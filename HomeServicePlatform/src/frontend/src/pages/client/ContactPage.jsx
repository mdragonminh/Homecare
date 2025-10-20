// src/pages/client/ContactPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Headphones,
  Shield,
  Star,
  CheckCircle,
  AlertCircle,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";

export const ContactPage = ({ loggedInUser }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    serviceType: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        serviceType: "",
      });

      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: t("contact.contact_info.hotline.title"),
      content: t("contact.contact_info.hotline.content"),
      description: t("contact.contact_info.hotline.description"),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Mail,
      title: t("contact.contact_info.email.title"),
      content: t("contact.contact_info.email.content"),
      description: t("contact.contact_info.email.description"),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: MapPin,
      title: t("contact.contact_info.address.title"),
      content: t("contact.contact_info.address.content"),
      description: t("contact.contact_info.address.description"),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: MessageCircle,
      title: t("contact.contact_info.chat.title"),
      content: t("contact.contact_info.chat.content"),
      description: t("contact.contact_info.chat.description"),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const faqData = [
    {
      question: t("contact.faq.questions.how_to_book.question"),
      answer: t("contact.faq.questions.how_to_book.answer"),
    },
    {
      question: t("contact.faq.questions.pricing.question"),
      answer: t("contact.faq.questions.pricing.answer"),
    },
    {
      question: t("contact.faq.questions.guarantee.question"),
      answer: t("contact.faq.questions.guarantee.answer"),
    },
    {
      question: t("contact.faq.questions.response_time.question"),
      answer: t("contact.faq.questions.response_time.answer"),
    },
  ];

  const serviceTypes = [
    t("contact.service_types.electrical_plumbing"),
    t("contact.service_types.house_cleaning"),
    t("contact.service_types.electronics_repair"),
    t("contact.service_types.plant_care"),
    t("contact.service_types.furniture_repair"),
    t("contact.service_types.other"),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in-up"
            style={{ animationFillMode: "backwards" }}
          >
            {t("contact.hero.title")}
          </h1>
          <p
            className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationFillMode: "backwards", animationDelay: "200ms" }}
          >
            {t("contact.hero.subtitle")}
          </p>
          <div
            className="flex items-center justify-center gap-8 text-white/80 animate-fade-in-up"
            style={{ animationFillMode: "backwards", animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{t("contact.hero.features.support")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>{t("contact.hero.features.secure")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>{t("contact.hero.features.service")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up"
              style={{ animationFillMode: "backwards" }}
            >
              {t("contact.contact_info.title")}
            </h2>
            <p
              className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-up"
              style={{ animationFillMode: "backwards", animationDelay: "200ms" }}
            >
              {t("contact.contact_info.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                style={{
                  animation: "fade-in-up 0.6s ease-out forwards",
                  animationDelay: `${100 * index}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div
                  className={`inline-flex p-4 rounded-lg mb-4 ${info.bgColor}`}
                >
                  <info.icon className={`w-6 h-6 ${info.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {info.title}
                </h3>
                <p className="text-lg font-medium text-gray-800 mb-1">
                  {info.content}
                </p>
                <p className="text-sm text-gray-600">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="grid lg:grid-cols-2 gap-12 animate-fade-in-up"
            style={{ animationFillMode: "backwards" }}
          >
            {/* Contact Form */}
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                {t("contact.contact_form.title")}
              </h3>

              {submitStatus === "success" && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in-down">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800">
                    {t("contact.contact_form.success_message")}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("contact.contact_form.full_name")}{" "}
                      {t("contact.contact_form.required")}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder={t(
                        "contact.contact_form.full_name_placeholder"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("contact.contact_form.email")}{" "}
                      {t("contact.contact_form.required")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder={t("contact.contact_form.email_placeholder")}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("contact.contact_form.phone")}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder={t("contact.contact_form.phone_placeholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("contact.contact_form.service_type")}
                    </label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">
                        {t("contact.contact_form.service_type_placeholder")}
                      </option>
                      {serviceTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("contact.contact_form.subject")}{" "}
                    {t("contact.contact_form.required")}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder={t("contact.contact_form.subject_placeholder")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("contact.contact_form.message")}{" "}
                    {t("contact.contact_form.required")}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
                    placeholder={t("contact.contact_form.message_placeholder")}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 transform hover:scale-[1.02] active:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("contact.contact_form.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t("contact.contact_form.send_message")}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              {/* Map */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="aspect-w-16 aspect-h-12">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1103.2844775938834!2d105.5242946196174!3d21.012894450710675!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc60e7d3f19%3A0x2be9d7d0b5abcbf4!2sFPT%20University!5e1!3m2!1sen!2s!4v1760629547276!5m2!1sen!2s"
                    className="w-full h-96 grayscale-[70%] hover:grayscale-0 transition-all duration-500"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {t("contact.map.main_office")}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {t("contact.map.main_office_address")}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{t("contact.map.office_hours")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("contact.social.title")}
                </h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="bg-blue-600 p-3 rounded-lg text-white hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="bg-pink-600 p-3 rounded-lg text-white hover:bg-pink-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="bg-blue-400 p-3 rounded-lg text-white hover:bg-blue-500 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="bg-red-600 p-3 rounded-lg text-white hover:bg-red-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up"
              style={{ animationFillMode: "backwards" }}
            >
              {t("contact.faq.title")}
            </h2>
            <p
              className="text-xl text-gray-600 animate-fade-in-up"
              style={{ animationFillMode: "backwards", animationDelay: "200ms" }}
            >
              {t("contact.faq.subtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-lg hover:border-gray-200"
                style={{
                  animation: "fade-in-up 0.6s ease-out forwards",
                  animationDelay: `${100 * index}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed ml-7">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">{t("contact.faq.no_answer")}</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 mx-auto transform hover:scale-105 hover:shadow-lg active:scale-100">
              <Headphones className="w-5 h-5" />
              {t("contact.faq.direct_support")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};