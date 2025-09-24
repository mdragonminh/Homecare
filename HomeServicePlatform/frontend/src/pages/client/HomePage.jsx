import { useState } from "react";
import { 
  ArrowRight, 
  Play, 
  Wrench, 
  Calendar, 
  Home, 
  CreditCard, 
  Bell, 
  Shield,
  Fan,
  Sparkles,
  Zap,
  Car,
  Scissors,
  Star,
  MapPin,
  Award,
  ChevronLeft,
  ChevronRight,
  Quote,
  CheckCircle
} from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";

// --- Data sections (features, services, technicians, testimonials) --- //
const features = [
  {
    icon: Wrench,
    title: "Yêu cầu dịch vụ",
    description: "Gửi yêu cầu sửa chữa, bảo trì nhanh chóng. Theo dõi tiến độ thực hiện real-time.",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    icon: Calendar,
    title: "Đặt lịch & Báo giá",
    description: "Quản lý lịch hẹn, nhận báo giá từ nhiều nhà cung cấp. So sánh và chọn lựa tối ưu.",
    color: "text-green-600", 
    bgColor: "bg-green-50"
  },
  {
    icon: Home,
    title: "Quản lý nhà & Thành viên",
    description: "Thêm căn hộ, mời thành viên gia đình. Phân quyền truy cập theo vai trò.",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    icon: CreditCard,
    title: "Thanh toán & Hóa đơn",
    description: "Thanh toán trực tuyến an toàn. Quản lý hóa đơn, lịch sử giao dịch chi tiết.",
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    icon: Bell,
    title: "Thông báo thông minh",
    description: "Nhận thông báo khi có cập nhật quan trọng. Tùy chỉnh theo sở thích cá nhân.",
    color: "text-red-600",
    bgColor: "bg-red-50"
  },
  {
    icon: Shield,
    title: "Xác thực & Bảo mật",
    description: "KYC verification, GatePass management. Đảm bảo an toàn cho mọi giao dịch.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50"
  }
];

const popularServices = [
  { icon: Fan, title: "Sửa chữa điều hòa", description: "Bảo trì, sửa chữa máy lạnh", price: "Từ 200,000đ", color: "text-blue-600", bgColor: "bg-blue-50" },
  { icon: Wrench, title: "Sửa chữa nước", description: "Sửa vòi, đường ống, thiết bị vệ sinh", price: "Từ 150,000đ", color: "text-cyan-600", bgColor: "bg-cyan-50" },
  { icon: Sparkles, title: "Vệ sinh nhà cửa", description: "Dọn dẹp căn hộ định kỳ", price: "Từ 300,000đ", color: "text-green-600", bgColor: "bg-green-50" },
  { icon: Zap, title: "Sửa chữa điện", description: "Lắp đặt, sửa chữa hệ thống điện", price: "Từ 180,000đ", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  { icon: Car, title: "Bảo vệ & Vận chuyển", description: "Dịch vụ bảo vệ, vận chuyển đồ", price: "Từ 250,000đ", color: "text-purple-600", bgColor: "bg-purple-50" },
  { icon: Scissors, title: "Dịch vụ khác", description: "Cắt tỉa cây, sửa nội thất", price: "Từ 100,000đ", color: "text-orange-600", bgColor: "bg-orange-50" }
];

const featuredTechnicians = [
  { id: 1, name: "Anh Thế Anh", specialty: "Điều hòa", rating: 4.9, reviewCount: 127, location: "Quận 1, TP.HCM", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: 2, name: "Chị Mai Hương", specialty: "Vệ sinh", rating: 4.8, reviewCount: 98, location: "Quận 7, TP.HCM", avatar: "https://i.pravatar.cc/150?img=2" },
  { id: 3, name: "Anh Minh Tuấn", specialty: "Điện", rating: 4.9, reviewCount: 156, location: "Quận 3, TP.HCM", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: 4, name: "Anh Đức Huy", specialty: "Nước", rating: 4.7, reviewCount: 89, location: "Quận 2, TP.HCM", avatar: "https://i.pravatar.cc/150?img=4" }
];

const testimonials = [
  { id: 1, name: "Nguyễn Thị Lan", content: "HomeCare giúp tôi tìm thợ rất nhanh, giá hợp lý.", role: "Chủ căn hộ", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: 2, name: "Trần Minh Khoa", content: "Thanh toán online tiện lợi, dịch vụ chuyên nghiệp.", role: "Người thuê", avatar: "https://i.pravatar.cc/150?img=6" }
];

// --- Main HomePage --- //
export function HomePage({ onShowLogin, onShowRegister,loggedInUser, onLogout }) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header onShowLogin={onShowLogin} onShowRegister={onShowRegister}  loggedInUser={loggedInUser}
        onLogout={onLogout}/>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold">
                Quản lý dịch vụ <span className="text-blue-600">HomeServicePlatform</span> dễ dàng hơn
              </h1>
              <p className="text-lg text-gray-600">
                Kết nối chủ nhà và thợ sửa chữa chỉ trong một nền tảng. Đặt lịch, thanh toán, quản lý dễ dàng.
              </p>
              <div className="flex gap-4">
                <button onClick={onShowRegister} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center">
                  Bắt đầu ngay <ArrowRight className="ml-2 w-5 h-5" />
                </button>
                <button className="border px-6 py-3 rounded-lg hover:bg-gray-100 flex items-center">
                  <Play className="mr-2 w-5 h-5" /> Xem demo
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1723847165390-f45ef02f6b86" alt="Thợ sửa chữa" className="rounded-2xl shadow-lg" />
              <div className="absolute -top-4 -left-4 bg-white p-3 shadow rounded">
                <p className="text-green-600 font-medium">✓ Yêu cầu hoàn thành</p>
                <p className="text-sm text-gray-500">Sửa điều hòa - A101</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Tính năng nổi bật</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-lg shadow hover:shadow-lg transition">
                  <div className={`w-12 h-12 flex items-center justify-center ${f.bgColor} rounded mb-4`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{f.title}</h3>
                  <p className="text-gray-600">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Dịch vụ phổ biến</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularServices.map((s, i) => (
                <div key={i} className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
                  <div className={`w-12 h-12 ${s.bgColor} flex items-center justify-center rounded mb-3`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-gray-600 mb-3">{s.description}</p>
                  <p className="text-blue-600 font-medium">{s.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technicians */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Kỹ thuật viên nổi bật</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTechnicians.map((t) => (
                <div key={t.id} className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-lg">
                  <img src={t.avatar} alt={t.name} className="w-20 h-20 mx-auto rounded-full mb-4" />
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-gray-500 text-sm">{t.specialty}</p>
                  <div className="flex justify-center items-center mt-2 text-yellow-500">
                    <Star className="w-4 h-4 fill-yellow-400" /> <span className="ml-1">{t.rating}</span>
                  </div>
                  <p className="text-sm text-gray-500">{t.location}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Khách hàng nói gì</h2>
            <div className="max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-lg shadow relative">
                <Quote className="absolute top-4 left-4 text-gray-200 w-10 h-10" />
                <p className="text-lg mb-6">"{testimonials[currentTestimonial].content}"</p>
                <div className="flex items-center justify-center gap-3">
                  <img src={testimonials[currentTestimonial].avatar} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold">{testimonials[currentTestimonial].name}</p>
                    <p className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)} className="p-2 border rounded-full">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)} className="p-2 border rounded-full">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
