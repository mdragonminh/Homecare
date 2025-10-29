import { useState, useEffect, useCallback } from "react";
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
  Filter,
  Loader2,
  AlertTriangle,
  Package,
  Monitor,
  Sofa,
  Wrench,
  AlertCircle,
  Tag,
  Hash,
  Calendar,
} from "lucide-react";

import AddHomeItemModal from "./AddHomeItemModal";
import HomeItemEditModal from "./HomeItemEditModal";
import HomeItemDetailsModal from "./HomeItemDetailsModal";

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

  const pageSize = 6;

const fetchHomeItems = useCallback(
  async (page, search) => {
    if (!homeId) {
      setError("error.missing_home_id"); 
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await homeApi.listHomeItems(homeId, page, pageSize, search || "");
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
  [homeId, pageSize] 
);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchHomeItems(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchHomeItems]);

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
          className="p-2.5 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="min-w-[40px] h-10 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`min-w-[40px] h-10 rounded-lg font-medium transition-all duration-200 shadow-sm ${
              page === currentPage
                ? "bg-blue-600 text-white border-blue-600"
                : "text-blue-600 bg-white border border-blue-200 hover:bg-blue-50"
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 text-gray-400">...</span>
            )}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="min-w-[40px] h-10 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    );
  };

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

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(pageSize)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-6 rounded-xl border border-blue-200 animate-pulse flex items-center gap-6"
        >
          <div className="w-14 h-14 bg-blue-100 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-5 bg-blue-100 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-blue-100 rounded w-2/3 mb-1"></div>
            <div className="h-3 bg-blue-100 rounded w-1/4"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg"></div>
            <div className="h-8 w-8 bg-blue-100 rounded-lg"></div>
            <div className="h-8 w-8 bg-blue-100 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-md border border-blue-200">
          <h3 className="text-xl font-semibold text-red-600 mb-4">
            {t("error.error_occurred")}: {error}
          </h3>
          <button
            onClick={() => fetchHomeItems(currentPage, debouncedSearch)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
          >
            {t("ui.try_again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
       
        <div className="mb-8 flex items-center justify-between">
        
          <div className="flex items-center gap-4">
          
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm"
              title={t("ui.go_back") || "Quay lại"}
            >
              <ChevronLeft size={16} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("ui.manage_items")}
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
            title={t("ui.add_item")}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t("ui.add_item")}</span>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              placeholder={t("ui.search_item_placeholder")}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900">
            <option>{t("ui.all_types")}</option>
            <option>{t("item.type.electronics")}</option>
            <option>{t("item.type.appliance")}</option>
            <option>{t("item.type.furniture")}</option>
            <option>{t("item.type.tool")}</option>
          </select>
          <select className="border border-gray-300 rounded-xl px-4 py-3 bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900">
            <option>{t("ui.all_brands")}</option>
          </select>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 bg-white text-blue-600">
            <Filter size={18} />
            {t("ui.filter")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {t("ui.total_items")}
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Monitor size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {t("item.type.electronics")}
              </p>
              <p className="text-2xl font-bold text-gray-900">...</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
              <Sofa size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {t("item.type.furniture")}
              </p>
              <p className="text-2xl font-bold text-gray-900">...</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {t("ui.needs_maintenance")}
              </p>
              <p className="text-2xl font-bold text-gray-900">...</p>
            </div>
          </div>
        </div>

        {/* Items List */}
        {loading && totalCount === 0 ? (
          renderSkeleton()
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center hover:shadow-md transition-all duration-200">
            <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Package size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {t("ui.no_items_found")}
            </h3>
            <p className="text-gray-600 mb-6">{t("ui.add_first_item_hint")}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
            >
              {t("ui.add_item")}
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-6 hover:shadow-md transition-all duration-200"
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center border ${getItemColor(
                      index
                    )}`}
                  >
                    {getItemIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate">
                      {item.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
                      <span className="inline-flex items-center gap-1.5 text-gray-700 bg-gray-100 px-3 py-1 rounded-lg font-medium">
                        <Tag size={14} />
                        {t(
                          `item.type.${item.type?.toLowerCase()}`,
                          item.type
                        ) || t("ui.uncategorized")}
                      </span>
                      {item.brand && (
                        <span className="text-gray-600 font-medium">
                          {item.brand}
                        </span>
                      )}
                      {item.modelNumber && (
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <Hash size={14} />
                          {item.modelNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {t("ui.working_well")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={12} />
                        {t("ui.purchase_info", { date: "10/01/2023" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewItem(item.id)}
                      className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title={t("ui.view")}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEditItem(item.id)}
                      className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                      title={t("ui.edit")}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title={t("ui.delete")}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && renderPaginationButtons()}
          </>
        )}
      </div>

      {/* Modals */}
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
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full">
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
              <button
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={loading}
              >
                {t("ui.cancel")}
              </button>
              <button
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
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
