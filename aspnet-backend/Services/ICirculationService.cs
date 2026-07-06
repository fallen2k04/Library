using System;
using System.Threading.Tasks;
using LuminaLibrary.Domain;
using LuminaLibrary.Application;

namespace LuminaLibrary.Services
{
    public interface ICirculationService
    {
        Task<ApiResponse<BorrowRecord>> CreateBorrowAsync(BorrowRequestDto dto, Guid loggedInUserId, string loggedInUserRole);
        Task<ApiResponse<object>> ApproveBorrowAsync(Guid id, Guid loggedInUserId);
        Task<ApiResponse<object>> RejectBorrowAsync(Guid id, string? notes);
        Task<ApiResponse<object>> ReturnBookAsync(Guid id, Guid loggedInUserId, string loggedInUserRole);
        Task<ApiResponse<object>> PayFineAsync(Guid id);
    }
}
