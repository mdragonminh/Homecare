// src/pages/client/AboutPage.jsx
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      title: t("about.core_values.values.dedication.title"),
      description: t("about.core_values.values.dedication.description"),
      color: "text-red-500",
    },
    {
      icon: Shield,
      title: t("about.core_values.values.quality.title"),
      description: t("about.core_values.values.quality.description"),
      color: "text-blue-500",
    },
    {
      icon: Users,
      title: t("about.core_values.values.family.title"),
      description: t("about.core_values.values.family.description"),
      color: "text-green-500",
    },
    {
      icon: Clock,
      title: t("about.core_values.values.convenience.title"),
      description: t("about.core_values.values.convenience.description"),
      color: "text-purple-500",
    },
  ];

  const timeline = [
    {
      year: "2020",
      title: t("about.timeline.milestones.2020.title"),
      description: t("about.timeline.milestones.2020.description"),
    },
    {
      year: "2021",
      title: t("about.timeline.milestones.2021.title"),
      description: t("about.timeline.milestones.2021.description"),
    },
    {
      year: "2022",
      title: t("about.timeline.milestones.2022.title"),
      description: t("about.timeline.milestones.2022.description"),
    },
    {
      year: "2023",
      title: t("about.timeline.milestones.2023.title"),
      description: t("about.timeline.milestones.2023.description"),
    },
    {
      year: "2024",
      title: t("about.timeline.milestones.2024.title"),
      description: t("about.timeline.milestones.2024.description"),
    },
  ];

  const team = [
    {
      name: t("about.team.members.ceo.name"),
      position: t("about.team.members.ceo.position"),
      image: "/api/placeholder/300/300",
      description: t("about.team.members.ceo.description"),
    },
    {
      name: t("about.team.members.cto.name"),
      position: t("about.team.members.cto.position"),
      image: "/api/placeholder/300/300",
      description: t("about.team.members.cto.description"),
    },
    {
      name: t("about.team.members.coo.name"),
      position: t("about.team.members.coo.position"),
      image: "/api/placeholder/300/300",
      description: t("about.team.members.coo.description"),
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
                {t("about.hero.title")}
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                {t("about.hero.subtitle")}
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center gap-2">
                  {t("about.hero.learn_more")}{" "}
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors duration-200 flex items-center gap-2">
                  <Play className="w-5 h-5" /> {t("about.hero.watch_video")}
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
                    <div className="text-blue-200">
                      {t("about.hero.stats.customers")}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.technicians)}+
                    </div>
                    <div className="text-blue-200">
                      {t("about.hero.stats.technicians")}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.services).toLocaleString()}+
                    </div>
                    <div className="text-blue-200">
                      {t("about.hero.stats.services_completed")}
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold mb-2">
                      {Math.floor(stats.satisfaction)}%
                    </div>
                    <div className="text-blue-200">
                      {t("about.hero.stats.satisfaction")}
                    </div>
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
              {t("about.mission_vision.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("about.mission_vision.subtitle")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 p-3 rounded-lg mr-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t("about.mission_vision.mission.title")}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t("about.mission_vision.mission.content")}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="bg-green-600 p-3 rounded-lg mr-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {t("about.mission_vision.vision.title")}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {t("about.mission_vision.vision.content")}
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
              {t("about.core_values.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("about.core_values.subtitle")}
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
              {t("about.timeline.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("about.timeline.subtitle")}
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
              {t("about.team.title")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("about.team.subtitle")}
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
            {t("about.cta.title")}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t("about.cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loggedInUser ? (
              <>
                <button
                  onClick={onShowRegister}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200"
                >
                  {t("about.cta.register_now")}
                </button>
                <button
                  onClick={onShowLogin}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
                >
                  {t("about.cta.login")}
                </button>
              </>
            ) : (
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200">
                {t("about.cta.book_service")}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
