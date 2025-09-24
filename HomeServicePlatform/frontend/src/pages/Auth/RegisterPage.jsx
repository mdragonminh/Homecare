import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Home, ArrowLeft, Wrench, Shield, CheckCircle } from "lucide-react";
import { authApi } from "../../services/authApi.jsx";

export default function RegisterPage({ onSwitchToLogin, onBackToHome }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    agreeToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | warning | error

  // Password validation function
  const validatePassword = (password) => {
    const minLength = 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < minLength) {
      return "Mật khẩu phải có ít nhất 8 ký tự!";
    }
    if (!hasSpecialChar) {
      return "Mật khẩu phải chứa ít nhất một ký tự đặc biệt!";
    }
    if (!hasUpperCase) {
      return "Mật khẩu phải chứa ít nhất một chữ cái in hoa!";
    }
    if (!hasLowerCase) {
      return "Mật khẩu phải chứa ít nhất một chữ cái thường!";
    }
    if (!hasNumber) {
      return "Mật khẩu phải chứa ít nhất một số!";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Kiểm tra các trường bắt buộc
    if (!formData.fullName) {
      setMessage("❌ Vui lòng nhập họ và tên!");
      setMessageType("error");
      return;
    }
    if (!formData.email) {
      setMessage("❌ Vui lòng nhập email!");
      setMessageType("error");
      return;
    }
    if (!formData.password) {
      setMessage("❌ Vui lòng nhập mật khẩu!");
      setMessageType("error");
      return;
    }
    if (!formData.confirmPassword) {
      setMessage("❌ Vui lòng nhập xác nhận mật khẩu!");
      setMessageType("error");
      return;
    }

    // Validate password requirements
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setMessage(`❌ ${passwordError}`);
      setMessageType("error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Mật khẩu xác nhận không khớp!");
      setMessageType("error");
      return;
    }

    if (!formData.agreeToTerms) {
      setMessage("❌ Vui lòng đồng ý với điều khoản sử dụng!");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register(formData);

      if (res.success) {
        setMessage("✅ Bạn đã đăng ký thành công, mời bạn vào xác nhận email.");
        setMessageType("success");

        setFormData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          userType: "",
          agreeToTerms: false,
        });

        // ⏳ Tự động chuyển sang Login sau 2.5 giây
        setTimeout(() => {
          onSwitchToLogin();
        }, 2500);
      } else {
        // Xử lý các loại lỗi khác nhau
        const errorMessage = res.message?.toLowerCase() || '';
        
        if (errorMessage.includes('email') && (errorMessage.includes('tồn tại') || errorMessage.includes('exist'))) {
          setMessage("❌ Email đã được sử dụng, vui lòng sử dụng email khác.");
          setMessageType("error");
        } else if (errorMessage.includes('username') && (errorMessage.includes('tồn tại') || errorMessage.includes('exist'))) {
          setMessage("❌ Tên người dùng đã được sử dụng, vui lòng thử tên khác.");
          setMessageType("error");
        } else if (errorMessage.includes('user creation failed')) {
          setMessage("❌ Không thể tạo tài khoản. Email hoặc thông tin đã được sử dụng.");
          setMessageType("error");
        } else if (res.message) {
          // Hiển thị message từ server
          setMessage(`❌ ${res.message}`);
          setMessageType("error");
        } else {
          setMessage("❌ Có lỗi xảy ra, vui lòng thử lại.");
          setMessageType("error");
        }
      }
    } catch (err) {
      console.error('Register error:', err);
      
      // Xử lý lỗi từ response
      if (err.response?.data?.message) {
        const serverMessage = err.response.data.message.toLowerCase();
        
        if (serverMessage.includes('email') && serverMessage.includes('exist')) {
          setMessage("❌ Email đã được sử dụng, vui lòng sử dụng email khác.");
        } else if (serverMessage.includes('username') && serverMessage.includes('exist')) {
          setMessage("❌ Tên người dùng đã được sử dụng, vui lòng thử tên khác.");
        } else if (serverMessage.includes('user creation failed')) {
          setMessage("❌ Không thể tạo tài khoản. Email hoặc thông tin đã được sử dụng.");
        } else {
          setMessage(`❌ ${err.response.data.message}`);
        }
      } else if (err.response?.status === 400) {
        setMessage("❌ Thông tin đăng ký không hợp lệ, vui lòng kiểm tra lại.");
      } else if (err.response?.status === 500) {
        setMessage("❌ Lỗi server, vui lòng thử lại sau.");
      } else {
        setMessage("❌ Lỗi kết nối đến server, vui lòng kiểm tra mạng và thử lại.");
      }
      
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
        {/* Left Panel - Brand */}
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
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Back to Home Button */}
            <button
              className="mb-8 flex items-center text-gray-600 hover:text-blue-600 transition-colors group"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Về trang chủ
            </button>

            {/* Register Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký tài khoản</h2>
                <p className="text-gray-500">Tạo tài khoản mới để bắt đầu sử dụng HomeServicePlatform</p>
              </div>

              {/* Scrollable Form Container */}
              <div className="px-8 pb-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
                {message && (
                  <div
                    className={`mb-6 p-4 rounded-xl text-sm font-medium sticky top-0 z-10
                      ${messageType === "success" ? "bg-green-50 text-green-700 border border-green-200" : ""}
                      ${messageType === "warning" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : ""}
                      ${messageType === "error" ? "bg-red-50 text-red-700 border border-red-200" : ""}`}
                  >
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Nhập họ và tên"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
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
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
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
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start space-x-3">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm font-medium text-gray-600 cursor-pointer">
                      Tôi đồng ý với{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Điều khoản sử dụng
                      </a>{" "}
                      và{" "}
                      <a href="#" className="text-blue-600 hover:underline">
                        Chính sách bảo mật
                      </a>
                    </label>
                  </div>

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-3 focus:ring-blue-500/20 transform hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang đăng ký...</span>
                      </div>
                    ) : (
                      "Đăng ký tài khoản"
                    )}
                  </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                  <span className="text-gray-600">Đã có tài khoản? </span>
                  <button
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={onSwitchToLogin}
                  >
                    Đăng nhập ngay
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