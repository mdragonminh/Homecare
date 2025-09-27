import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  Eye,
  Pencil,
  Trash2,
  Home,
  Filter,
  MapPin,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Building2,
  House,
  Map,
} from "lucide-react";
import { homeApi } from "../../../services/homeApi";
import AddAddressPage from "./AddHome"; // Đảm bảo đường dẫn đúng
import AddHomeItemModal from "./AddHomeItemModal"; // Đảm bảo đường dẫn đúng
import { useNavigate } from "react-router-dom";

const homeTypes = ["apartment", "house", "villa", "condo"];

const homeTypeLabels = {
  apartment: "Căn hộ",
  house: "Nhà riêng",
  villa: "Biệt thự",
  condo: "Chung cư",
};

const homeTypeIcons = {
  // Đã thay thế icon emoji bằng icon Lucide-React
  apartment: <Building2 className="w-8 h-8" />,
  house: <House className="w-8 h-8" />,
  villa: <Map className="w-8 h-8" />,
  condo: <Building className="w-8 h-8" />,
};

const homeTypeColors = {
  all: { bg: "bg-blue-100", text: "text-blue-700", icon: "text-blue-600" },
  apartment: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    icon: "text-indigo-600",
  },
  house: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: "text-emerald-600",
  },
  villa: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: "text-amber-600",
  },
  condo: {
    bg: "bg-fuchsia-100",
    text: "text-fuchsia-700",
    icon: "text-fuchsia-600",
  },
};

export default function HomeManagementPage() {
  const navigate = useNavigate();
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedHome, setSelectedHome] = useState(null);
  const [homeToDelete, setHomeToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [homeToAddItem, setHomeToAddItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchHomes = async (page = 1, search = searchTerm, type = filterType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await homeApi.getHomesOfCurrentUser(page, 10, search, type);
      if (res.success) {
        const mappedHomes = res.data.items.map((item) => ({
          ...item,
          ownerName: item.customerProfileName || "Chưa có tên",
          type: item.type || "house",
        }));
        setHomes(mappedHomes);

        setCurrentPage(res.data.currentPage);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.totalCount);
      } else {
        setError(res.message);
      }
    } catch (error) {
      console.error("Error fetching homes:", error);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleHomeAdded = () => {
    setShowAddModal(false); // Đóng modal
    fetchHomes(); // Tải lại danh sách nhà
  };

  const handleItemAdded = () => {
    setHomeToAddItem(null); // Đóng modal thêm vật phẩm
    // Nếu bạn muốn tải lại danh sách nhà sau khi thêm vật phẩm, hãy gọi fetchHomes() ở đây
    // Ví dụ: fetchHomes(currentPage);
  };

  // 1. Effect để reset trang khi search/filter thay đổi
useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, filterType]);

// 2. Effect riêng cho việc fetch data
useEffect(() => {
  const timeoutId = setTimeout(() => {
    fetchHomes(currentPage, searchTerm, filterType);
  }, searchTerm ? 300 : 0); // Giảm thời gian debounce xuống 300ms

  return () => clearTimeout(timeoutId);
}, [currentPage, searchTerm, filterType]);

// 3. Hoặc nếu muốn tối ưu hơn nữa:
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  setCurrentPage(1);
}, [debouncedSearchTerm, filterType]);

useEffect(() => {
  fetchHomes(currentPage, debouncedSearchTerm, filterType);
}, [currentPage, debouncedSearchTerm, filterType]);

// Hook useDebounce (thêm vào đầu component):
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


  const handleDelete = () => {
    // Trong ứng dụng thực tế, sẽ gọi API xóa home
    setHomes(homes.filter((h) => h.id !== homeToDelete));
    setHomeToDelete(null);
  };

  const renderPaginationButtons = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <nav className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Có lỗi xảy ra
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchHomes()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              <span className="text-lg">←</span> Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center flex-1 gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Home className="text-blue-600" size={28} />
              </div>
              Quản lý Nhà & Địa chỉ
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium min-w-[200px] justify-center"
            >
              <Plus size={20} /> Thêm địa chỉ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${homeTypeColors.all.bg}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng số nhà
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className={`p-3 rounded-xl ${homeTypeColors.all.bg}`}>
                <Building className={homeTypeColors.all.icon} size={24} />
              </div>
            </div>
          </div>

          {homeTypes.map((type) => {
            const count = homes.filter((h) => h.type === type).length;
            const colors = homeTypeColors[type];
            return (
              <div
                key={type}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${colors.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {homeTypeLabels[type]}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`text-3xl p-2 rounded-xl ${colors.bg}`}>
                    {homeTypeIcons[type]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                placeholder="Tìm kiếm theo tên, địa chỉ hoặc chủ sở hữu..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                className="pl-12 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[200px] appearance-none cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Tất cả loại hình</option>
                {homeTypes.map((type) => (
                  <option key={type} value={type}>
                    {homeTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Home Cards */}
        {homes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Không tìm thấy bất động sản nào
            </h3>
            <p className="text-gray-600 mb-6">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
              className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {homes.map((home) => (
              <div
                key={home.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {homeTypeIcons[home.type]}
                      </span>
                      <span
                        className={`px-3 py-1 ${homeTypeColors[home.type].bg} ${homeTypeColors[home.type].text} text-xs font-medium rounded-full`}
                      >
                        {homeTypeLabels[home.type]}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                    {home.name}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin
                        size={16}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span className="text-sm line-clamp-1">
                        {home.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <User size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        {home.ownerName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 pb-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/home-items/${home.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Wrench size={16} />{" "}
                      <span className="text-sm">
                        Thiết bị 
                      </span>
                    </button>

                    {/* ✅ NÚT THÊM VẬT PHẨM MỚI */}
                    <button
                      onClick={() => setHomeToAddItem(home.id)}
                      className="flex items-center justify-center p-2.5 text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                      title="Thêm vật phẩm/thiết bị"
                    >
                      <Plus size={16} />
                    </button>

                    <button className="flex items-center justify-center p-2.5 text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setHomeToDelete(home.id)}
                      className="flex items-center justify-center p-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Hiển thị các nút phân trang */}
        {totalPages > 1 && renderPaginationButtons()}
      </div>

      {/* View Modal */}
      {selectedHome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {homeTypeIcons[selectedHome.type]}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedHome.name}
                    </h2>
                    <span
                      className={`px-3 py-1 ${homeTypeColors[selectedHome.type].bg} ${homeTypeColors[selectedHome.type].text} text-xs font-medium rounded-full`}
                    >
                      {homeTypeLabels[selectedHome.type]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedHome(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin
                  size={20}
                  className="text-gray-400 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Địa chỉ</p>
                  <p className="text-gray-900">{selectedHome.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={20} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Chủ sở hữu
                  </p>
                  <p className="text-gray-900">{selectedHome.ownerName}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setSelectedHome(null)}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {homeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Xác nhận xóa
              </h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa bất động sản này? Hành động này không
                thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setHomeToDelete(null)}
                  className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop với hiệu ứng mờ */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowAddModal(false)}
          />

          {/* Modal content với hiệu ứng chuyển động */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
            <AddAddressPage onClose={handleHomeAdded} />
          </div>
        </div>
      )}

      {/* ✅ Add Home Item Modal mới */}
      {homeToAddItem && (
        <AddHomeItemModal
          homeId={homeToAddItem}
          onClose={() => setHomeToAddItem(null)}
          onSuccess={handleItemAdded}
        />
      )}
    </div>
  );
}