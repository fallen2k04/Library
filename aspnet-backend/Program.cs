using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Application;
using LuminaLibrary.Domain;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Customize model state validation response to match { success: false, message: "...", errors: [...] }
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            var response = ApiResponse<object>.Fail("Dữ liệu không hợp lệ.", errors);
            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(response);
        };
    });

// Configure Database Connection (PostgreSQL, MySQL or SQL Server)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var provider = builder.Configuration.GetValue<string>("DatabaseProvider");

if (provider == "PostgreSQL")
{
    builder.Services.AddDbContext<LibraryDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else if (provider == "MySQL")
{
    builder.Services.AddDbContext<LibraryDbContext>(options =>
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
}
else
{
    builder.Services.AddDbContext<LibraryDbContext>(options =>
        options.UseSqlServer(connectionString));
}

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("Cấu hình JWT:Key không được thiết lập. Vui lòng thiết lập biến môi trường hoặc cấu hình trong appsettings.json.");
}
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "LuminaLibrary",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "LuminaLibraryClients",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// Configure CORS for React Frontend connection
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                         ?? new[] { "http://localhost:5173" };

    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Swagger Setup with Bearer Token Authorization
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Lumina Library System REST API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Global Exception Handling Middleware to return Standard JSON error
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Đã xảy ra lỗi không kiểm soát được trong quá trình xử lý request.");

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = 500;
        var response = ApiResponse<object>.Fail("Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên hoặc thử lại sau.");
        await context.Response.WriteAsJsonAsync(response);
    }
});

// Auto Migrate & Seed on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
    db.Database.EnsureCreated();

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS `librarian_consultations` (
          `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `librarian_name` VARCHAR(200) NOT NULL,
          `subject` VARCHAR(500) NOT NULL,
          `date` DATETIME NOT NULL,
          `time` VARCHAR(50) NOT NULL,
          `ticket_number` VARCHAR(50) NOT NULL,
          `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
          `created_at` DATETIME NOT NULL,
          PRIMARY KEY (`id`),
          CONSTRAINT `FK_librarian_consultations_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    ");

    try
    {
        db.Database.ExecuteSqlRaw("ALTER TABLE `librarian_consultations` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'Pending';");
    }
    catch { /* Ignore if column already exists */ }

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS `space_reservations` (
          `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `space_type` VARCHAR(200) NOT NULL,
          `date` DATETIME NOT NULL,
          `time` VARCHAR(50) NOT NULL,
          `ticket_number` VARCHAR(50) NOT NULL,
          `code` VARCHAR(50) NOT NULL,
          `created_at` DATETIME NOT NULL,
          PRIMARY KEY (`id`),
          CONSTRAINT `FK_space_reservations_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    ");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS `class_schedules` (
          `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `title` VARCHAR(200) NOT NULL,
          `instructor` VARCHAR(200) NOT NULL,
          `date` DATETIME NOT NULL,
          `time` VARCHAR(50) NOT NULL,
          `max_capacity` INT NOT NULL,
          `registered_count` INT NOT NULL DEFAULT 0,
          `description` TEXT NULL,
          `created_at` DATETIME NOT NULL,
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB;
    ");

    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS `class_registrations` (
          `id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `class_schedule_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `user_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
          `registration_date` DATETIME NOT NULL,
          PRIMARY KEY (`id`),
          CONSTRAINT `FK_class_registrations_class_schedules` FOREIGN KEY (`class_schedule_id`) REFERENCES `class_schedules` (`id`) ON DELETE CASCADE,
          CONSTRAINT `FK_class_registrations_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    ");

    // Create or upgrade minh2k004@gmail.com to Admin
    var targetUser = db.Users.FirstOrDefault(u => u.Email == "minh2k004@gmail.com");
    var adminRole = db.Roles.FirstOrDefault(r => r.Name == "Admin");
    if (adminRole != null)
    {
        if (targetUser == null)
        {
            db.Users.Add(new User
            {
                FullName = "Minh Admin",
                Email = "minh2k004@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Minh@23122004"),
                RoleId = adminRole.Id,
                IsLocked = false,
                MembershipTier = "Academic Member",
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            targetUser.RoleId = adminRole.Id;
            targetUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Minh@23122004");
        }
        db.SaveChanges();
    }

    // Delete seeded mock librarians if they exist
    var mockEmails = new[] { "alistair@library.com", "sarah@library.com", "elena@library.com" };
    var mockUsers = db.Users.Where(u => mockEmails.Contains(u.Email)).ToList();
    if (mockUsers.Any())
    {
        db.Users.RemoveRange(mockUsers);
        db.SaveChanges();
    }
}

if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableSwaggerInProd"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lumina Library API v1");
    });
}

app.UseCors("AllowSpecificOrigins");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
