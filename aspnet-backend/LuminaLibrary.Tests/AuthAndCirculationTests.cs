using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using LuminaLibrary.Controllers;
using LuminaLibrary.Domain;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Application;
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
                {"Jwt:Audience", "LuminaLibraryClients"}
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
            // Arrange
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

            // Act
            var result = await controller.Register(registerDto);

            // Assert
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
            // Arrange
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

            // Act
            var loginDto = new LoginDto
            {
                Email = "login-test@library.com",
                Password = "Password123"
            };
            var result = await controller.Login(loginDto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var apiResponse = Assert.IsType<ApiResponse<AuthResponseDto>>(okResult.Value);
            Assert.True(apiResponse.Success);
            Assert.NotNull(apiResponse.Data?.Token);
            Assert.NotNull(apiResponse.Data?.RefreshToken);
        }

        [Fact]
        public async Task Login_Fails_WithIncorrectPassword()
        {
            // Arrange
            using var context = new LibraryDbContext(_dbOptions);
            await SeedRolesAsync(context);
            var controller = new AuthController(context, _configuration);

            var registerDto = new RegisterDto
            {
                FullName = "Test User",
                Email = "fail-test@library.com",
                Password = "Password123",
                PhoneNumber = "123456789"
            };
            await controller.Register(registerDto);

            // Act
            var loginDto = new LoginDto
            {
                Email = "fail-test@library.com",
                Password = "WrongPassword"
            };
            var result = await controller.Login(loginDto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }
}
