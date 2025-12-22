// src/pages/client/HomePage.jsx
import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  Play,
  Wrench,
  Fan,
  Sparkles,
  Zap,
  Car,
  Scissors,
  Star,
  Loader2,
  ChevronRight,
  Calendar,
  Users,
  CheckCircle,
  Heart,
} from "lucide-react";
/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { technicianApi } from "../../services/technicianApi";
import { serviceApi } from "../../services/serviceApi";
import { statisticsApi } from "../../services/statisticsApi";

const heroImages = [
  "https://images.pexels.com/photos/3990359/pexels-photo-3990359.jpeg",
  "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg",
  "https://images.pexels.com/photos/442160/pexels-photo-442160.jpeg",
  "https://images.pexels.com/photos/8853536/pexels-photo-8853536.jpeg",
  "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg",
];

const mapServiceTitleToIcon = (title) => {
  const lowerTitle = title ? title.toLowerCase() : "";
  if (lowerTitle.includes("điều hòa")) return Fan;
  if (lowerTitle.includes("điện")) return Zap;
  if (lowerTitle.includes("nước") || lowerTitle.includes("ống")) return Wrench;
  if (lowerTitle.includes("vệ sinh")) return Sparkles;
  if (lowerTitle.includes("vận chuyển")) return Car;
  if (lowerTitle.includes("cắt tỉa") || lowerTitle.includes("cây")) return Scissors;
  return Wrench;
};

