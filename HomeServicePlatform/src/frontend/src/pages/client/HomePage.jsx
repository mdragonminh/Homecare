// src/pages/client/HomePage.jsx
import { useState, useEffect } from "react";
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
  Quote,
  Loader2, // Icon cho trạng thái loading
} from "lucide-react";
// eslint-disable-next-line
import { motion } from "framer-motion";
import { technicianApi } from "../../services/technicianApi";
import { serviceApi } from "../../services/serviceApi"; // Import serviceApi

// Danh sách ảnh Hero - rõ nét, đẹp
const heroImages = [
  "https://luxurydecor.vn/wp-content/uploads/2019/12/thiet-ke-noi-that-chung-cu-2-phong-ngu-6.jpg",
  "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg",
  "https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg",
  "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg",
  "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
];

const features = [
  { icon: Wrench, title: "Yêu cầu dịch vụ", desc: "Gửi yêu cầu nhanh, theo dõi real-time" },
  { icon: Calendar, title: "Đặt lịch & Báo giá", desc: "So sánh giá từ nhiều thợ" },
  { icon: Home, title: "Quản lý nhà", desc: "Thêm căn hộ, mời người thân" },
  { icon: CreditCard, title: "Thanh toán an toàn", desc: "Ví điện tử, hóa đơn tự động" },
  { icon: Bell, title: "Thông báo", desc: "Nhắc lịch, cập nhật tiến độ" },
  { icon: Shield, title: "Bảo mật & KYC", desc: "Xác thực thợ, bảo hiểm dịch vụ" },
];

const testimonials = [
  { name: "Chị Nguyễn Lan", role: "Chủ căn hộ Vinhomes", content: "Tìm thợ cực nhanh, giá minh bạch, thợ đến đúng giờ!", avatar: "https://i.pravatar.cc/150?img=5" },
  { name: "Anh Minh Khoa", role: "Người thuê căn hộ", content: "Thanh toán online tiện lắm, không cần tiền mặt.", avatar: "https://i.pravatar.cc/150?img=12" },
  { name: "Cô Hà", role: "Chủ nhà phố", content: "Đã dùng 5 lần sửa điện + điều hòa, lần nào cũng ưng!", avatar: "https://i.pravatar.cc/150?img=8" },
];

// Hàm ánh xạ tên dịch vụ từ API với Icon (tạm thời)
const mapServiceTitleToIcon = (title) => {
    const lowerTitle = title ? title.toLowerCase() : '';
    if (lowerTitle.includes("điều hòa")) return Fan;
    if (lowerTitle.includes("điện")) return Zap;
    if (lowerTitle.includes("nước") || lowerTitle.includes("ống")) return Wrench;
    if (lowerTitle.includes("vệ sinh")) return Sparkles;
    if (lowerTitle.includes("vận chuyển")) return Car;
    if (lowerTitle.includes("cắt tỉa") || lowerTitle.includes("cây")) return Scissors;
    return Wrench; // Mặc định
};

