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
  Map,
  CheckCircle,
  List,
  LayoutGrid,
  Settings,
  Bed,
  Maximize,
} from "lucide-react";
import { homeApi } from "../../../services/homeApi";
import AddAddressPage from "./AddHome";
import EditHomePage from "./EditHomePage";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ✅ HOOK useDebounce
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

const homeTypes = ["apartment", "house", "villa", "condo"];

const homeTypeLabels = {
  all: "ui.all",
  apartment: "ui.apartment",
  house: "ui.house",
  villa: "ui.villa",
  condo: "ui.condo",
};

const homeTypeIcons = {
  all: <Building className="w-4 h-4" />,
  apartment: <Building2 className="w-4 h-4" />,
  house: <Home className="w-4 h-4" />,
  villa: <Map className="w-4 h-4" />,
  condo: <Building className="w-4 h-4" />,
};

export default function HomeManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [homeToDelete, setHomeToDelete] = useState(null);
  const [homeToEdit, setHomeToEdit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Giữ nguyên logic fetchHomes
  const fetchHomes = async (
    page = 1,
    search = debouncedSearchTerm,
    type = filterType
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await homeApi.getHomesOfCurrentUser(page, 6, search, type);
      if (res.success) {
        const mappedHomes = res.data.items.map((item) => ({
          ...item,
          ownerName: item.customerProfileName || t("ui.no_name"),
          type: item.type ? item.type.toLowerCase() : "house",
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
      setError(t("error.fetch_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleActionSuccess = (message) => {
    setSuccessMessage(message);
    fetchHomes(currentPage);

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };
  
  const handleHomeAdded = () => {
    setShowAddModal(false);
    handleActionSuccess(t("success.home_added"));
  };

  const handleHomeEdited = () => {
    setHomeToEdit(null); // Đóng modal
    handleActionSuccess(t("success.home_edited"));
  };

  // 1. Effect để reset trang khi search/filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType]);

  // 2. Effect riêng cho việc fetch data
  useEffect(() => {
    fetchHomes(currentPage, debouncedSearchTerm, filterType);
  }, [currentPage, debouncedSearchTerm, filterType]);

  const handleDelete = async () => {
    try {
      const res = await homeApi.deleteHome(homeToDelete);

      if (res.success) {
        handleActionSuccess(t("success.home_deleted"));
      } else {
        setError(res.message || t("error.delete_failed"));
      }
    } catch (error) {
      console.error("Error deleting home:", error);
      setError(t("error.delete_unknown"));
    } finally {
      setHomeToDelete(null); // Đóng modal xác nhận
    }
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
          className="p-3 bg-white/80 backdrop-blur border border-white/30 text-gray-500 hover:bg-blue-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-4 py-3 font-medium transition-all duration-300 ${
              page === currentPage
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-white/80 backdrop-blur text-gray-700 hover:bg-blue-50 border border-white/30 hover:shadow-lg"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-3 bg-white/80 backdrop-blur border border-white/30 text-gray-500 hover:bg-blue-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    );
  };

  // Giữ nguyên phần xử lý lỗi toàn màn hình
  if (error && !homeToDelete) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-50">
        <div className="text-center bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl max-w-md border border-white/30">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {t("ui.error_occurred")}
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchHomes();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-600/50 transition-all"
          >
            {t("ui.try_again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-6">
          {/* Title with blue color */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Home size={24} className="text-white" />
              </div>
              {t("ui.home_management")}
            </h1>
            <p className="text-gray-600">{t("ui.home_management_description")}</p>
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                placeholder={t("ui.search_by_name_or_address")}
                className="w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur border border-white/30 rounded-2xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Icon */}
            <button
              className="p-3.5 bg-white/70 backdrop-blur border border-white/30 rounded-2xl text-gray-500 hover:bg-blue-50 hover:shadow-lg transition-all"
              title={t("ui.advanced_filter")}
            >
              <Filter size={20} />
            </button>

            {/* Filter Types */}
            <div className="flex flex-wrap items-center gap-2">
              {["all", ...homeTypes].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                    type === filterType
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "bg-white/70 backdrop-blur text-gray-700 hover:bg-blue-50 border border-white/30 hover:shadow-lg"
                  }`}
                >
                  {homeTypeIcons[type]}
                  <span className="hidden sm:inline">{t(homeTypeLabels[type])}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in">
            <CheckCircle size={20} />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Stats and Add Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="bg-white/70 backdrop-blur rounded-2xl px-6 py-4 shadow-lg border border-white/30">
            <h2 className="text-lg font-semibold text-gray-800">
              {t("ui.showing")} {totalCount} {t("ui.properties")}
            </h2>
            <p className="text-sm text-gray-600">{t("ui.total_in_system")}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-white/70 backdrop-blur border border-white/30 rounded-2xl overflow-hidden shadow-lg">
              <button className="p-3 bg-blue-600 text-white">
                <LayoutGrid size={20} />
              </button>
              <button className="p-3 text-gray-500 hover:bg-blue-50 transition-colors">
                <List size={20} />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 font-medium"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{t("ui.add_new")}</span>
            </button>
          </div>
        </div>

        {/* Property Cards */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur flex justify-center items-center z-10 rounded-3xl">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {homes.length === 0 ? (
            <div className="text-center py-16 bg-white/70 backdrop-blur rounded-3xl shadow-xl border border-white/30">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {t("ui.no_properties_found")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("ui.try_change_search_or_filter")}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-600/50 transition-all"
              >
                {t("ui.clear_filter")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {homes.map((home) => (
                <div
                  key={home.id}
                  className="group bg-white/80 backdrop-blur rounded-xl shadow-xl border border-white/30 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 mx-auto"
                >
                  {/* Image Area with Delete Button */}
                  <div className="relative bg-blue-100 h-64 overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 bg-blue-400/20"></div>
                    <div className="absolute top-4 left-4 w-16 h-16 bg-white/30 rounded-2xl backdrop-blur flex items-center justify-center">
                      <div className="text-blue-600 scale-150">
                        {homeTypeIcons[home.type] || homeTypeIcons['house']}
                      </div>
                    </div>
                    
                    {/* Delete Button - Positioned on image */}
                    <button
                      onClick={() => setHomeToDelete(home.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-red-500/90 backdrop-blur text-white rounded-2xl hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-red-500/50 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} className="mx-auto" />
                    </button>

                    {/* Property Type Badge */}
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-xl text-xs font-medium text-gray-700">
                      {t(homeTypeLabels[home.type] || homeTypeLabels['house'])}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <h3 className="text-lg font-bold text-blue-900 mb-3 line-clamp-1">
                      {home.name || t("ui.property_title")}
                    </h3>

                    <div className="space-y-4 text-gray-600 mb-6">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm line-clamp-2 leading-relaxed">
                          {home.address}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 line-clamp-3">
                        {t("ui.short_description")}
                      </p>

                      {/* Property Details */}
                      <div className="flex gap-4 text-xs font-medium text-gray-500 pt-1">
                        <span>{t("ui.rooms", { count: 8 })}</span>
                        <span>{t("ui.area", { size: 15 })}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                      {/* Edit Button */}
                      <button
                        onClick={() => setHomeToEdit(home)}
                        title={t("ui.edit_address")}
                        className="w-10 h-10 bg-blue-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-600/50 transition-all duration-300"
                      >
                        <Pencil size={16} className="mx-auto" />
                      </button>

                      {/* Manage Button */}
                      <button
                        onClick={() => navigate(`/home-items/${home.id}`)}
                        title={t("ui.manage_rooms_devices")}
                        className="w-10 h-10 bg-blue-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-600/50 transition-all duration-300"
                      >
                        <Settings size={16} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && renderPaginationButtons()}
      </div>

      {/* Delete Modal */}
      {homeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t("ui.confirm_delete")}
              </h3>
              <p className="text-gray-600 mb-8">
                {t("ui.confirm_delete_message")}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setHomeToDelete(null)}
                  className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
                >
                  {t("ui.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 text-white bg-blue-600 rounded-2xl hover:shadow-lg hover:shadow-blue-600/50 transition-all font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? t("ui.deleting") : t("ui.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddAddressPage
          onClose={handleCloseAddModal}
          onSuccess={handleHomeAdded}
        />
      )}

      {homeToEdit && (
        <EditHomePage
          homeData={homeToEdit}
          onClose={() => setHomeToEdit(null)}
          onSuccess={handleHomeEdited}
        />
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}