using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Domain;
using LuminaLibrary.Application;
using Microsoft.AspNetCore.RateLimiting;
namespace LuminaLibrary.Controllers;

    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly LibraryDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(LibraryDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthLimitPolicy")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
            {
                return BadRequest(ApiResponse<object>.Fail("Email này đã được sử dụng."));
            }

            var memberRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Member");
            if (memberRole == null)
            {
                return BadRequest(ApiResponse<object>.Fail("Vai trò hệ thống 'Member' chưa được khởi tạo."));
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email.ToLower(),
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = HashPassword(dto.Password),
                RoleId = memberRole.Id,
                IsLocked = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            
            _context.RefreshTokens.Add(new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });
            await _context.SaveChangesAsync();

            // Gửi email thông báo đăng ký thành công
            string subject = "Đăng ký thành công tài khoản Lumina Library";
            string body = $"Chào bạn <b>{user.FullName}</b>,<br/><br/>Chúc mừng bạn đã đăng ký thành công tài khoản tại Lumina Library.<br/>Thông tin tài khoản:<br/>- Email: {user.Email}<br/>- Số điện thoại: {user.PhoneNumber ?? "Chưa thiết lập"}<br/><br/>Trân trọng,<br/>Lumina Library Support Team";
            try
            {
                await SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi gửi email chào mừng: {ex.Message}");
            }

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                User = MapToUserDto(user, memberRole.Name)
            }, "Đăng ký tài khoản thành công."));
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthLimitPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return BadRequest(ApiResponse<object>.Fail("Email hoặc mật khẩu không chính xác."));
            }

            if (user.IsLocked)
            {
                var supportPhone = _configuration["SupportPhoneNumber"] ?? "0947150096";
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail($"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để biết thêm chi tiết với số điện thoại: {supportPhone}"));
            }

            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            
            _context.RefreshTokens.Add(new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                Token = token,
                RefreshToken = refreshToken,
                User = MapToUserDto(user, user.Role?.Name ?? "Guest")
            }, "Đăng nhập thành công."));
        }

        // POST: api/auth/refresh-token
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

            if (storedToken == null || storedToken.IsRevoked || storedToken.ExpiryDate < DateTime.UtcNow)
            {
                return Unauthorized(ApiResponse<object>.Fail("Refresh Token không hợp lệ hoặc đã hết hạn."));
            }

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == storedToken.UserId);

            if (user == null)
            {
                return Unauthorized(ApiResponse<object>.Fail("Người dùng không tồn tại."));
            }

            if (user.IsLocked)
            {
                var supportPhone = _configuration["SupportPhoneNumber"] ?? "0947150096";
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail($"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để biết thêm chi tiết với số điện thoại: {supportPhone}"));
            }

            var token = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            _context.RefreshTokens.Remove(storedToken);
            _context.RefreshTokens.Add(new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                ExpiryDate = DateTime.UtcNow.AddDays(7)
            });
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                Token = token,
                RefreshToken = newRefreshToken,
                User = MapToUserDto(user, user.Role?.Name ?? "Guest")
            }, "Cấp lại access token thành công."));
        }

        // POST: api/auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            if (!string.IsNullOrEmpty(dto.RefreshToken))
            {
                var storedToken = await _context.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);
                if (storedToken != null)
                {
                    _context.RefreshTokens.Remove(storedToken);
                    await _context.SaveChangesAsync();
                }
            }
            return Ok(ApiResponse<object>.Ok(null!, "Đã đăng xuất thành công."));
        }



        public class ForgotPasswordDto
        {
            [Required(ErrorMessage = "Email không được để trống")]
            [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordDto
        {
            [Required(ErrorMessage = "Email không được để trống")]
            [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
            public string Email { get; set; } = string.Empty;

            [Required(ErrorMessage = "Mã xác thực không được để trống")]
            public string Token { get; set; } = string.Empty;

            [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
            [MinLength(8, ErrorMessage = "Mật khẩu mới phải từ 8 ký tự trở lên")]
            public string NewPassword { get; set; } = string.Empty;
        }

        // POST: api/auth/forgot-password
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [EnableRateLimiting("OtpLimitPolicy")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            var code = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

            if (user != null)
            {
                var existingToken = await _context.PasswordResetTokens.FindAsync(dto.Email.ToLower());
                if (existingToken != null)
                {
                    existingToken.Code = code;
                    existingToken.ExpiryDate = DateTime.UtcNow.AddMinutes(10);
                }
                else
                {
                    _context.PasswordResetTokens.Add(new PasswordResetToken
                    {
                        Email = dto.Email.ToLower(),
                        Code = code,
                        ExpiryDate = DateTime.UtcNow.AddMinutes(10)
                    });
                }
                await _context.SaveChangesAsync();

                string subject = "Mã xác thực đặt lại mật khẩu - Lumina Library";
                string body = $"Chào bạn,<br/><br/>Mã xác thực đặt lại mật khẩu của bạn là: <b>{code}</b>. Mã này sẽ hết hạn trong vòng 10 phút.<br/><br/>Trân trọng,<br/>Lumina Library Support Team";

                try
                {
                    await SendEmailAsync(dto.Email.ToLower(), subject, body);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi gửi email: {ex.Message}");
                }
            }

            return Ok(ApiResponse<object>.Ok(null!, "Mã xác thực đặt lại mật khẩu đã được gửi thành công. Vui lòng kiểm tra email của bạn."));
        }

        // POST: api/auth/reset-password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [EnableRateLimiting("OtpLimitPolicy")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (user == null)
            {
                return BadRequest(ApiResponse<object>.Fail("Thông tin tài khoản hoặc mã xác thực không chính xác."));
            }

            var tokenInfo = await _context.PasswordResetTokens.FindAsync(dto.Email.ToLower());
            if (tokenInfo == null || tokenInfo.Code != dto.Token)
            {
                return BadRequest(ApiResponse<object>.Fail("Mã xác thực không chính xác."));
            }

            if (tokenInfo.ExpiryDate < DateTime.UtcNow)
            {
                _context.PasswordResetTokens.Remove(tokenInfo);
                await _context.SaveChangesAsync();
                return BadRequest(ApiResponse<object>.Fail("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới."));
            }

            user.PasswordHash = HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _context.PasswordResetTokens.Remove(tokenInfo);
            
            // Revoke all refresh tokens for this user on password reset (logout from all devices)
            var userTokens = _context.RefreshTokens.Where(rt => rt.UserId == user.Id);
            _context.RefreshTokens.RemoveRange(userTokens);

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(null!, "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới."));
        }

        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpServer = _configuration["Smtp:Server"];
            var smtpPortStr = _configuration["Smtp:Port"];
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var enableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl");
            var senderEmail = _configuration["Smtp:SenderEmail"] ?? "no-reply@library.com";
            var senderName = _configuration["Smtp:SenderName"] ?? "Lumina Library";

            if (string.IsNullOrEmpty(smtpServer) || string.IsNullOrEmpty(username))
            {
                Console.WriteLine("---------------------------------------------");
                Console.WriteLine($"[EMAIL FALLBACK LOGGER]");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body: {body}");
                Console.WriteLine("---------------------------------------------");
                return;
            }

            int port = int.TryParse(smtpPortStr, out var p) ? p : 587;

            var message = new MimeKit.MimeMessage();
            message.From.Add(new MimeKit.MailboxAddress(senderName, senderEmail));
            message.To.Add(new MimeKit.MailboxAddress("", toEmail));
            message.Subject = subject;

            var bodyBuilder = new MimeKit.BodyBuilder { HtmlBody = body };
            message.Body = bodyBuilder.ToMessageBody();

            using (var client = new MailKit.Net.Smtp.SmtpClient())
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;

                await client.ConnectAsync(smtpServer, port, enableSsl ? MailKit.Security.SecureSocketOptions.StartTls : MailKit.Security.SecureSocketOptions.None);
                await client.AuthenticateAsync(username, password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("Cấu hình JWT:Key không được thiết lập. Vui lòng cấu hình biến môi trường hoặc file appsettings.json.");
            }
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "Guest")
            };

            var token = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(30),
                SigningCredentials = creds,
                Issuer = _configuration["Jwt:Issuer"] ?? "LuminaLibrary",
                Audience = _configuration["Jwt:Audience"] ?? "LuminaLibraryClients"
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var createdToken = tokenHandler.CreateToken(token);
            return tokenHandler.WriteToken(createdToken);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        private static UserDto MapToUserDto(User user, string roleName)
        {
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = roleName,
                MembershipTier = user.MembershipTier,
                IsLocked = user.IsLocked,
            };
        }
    }
