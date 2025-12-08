// src/pages/client/HomePage.jsx
import { useState, useEffect } from "react";
import {
  ArrowRight, Play, Wrench, Calendar, Home, CreditCard, Bell, Shield,
  Fan, Sparkles, Zap, Car, Scissors, Star, Quote, CheckCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { technicianApi } from "../../services/technicianApi";

// Danh sách ảnh Hero
const heroImages = [
  "https://luxurydecor.vn/wp-content/uploads/2019/12/thiet-ke-noi-that-chung-cu-2-phong-ngu-6.jpg",
  "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg",
  "https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg",
  "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg",
  "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
];

const features = [
  { icon: Wrench, title: "Yêu cầu dịch vụ", desc: "Gửi yêu cầu nhanh, theo dõi real-time", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Calendar, title: "Đặt lịch & Báo giá", desc: "So sánh giá từ nhiều thợ", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Home, title: "Quản lý nhà & Thành viên", desc: "Thêm căn hộ, mời người thân", color: "text-cyan-600", bg: "bg-cyan-50" },
  { icon: CreditCard, title: "Thanh toán an toàn", desc: "Ví điện tử, hóa đơn tự động", color: "text-teal-600", bg: "bg-teal-50" },
  { icon: Bell, title: "Thông báo thông minh", desc: "Nhắc lịch, cập nhật tiến độ", color: "text-green-600", bg: "bg-green-50" },
  { icon: Shield, title: "Bảo mật & KYC", desc: "Xác thực thợ, bảo hiểm dịch vụ", color: "text-indigo-600", bg: "bg-indigo-50" }
];

// Định nghĩa màu sắc riêng cho từng dịch vụ
const serviceColors = [
    { iconColor: "text-red-600", bgColor: "from-red-100 to-red-50" },     // Sửa điều hòa (Fan)
    { iconColor: "text-amber-600", bgColor: "from-amber-100 to-amber-50" }, // Sửa điện (Zap)
    { iconColor: "text-blue-600", bgColor: "from-blue-100 to-blue-50" },   // Sửa ống nước (Wrench)
    { iconColor: "text-teal-600", bgColor: "from-teal-100 to-teal-50" },   // Vệ sinh nhà (Sparkles)
    { iconColor: "text-purple-600", bgColor: "from-purple-100 to-purple-50" }, // Vận chuyển (Car)
    { iconColor: "text-lime-600", bgColor: "from-lime-100 to-lime-50" }    // Cắt tỉa cây (Scissors)
];


const popularServices = [
  { icon: Fan, title: "Sửa điều hòa", desc: "Vệ sinh, nạp gas, sửa lỗi", price: "Từ 250k", hot: true },
  { icon: Zap, title: "Sửa điện", desc: "Ổ cắm, đèn, quạt", price: "Từ 180k" },
  { icon: Wrench, title: "Sửa ống nước", desc: "Thay vòi, thông tắc", price: "Từ 150k" },
  { icon: Sparkles, title: "Vệ sinh nhà", desc: "Dọn tổng, sofa, kính", price: "Từ 400k", hot: true },
  { icon: Car, title: "Vận chuyển", desc: "Chuyển nhà, đồ đạc", price: "Từ 500k" },
  { icon: Scissors, title: "Cắt tỉa cây", desc: "Tỉa cây, chăm vườn", price: "Từ 300k" }
];

const testimonials = [
  { name: "Chị Nguyễn Lan", role: "Chủ căn hộ Vinhomes", content: "Tìm thợ cực nhanh, giá minh bạch, thợ đến đúng giờ!", avatar: "https://i.pravatar.cc/150?img=5" },
  { name: "Anh Minh Khoa", role: "Người thuê căn hộ", content: "Thanh toán online tiện lắm, không cần tiền mặt.", avatar: "https://i.pravatar.cc/150?img=12" },
  { name: "Cô Hà", role: "Chủ nhà phố", content: "Đã dùng 5 lần sửa điện + điều hòa, lần nào cũng ưng!", avatar: "https://i.pravatar.cc/150?img=8" }
];

export function HomePage({ onShowRegister, loggedInUser }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [featuredTechnicians, setFeaturedTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);

  // Hero slider – 8 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Testimonial slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Load technicians
  useEffect(() => {
    const load = async () => {
      setLoadingTechnicians(true);
      try {
        const res = await technicianApi.getFeaturedTechnicians(8);
        if (res.success) setFeaturedTechnicians(res.data || []);
      } catch (err) { console.error(err); }
      finally { setLoadingTechnicians(false); }
    };
    load();
  }, []);

  const getAvatarUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const base = API_URL.endsWith("/api") ? API_URL : API_URL.replace(/\/api$/, "") + "/api";
    return `${base}/File/preview?filePath=${encodeURIComponent(filePath)}`;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">

      {/* HERO SLIDER – KHÔNG MỜ ẢNH, GRADIENT ĐẬM NỔI BẬT */}
      <section className="relative h-[500px] md:h-[600px] lg:h-[720px] overflow-hidden">
        {/* Background ảnh rõ nét, không blend */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out"
          style={{ 
            backgroundImage: `url(${heroImages[currentSlide]})`
          }}
        />
        {/* Overlay gradient đậm, nổi bật (xanh dương + tím đậm, opacity thấp để ảnh rõ) */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-blue-900/20 to-purple-900/20" />

        {/* Nội dung Hero */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl text-white"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                Dịch vụ nhà cửa<br />
                {/* Đổi màu gradient sang màu vàng/cam/hồng nổi bật hơn */}
                <span className="bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 bg-clip-text text-transparent">

                  Chỉ 1 chạm là xong
                </span>
              </h1>
              <p className="text-lg md:text-xl mt-5 mb-8 text-gray-100 font-light">
                Kết nối ngay với hàng nghìn thợ uy tín • Báo giá tức thì • Thanh toán an toàn
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowRegister}
                  className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl shadow-2xl flex items-center justify-center gap-3 text-lg hover:shadow-purple-500/50 transition"
                >
                  Bắt đầu miễn phí <ArrowRight className="w-6 h-6" />
                </motion.button>
                <motion.button className="border-2 border-white/80 text-white px-8 py-4 rounded-xl backdrop-blur-sm flex items-center justify-center gap-3 hover:bg-white/10 transition">
                  <Play className="w-6 h-6" /> Xem giới thiệu
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Dots + Prev/Next */}
        <div className="absolute inset-y-0 w-full flex justify-between items-center px-4 z-10">
          <button
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + heroImages.length) % heroImages.length
              )
            }
            // KÍCH THƯỚC NHỎ LẠI: w-10 h-10
            className="w-10 h-10 bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition duration-300 shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" /> {/* ICON NHỎ LẠI */}
          </button>
          <button
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % heroImages.length)
            }
            // KÍCH THƯỚC NHỎ LẠI: w-10 h-10
            className="w-10 h-10 bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition duration-300 shadow-lg"
          >
            <ChevronRight className="h-5 w-5" /> {/* ICON NHỎ LẠI */}
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Tại sao chọn chúng tôi?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl shadow hover:shadow-lg transition"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-base font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES – MÀU RIÊNG CHO TIÊU ĐỀ, GIÁ VÀ ICON */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dịch vụ phổ biến
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {popularServices.map((s, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }} className="relative bg-white dark:bg-gray-800 rounded-xl shadow p-5 text-center">
                {s.hot && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">HOT</div>}
                {/* Thay đổi màu nền và màu icon dựa trên serviceColors */}
                <div className={`w-14 h-14 mx-auto mb-3 bg-gradient-to-br ${serviceColors[i].bgColor} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-8 h-8 ${serviceColors[i].iconColor}`} />
                </div>
                <h3 className="text-base font-semibold text-black dark:text-white">{s.title}</h3> {/* Màu đen cho tiêu đề */}
                <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">{s.price}</p> {/* Màu xanh dương cho giá */}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNICIANS */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Thợ được đánh giá cao
          </h2>
          {loadingTechnicians ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 h-64 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredTechnicians.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow p-5"
                >
                  <img
                    src={getAvatarUrl(t.avatarUrl) || `https://i.pravatar.cc/150?u=${t.id}`}
                    alt={t.fullName}
                    className="w-20 h-20 mx-auto rounded-full object-cover border-4 border-white shadow"
                    onError={e => e.target.src = `https://i.pravatar.cc/150?u=${t.id}`}
                  />
                  <h3 className="mt-3 text-base font-bold text-black dark:text-white">{t.fullName}</h3>
                  <div className="flex justify-center gap-1 flex-wrap mt-2">
                    {t.services?.slice(0, 2).map((s, idx) => (
                      <span key={idx} className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 px-2 py-1 rounded">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-center mt-3 text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 font-bold">{t.rating?.toFixed(1) || "5.0"}</span>
                    <span className="ml-1 text-xs text-gray-500">({t.ratingCount || 89})</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-14 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">Khách hàng nói gì</h2>
          <div className="max-w-2xl mx-auto">
            <motion.div className="bg-white rounded-xl shadow-xl p-6 text-center">
              <Quote className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-base italic text-gray-700">"{testimonials[currentTestimonial].content}"</p>
              <div className="flex items-center justify-center gap-4 mt-5">
                <img src={testimonials[currentTestimonial].avatar} alt="" className="w-12 h-12 rounded-full border-2 border-purple-500" />
                <div>
                  <p className="font-semibold">{testimonials[currentTestimonial].name}</p>
                  <p className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
            <div className="flex justify-center gap-2 mt-5">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrentTestimonial(i)} className={`w-2 h-2 rounded-full transition ${i === currentTestimonial ? "bg-white w-8" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {loggedInUser?.role === 'admin' && (
        <div className="text-center py-8">
          <a href="/admin/accounts" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">
            Vào Trang Quản Trị
          </a>
        </div>
      )}
    </div>
  );
}