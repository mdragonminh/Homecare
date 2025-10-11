// src/pages/client/AboutPage.jsx
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
  const [activeSection, setActiveSection] = useState(0);
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

    const duration = 2000; // 2 seconds
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
      title: "Tận tâm phục vụ",
      description:
        "Chúng tôi luôn đặt khách hàng làm trung tâm, mang đến trải nghiệm dịch vụ tốt nhất.",
      color: "text-red-500",
    },
    {
      icon: Shield,
      title: "Uy tín & Chất lượng",
      description:
        "Cam kết cung cấp dịch vụ chất lượng cao với đội ngũ kỹ thuật viên được đào tạo bài bản.",
      color: "text-blue-500",
    },
    {
      icon: Users,
      title: "Đồng hành cùng gia đình",
      description:
        "Hiểu rõu nhu cầu của mỗi gia đình Việt, tạo nên không gian sống hoàn hảo.",
      color: "text-green-500",
    },
    {
      icon: Clock,
      title: "Nhanh chóng & Tiện lợi",
      description:
        "Phản hồi nhanh 24/7, hỗ trợ khách hàng trong mọi tình huống khẩn cấp.",
      color: "text-purple-500",
    },
  ];

  const timeline = [
    {
      year: "2020",
      title: "Khởi đầu hành trình",
      description:
        "Ra đời với sứ mệnh kết nối chủ nhà và thợ sửa chữa chuyên nghiệp.",
    },
    {
      year: "2021",
      title: "Mở rộng dịch vụ",
      description:
        "Phát triển đa dạng các loại hình dịch vụ gia đình từ sửa chữa đến bảo trì.",
    },
    {
      year: "2022",
      title: "Công nghệ tiên tiến",
      description:
        "Ứng dụng công nghệ AI và IoT để tối ưu hóa trải nghiệm khách hàng.",
    },
    {
      year: "2023",
      title: "Vươn tầm toàn quốc",
      description:
        "Mở rộng hoạt động trên toàn quốc với hơn 500 kỹ thuật viên.",
    },
    {
      year: "2024",
      title: "Dẫn đầu thị trường",
      description: "Trở thành nền tảng số 1 về dịch vụ gia đình tại Việt Nam.",
    },
  ];

  const team = [
    {
      name: "Nguyễn Văn An",
      position: "CEO & Co-founder",
      image: "/api/placeholder/300/300",
      description: "10+ năm kinh nghiệm trong lĩnh vực công nghệ và dịch vụ",
    },
    {
      name: "Trần Thị Bình",
      position: "CTO",
      image: "/api/placeholder/300/300",
      description: "Chuyên gia về AI và Machine Learning với 8 năm kinh nghiệm",
    },
    {
      name: "Lê Minh Cường",
      position: "COO",
      image: "/api/placeholder/300/300",
      description: "Chuyên gia vận hành với 12 năm kinh nghiệm quản lý dịch vụ",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Về chúng tôi
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                Kết nối mọi gia đình với dịch vụ chăm sóc nhà chuyên nghiệp, tạo
                nên không gian sống hoàn hảo cho người Việt.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2">
                  Tìm hiểu thêm <ChevronRight className="w-5 h-5" />
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors duration-200 flex items-center gap-2">
                  <Play className="w-5 h-5" /> Xem video
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-6 text-white text-center">
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.customers).toLocaleString()}+
                    </div>
                    <div className="text-blue-200">Khách hàng</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.technicians)}+
                    </div>
                    <div className="text-blue-200">Thợ sửa chữa</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.services).toLocaleString()}+
                    </div>
                    <div className="text-blue-200">Dịch vụ hoàn thành</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.satisfaction)}%
                    </div>
                    <div className="text-blue-200">Hài lòng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Sứ mệnh & Tầm nhìn
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi mong muốn tạo ra một nền tảng kết nối hoàn hảo giữa nhu
              cầu chăm sóc nhà và dịch vụ chuyên nghiệp.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg mr-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Sứ mệnh</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Mang đến cho mọi gia đình Việt Nam những dịch vụ chăm sóc nhà
                  chất lượng cao, tiện lợi và đáng tin cậy. Chúng tôi không chỉ
                  sửa chữa mà còn chăm sóc ngôi nhà như chính ngôi nhà của chúng
                  tôi.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 p-3 rounded-lg mr-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Tầm nhìn</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Trở thành nền tảng dịch vụ gia đình số 1 Đông Nam Á, nơi mọi
                  người có thể tìm thấy giải pháp hoàn hảo cho mọi nhu cầu chăm
                  sóc và bảo trì ngôi nhà.
                </p>
              </div>
            </div>

            <div className="relative">
              <img
                src="/api/placeholder/600/400"
                alt="Mission Vision"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Giá trị cốt lõi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những giá trị định hướng mọi hoạt động và quyết định của chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div
                  className={`inline-flex p-3 rounded-lg mb-4 ${value.color} bg-gray-100`}
                >
                  <value.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Hành trình phát triển
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Từ những bước đầu tiên đến thành công ngày hôm nay
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-blue-200"></div>

            {timeline.map((item, index) => (
              <div
                key={index}
                className="relative flex items-center mb-16 last:mb-0"
              >
                <div
                  className={`w-1/2 ${
                    index % 2 === 0 ? "pr-8 text-right" : "pl-8 order-2"
                  }`}
                >
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>

                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Đội ngũ lãnh đạo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Những con người tài năng và tâm huyết đằng sau thành công của
              chúng tôi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-3">
                    {member.position}
                  </p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Sẵn sàng trải nghiệm dịch vụ của chúng tôi?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn gia đình đã tin tưởng và sử dụng dịch vụ
            của chúng tôi
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loggedInUser ? (
              <>
                <button
                  onClick={onShowRegister}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                >
                  Đăng ký ngay
                </button>
                <button
                  onClick={onShowLogin}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
                >
                  Đăng nhập
                </button>
              </>
            ) : (
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200">
                Đặt dịch vụ ngay
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
