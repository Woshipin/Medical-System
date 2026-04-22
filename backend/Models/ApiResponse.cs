namespace MedicalSystem.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // 加上 default! 和允许 data 为空
        public static ApiResponse<T> SuccessResponse(T? data, string message = "操作成功")
        {
            return new ApiResponse<T> { Success = true, Data = data, Message = message };
        }

        public static ApiResponse<T> FailureResponse(string message, List<string>? errors = null)
        {
            return new ApiResponse<T> { Success = false, Message = message, Errors = errors };
        }
    }
}