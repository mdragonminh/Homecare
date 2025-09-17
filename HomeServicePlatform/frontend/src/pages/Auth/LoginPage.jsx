// src/pages/Auth/LoginPage.jsx
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Home, ArrowLeft, Wrench, Shield, CheckCircle } from "lucide-react";
import { authApi } from "../../services/authApi.jsx";

export function LoginPage({ onSwitchToRegister, onBackToHome, onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);

    try {
      const res = await authApi.login(formData);
      if (res.success) {
        console.log("✅ Login thành công:", res);
        localStorage.setItem("token", res.token);
        onLoginSuccess(res.user);
      } else {
        setError(res.message);
      }
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("👉 Chức năng Đăng nhập bằng Google sẽ được tích hợp sau.");
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
        {/* Left Panel - Brand & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 py-16">
            {/* Logo & Brand */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mr-4">
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

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Thợ chuyên nghiệp</h3>
                  <p className="text-blue-100 text-sm">Đội ngũ thợ có kinh nghiệm, được đào tạo bài bản</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Bảo hành chất lượng</h3>
                  <p className="text-blue-100 text-sm">Cam kết bảo hành dài hạn cho mọi dịch vụ</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dịch vụ tại nhà</h3>
                  <p className="text-blue-100 text-sm">Tiện lợi, nhanh chóng, phục vụ 24/7</p>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
            <div className="absolute top-20 -left-10 w-40 h-40 bg-white/5 rounded-full"></div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Back to Home Button */}
            <button
              className="mb-8 flex items-center text-gray-600 hover:text-blue-600 transition-colors group"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Về trang chủ
            </button>

            {/* Login Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại!</h2>
                <p className="text-gray-500">
                  Đăng nhập để tiếp tục sử dụng dịch vụ HomeServicePlatform
                </p>
              </div>

              {/* Form */}
              <div className="px-8 pb-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember & Forgot */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <input
                        id="rememberMe"
                        name="rememberMe"
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="rememberMe" className="text-sm font-medium text-gray-600">
                        Ghi nhớ đăng nhập
                      </label>
                    </div>

                    <button
                      type="button"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      onClick={handleForgotPassword}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang đăng nhập...</span>
                      </div>
                    ) : (
                      "Đăng nhập"
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-8 flex items-center">
                  <hr className="flex-1 border-gray-200" />
                  <span className="px-4 text-sm font-medium text-gray-500 bg-white">Hoặc</span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-4 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-3 focus:ring-gray-500/20 transition-all flex items-center justify-center space-x-3"
                >
                  <img
                    src="https://www.svgrepo.com/show/355037/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>Đăng nhập với Google</span>
                </button>

                {/* Register Link */}
                <div className="mt-8 text-center">
                  <span className="text-gray-600">Chưa có tài khoản? </span>
                  <button
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={onSwitchToRegister}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Brand */}
            <div className="lg:hidden mt-8 text-center">
              <div className="flex items-center justify-center mb-2">
                <Wrench className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">HomeCare</span>
              </div>
              <p className="text-sm text-gray-500">Dịch vụ sửa chữa nhà chuyên nghiệp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}