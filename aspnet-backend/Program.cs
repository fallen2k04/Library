using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Application;
using LuminaLibrary.Domain;
using LuminaLibrary.Services;
using LuminaLibrary.BackgroundServices;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

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

// Register Domain/Application Services
builder.Services.AddScoped<ICirculationService, CirculationService>();
builder.Services.AddHostedService<OverdueCheckBackgroundService>();

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";
        var responseObj = ApiResponse<object>.Fail("Yêu cầu quá thường xuyên. Vui lòng thử lại sau.");
        await context.HttpContext.Response.WriteAsJsonAsync(responseObj, cancellationToken: token);
    };

    // Policy for login / register: 10 requests per 1 minute
    options.AddPolicy("AuthLimitPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? context.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 10,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Policy for forgot / reset password: 5 requests per 10 minutes
    options.AddPolicy("OtpLimitPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? context.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(10)
            }));
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
        var traceId = Guid.NewGuid().ToString();
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Đã xảy ra lỗi không kiểm soát được trong quá trình xử lý request. TraceId: {TraceId}", traceId);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = 500;
        var response = ApiResponse<object>.Fail($"Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên và cung cấp mã lỗi: {traceId}");
        await context.Response.WriteAsJsonAsync(response);
    }
});

// Auto Migrate & Seed on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
    db.Database.Migrate();

    // Create or upgrade Admin from configuration
    var adminEmail = app.Configuration["SeedAdmin:Email"];
    var adminPassword = app.Configuration["SeedAdmin:Password"];

    if (!string.IsNullOrEmpty(adminEmail) && !string.IsNullOrEmpty(adminPassword))
    {
        var normalizedEmail = adminEmail.ToLower();
        var targetUser = db.Users.FirstOrDefault(u => u.Email.ToLower() == normalizedEmail);
        var adminRole = db.Roles.FirstOrDefault(r => r.Name == "Admin");
        if (adminRole != null && targetUser == null)
        {
            db.Users.Add(new User
            {
                FullName = "System Admin",
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                RoleId = adminRole.Id,
                IsLocked = false,
                MembershipTier = "Academic Member",
                CreatedAt = DateTime.UtcNow
            });
            db.SaveChanges();
        }
    }
    else
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning("SeedAdmin configuration is missing (SeedAdmin:Email or SeedAdmin:Password is empty). Skipping admin seeding.");
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

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
