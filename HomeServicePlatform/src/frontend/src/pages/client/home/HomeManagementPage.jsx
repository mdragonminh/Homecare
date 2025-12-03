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

  const fetchHomes = useCallback(
    async (page = 1, search = "") => {
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
    },
    []
  );

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* HEADER VÀ QUAY LẠI */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => navigate(-1)}
            title={t("ui.back")}
            className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm flex-shrink-0 h-10 w-10 flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3 ml-4">
            {t("ui.home_management")}
          </h1>
        </div>

        {/* CONTROLS (TOTAL COUNT, SEARCH, ADD) - Refactored for Mobile-First */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-6 w-full">
          {/* Total Items Count - Full width on mobile, auto on desktop */}
          <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200 flex items-center justify-center w-full sm:w-auto flex-shrink-0">
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              {t("ui.showing")} {totalCount} {t("ui.homes")}
            </span>
          </div>

          {/* Search Bar & Add Button - Stack on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:flex-1 items-stretch">
            {/* SEARCH INPUT */}
            <div className="relative flex-grow w-full sm:w-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                placeholder={t("ui.search_by_name_or_address")}
                // Điều chỉnh py-2.5 trên mobile
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 h-11 sm:h-12 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* ADD NEW BUTTON - Chiều rộng full trên mobile, ẩn text trên mobile */}
            <button
              onClick={() => setShowAddModal(true)}
              // Thay đổi p-2.5 trên mobile, px-4 py-3 trên desktop
              className="flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md h-11 sm:h-12 w-full sm:w-36 flex-shrink-0"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">{t("ui.add_new")}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative">
          {isFetching && !initialLoading && homes.length > 0 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 text-sm text-gray-600 z-10">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("ui.loading")}...
            </div>
          )}

          {initialLoading && isFetching ? (
            /* LOADING SKELETON */
            <div className="divide-y divide-gray-100">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start gap-4"
                >
                  <div className="flex-1 min-w-0 flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0 mt-0.5"></div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full max-w-lg"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="h-8 w-24 bg-gray-200 rounded-xl"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded"></div>
                    <div className="h-8 w-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : homes.length === 0 ? (
            /* NO RESULTS STATE */
            <div className="text-center py-16">
              <div className="text-6xl mb-4 text-gray-300">
                <Home className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("ui.no_properties_found")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("ui.try_change_search_or_filter")}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
              >
                {t("ui.clear_filter")}
              </button>
            </div>
          ) : (
            /* RENDER HOME CARDS - Refactored for Mobile-First */
            <div className="divide-y divide-gray-100">
              {homes.map((home) => (
                <div
                  key={home.id}
                  className="p-4 sm:p-6 transition-all duration-200 hover:bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  {/* HOME INFO BLOCK (Icon + Name) */}
                  <div className="flex items-start flex-1 min-w-0 gap-4 w-full">
                    {/* PROMIMENT ICON */}
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <Home size={20} />
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      {/* NAME */}
                      <div className="text-lg sm:text-xl font-bold text-gray-900 truncate leading-snug">
                        {home.name || t("ui.property_title")}
                      </div>

                      {/* ADDRESS - Chỉ hiển thị trên DESKTOP (sm:) */}
                      <div className="hidden sm:flex items-start gap-2 text-sm text-gray-600 mt-2">
                        <MapPin
                          size={16}
                          className="text-gray-400 flex-shrink-0 mt-0.5"
                        />
                        <span className="break-words font-medium">
                          {home.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* NEW: ADDRESS BLOCK - Chỉ hiển thị trên MOBILE (dưới sm:) */}
                  <div className="w-full sm:hidden">
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin
                        size={16}
                        className="text-gray-400 flex-shrink-0 mt-0.5"
                      />
                      <span className="break-words font-medium w-full">
                        {home.address}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS BLOCK - Tối ưu cho mobile: Justify-between chia đều 2 nhóm */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
                    {/* Nút phụ: Edit/Delete - Đặt bên trái cho mobile */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setHomeToEdit(home)}
                        title={t("ui.edit_address")}
                        className="text-amber-600 hover:text-amber-700 font-medium transition-colors text-sm py-1 h-8 flex items-center"
                      >
                        <Pencil size={18} className="sm:hidden mr-1" />
                        {t("ui.edit")}
                      </button>

                      <span className="text-gray-300">|</span>

                      <button
                        onClick={() => setHomeToDelete(home.id)}
                        title={t("ui.delete")}
                        className="text-red-600 hover:text-red-700 font-medium transition-colors text-sm py-1 h-8 flex items-center"
                      >
                        <Trash2 size={18} className="sm:hidden mr-1" />
                        {t("ui.delete")}
                      </button>
                    </div>

                    {/* Nút "Thiết bị" - Nút chính, đặt bên phải */}
                    <button
                      onClick={() => navigate(`/home-items/${home.id}`)}
                      title={t("ui.manage_rooms_devices")}
                      // Thay đổi padding cho mobile (p-2.5 vs px-4 py-2)
                      className="px-3 py-2 sm:px-4 sm:py-2 text-sm border border-blue-400 text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 font-semibold shadow-sm flex items-center gap-1 flex-shrink-0"
                    >
                      <Settings size={16} />
                      {/* Hiển thị "Quản lý phòng" trên desktop, "Phòng" trên mobile */}
                      <span className="hidden sm:inline">
                        {t("ui.manage_rooms")}
                      </span>
                      <span className="inline sm:hidden">{t("ui.manage_rooms_devices")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && renderPaginationButtons()}
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