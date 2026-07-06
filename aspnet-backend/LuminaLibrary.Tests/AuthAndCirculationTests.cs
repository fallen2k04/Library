using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using LuminaLibrary.Controllers;
using LuminaLibrary.Domain;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Application;
using LuminaLibrary.Services;
using Xunit;

namespace LuminaLibrary.Tests
{
    public class AuthAndCirculationTests
    {
        private readonly DbContextOptions<LibraryDbContext> _dbOptions;
        private readonly IConfiguration _configuration;

        public AuthAndCirculationTests()
        {
            _dbOptions = new DbContextOptionsBuilder<LibraryDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var myConfiguration = new Dictionary<string, string>
            {
                {"Jwt:Key", "LuminaLibrarySuperSecretTokenKey2026!#MySecureRandomKeyHexLengthEnough"},
                {"Jwt:Issuer", "LuminaLibrary"},
                {"Jwt:Audience", "LuminaLibraryClients"},
                {"LibraryRules:MaxActiveBorrows", "5"},
                {"LibraryRules:DefaultLoanDurationDays", "14"},
                {"LibraryRules:DailyFineAmount", "5000"}
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(myConfiguration!)
                .Build();
        }

        private async Task SeedRolesAsync(LibraryDbContext context)
        {
            context.Roles.Add(new Role { Id = Guid.Parse("33333333-3333-3333-3333-333333333330"), Name = "Member" });
            context.Roles.Add(new Role { Id = Guid.Parse("11111111-1111-1111-1111-111111111110"), Name = "Admin" });
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task Register_CreatesUser_WithBCryptPasswordHash()
        {
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);
            var controller = new AuthController(context, _configuration);

            var registerDto = new RegisterDto
            {
                FullName = "Test User",
                Email = "test@library.com",
                Password = "SecretPassword123",
                PhoneNumber = "123456789"
            };

            var result = await controller.Register(registerDto);
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<AuthResponseDto>>(okResult.Value);
            Assert.True(apiResponse.Success);

            var createdUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "test@library.com");
            Assert.NotNull(createdUser);
            Assert.True(BCrypt.Net.BCrypt.Verify("SecretPassword123", createdUser.PasswordHash));
        }

        [Fact]
        public async Task Login_Succeeds_WithCorrectPassword()
        {
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);
            var controller = new AuthController(context, _configuration);

            var registerDto = new RegisterDto
            {
                FullName = "Test User",
                Email = "login-test@library.com",
                Password = "Password123",
                PhoneNumber = "123456789"
            };
            await controller.Register(registerDto);

            var loginDto = new LoginDto
            {
                Email = "login-test@library.com",
                Password = "Password123"
            };
            var result = await controller.Login(loginDto);
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<AuthResponseDto>>(okResult.Value);
            Assert.True(apiResponse.Success);
            Assert.NotNull(apiResponse.Data?.Token);
            Assert.NotNull(apiResponse.Data?.RefreshToken);
        }

        [Fact]
        public async Task CreateBorrow_EnforcesActiveBorrowLimit()
        {
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);

            var userId = Guid.NewGuid();
            var memberRole = context.Roles.First(r => r.Name == "Member");
            context.Users.Add(new User
            {
                Id = userId,
                FullName = "Borrower Limit Test",
                Email = "limit-test@library.com",
                PasswordHash = "hashed",
                RoleId = memberRole.Id,
                MembershipTier = "Academic Member"
            });

            var bookId = Guid.NewGuid();
            context.Books.Add(new Book
            {
                Id = bookId,
                Title = "Test Book",
                ISBN = "111-222-333",
                TotalCopies = 10,
                AvailableCopies = 10,
                CategoryId = Guid.NewGuid()
            });

            // Add 5 already borrowed records (limit is 5)
            for (int i = 0; i < 5; i++)
            {
                context.BorrowRecords.Add(new BorrowRecord
                {
                    UserId = userId,
                    BookId = bookId,
                    Status = BorrowRecordStatus.Borrowed,
                    BorrowDate = DateTime.UtcNow,
                    DueDate = DateTime.UtcNow.AddDays(14)
                });
            }
            await context.SaveChangesAsync();

            var service = new CirculationService(context, _configuration);
            var request = new BorrowRequestDto { BookId = bookId };

            // Act
            var result = await service.CreateBorrowAsync(request, userId, "Member");

