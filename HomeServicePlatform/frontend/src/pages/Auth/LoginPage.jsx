import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Home, ArrowLeft, Wrench, Shield, CheckCircle } from "lucide-react";
import { authApi } from "../../services/authApi.jsx";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export function LoginPage({ onSwitchToRegister, onBackToHome, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.email) {
    setError("Vui lòng nhập email.");
    return;
  }
  if (!formData.password) {
    setError("Vui lòng nhập mật khẩu.");
    return;
  }
    setLoading(true);

    try {
      const res = await authApi.login(formData);

      if (res.success) {
        const { jwtToken } = res.data;
        const decoded = jwtDecode(jwtToken);
        const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        const name = decoded["name"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        const role = decoded["role"] || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        localStorage.setItem("jwtToken", jwtToken);
        if (userId) localStorage.setItem("userId", userId);
        if (email) localStorage.setItem("email", email);
        if (name) localStorage.setItem("name", name);
        if (role) localStorage.setItem("role", role);

        onLoginSuccess({ userId, email, jwtToken, name, role });
        navigate('/');
      
      } else {
        // Đây là trường hợp API trả về success: false
        setError(res.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
      }
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);

      if (err.response) {
        const status = err.response.status;
        const backendMessage = err.response.data?.message;

        if (status === 400) {
          setError(backendMessage || "Yêu cầu không hợp lệ. Vui lòng kiểm tra thông tin đã nhập.");
        } else if (status === 401) {
          // Kiểm tra thông báo lỗi cụ thể từ backend và việt hóa
          if (backendMessage && backendMessage.includes("Invalid credentials")) {
            setError("Email hoặc mật khẩu bạn nhập không đúng. Vui lòng thử lại.");
          } else if (backendMessage && backendMessage.includes("Invalid password")) {
            // Thêm trường hợp này để đảm bảo xử lý cả "Invalid password"
            setError("Mật khẩu bạn nhập không đúng. Vui lòng thử lại.");
          } else {
            setError("Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email để xác thực.");
          }
        } else if (status === 500) {
          setError("Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.");
        } else {
          setError(`Lỗi ${status}: Đã xảy ra lỗi không xác định.`);
        }
      } else if (err.request) {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.");
      } else {
        setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authApi.googleLogin();  
  };

  const handleForgotPassword = () => {
    alert("👉 Chức năng Quên mật khẩu sẽ được bổ sung sau (gửi email reset).");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-600 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-orange-500 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-green-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">HomeServicePlatform</h1>
                  <p className="text-blue-100 text-sm">Dịch vụ sửa chữa nhà chuyên nghiệp</p>
                </div>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                Giải pháp toàn diện cho mọi nhu cầu sửa chữa, bảo trì và cải tạo ngôi nhà của bạn.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Thợ chuyên nghiệp</h3>
                  <p className="text-blue-100 text-sm">Đội ngũ thợ có kinh nghiệm, được đào tạo bài bản</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Bảo hành chất lượng</h3>
                  <p className="text-blue-100 text-sm">Cam kết bảo hành dài hạn cho mọi dịch vụ</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dịch vụ tại nhà</h3>
                  <p className="text-blue-100 text-sm">Tiện lợi, nhanh chóng, phục vụ 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <button
              className="mb-8 flex items-center text-gray-600 hover:text-blue-600"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </button>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại!</h2>
                <p className="text-gray-500">Đăng nhập để tiếp tục sử dụng dịch vụ</p>
              </div>

              <div className="px-8 pb-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@example.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-xl focus:ring focus:ring-blue-200"
                        
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Nhập mật khẩu"
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border rounded-xl focus:ring focus:ring-blue-200"
                        
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex justify-between items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {/* Login button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>

                <div className="my-6 flex items-center">
                  <hr className="flex-1 border-gray-200" />
                  <span className="px-4 text-sm text-gray-500">Hoặc</span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 border rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50"
                >
                  <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
                  <span>Đăng nhập với Google</span>
                </button>

                <div className="mt-6 text-center">
                  <span className="text-gray-600">Chưa có tài khoản? </span>
                  <button
                    onClick={onSwitchToRegister}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}