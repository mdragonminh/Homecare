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

/**
 * useDebounce
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchHomes(currentPage, debouncedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]);

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

  const renderPaginationButtons = () => {
    const pageNumbers = [];
    // Giữ nguyên maxPagesToShow = 5, nhưng tăng kích thước nút
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
      <nav className="flex items-center justify-center gap-1 mt-6 text-sm">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          // Thay đổi kích thước nút: w-9 h-9 (lớn hơn, dễ chạm hơn)
          className="p-1.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm w-9 h-9 flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              // Thay đổi kích thước nút: w-9 h-9
              className="w-9 h-9 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            // Thay đổi kích thước nút: w-9 h-9
            className={`w-9 h-9 rounded-lg font-medium transition-all duration-200 shadow-sm ${
              page === currentPage
                ? "bg-gray-700 text-white border-gray-700"
                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-1 text-gray-400">...</span>
            )}
            <button
              onClick={() => setCurrentPage(totalPages)}
              // Thay đổi kích thước nút: w-9 h-9
              className="w-9 h-9 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          // Thay đổi kích thước nút: w-9 h-9
          className="p-1.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm w-9 h-9 flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    );
  };

  // Error Panel
  if (error && !homeToDelete) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-50">
        <div className="text-center bg-white/90 backdrop-blur p-8 rounded-3xl shadow-2xl max-w-md border border-white/30">
          <div className="text-6xl mb-4">Lỗi</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {t("ui.error_occurred")}
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setCurrentPage(1);
              fetchHomes(1, debouncedSearchTerm);
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
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow hover:shadow-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {t("ui.home_management")}
          </h1>
        </div>

        <div className="text-sm text-gray-500">
          {t("ui.showing")}{" "}
          <span className="font-semibold text-red-900 text-xl">{totalCount}</span>{" "}
          {t("ui.homes")}
        </div>
      </div>

      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("ui.search_by_name_or_address")}
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-[1px] transition active:scale-95 flex items-center gap-2"
        >
          <Plus size={20} />
          {t("ui.add_new")}
        </button>
      </div>

      {/* ===== MAIN LIST ===== */}
      <div className="bg-white/70 backdrop-blur rounded-3xl shadow-xl border border-white/40 overflow-hidden">

        {isFetching && !initialLoading && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-white/80 rounded-full shadow flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("ui.loading")}...
          </div>
        )}

        {homes.length === 0 ? (
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
          <div className="divide-y divide-gray-100">
            {homes.map((home) => (
              <div
                key={home.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6
                transition-all duration-300 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white hover:-translate-y-[2px]"
              >
                {/* LEFT */}
                <div className="flex items-start gap-5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <Home size={22} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {home.name || t("ui.property_title")}
                    </h3>
                    <div className="flex items-start gap-2 text-sm text-gray-500 mt-1">
                      <MapPin size={16} className="mt-0.5" />
                      <span className="line-clamp-2">
                        {home.address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-6 flex-wrap justify-between sm:justify-end">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setHomeToEdit(home)}
                      className="text-amber-600 hover:text-amber-700 font-semibold transition hover:scale-105"
                    >
                      {t("ui.edit")}
                    </button>
                    <button
                      onClick={() => setHomeToDelete(home.id)}
                      className="text-red-600 hover:text-red-700 font-semibold transition hover:scale-105"
                    >
                      {t("ui.delete")}
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/home-items/${home.id}`)}
                    className="px-5 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 hover:shadow-md transition"
                  >
                    {t("ui.manage_rooms_devices")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {renderPaginationButtons()}
        </div>
      )}

    </div>

      {/* DELETE CONFIRM MODAL - Refactored for Mobile (Slide up from bottom) */}
      {homeToDelete && (
        // items-end trên mobile để modal trượt lên từ dưới, sm:items-center để căn giữa trên desktop
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div
            // rounded-t-2xl trên mobile, w-full, không dùng max-w-md trên mobile
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
              <button
                onClick={() => setHomeToDelete(null)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={isFetching}
              >
                {t("ui.cancel")}
              </button>
              <button
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
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <AddAddressPage
          onClose={handleCloseAddModal}
          onSuccess={handleHomeAdded}
        />
      )}

      {/* EDIT MODAL */}
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
