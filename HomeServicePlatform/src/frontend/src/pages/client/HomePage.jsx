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

  // Logic xoay vòng Dịch vụ
  const [serviceStartIndex, setServiceStartIndex] = useState(0);

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

  // Tính toán 6 dịch vụ hiển thị
  const visibleServices = useMemo(() => {
    if (services.length === 0) return [];
    let items = [];
    for (let i = 0; i < 6; i++) {
      items.push(services[(serviceStartIndex + i) % services.length]);
    }
    return items;
  }, [services, serviceStartIndex]);

  // Sắp xếp và lấy Top 4 kỹ thuật viên có Rating cao nhất
  const topRatedTechs = useMemo(() => {
    if (!featuredTechnicians || featuredTechnicians.length === 0) return [];
    return [...featuredTechnicians]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
  }, [featuredTechnicians]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoadingTechnicians(true);
      setLoadingServices(true);
      setLoadingStatistics(true);
      try {
        const [techRes, servRes, statsRes] = await Promise.all([
          technicianApi.getFeaturedTechnicians(20), // Lấy đủ dữ liệu để lọc top
          serviceApi.getServices(),
          statisticsApi.getPublicStatistics()
        ]);
        if (techRes.success) setFeaturedTechnicians(techRes.data || []);
        if (servRes.success) setServices(servRes.data || []);
        
        if (statsRes.success && statsRes.data) {
          setStatistics({
            totalBookings: statsRes.data.totalBookings || 0,
            totalTechnicians: statsRes.data.totalTechnicians || 0,
            activeTechnicians: statsRes.data.activeTechnicians || 0,
            completionRate: statsRes.data.completionRate || 0,
            customerSatisfaction: statsRes.data.customerSatisfaction || 0,
          });
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
      {/* HERO SECTION */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Items render dựa trên state statistics... (Giống code cũ của bạn) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100"><Calendar className="w-6 h-6 text-blue-600" /></div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{statistics.totalBookings.toLocaleString("vi-VN")}</h3>
              <p className="text-sm text-gray-600">Tổng đơn đặt</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100"><Users className="w-6 h-6 text-green-600" /></div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{statistics.totalTechnicians.toLocaleString("vi-VN")}</h3>
              <p className="text-sm text-gray-600">Kỹ thuật viên</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100"><CheckCircle className="w-6 h-6 text-purple-600" /></div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{statistics.completionRate.toFixed(1)}%</h3>
              <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-100"><Heart className="w-6 h-6 text-pink-600" /></div>
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{statistics.customerSatisfaction.toFixed(1)}%</h3>
              <p className="text-sm text-gray-600">Hài lòng khách hàng</p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES - CAROUSEL ĐÃ TỐI ƯU MOBILE */}
      {/* POPULAR SERVICES - ĐÃ LOẠI BỎ BORDER VÀ SỬA LỖI ĐÈ TRÊN MOBILE */}
<section className="py-20">
  <div className="container mx-auto px-6">
    <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">Dịch vụ phổ biến</h2>
    
    {/* Sử dụng flex để nút nằm ngoài danh sách card */}
    <div className="flex items-center gap-2 md:gap-4">
      
      {/* Container chứa Grid Dịch vụ */}
      <div className="flex-1 overflow-hidden">
        {loadingServices ? (
          <div className="flex justify-center items-center h-48 w-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleServices.map((s, idx) => {
                const Icon = mapServiceTitleToIcon(s.name);
                const price = s.price ?? s.Price ?? 0;
                const formattedPrice = price > 0
                  ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", minimumFractionDigits: 0 }).format(price)
                  : "Liên hệ";
                return (
                  <motion.div
                    key={`${s.id}-${serviceStartIndex}-${idx}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center h-full"
                  >
                    <div className="w-10 h-10 md:w-14 md:h-14 mb-3 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 md:w-8 md:h-8 text-blue-600" />
                    </div>
                    <h3 className="text-center text-[12px] md:text-sm font-semibold text-gray-800 line-clamp-1 mb-1">{s.name}</h3>
                    <p className="text-center text-[10px] md:text-xs font-bold text-blue-600 mt-auto">{formattedPrice}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* NÚT MŨI TÊN - CHỈ GIỮ ICON, KHÔNG BORDER, KHÔNG BACKGROUND */}
      {!loadingServices && (
        <button 
          onClick={() => setServiceStartIndex(prev => (prev + 1) % services.length)} 
          className="flex-shrink-0 text-blue-600 hover:scale-125 active:scale-90 transition-all"
        >
          <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
        </button>
      )}
      
    </div>
  </div>
</section>

      {/* TECHNICIANS - TOP 4 RATING (KHÔNG MŨI TÊN) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">Thợ được đánh giá cao nhất</h2>
          
          <div>
            {loadingTechnicians ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {topRatedTechs.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-5 md:p-6 text-center shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-all"
                  >
                    <div className="relative">
                      <img
                        src={getAvatarUrl(t.avatarUrl) || `https://i.pravatar.cc/150?u=${t.id}`}
                        alt={t.fullName}
                        className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full object-cover border-4 border-white shadow-sm"
                        onError={(e) => (e.target.src = `https://i.pravatar.cc/150?u=${t.id}`)}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-gray-800 line-clamp-1">{t.fullName}</h3>
                    <div className="flex items-center justify-center mt-3 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-bold text-gray-700">{t.rating?.toFixed(1) || "5.0"}</span>
                      <span className="ml-1 text-[10px] text-gray-400">({t.ratingCount || 0})</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}