export function HomePage({ onShowRegister, loggedInUser }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredTechnicians, setFeaturedTechnicians] = useState([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [statistics, setStatistics] = useState({
    totalBookings: 0,
    totalTechnicians: 0,
    activeTechnicians: 0,
    completionRate: 0,
    customerSatisfaction: 0,
  });
  const [loadingStatistics, setLoadingStatistics] = useState(true);

  // Logic xoay vòng Dịch vụ (6 cái)
  const [serviceStartIndex, setServiceStartIndex] = useState(0);
  
  // Logic xoay vòng Kỹ thuật viên (4 cái) - MỚI
  const [techStartIndex, setTechStartIndex] = useState(0);

  // Hero slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tự động nhảy Dịch vụ
  useEffect(() => {
    if (services.length > 6) {
      const interval = setInterval(() => {
        setServiceStartIndex((prev) => (prev + 1) % services.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [services.length]);

  // Tự động nhảy Kỹ thuật viên - MỚI
  useEffect(() => {
    if (featuredTechnicians.length > 4) {
      const interval = setInterval(() => {
        setTechStartIndex((prev) => (prev + 1) % featuredTechnicians.length);
      }, 6000); // Tech nhảy chậm hơn dịch vụ 1 chút để đỡ rối mắt
      return () => clearInterval(interval);
    }
  }, [featuredTechnicians.length]);

  const visibleServices = useMemo(() => {
    if (services.length === 0) return [];
    let items = [];
    for (let i = 0; i < 6; i++) {
      items.push(services[(serviceStartIndex + i) % services.length]);
    }
    return items;
  }, [services, serviceStartIndex]);

  // Tính toán 4 Tech hiển thị - MỚI
  const visibleTechs = useMemo(() => {
    if (featuredTechnicians.length === 0) return [];
    let items = [];
    const countToShow = Math.min(4, featuredTechnicians.length);
    for (let i = 0; i < countToShow; i++) {
      items.push(featuredTechnicians[(techStartIndex + i) % featuredTechnicians.length]);
    }
    return items;
  }, [featuredTechnicians, techStartIndex]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoadingTechnicians(true);
      setLoadingServices(true);
      setLoadingStatistics(true);
      try {
        const [techRes, servRes, statsRes] = await Promise.all([
          technicianApi.getFeaturedTechnicians(12), // Lấy nhiều hơn để xoay vòng
          serviceApi.getServices(),
          statisticsApi.getPublicStatistics()
        ]);
        if (techRes.success) setFeaturedTechnicians(techRes.data || []);
        if (servRes.success) setServices(servRes.data || []);
        
        // Xử lý statistics với logging chi tiết
        console.log("Statistics API Response:", statsRes);
        if (statsRes.success && statsRes.data) {
          console.log("Statistics Data:", statsRes.data);
          setStatistics({
            totalBookings: statsRes.data.totalBookings || 0,
            totalTechnicians: statsRes.data.totalTechnicians || 0,
            activeTechnicians: statsRes.data.activeTechnicians || 0,
            completionRate: statsRes.data.completionRate || 0,
            customerSatisfaction: statsRes.data.customerSatisfaction || 0,
          });
        } else {
          console.warn("Statistics API failed or returned no data:", statsRes.message);
          // Giữ giá trị mặc định (0) nếu API fail
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoadingTechnicians(false);
        setLoadingServices(false);
        setLoadingStatistics(false);
      }
    };
    loadData();
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
      {/* HERO SECTION - Giữ nguyên */}
      <section className="relative h-[420px] md:h-[520px] overflow-hidden">
        {heroImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: currentSlide === i ? 1 : 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative h-full flex items-end pb-10 md:pb-14">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl text-white">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">Dịch vụ nhà cửa<br /><span className="text-cyan-400">Chỉ 1 chạm là xong</span></h1>
              <p className="text-base md:text-lg mt-4 text-gray-200">Kết nối nhanh với thợ uy tín • Báo giá tức thì • Thanh toán an toàn</p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button onClick={onShowRegister} className="bg-white text-blue-600 font-semibold px-7 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">Bắt đầu ngay <ArrowRight className="w-5 h-5" /></button>
                <a href="https://drive.google.com/file/d/1lKYEkP4KolPtMShne-RF4uq6ptgVOlUY/view" target="_blank" rel="noopener noreferrer" className="border border-white/70 text-white px-7 py-3.5 rounded-xl backdrop-blur-sm flex items-center justify-center gap-2 hover:bg-white/10 transition"><Play className="w-5 h-5" /> Xem giới thiệu</a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
              Thống kê nền tảng
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Những con số minh chứng cho chất lượng dịch vụ của chúng tôi
            </p>
          </motion.div>

          {loadingStatistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-40 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Bookings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">
                  {statistics.totalBookings.toLocaleString("vi-VN")}
                </h3>
                <p className="text-sm text-gray-600">Tổng đơn đặt</p>
              </motion.div>

              {/* Total Technicians */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">
                  {statistics.totalTechnicians.toLocaleString("vi-VN")}
                </h3>
                <p className="text-sm text-gray-600">
                  Kỹ thuật viên 
                </p>
              </motion.div>

              {/* Completion Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">
                  {statistics.completionRate.toFixed(1)}%
                </h3>
                <p className="text-sm text-gray-600">Tỷ lệ hoàn thành dịch vụ</p>
              </motion.div>

              {/* Customer Satisfaction */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-1">
                  {statistics.customerSatisfaction.toFixed(1)}%
                </h3>
                <p className="text-sm text-gray-600">Độ hài lòng khách hàng</p>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* POPULAR SERVICES - CAROUSEL (Giữ nguyên logic của bạn) */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">Dịch vụ phổ biến</h2>
          <div className="relative group">
            {loadingServices ? (
              <div className="flex justify-center items-center h-48 w-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pr-4 md:pr-12">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visibleServices.map((s, idx) => {
                      const Icon = mapServiceTitleToIcon(s.name);
                      return (
                        <motion.div
                          key={`${s.id}-${serviceStartIndex}-${idx}`}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.5 }}
                          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center h-full hover:shadow-md transition-shadow"
                        >
                          <div className="w-14 h-14 mb-4 bg-blue-50 rounded-xl flex items-center justify-center"><Icon className="w-8 h-8 text-blue-600" /></div>
                          <h3 className="text-center text-sm font-semibold text-gray-800 line-clamp-1">{s.name}</h3>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
                <button onClick={() => setServiceStartIndex(prev => (prev + 1) % services.length)} className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 p-2 text-blue-600 hover:scale-110 transition-all"><ChevronRight className="w-10 h-10 md:w-12 md:h-12" /></button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* TECHNICIANS - CAROUSEL (Đã cập nhật giống Dịch vụ) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">Thợ được đánh giá cao</h2>
          
          <div className="relative group">
            {loadingTechnicians ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-2xl h-64 animate-pulse shadow" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pr-4 md:pr-12">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visibleTechs.map((t, idx) => (
                      <motion.div
                        key={`${t.id}-${techStartIndex}-${idx}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 flex flex-col items-center"
                      >
                        <img
                          src={getAvatarUrl(t.avatarUrl) || `https://i.pravatar.cc/150?u=${t.id}`}
                          alt={t.fullName}
                          className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-gray-100"
                          onError={(e) => (e.target.src = `https://i.pravatar.cc/150?u=${t.id}`)}
                        />
                        <h3 className="mt-4 text-sm font-semibold text-gray-800 line-clamp-1">{t.fullName}</h3>
                        <div className="flex items-center justify-center mt-3 text-yellow-500">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="ml-1 text-sm font-bold">{t.rating?.toFixed(1) || "5.0"}</span>
                          <span className="ml-1 text-xs text-gray-500">({t.ratingCount || 0})</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Nút mũi tên cho Tech */}
                <button
                  onClick={() => setTechStartIndex(prev => (prev + 1) % featuredTechnicians.length)}
                  className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 p-2 text-blue-600 hover:scale-110 transition-all"
                >
                  <ChevronRight className="w-10 h-10 md:w-12 md:h-12" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {loggedInUser?.role === "admin" && (
        <div className="text-center py-12">
          <a href="/admin/accounts" className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg">Vào Trang Quản Trị</a>
        </div>
      )}
    </div>
  );
}