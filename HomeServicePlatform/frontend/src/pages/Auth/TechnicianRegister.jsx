import { useState } from "react";
import { Upload, User, Briefcase, FileText, Award, Phone, Mail, MapPin, Calendar, Star, Clock, DollarSign, CheckCircle, Shield, Zap } from "lucide-react";

const SPECIALIZATIONS = [
  "Điện", "Nước", "Điều hòa", "Sửa chữa đồ điện tử", 
  "Sơn nhà", "Dọn dẹp", "Làm vườn", "Sửa chữa nội thất",
  "Lắp đặt thiết bị", "Bảo trì máy móc"
];

const AVAILABILITY_OPTIONS = [
  "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"
];

export default function TechnicianRegister() {
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
    portfolio: null,
    idDocument: null,
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || 
        !formData.experience || formData.specializations.length === 0 || 
        !formData.bio || !formData.hourlyRate || !formData.agreeToTerms || !formData.agreeToBackgroundCheck) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }
    alert("Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24 giờ.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header với background màu xanh nhạt */}
      <div 
  className="relative py-16"
  style={{
    backgroundImage: "url('https://encrypted-tbn0.gstatic.com/licensed-image?q=tbn:ANd9GcTUvYMVwAgyyFHCZJc0lf74j85foiW-5tcp_0-Utq6btFnaDOiTCegimm48frzL8bcctQjWbSro5jXndDUSN-FIUaQnODNtA3KkalUdQGxF5-I4MnA')",  // 👉 đổi ảnh
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
>
  {/* Overlay để chữ dễ đọc */}
  <div className="absolute inset-0 bg-black/30"></div>

  <div className="relative max-w-6xl mx-auto px-4 text-center text-white">
    {/* Logo */}
    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
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
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Star className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Thu nhập cao</h3>
        <p className="text-gray-600 text-sm">Lên đến 15 triệu/tháng</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="font-semibold text-lg text-gray-800 mb-2">Bảo hiểm đầy đủ</h3>
        <p className="text-gray-600 text-sm">An toàn trong công việc</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
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
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            
            {/* Thông Tin Cá Nhân */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Thông Tin Cá Nhân</h2>
                  <p className="text-sm text-gray-600">Cung cấp thông tin cơ bản về bản thân</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="0123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateFormData("address", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Số nhà, tên đường, phường/xã"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                  <select
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Kinh Nghiệm & Kỹ Năng</h2>
                  <p className="text-sm text-gray-600">Chia sẻ về chuyên môn và kinh nghiệm làm việc</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số năm kinh nghiệm *</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => updateFormData("experience", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="">Chọn số năm kinh nghiệm</option>
                    <option value="0-1">Dưới 1 năm</option>
                    <option value="1-3">1-3 năm</option>
                    <option value="3-5">3-5 năm</option>
                    <option value="5-10">5-10 năm</option>
                    <option value="10+">Trên 10 năm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Lĩnh vực chuyên môn *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SPECIALIZATIONS.map((spec) => (
                      <label key={spec} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => toggleSpecialization(spec)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chứng chỉ & Bằng cấp</label>
                  <textarea
                    rows={4}
                    value={formData.certifications}
                    onChange={(e) => updateFormData("certifications", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                    placeholder="Liệt kê các chứng chỉ chuyên môn, bằng cấp có liên quan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thời gian có thể làm việc</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {AVAILABILITY_OPTIONS.map((day) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.availability.includes(day)}
                          onChange={() => toggleAvailability(day)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông Tin Bổ Sung */}
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Thông Tin Bổ Sung</h2>
                  <p className="text-sm text-gray-600">Hoàn thiện hồ sơ để thu hút khách hàng</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức lương mong muốn (VNĐ/giờ) *</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => updateFormData("hourlyRate", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="150000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu bản thân *</label>
                  <textarea
                    rows={5}
                    value={formData.bio}
                    onChange={(e) => updateFormData("bio", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                    placeholder="Mô tả về kinh nghiệm, kỹ năng và những điều đặc biệt khách hàng nên biết về bạn..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh công việc</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tải lên hình ảnh các công việc đã thực hiện</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giấy tờ tùy thân</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tải lên CMND/CCCD hoặc Passport</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Điều khoản */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Điều khoản & Xác nhận</h2>
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
                    Tôi đồng ý với <span className="text-blue-600 underline">Điều khoản sử dụng</span> và{" "}
                    <span className="text-blue-600 underline">Chính sách bảo mật</span> của nền tảng
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
                    Tôi đồng ý cho phép nền tảng kiểm tra lý lịch và xác thực thông tin cá nhân để đảm bảo chất lượng dịch vụ
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-12 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Đăng Ký Ngay
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600">
            <p className="mb-2">Cần hỗ trợ? Liên hệ ngay với chúng tôi</p>
            <div className="flex items-center justify-center gap-6">
              <a href="mailto:support@homeservice.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <Mail className="w-4 h-4" />
                support@homeservice.com
              </a>
              <a href="tel:1900-1234" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
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