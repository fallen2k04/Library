using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using LuminaLibrary.Infrastructure;
using LuminaLibrary.Domain;

namespace LuminaLibrary.BackgroundServices
{
    public class OverdueCheckBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<OverdueCheckBackgroundService> _logger;
        private readonly IConfiguration _configuration;
        private readonly TimeSpan _period = TimeSpan.FromMinutes(10); // Run every 10 minutes

        public OverdueCheckBackgroundService(IServiceScopeFactory scopeFactory, ILogger<OverdueCheckBackgroundService> logger, IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("OverdueCheckBackgroundService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("OverdueCheckBackgroundService execution cycle starting.");
                    
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
                        var now = DateTime.UtcNow;

                        // 1. Process Overdue Borrow Records
                        var overdueRecords = await context.BorrowRecords
                            .Where(r => r.Status == BorrowRecordStatus.Borrowed && r.DueDate < now)
                            .ToListAsync(stoppingToken);

                        if (overdueRecords.Any())
                        {
                            _logger.LogInformation("Found {Count} overdue borrow records to update.", overdueRecords.Count);
                            decimal dailyFineAmount = _configuration.GetValue<decimal>("LibraryRules:DailyFineAmount", 5000);

                            foreach (var record in overdueRecords)
                            {
                                record.Status = BorrowRecordStatus.Overdue;
                                var daysLate = (now - record.DueDate).Days;
                                if (daysLate > 0)
                                {
                                    record.FineAmount = daysLate * dailyFineAmount;
                                }
                            }
                        }

                        // 2. Process Expired Reservations
                        var expiredReservations = await context.Reservations
                            .Where(r => r.Status == "Available" && r.ExpiryDate < now)
                            .ToListAsync(stoppingToken);

                        if (expiredReservations.Any())
                        {
                            _logger.LogInformation("Found {Count} expired reservations to update.", expiredReservations.Count);
                            foreach (var res in expiredReservations)
                            {
                                res.Status = "Expired";
                                
                                // Shift next in queue
                                var siblings = await context.Reservations
                                    .Where(r => r.BookId == res.BookId && r.Status == "Waiting")
                                    .OrderBy(r => r.QueuePosition)
                                    .ToListAsync(stoppingToken);

                                if (siblings.Count > 0)
                                {
                                    var next = siblings[0];
                                    next.Status = "Available";
                                    next.ExpiryDate = now.AddDays(3);
                                    
                                    for (int i = 0; i < siblings.Count; i++)
                                    {
                                        siblings[i].QueuePosition = i + 1;
                                    }
                                }
                            }
                        }

                        await context.SaveChangesAsync(stoppingToken);
                    }

                    _logger.LogInformation("OverdueCheckBackgroundService execution cycle finished successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred in OverdueCheckBackgroundService execution cycle.");
                }

                // Wait before running again
                await Task.Delay(_period, stoppingToken);
            }

            _logger.LogInformation("OverdueCheckBackgroundService is stopping.");
        }
    }
}