export function HomePage({ onShowRegister, loggedInUser }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const [featuredTechnicians, setFeaturedTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);

  // State để lưu trữ dữ liệu dịch vụ từ API
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Hero slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Testimonial slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Load featured technicians
  useEffect(() => {
    const loadTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const res = await technicianApi.getFeaturedTechnicians(8);
        if (res.success) setFeaturedTechnicians(res.data || []);
      } catch (err) {
        console.error("Lỗi khi tải kỹ thuật viên:", err);
      } finally {
        setLoadingTechnicians(false);
      }
    };
    loadTechnicians();
  }, []);

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const res = await serviceApi.getServices(); // Gọi API dịch vụ
        if (res.success && Array.isArray(res.data)) {
          // Chỉ lấy tối đa 6 dịch vụ để hiển thị
          setServices(res.data.slice(0, 6)); 
        } else {
            setServices([]);
            console.error("Lỗi hoặc dữ liệu trả về không phải mảng:", res.message || "Dữ liệu không hợp lệ");
        }
      } catch (err) {
        console.error("Lỗi khi tải dịch vụ:", err);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);


  const getAvatarUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const base = API_URL.endsWith("/api") ? API_URL : API_URL.replace(/\/api$/, "") + "/api";
    return `${base}/File/preview?filePath=${encodeURIComponent(filePath)}`;
  };

  return (
    <div className="bg-white min-h-screen">

      {/* HERO - Ảnh rõ nét, không nền đè */}
      <section className="relative h-[420px] md:h-[520px] overflow-hidden">
        {heroImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: currentSlide === i ? 1 : 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${img})` }}
            />
          </motion.div>
        ))}

        {/* Chỉ có lớp tối nhẹ ở dưới để chữ nổi bật */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative h-full flex items-end pb-10 md:pb-14">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl text-white"
            >
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Dịch vụ nhà cửa<br />
                <span className="text-cyan-400">Chỉ 1 chạm là xong</span>
              </h1>
              <p className="text-base md:text-lg mt-4 text-gray-200">
                Kết nối nhanh với thợ uy tín • Báo giá tức thì • Thanh toán an toàn
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onShowRegister}
                  className="bg-white text-blue-600 font-semibold px-7 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition"
                >
                  Bắt đầu ngay <ArrowRight className="w-5 h-5" />
                </motion.button>

                <motion.button className="border border-white/70 text-white px-7 py-3.5 rounded-xl backdrop-blur-sm flex items-center justify-center gap-2 hover:bg-white/10 transition">
                  <Play className="w-5 h-5" /> Xem giới thiệu
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Dots nhỏ gọn */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentSlide === i ? "bg-white w-10" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </section>

      {/* FEATURES - Nhỏ gọn, hiện đại */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">
            Tại sao chọn chúng tôi?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="text-center group"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                  <f.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">{f.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES - SỬ DỤNG DỮ LIỆU TỪ API */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">
            Dịch vụ phổ biến
          </h2>

          {loadingServices ? (
            // Hiển thị trạng thái Loading
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600">Đang tải dịch vụ...</span>
            </div>
          ) : services.length === 0 ? (
            // Hiển thị khi không có dịch vụ
            <div className="text-center text-gray-500 h-48 flex items-center justify-center">
                Không tìm thấy dịch vụ nào.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {services.map((s, i) => {
                const Icon = mapServiceTitleToIcon(s.name); 
                
                return (
                  <motion.div
                    key={s.id || i}
                    whileHover={{ y: -8, scale: 1.05 }}
                    className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100"
                  >
                    {/* Giả định API trả về trường 'isHot' */}
                    {s.isHot && ( 
                      <span className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow">
                        HOT
                      </span>
                    )}
                    <div className="w-14 h-14 mx-auto mb-4 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    {/* Sử dụng tên dịch vụ từ API */}
                    <h3 className="text-center text-sm font-semibold text-gray-800">{s.name}</h3>
                    {/* Sử dụng mô tả dịch vụ từ API */}
                    <p className="text-center text-xs text-gray-500 mt-1">{s.description || "Dịch vụ chất lượng cao"}</p> 
                    {/* Hiển thị giá tối thiểu (giả định trường minPrice là số) */}
                    <p className="text-center text-sm font-bold text-blue-600 mt-3">
                        {s.minPrice ? `Từ ${new Intl.NumberFormat('vi-VN').format(s.minPrice)}đ` : "Liên hệ"}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* TECHNICIANS */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">
            Thợ được đánh giá cao
          </h2>

          {loadingTechnicians ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse shadow" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {featuredTechnicians.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl p-6 text-center shadow hover:shadow-lg transition border"
                >
                  <img
                    src={getAvatarUrl(t.avatarUrl) || `https://i.pravatar.cc/150?u=${t.id}`}
                    alt={t.fullName}
                    className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-gray-100"
                    onError={(e) => (e.target.src = `https://i.pravatar.cc/150?u=${t.id}`)}
                  />
                  <h3 className="mt-4 text-sm font-semibold text-gray-800">{t.fullName}</h3>
                  <div className="flex items-center justify-center mt-3 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 text-sm font-bold">{t.rating?.toFixed(1) || "5.0"}</span>
                    <span className="ml-1 text-xs text-gray-500">({t.ratingCount || 89})</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6">
          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-10 text-center"
          >
            <Quote className="w-12 h-12 text-blue-200 mx-auto mb-6" />
            <p className="text-lg md:text-xl italic text-gray-700 leading-relaxed mb-8">
              "{testimonials[currentTestimonial].content}"
            </p>
            <div className="flex items-center justify-center gap-5">
              <img
                src={testimonials[currentTestimonial].avatar}
                alt={testimonials[currentTestimonial].name}
                className="w-16 h-16 rounded-full ring-4 ring-blue-200"
              />
              <div className="text-left">
                <p className="font-bold text-gray-800">{testimonials[currentTestimonial].name}</p>
                <p className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</p>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentTestimonial ? "bg-white w-10" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Admin Link */}
      {loggedInUser?.role === "admin" && (
        <div className="text-center py-12">
          <a
            href="/admin/accounts"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            Vào Trang Quản Trị
          </a>
        </div>
      )}
    </div>
  );
}