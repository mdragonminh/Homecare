import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Home,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Settings,
  Loader2,
} from "lucide-react";
import { homeApi } from "../../../services/homeApi";
import AddAddressPage from "./AddHome";
import EditHomePage from "./EditHomePage";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
// eslint-disable-next-line
import { motion } from "framer-motion"; // Import framer-motion

/**
 * useDebounce (GIỮ NGUYÊN LOGIC)
 */
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

export default function HomeManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [homes, setHomes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [homeToDelete, setHomeToDelete] = useState(null);
  const [homeToEdit, setHomeToEdit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const abortControllerRef = useRef(null);

  // GIỮ NGUYÊN LOGIC fetchHomes
  const fetchHomes = useCallback(async (page = 1, search = "") => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsFetching(true);
      setError(null);

      // Bỏ tham số 'type' khỏi API call
      const res = await homeApi.getHomesOfCurrentUser(page, 6, search, null, {
        signal: controller.signal,
      });

      if (res && res.success) {
        const mappedHomes = (res.data.items || []).map((item) => ({
          ...item,
          type: item.type ? item.type.toLowerCase() : "apartment",
        }));

        setHomes(mappedHomes);
        setCurrentPage(res.data.currentPage || page);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(
          res.data.totalCount || (mappedHomes ? mappedHomes.length : 0)
        );
      } else if (res && !res.success) {
        setError(res.message || "error.fetch_failed");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // request bị abort
      } else {
        console.error("Error fetching homes:", err);
        setError("error.fetch_failed");
      }
    } finally {
      setIsFetching(false);
      setInitialLoading(false);
      abortControllerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency list chỉ cần fetchHomes

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchHomes(currentPage, debouncedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]);

  // GIỮ NGUYÊN LOGIC Handlers
  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleHomeAdded = () => {
    setShowAddModal(false);
    toast.success(t("success.home_added"));
    fetchHomes(currentPage, debouncedSearchTerm);
  };

  const handleHomeEdited = () => {
    setHomeToEdit(null);
    fetchHomes(currentPage, debouncedSearchTerm);
  };

  const handleDelete = async () => {
    try {
      setIsFetching(true);
      const res = await homeApi.deleteHome(homeToDelete);
      if (res.success) {
        toast.success(t("success.home_deleted"));
        // Cập nhật lại trang nếu trang hiện tại không còn nhà nào
        const nextPage =
          currentPage > 1 && homes.length === 1 ? currentPage - 1 : currentPage;
        fetchHomes(nextPage, debouncedSearchTerm);
      } else {
        toast.error(res.message || t("error.delete_failed"));
      }
    } catch (err) {
      console.error("Error deleting home:", err);
      toast.error(t("error.delete_unknown"));
    } finally {
      setHomeToDelete(null);
      setIsFetching(false);
    }
  };

  // GIỮ NGUYÊN LOGIC phân trang, chỉ thay đổi styling
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

    const buttonClass = (isActive) =>
      `w-9 h-9 rounded-lg font-medium transition-all duration-200 shadow-sm flex items-center justify-center ${
        isActive
          ? "bg-gray-700 text-white border-gray-700 hover:bg-gray-800"
          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
      }`;

    const navButtonClass =
      "p-1.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm w-9 h-9 flex items-center justify-center";

    return (
      <nav className="flex items-center justify-center gap-1 mt-6 text-sm">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={navButtonClass}
        >
          <ChevronLeft size={16} />
        </motion.button>
        {startPage > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(1)}
              className={buttonClass(1 === currentPage)}
            >
              1
            </motion.button>
            {startPage > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}
        {pageNumbers.map((page) => (
          <motion.button
            key={page}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage(page)}
            className={buttonClass(page === currentPage)}
          >
            {page}
          </motion.button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-1 text-gray-400">...</span>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(totalPages)}
              className={buttonClass(totalPages === currentPage)}
            >
              {totalPages}
            </motion.button>
          </>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={navButtonClass}
        >
          <ChevronRight size={16} />
        </motion.button>
      </nav>
    );
  };

  // Error Panel (Styling mới)
  if (error && !homeToDelete) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl max-w-md border border-white/30"
        >
          <div className="text-6xl mb-4 text-red-500">
            <Settings className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t("ui.error_occurred")}
          </h3>
          <p className="text-gray-600 mb-4">
            {t("error.fetch_failed_detail") || "Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."}
          </p>
          <p className="text-red-500 text-sm mb-4">
            {t("error.message_prefix") || "Chi tiết lỗi:"} {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setError(null);
              setCurrentPage(1);
              fetchHomes(1, debouncedSearchTerm);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            {t("ui.try_again")}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    // Nền mới đồng bộ với LoginPage
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Circles (Đã đổi màu) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          // ĐÃ SỬA: Đổi gradient sang trắng/xám nhạt
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-white to-gray-100 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          // ĐÃ SỬA: Đổi gradient sang trắng/xám nhạt
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-gray-100 to-white rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md hover:shadow-lg transition-all border border-gray-100"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </motion.button>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {t("ui.home_management") || "Quản Lý Nhà Cửa"}
            </h1>
          </div>

          <div className="text-sm text-gray-500 bg-white/50 backdrop-blur-sm p-2 px-4 rounded-full border border-white/50 shadow-md">
            {t("ui.showing")}{" "}
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              {totalCount}
            </span>{" "}
            <span className="font-semibold text-gray-700">{t("ui.homes")}</span>
          </div>
        </motion.div>

        {/* ===== TOP TOOLBAR ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("ui.search_by_name_or_address")}
              className="w-full h-12 pl-12 pr-4 rounded-2xl border-2 border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            // Nút gradient đồng bộ
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-blue-500/50 transition active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} />
            {t("ui.add_new")}
          </motion.button>
        </motion.div>

        {/* ===== MAIN LIST CONTAINER & LOADING/ERROR STATUS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          // Card Container mới đồng bộ
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden"
        >
          {/* Loading Indicator */}
          {isFetching && !initialLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-4 right-4 px-4 py-2 bg-white/90 rounded-full shadow-md flex items-center gap-2 text-sm text-gray-600 z-10 border border-gray-100"
            >
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              {t("ui.loading")}...
            </motion.div>
          )}

          {/* Empty State */}
          {homes.length === 0 && !isFetching && !initialLoading ? (
            <div className="py-24 text-center">
              <Home className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800">
                {t("ui.no_properties_found")}
              </h3>
              <p className="text-gray-500 mt-1">
                {t("ui.try_change_search_or_filter")}
              </p>
            </div>
          ) : (
            // Home List
            <div className="divide-y divide-gray-100">
              {homes.map((home, index) => (
                <motion.div
                  key={home.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6
                  transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:shadow-lg/50" // Hiệu ứng hover mượt mà hơn
                >
                  {/* LEFT: Home Info */}
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">
                      <Home size={22} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {home.name || t("ui.property_title")}
                      </h3>
                      <div className="flex items-start gap-2 text-sm text-gray-500 mt-1">
                        <MapPin size={16} className="mt-0.5 text-blue-500" />
                        <span className="line-clamp-2">
                          {home.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT ACTIONS */}
                  <div className="flex items-center gap-4 flex-wrap justify-between sm:justify-end">
                    {/* Edit Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHomeToEdit(home)}
                      className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-semibold transition-all p-2 rounded-lg hover:bg-amber-50"
                    >
                      <Pencil size={18} />
                      {t("ui.edit")}
                    </motion.button>
                    
                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setHomeToDelete(home.id)}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-semibold transition-all p-2 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                      {t("ui.delete")}
                    </motion.button>
                    
                    {/* Manage Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(59, 130, 246, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/home-items/${home.id}`)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm hover:shadow-md transition"
                    >
                      {t("ui.manage_rooms_devices")}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex justify-center gap-2"
          >
            {renderPaginationButtons()}
          </motion.div>
        )}

      </div>

      {/* DELETE CONFIRM MODAL (GIỮ NGUYÊN LOGIC) */}
      {homeToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            exit={{ y: "100%" }}
            className="bg-white p-6 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-none sm:max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {t("ui.confirm_delete")}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t("ui.confirm_delete_message")}
            </p>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHomeToDelete(null)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={isFetching}
              >
                {t("ui.cancel")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 shadow-sm transition-all duration-200 font-medium"
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("ui.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    {t("ui.delete")}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADD MODAL (GIỮ NGUYÊN LOGIC) */}
      {showAddModal && (
        <AddAddressPage
          onClose={handleCloseAddModal}
          onSuccess={handleHomeAdded}
        />
      )}

      {/* EDIT MODAL (GIỮ NGUYÊN LOGIC) */}
      {homeToEdit && (
        <EditHomePage
          homeData={homeToEdit}
          onClose={() => setHomeToEdit(null)}
          onSuccess={handleHomeEdited}
        />
      )}
    </div>
  );
}