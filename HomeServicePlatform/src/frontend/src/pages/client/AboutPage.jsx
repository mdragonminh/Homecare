import { useState, useRef, useEffect } from "react";
import {
  Heart,
  Users,
  Wrench,
  Star,
  Award,
  CheckCircle,
  Home,
  Shield,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Play,
} from "lucide-react";

export const AboutPage = ({ loggedInUser, onShowLogin, onShowRegister }) => {
  const [stats, setStats] = useState({
    customers: 0,
    technicians: 0,
    services: 0,
    satisfaction: 0,
  });

  // Animation counters
  useEffect(() => {
    const targetStats = {
      customers: 5000,
      technicians: 500,
      services: 1200,
      satisfaction: 98,
    };

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      setStats((prev) => {
        const newStats = { ...prev };
        Object.keys(targetStats).forEach((key) => {
          const increment = targetStats[key] / steps;
          if (prev[key] < targetStats[key]) {
            newStats[key] = Math.min(prev[key] + increment, targetStats[key]);
          }
        });
        return newStats;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  const values = [
    {
      icon: Heart,
      title: "Tâm Huyết",
      description: "Chúng tôi đặt hết tâm sức vào từng công việc",
      gradient: "from-red-500 to-pink-500",
      number: "01",
    },
    {
      icon: Shield,
      title: "Chất Lượng",
      description: "Tiêu chuẩn cao nhất trong mọi dịch vụ",
      gradient: "from-blue-500 to-cyan-500",
      number: "02",
    },
    {
      icon: Users,
      title: "Gia Đình",
      description: "Coi khách hàng như thành viên gia đình",
      gradient: "from-green-500 to-emerald-500",
      number: "03",
    },
    {
      icon: Clock,
      title: "Tiện Lợi",
      description: "Phục vụ nhanh chóng, hiệu quả nhất",
      gradient: "from-purple-500 to-indigo-500",
      number: "04",
    },
  ];

  const timeline = [
    {
      year: "2020",
      title: "Khởi Đầu",
      description: "Ra mắt dịch vụ với đội ngũ nhỏ nhưng nhiệt huyết",
    },
    {
      year: "2021",
      title: "Phát Triển",
      description: "Mở rộng sang 5 thành phố lớn",
    },
    {
      year: "2022",
      title: "Đột Phá",
      description: "Đạt 10,000 khách hàng hài lòng",
    },
    {
      year: "2023",
      title: "Nâng Cấp",
      description: "Triển khai ứng dụng di động",
    },
    {
      year: "2024",
      title: "Lãnh Đạo",
      description: "Trở thành nền tảng số 1 trong ngành",
    },
  ];

  const team = [
    {
      name: "Nguyễn Văn A",
      position: "Tổng Giám Đốc",
      image: "/api/placeholder/300/300",
      description: "20 năm kinh nghiệm trong lĩnh vực dịch vụ",
    },
    {
      name: "Trần Thị B",
      position: "Giám Đốc Công Nghệ",
      image: "/api/placeholder/300/300",
      description: "Expert về hệ thống quản lý và AI",
    },
    {
      name: "Lê Văn C",
      position: "Giám Đốc Vận Hành",
      image: "/api/placeholder/300/300",
      description: "Chuyên gia tối ưu hóa quy trình",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white space-y-8">
              <div className="inline-block px-5 py-2 bg-blue-500/20 border border-blue-400/50 rounded-full w-fit hover:bg-blue-500/30 transition-all duration-300">
                <span className="text-sm font-semibold text-blue-300">
                  ✨ Nhà Cung Cấp Dịch Vụ Hàng Đầu
                </span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                Chúng Tôi Là{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Những Người Tốt
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-2xl">
                Với hơn 5 năm phục vụ, chúng tôi luôn cam kết mang lại trải
                nghiệm tốt nhất cho khách hàng
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 flex items-center gap-2 transform hover:scale-105">
                  <span className="relative z-10">Khám Phá Thêm</span>
                  <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                <button className="px-8 py-4 border-2 border-blue-300 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-cyan-300 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm">
                  <Play className="w-5 h-5" /> Xem Video
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>

              <div className="relative grid grid-cols-2 gap-6">
                {[
                  { label: "Khách Hàng", value: "customers", icon: Users },
                  {
                    label: "Kỹ Thuật Viên",
                    value: "technicians",
                    icon: Wrench,
                  },
                  { label: "Dịch Vụ", value: "services", icon: CheckCircle },
                  { label: "Hài Lòng", value: "satisfaction", icon: Star },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="group p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-2"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">
                      {Math.floor(stats[stat.value]).toLocaleString()}
                      {stat.value === "satisfaction" ? "%" : "+"}
                    </div>
                    <div className="text-sm text-blue-100 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Sứ Mệnh & Tầm Nhìn
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Các giá trị cơ bản hướng dẫn mọi quyết định của chúng tôi
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: Heart,
                  title: "Sứ Mệnh",
                  content:
                    "Cung cấp dịch vụ chất lượng cao, nhanh chóng và đáng tin cậy cho mọi gia đình",
                  gradient: "from-red-500 to-pink-500",
                },
                {
                  icon: Star,
                  title: "Tầm Nhìn",
                  content:
                    "Trở thành nền tảng dịch vụ tín cậy nhất, nơi khách hàng và kỹ thuật viên cùng phát triển",
                  gradient: "from-amber-500 to-orange-500",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative flex items-start gap-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>

              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=500&fit=crop"
                alt="Mission Vision"
                className="relative w-full h-96 object-cover rounded-2xl shadow-2xl group-hover:shadow-3xl transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Giá Trị Cốt Lõi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những nguyên tắc kinh doanh của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group relative h-full bg-white border border-gray-200 rounded-2xl p-8 overflow-hidden hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-200/50 to-purple-200/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-xl flex items-center justify-center group-hover:scale-120 transition-transform duration-300 shadow-lg`}
                    >
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 group-hover:text-blue-200 transition-colors duration-300">
                      {value.number}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Hành Trình Của Chúng Tôi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Từ khởi đầu nhỏ bé đến thành công ngày hôm nay
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

            {timeline.map((item, index) => (
              <div
                key={index}
                className="relative flex items-center mb-20 last:mb-0"
              >
                <div
                  className={`w-1/2 ${
                    index % 2 === 0 ? "pr-8 text-right" : "pl-8 order-2"
                  }`}
                >
                  <div className="group p-8 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl shadow-lg hover:border-blue-400 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                      {item.year}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="absolute left-1/2 transform -translate-x-1/2 w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-4 border-white shadow-lg hover:scale-125 transition-transform duration-300 cursor-pointer"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Đội Ngũ Lãnh Đạo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những người tài năng đằng sau thành công của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {team.map((member, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-100 hover:border-blue-300"
              >
                <div className="relative h-80 overflow-hidden bg-gray-200">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    {member.position}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%20fill-opacity=%270.05%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10"></div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Sẵn Sàng Bắt Đầu?
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Hãy tham gia với hàng ngàn khách hàng hài lòng của chúng tôi
                ngay hôm nay
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <button
                onClick={onShowRegister}
                className="group relative px-10 py-4 bg-white text-blue-600 rounded-xl font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-white/50 transform hover:scale-105"
              >
                <span className="relative z-10">Đăng Ký Ngay</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <button
                onClick={onShowLogin}
                className="px-10 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/20 hover:shadow-xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              >
                Đăng Nhập
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};