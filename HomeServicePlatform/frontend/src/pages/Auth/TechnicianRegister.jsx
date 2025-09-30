import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, User, Briefcase, FileText, Award, Phone, Mail, MapPin, Calendar, Star, Clock, DollarSign, CheckCircle, Shield, Zap, ArrowLeft, Home } from "lucide-react";

const SPECIALIZATIONS = [
  "Điện", "Nước", "Điều hòa", "Sửa chữa đồ điện tử", 
  "Sơn nhà", "Dọn dẹp", "Làm vườn", "Sửa chữa nội thất",
  "Lắp đặt thiết bị", "Bảo trì máy móc"
];

const AVAILABILITY_OPTIONS = [
  "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"
];

// ✅ Thêm loggedInUser vào props
export default function TechnicianRegister({ loggedInUser }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    experience: "",
    specializations: [],
    certifications: "",
    availability: [],
    hourlyRate: "",
    bio: "",
    portfolio: null, // Tên file
    idDocument: null, // Tên file
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const navigate = useNavigate();

  // 💡 LOGIC KIỂM TRA ĐĂNG NHẬP VÀ CHUYỂN HƯỚNG
  useEffect(() => {
    if (loggedInUser) {
      // Chuyển hướng nếu đã đăng nhập
      navigate("/");
    }
  }, [loggedInUser, navigate]);
  
  const handleBackToHome = () => {
    navigate("/");
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleFileChange = (field, file) => {
    // Chỉ lưu tên file cho mục đích minh họa
    if (file) {
        updateFormData(field, file.name);
    } else {
        updateFormData(field, null);
    }
  };

  const toggleSpecialization = (spec) => {
    updateFormData("specializations", 
      formData.specializations.includes(spec)
        ? formData.specializations.filter(s => s !== spec)
        : [...formData.specializations, spec]
    );
  };

  const toggleAvailability = (day) => {
    updateFormData("availability", 
      formData.availability.includes(day)
        ? formData.availability.filter(d => d !== day)
        : [...formData.availability, day]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    // Validation checks
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || 
        !formData.experience || formData.specializations.length === 0 || 
        !formData.bio || !formData.hourlyRate || !formData.agreeToTerms || !formData.agreeToBackgroundCheck) {
      setMessage("❌ Vui lòng điền đầy đủ thông tin bắt buộc và đồng ý các điều khoản.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    // Simulate API call for 2 seconds
    setTimeout(() => {
        setLoading(false);
        // Simulate successful registration
        setMessage("✅ Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ để xác minh hồ sơ.");
        setMessageType("success");
        // Optionally reset form data
        // setFormData({
        //     // ... reset form state to initial values
        // });
    }, 2000);
  };
  
  // 💡 Early return nếu đã đăng nhập
  if (loggedInUser) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-xl text-blue-600 font-semibold p-8 bg-white rounded-xl shadow-lg">Đang chuyển hướng về trang chủ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header với background màu xanh nhạt */}
      <div 
        className="relative py-16"
        style={{
          backgroundImage: "url('https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTUvYMVwAgyyFHCZJc0lf74j85foiW-5tcp_0-Utq6btFnaDOiTCegimm48frzL8bcctQjWbSro5jXndDUSN-FIUaQnODNtA3KkalUdQGxF5-I4MnA')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* Overlay để chữ dễ đọc */}
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
            <button
                className="absolute top-0 left-0 lg:-left-20 flex items-center text-white/90 hover:text-white transition-colors group p-2 rounded-lg bg-black/20 hover:bg-black/30 backdrop-blur-sm"
                onClick={handleBackToHome}
            >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Về trang chủ
            </button>
            
          {/* Logo */}
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-800/50">
            <User className="w-10 h-10 text-white" />
          </div>

          {/* Tiêu đề chính */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Trở Thành Kỹ Thuật Viên Chuyên Nghiệp
          </h1>
          <p className="text-xl mb-12">
            Tham gia nền tảng dịch vụ gia đình hàng đầu Việt Nam và bắt đầu kiếm tiền ngay hôm nay
          </p>

          {/* 3 cards benefit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-xl transform transition hover:scale-[1.03] duration-300 ease-in-out">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Thu nhập cao</h3>
              <p className="text-gray-600 text-sm">Lên đến 15 triệu/tháng</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-xl transform transition hover:scale-[1.03] duration-300 ease-in-out">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Bảo hiểm đầy đủ</h3>
              <p className="text-gray-600 text-sm">An toàn trong công việc</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-xl transform transition hover:scale-[1.03] duration-300 ease-in-out">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Linh hoạt thời gian</h3>
              <p className="text-gray-600 text-sm">Tự do sắp xếp lịch làm việc</p>
            </div>
          </div>
        </div>
      </div>


      {/* Form Section */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Message Box */}
            {message && (
              <div
                className={`p-4 mx-8 mt-8 rounded-xl text-sm font-medium 
                  ${messageType === "success" ? "bg-green-100 text-green-800 border border-green-300" : ""}
                  ${messageType === "error" ? "bg-red-100 text-red-800 border border-red-300" : ""}`}
              >
                {message}
              </div>
            )}

            {/* Thông Tin Cá Nhân */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">1. Thông Tin Cá Nhân</h2>
                  <p className="text-sm text-gray-600">Cung cấp thông tin cơ bản về bản thân</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    placeholder="example@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    placeholder="0123 456 789"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Số nhà, tên đường, phường/xã"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">Chọn thành phố</option>
                    <option value="hanoi">Hà Nội</option>
                    <option value="hcm">TP. Hồ Chí Minh</option>
                    <option value="danang">Đà Nẵng</option>
                    <option value="haiphong">Hải Phòng</option>
                    <option value="cantho">Cần Thơ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Kinh Nghiệm & Kỹ Năng */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">2. Kinh Nghiệm & Kỹ Năng</h2>
                  <p className="text-sm text-gray-600">Chia sẻ về chuyên môn và kinh nghiệm làm việc</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số năm kinh nghiệm *</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => updateFormData("experience", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">Chọn số năm kinh nghiệm</option>
                    <option value="0-1">Dưới 1 năm</option>
                    <option value="1-3">1-3 năm</option>
                    <option value="3-5">3-5 năm</option>
                    <option value="5-10">5-10 năm</option>
                    <option value="10+">Trên 10 năm</option>
                  </select>
                </div>

                {/* Specializations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Lĩnh vực chuyên môn *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SPECIALIZATIONS.map((spec) => (
                      <label 
                        key={spec} 
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.specializations.includes(spec) 
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm text-gray-700 font-medium">{spec}</span>
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => toggleSpecialization(spec)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          style={{ minWidth: '1rem' }}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chứng chỉ & Bằng cấp</label>
                  <textarea
                    rows={4}
                    value={formData.certifications}
                    onChange={(e) => updateFormData("certifications", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors resize-none"
                    placeholder="Liệt kê các chứng chỉ chuyên môn, bằng cấp có liên quan..."
                  />
                </div>
              </div>
            </div>

            {/* Thông Tin Bổ Sung */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">3. Thông Tin Bổ Sung</h2>
                  <p className="text-sm text-gray-600">Hoàn thiện hồ sơ để thu hút khách hàng</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức lương mong muốn (VNĐ/giờ) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => updateFormData("hourlyRate", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg pl-4 pr-16 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors"
                      placeholder="150000"
                    />
                    <span className="absolute right-0 top-0 h-full flex items-center pr-4 text-gray-500 text-sm font-medium">VNĐ/giờ</span>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu bản thân *</label>
                  <textarea
                    rows={5}
                    value={formData.bio}
                    onChange={(e) => updateFormData("bio", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-colors resize-none"
                    placeholder="Mô tả về kinh nghiệm, kỹ năng và những điều đặc biệt khách hàng nên biết về bạn..."
                  />
                </div>
                
                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thời gian có thể làm việc</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {AVAILABILITY_OPTIONS.map((day) => (
                      <label 
                        key={day} 
                        className={`flex justify-center items-center p-3 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                          formData.availability.includes(day) 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.availability.includes(day)}
                          onChange={() => toggleAvailability(day)}
                          className="hidden"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Portfolio Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh công việc</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer block bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange("portfolio", e.target.files[0])}
                      />
                      <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {formData.portfolio ? `Đã chọn: ${formData.portfolio}` : "Tải lên hình ảnh các công việc đã thực hiện"}
                      </p>
                    </label>
                  </div>

                  {/* ID Document Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giấy tờ tùy thân</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer block bg-gray-50">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.png"
                        className="hidden"
                        onChange={(e) => handleFileChange("idDocument", e.target.files[0])}
                      />
                      <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {formData.idDocument ? `Đã chọn: ${formData.idDocument}` : "Tải lên CMND/CCCD hoặc Passport"}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Điều khoản */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">4. Điều khoản & Xác nhận</h2>
                  <p className="text-sm text-gray-600">Vui lòng đọc và đồng ý với các điều khoản</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => updateFormData("agreeToTerms", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a> và{" "}
                    <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a> của nền tảng *
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToBackgroundCheck}
                    onChange={(e) => updateFormData("agreeToBackgroundCheck", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Tôi đồng ý cho phép nền tảng kiểm tra lý lịch và xác thực thông tin cá nhân để đảm bảo chất lượng dịch vụ *
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Đang gửi hồ sơ...</span>
                    </div>
                  ) : (
                    "Đăng Ký Ngay"
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600 pb-12">
            <p className="mb-2">Cần hỗ trợ? Liên hệ ngay với chúng tôi</p>
            <div className="flex items-center justify-center gap-6">
              <a href="mailto:support@homeservice.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                <Mail className="w-4 h-4" />
                support@homeservice.com
              </a>
              <a href="tel:1900-1234" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                <Phone className="w-4 h-4" />
                1900-1234
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
