import { useState, useEffect, useCallback } from "react"; // Đã xóa 'useRef'
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { homeApi } from "../../../services/homeApi";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Package,
  Monitor,
  Sofa,
  Wrench,
  Tag,
  Hash,
} from "lucide-react";
// eslint-disable-next-line
import { motion } from "framer-motion"; // Đã thêm framer-motion

import AddHomeItemModal from "./AddHomeItemModal";
import HomeItemEditModal from "./HomeItemEditModal";
import HomeItemDetailsModal from "./HomeItemDetailsModal";

// Kích thước trang mặc định (GIỮ NGUYÊN LOGIC)
const pageSize = 6;

export default function HomeItemsInterface() {
  const { homeId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemToEditId, setItemToEditId] = useState(null);
  const [itemToViewId, setItemToViewId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // LOGIC: fetchHomeItems (GIỮ NGUYÊN)
  const fetchHomeItems = useCallback(
    async (page, search) => {
      if (!homeId) {
        setError("error.missing_home_id");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await homeApi.listHomeItems(
          homeId,
          page,
          pageSize,
          search || ""
        );
        if (res.success) {
          setItems(res.data.items || []);
          setCurrentPage(res.data.currentPage || 1);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.totalCount ?? 0);
          setError(null);
        } else {
          setError(res.message || "error.fetch_items_failed");
        }
      } catch (err) {
        console.error("Error fetching home items:", err);
        setError("error.fetch_items_failed");
      } finally {
        setLoading(false);
      }
    },
    [homeId]
  );

  // LOGIC: Debounce Search (GIỮ NGUYÊN)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // LOGIC: Fetch Data on Mount/Change (GIỮ NGUYÊN)
  useEffect(() => {
    fetchHomeItems(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchHomeItems]);

  // LOGIC: Handlers (GIỮ NGUYÊN)
  const handleItemAddedOrEdited = () => {
    setShowAddModal(false);
    setItemToEditId(null);
    fetchHomeItems(currentPage, debouncedSearch);
  };

  const handleViewItem = (itemId) => {
    setItemToViewId(itemId);
  };

  const handleEditItem = (itemId) => {
    setItemToEditId(itemId);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    const deletePromise = homeApi.deleteHomeItem(itemToDelete.id);

    toast.promise(deletePromise, {
      loading: t("ui.deleting_item") || "Đang xóa vật phẩm...",
      success: (res) => {
        if (res.success) {
          setItemToDelete(null);
          const newPage =
            items.length === 1 && currentPage > 1
              ? currentPage - 1
              : currentPage;
          fetchHomeItems(newPage, debouncedSearch);
          return (
            t("success.item_deleted", { item_name: itemToDelete.name }) ||
            `Đã xóa "${itemToDelete.name}" thành công!`
          );
        } else {
          return res.message;
        }
      },
      error: (err) => {
        console.error("Error deleting item:", err);
        return t("error.delete_failed") || "Xóa vật phẩm thất bại.";
      },
      finally: () => {
        setLoading(false);
      },
    });
  };

  // LOGIC: Pagination, Chỉ thay đổi Styling và thêm Motion
  const renderPaginationButtons = () => {
    const pageNumbers = [];
    const maxPagesToShow = window.innerWidth < 640 ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Styling mới đồng bộ
    const buttonClass = (isActive) =>
      `min-w-[40px] h-10 rounded-xl font-medium transition-all duration-200 shadow-sm ${
        isActive
          ? "bg-gray-700 text-white border-gray-700 hover:bg-gray-800"
          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
      }`;

    const navButtonClass =
      "p-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm w-10 h-10 flex items-center justify-center";

    return (
      <nav className="flex items-center justify-center gap-1 mt-8 text-sm">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(currentPage - 1)}
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
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={navButtonClass}
        >
          <ChevronRight size={16} />
        </motion.button>
      </nav>
    );
  };

  // LOGIC: Icon/Color (GIỮ NGUYÊN)
  const getItemIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "electronics":
        return <Monitor size={24} />;
      case "appliance":
        return <Package size={24} />;
      case "furniture":
        return <Sofa size={24} />;
      case "tool":
        return <Wrench size={24} />;
      default:
        return <Package size={24} />;
    }
  };

  const getItemColor = (index) => {
    const colors = [
      "bg-blue-50 text-blue-600 border-blue-100",
      "bg-indigo-50 text-indigo-600 border-indigo-100",
      "bg-sky-50 text-sky-600 border-sky-100",
    ];
    return colors[index % colors.length];
  };

  // Styling mới cho Skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(pageSize)].map((_, i) => (
        <div
          key={i}
          className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 animate-pulse flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
        >
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 w-full">
            <div className="h-5 bg-blue-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-cyan-100 rounded w-2/3 mb-1"></div>
            <div className="h-3 bg-blue-100 rounded w-1/4"></div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Styling mới cho Error Panel
  if (error && !itemToDelete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl max-w-md border border-white/30"
        >
          <div className="text-6xl mb-4 text-red-500">
            <AlertTriangle className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t("ui.error_occurred")}
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setError(null);
              setCurrentPage(1);
              fetchHomeItems(1, debouncedSearch);
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
    // Nền mới đồng bộ
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Animated Background Circles */}
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
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl"
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
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-400 to-blue-400 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-md hover:shadow-lg transition-all border border-gray-100"
            title={t("ui.go_back") || "Quay lại"}
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </motion.button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("ui.manage_items")}
          </h1>
        </motion.div>

        {/* Search and Add controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-stretch gap-4 mb-8"
        >
          {/* Total Items Count */}
          <div className="bg-white/50 backdrop-blur-sm px-4 py-3 sm:px-6 sm:py-0 rounded-2xl border border-white/50 shadow-md flex items-center justify-center flex-shrink-0">
            <p className="text-sm sm:text-xm text-gray-500 whitespace-nowrap">
              {t("ui.total_items") || "Hiện thị"}:{" "}
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 ml-1">
                {totalCount}
              </span>
            </p>
          </div>

          {/* Search Bar & Add Button */}
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                placeholder={
                  t("ui.search_item_placeholder") ||
                  "Tìm kiếm theo tên hoặc địa chỉ..."
                }
                className="w-full h-12 pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all duration-200 bg-white shadow-sm text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Button - Nút gradient đồng bộ */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 h-12 p-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl shadow-lg hover:shadow-blue-500/50 transition active:scale-95 font-semibold flex-shrink-0 whitespace-nowrap"
              title={t("ui.add_item")}
            >
              <Plus size={20} />
              <span className="hidden sm:inline">
                {t("ui.add_item") || "Thêm mới"}
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* ===== MAIN LIST CONTAINER & STATES ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          // Card Container mới đồng bộ
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden"
        >
          {loading && totalCount === 0 ? (
            <div className="p-6">{renderSkeleton()}</div>
          ) : items.length === 0 ? (
            // Empty State
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-md">
                <Package size={32} className="text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                {t("ui.no_items_found")}
              </h3>
              <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                {t("ui.add_first_item_hint")}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                {t("ui.add_item")}
              </motion.button>
            </div>
          ) : (
            // Item List
            <div className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  // Card style
                  className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6
                  transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-white hover:shadow-lg/50"
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-md ${getItemColor(
                      index
                    )}`}
                  >
                    {getItemIcon(item.type)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base sm:text-xl mb-1 truncate">
                      {item.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm mb-0">
                      <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-100 px-3 py-1 rounded-full font-medium">
                        <Tag size={14} />
                        {t(
                          `item.type.${item.type?.toLowerCase()}`,
                          item.type
                        ) || t("ui.uncategorized")}
                      </span>
                      {item.brand && (
                        <span className="text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full">
                          {item.brand}
                        </span>
                      )}
                      {item.modelNumber && (
                        <span className="inline-flex items-center gap-1.5 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          <Hash size={14} />
                          {item.modelNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleViewItem(item.id)}
                      className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm"
                      title={t("ui.view")}
                    >
                      <Eye size={20} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditItem(item.id)}
                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200 shadow-sm"
                      title={t("ui.edit")}
                    >
                      <Pencil size={20} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setItemToDelete(item)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm"
                      title={t("ui.delete")}
                    >
                      <Trash2 size={20} />
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

      {/* Modals (GIỮ NGUYÊN LOGIC) */}
      {showAddModal && (
        <AddHomeItemModal
          homeId={homeId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleItemAddedOrEdited}
        />
      )}
      {itemToEditId && (
        <HomeItemEditModal
          homeItemId={itemToEditId}
          onClose={() => setItemToEditId(null)}
          onSuccess={handleItemAddedOrEdited}
        />
      )}
      {itemToViewId && (
        <HomeItemDetailsModal
          homeItemId={itemToViewId}
          onClose={() => setItemToViewId(null)}
        />
      )}

      {/* Delete Confirmation Modal (Thêm motion) */}
      {itemToDelete && (
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
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {t("ui.confirm_delete") || "Xác nhận xóa"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t("ui.delete_confirm_message", { item_name: itemToDelete.name })}
            </p>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={loading}
              >
                {t("ui.cancel")}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteItem}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 shadow-sm transition-all duration-200 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("ui.deleting") || "Đang xóa..."}
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
    </div>
  );
}