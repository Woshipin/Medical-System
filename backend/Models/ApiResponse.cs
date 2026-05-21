namespace MedicalSystem.Models // 声明命名空间，便于控制器统一调用该响应格式
{
    /// <summary>
    /// 统一 API 响应包装
    /// </summary>
    public class ApiResponse<T> // 定义泛型 ApiResponse 响应结构，便于标准化前后端交互格式
    {
        public bool Success { get; set; } // 表明接口请求执行是否成功的状态标识

        public string? Message { get; set; } // 统一的附加消息说明，提示操作结果

        public T? Data { get; set; } // 具体的接口业务负载数据，允许为空

        public List<string>? Errors { get; set; } // 当遇到验证或业务异常时的详细错误列表，允许为空

        public static ApiResponse<T> SuccessResponse(T? data, string message = "操作成功") // 生成成功响应结构的静态便利方法
        {
            return new ApiResponse<T> { Success = true, Data = data, Message = message }; // 返回组装完毕的成功 ApiResponse 实例
        }

        public static ApiResponse<T> FailureResponse(string message, List<string>? errors = null) // 生成失败响应结构的静态便利方法
        {
            return new ApiResponse<T> { Success = false, Message = message, Errors = errors }; // 返回组装完毕的失败 ApiResponse 实例
        }
    }
}