            // Assert
            Assert.False(result.Success);
            Assert.Contains("tối đa 5 cuốn", result.Message);
        }

        [Fact]
        public async Task ReturnBook_CalculatesFineAmountCorrectly()
        {
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);

            var userId = Guid.NewGuid();
            var memberRole = context.Roles.First(r => r.Name == "Member");
            context.Users.Add(new User
            {
                Id = userId,
                FullName = "Overdue User",
                Email = "fine-test@library.com",
                PasswordHash = "hashed",
                RoleId = memberRole.Id,
                MembershipTier = "Academic Member"
            });

            var bookId = Guid.NewGuid();
            var book = new Book
            {
                Id = bookId,
                Title = "Overdue Book",
                ISBN = "444-555-666",
                TotalCopies = 5,
                AvailableCopies = 4,
                CategoryId = Guid.NewGuid()
            };
            context.Books.Add(book);

            var record = new BorrowRecord
            {
                UserId = userId,
                BookId = bookId,
                Status = BorrowRecordStatus.Borrowed,
                BorrowDate = DateTime.UtcNow.AddDays(-20),
                DueDate = DateTime.UtcNow.AddDays(-6) // Overdue by 6 days
            };
            context.BorrowRecords.Add(record);
            await context.SaveChangesAsync();

            var service = new CirculationService(context, _configuration);

            // Act
            var result = await service.ReturnBookAsync(record.Id, Guid.NewGuid(), "Admin");

            // Assert
            Assert.True(result.Success);
            var updatedRecord = await context.BorrowRecords.FindAsync(record.Id);
            Assert.NotNull(updatedRecord);
            Assert.Equal(BorrowRecordStatus.Returned, updatedRecord.Status);
            // 6 days late * 5000đ/day = 30000đ
            Assert.Equal(30000m, updatedRecord.FineAmount);
        }

        [Fact]
        public async Task ReturnBook_FulfillsWaitingReservationQueue()
        {
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);

            var userId1 = Guid.NewGuid();
            var userId2 = Guid.NewGuid();
            var memberRole = context.Roles.First(r => r.Name == "Member");

            context.Users.Add(new User { Id = userId1, FullName = "User 1", Email = "u1@library.com", PasswordHash = "h", RoleId = memberRole.Id });
            context.Users.Add(new User { Id = userId2, FullName = "User 2", Email = "u2@library.com", PasswordHash = "h", RoleId = memberRole.Id });

            var bookId = Guid.NewGuid();
            context.Books.Add(new Book
            {
                Id = bookId,
                Title = "Reserved Book",
                ISBN = "777-888-999",
                TotalCopies = 1,
                AvailableCopies = 0,
                CategoryId = Guid.NewGuid()
            });

            var borrowRecord = new BorrowRecord
            {
                UserId = userId1,
                BookId = bookId,
                Status = BorrowRecordStatus.Borrowed,
                BorrowDate = DateTime.UtcNow.AddDays(-5),
                DueDate = DateTime.UtcNow.AddDays(9)
            };
            context.BorrowRecords.Add(borrowRecord);

            // Add reservation queue for userId2
            var reservation = new Reservation
            {
                UserId = userId2,
                BookId = bookId,
                Status = "Waiting",
                QueuePosition = 1,
                ReservationDate = DateTime.UtcNow
            };
            context.Reservations.Add(reservation);
            await context.SaveChangesAsync();

            var service = new CirculationService(context, _configuration);

            // Act
            var result = await service.ReturnBookAsync(borrowRecord.Id, Guid.NewGuid(), "Admin");

            // Assert
            Assert.True(result.Success);
            var updatedReservation = await context.Reservations.FindAsync(reservation.Id);
            Assert.NotNull(updatedReservation);
            Assert.Equal("Available", updatedReservation.Status); // Promoted to Available
        }

        [Fact]
        public async Task UpdateMembershipStatus_Approved_UpdatesUserMembershipTier()
        {
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);

            var userId = Guid.NewGuid();
            var memberRole = context.Roles.First(r => r.Name == "Member");
            var user = new User
            {
                Id = userId,
                FullName = "Upgrade Candidate",
                Email = "upgrade-candidate@library.com",
                PasswordHash = "h",
                RoleId = memberRole.Id,
                MembershipTier = "Academic Member"
            };
            context.Users.Add(user);

            var request = new MembershipRequest
            {
                UserId = userId,
                TierName = "Archive Scholar",
                Price = 150000,
                PaymentMethod = "MOMO",
                Status = "Pending"
            };
            context.MembershipRequests.Add(request);
            await context.SaveChangesAsync();

            var controller = new MembershipRequestsController(context);
            var updateDto = new UpdateMembershipRequestStatusDto { Status = "Approved" };

            // Act
            var result = await controller.UpdateStatus(request.Id, updateDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<object>>(okResult.Value);
            Assert.True(apiResponse.Success);

            var updatedUser = await context.Users.FindAsync(userId);
            Assert.NotNull(updatedUser);
            Assert.Equal("Archive Scholar", updatedUser.MembershipTier);
        }
    }
}
