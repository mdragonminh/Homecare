// src/pages/ServiceListPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { serviceApi } from '../../../services/serviceApi';
import { useNavigate } from 'react-router-dom';

export function ServiceListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // States
  const [serviceData, setServiceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState(''); // Thêm state cho địa chỉ

  // Mock data cho kỹ thuật viên (cập nhật với khoảng cách)
  const [technicians] = useState([
    {
      id: 1,
      name: 'Nguyễn Văn An',
      avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+An&background=3b82f6&color=fff',
      specialty: 'Điện lạnh',
      rating: 4.8,
      completedJobs: 156,
      experience: '5 năm',
      status: 'available',
      distance: '3.2 km', // Thêm khoảng cách
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+Binh&background=10b981&color=fff',
      specialty: 'Điện nước',
      rating: 4.9,
      completedJobs: 203,
      experience: '7 năm',
      status: 'available',
      distance: '5.1 km',
    },
    {
      id: 3,
      name: 'Lê Hoàng Cường',
      avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+Cuong&background=f59e0b&color=fff',
      specialty: 'Sửa chữa điện tử',
      rating: 4.7,
      completedJobs: 134,
      experience: '4 năm',
      status: 'busy',
      distance: '2.8 km',
    },
    {
      id: 4,
      name: 'Phạm Minh Đức',
      avatar: 'https://ui-avatars.com/api/?name=Pham+Minh+Duc&background=8b5cf6&color=fff',
      specialty: 'Vệ sinh máy lạnh',
      rating: 4.6,
      completedJobs: 98,
      experience: '3 năm',
      status: 'available',
      distance: '4.5 km',
    },
    {
      id: 5,
      name: 'Võ Thị Em',
      avatar: 'https://ui-avatars.com/api/?name=Vo+Thi+Em&background=ec4899&color=fff',
      specialty: 'Vệ sinh nhà cửa',
      rating: 5.0,
      completedJobs: 267,
      experience: '6 năm',
      status: 'available',
      distance: '6.0 km',
    },
    {
      id: 6,
      name: 'Đỗ Văn Phong',
      avatar: 'https://ui-avatars.com/api/?name=Do+Van+Phong&background=06b6d4&color=fff',
      specialty: 'Sửa chữa đa năng',
      rating: 4.5,
      completedJobs: 89,
      experience: '2 năm',
      status: 'available',
      distance: '3.9 km',
    },
  ]);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      const result = await serviceApi.getServices();

      if (result.success) {
        setServiceData(result.data);
      } else {
        setError(result.message || t('error.fetch_services'));
      }
      setIsLoading(false);
    };
    fetchServices();
  }, []);

  // Lọc dịch vụ theo danh mục và tìm kiếm
  const filteredServices = serviceData
    .filter(
      (categoryGroup) =>
        selectedCategory === 'all' || categoryGroup.category.id === selectedCategory
    )
    .map((categoryGroup) => ({
      ...categoryGroup,
      services: categoryGroup.services.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((categoryGroup) => categoryGroup.services.length > 0);

  // Lọc kỹ thuật viên theo tìm kiếm
  const filteredTechnicians = technicians.filter(
    (tech) =>
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy tất cả danh mục để làm filter
  const categories = serviceData.map((cg) => cg.category);

  // Xử lý lấy vị trí (mock, sẽ thay bằng Google Maps API sau)
  const handleLocationInput = (e) => {
    setUserLocation(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{t('loading.services')}</p>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-500 text-center">Lỗi: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-8 mb-12 text-white">
        <h1 className="text-4xl font-extrabold mb-4">
          {t('page.services.title')} - Dịch vụ sửa chữa tại nhà
        </h1>
        <p className="text-lg mb-6">
          Tìm kiếm dịch vụ hoặc kỹ thuật viên gần bạn. Nhanh chóng, chuyên nghiệp, đúng giờ.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm dịch vụ hoặc kỹ thuật viên (ví dụ: sửa máy lạnh)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-12 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-white shadow-lg text-gray-800 placeholder-gray-500"
            />
            <svg
              className="absolute left-4 top-5 h-6 w-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Nhập địa chỉ của bạn (ví dụ: 123 Lê Lợi, Q.1)"
              value={userLocation}
              onChange={handleLocationInput}
              className="w-full px-6 py-4 pl-12 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-white shadow-lg text-gray-800 placeholder-gray-500"
            />
            <svg
              className="absolute left-4 top-5 h-6 w-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Dịch vụ - Category Filter */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Danh sách dịch vụ</h2>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.flatMap((categoryGroup) =>
            categoryGroup.services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
                onClick={() => navigate(`/services/${service.id}/book`)}
              >
                <div className="relative">
                  <img
                    src={service.image || 'https://via.placeholder.com/300x150?text=' + service.name}
                    alt={service.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-6">
                    <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                      {service.name}
                    </h4>
                    <p className="text-sm text-gray-500 mb-2">{service.description || 'Dịch vụ chất lượng cao, nhanh chóng.'}</p>
                    <p className="text-xl font-bold text-blue-600 mb-4">
                      Từ {service.basePrice.toLocaleString('vi-VN')} VNĐ
                    </p>
                    <button className="w-full py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
                      Đặt dịch vụ
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">Không tìm thấy dịch vụ phù hợp</p>
          </div>
        )}
      </section>

      {/* Kỹ thuật viên */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Kỹ thuật viên tiêu biểu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians.map((tech) => (
            <div
              key={tech.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
              onClick={() => navigate(`/technicians/${tech.id}/book`)}
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={tech.avatar}
                    alt={tech.name}
                    className="w-16 h-16 rounded-full border-2 border-blue-100"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {tech.name}
                    </h3>
                    <p className="text-sm text-gray-500">{tech.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-semibold text-gray-700">{tech.rating}</span>
                      <span className="text-sm text-gray-500">({tech.completedJobs} công việc)</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Cách bạn: {tech.distance}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tech.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tech.status === 'available' ? 'Sẵn sàng' : 'Đang bận'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Hoàn thành</p>
                    <p className="text-lg font-bold text-blue-600">{tech.completedJobs}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Kinh nghiệm</p>
                    <p className="text-lg font-bold text-gray-700">{tech.experience}</p>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors">
                  Đặt lịch
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTechnicians.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">Không tìm thấy kỹ thuật viên phù hợp</p>
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tại sao chọn chúng tôi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <svg
              className="mx-auto h-12 w-12 text-blue-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Đúng giờ</h3>
            <p className="text-gray-500">Kỹ thuật viên đến đúng lịch hẹn của bạn.</p>
          </div>
          <div>
            <svg
              className="mx-auto h-12 w-12 text-blue-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Chuyên nghiệp</h3>
            <p className="text-gray-500">Kỹ thuật viên được xác minh, giàu kinh nghiệm.</p>
          </div>
          <div>
            <svg
              className="mx-auto h-12 w-12 text-blue-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Đảm bảo</h3>
            <p className="text-gray-500">Hoàn tiền nếu không hài lòng với dịch vụ.</p>
          </div>
        </div>
      </section>
    </div>
  );
}