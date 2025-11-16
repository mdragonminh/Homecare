import { useState, useEffect, useCallback, useRef } from "react";
import {
    Plus,
    Search,
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
    Settings,
    Bed,
    Maximize,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { homeApi } from "../../../services/homeApi";
import AddAddressPage from "./AddHome";
import EditHomePage from "./EditHomePage";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * useDebounce: giữ nguyên như bạn có
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

const homeTypes = ["apartment", "house", "villa", "condo"];

const homeTypeLabels = {
    all: "ui.all",
    apartment: "ui.apartment",
    house: "ui.house",
    villa: "ui.villa",
    condo: "ui.condo",
};

const homeTypeIcons = {
    all: <Building className="w-4 h-4 text-current" />,
    apartment: <Building2 className="w-4 h-4 text-current" />,
    house: <Home className="w-4 h-4 text-current" />,
    villa: <Map className="w-4 h-4 text-current" />,
    condo: <Building className="w-4 h-4 text-current" />,
};

/**
 * FilterDropdown component (giữ nguyên, dùng class để bắt click outside)
 */
const FilterDropdown = ({ t, filterType, setFilterType, homeTypeLabels, homeTypeIcons, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentLabelKey = homeTypeLabels[filterType] || homeTypeLabels.all;
    const currentLabel = t(currentLabelKey);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (type) => {
        setFilterType(type);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && event.target.closest('.filter-dropdown-container') === null) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={`relative filter-dropdown-container ${className}`}>
            <button
                onClick={toggleDropdown}
                className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm w-full text-gray-700 h-12"
            >
                <span className="font-medium">{currentLabel}</span>
                {isOpen ? <ChevronUp size={18} className="text-gray-600" /> : <ChevronDown size={18} className="text-gray-600" />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 transition-opacity duration-200">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {["all", ...homeTypes].map((type) => (
                            <button
                                key={type}
                                onClick={() => handleSelect(type)}
                                className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 text-left hover:bg-gray-100 transition-colors ${
                                    type === filterType ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                                }`}
                                role="menuitem"
                            >
                                <div className={type === filterType ? "text-blue-600" : "text-gray-700"}>
                                    {homeTypeIcons[type]}
                                </div>
                                {t(homeTypeLabels[type])}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function HomeManagementPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // dữ liệu
    const [homes, setHomes] = useState([]);
    // initialLoading: chỉ true khi lần load đầu vào trang -> show skeleton
    const [initialLoading, setInitialLoading] = useState(true);
    // isFetching: true khi đang gọi API (dùng để hiển thị loader nhỏ), không clear bảng
    const [isFetching, setIsFetching] = useState(false);

    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [homeToDelete, setHomeToDelete] = useState(null);
    const [homeToEdit, setHomeToEdit] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // ref để giữ controller của request hiện tại (để abort khi cần)
    const abortControllerRef = useRef(null);

    /**
     * fetchHomes: không set loading "toàn bộ bảng" mỗi lần
     * - show skeleton only when (initialLoading && isFetching)
     * - sử dụng AbortController để huỷ request cũ (tránh race)
     */
    const fetchHomes = useCallback(async (page = 1, search = "", type = "all") => {
        // abort request cũ nếu có
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setIsFetching(true);
            setError(null);

            const res = await homeApi.getHomesOfCurrentUser(page, 6, search, type, {
                signal: controller.signal,
            });

            // nếu request bị abort, sẽ ném error; nên kiểm tra res
            if (res && res.success) {
                const mappedHomes = (res.data.items || []).map((item) => ({
                    ...item,
                    ownerName: item.customerProfileName || "ui.no_name",
                    type: item.type ? item.type.toLowerCase() : "house",
                }));

                setHomes(mappedHomes);
                setCurrentPage(res.data.currentPage || page);
                setTotalPages(res.data.totalPages || 1);
                setTotalCount(res.data.totalCount || (mappedHomes ? mappedHomes.length : 0));
            } else if (res && !res.success) {
                setError(res.message || "error.fetch_failed");
            }
        } catch (err) {
            if (err.name === "AbortError") {
                // request bị abort, không cần set error
                // console.log("Fetch aborted");
            } else {
                console.error("Error fetching homes:", err);
                setError("error.fetch_failed");
            }
        } finally {
            setIsFetching(false);
            setInitialLoading(false); // đã gọi ít nhất 1 lần -> tắt skeleton forever (cho đến khi reload trang)
            abortControllerRef.current = null;
        }
    }, []);

    // reset page khi search/filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, filterType]);

    // gọi fetch khi currentPage / debounce / filter thay đổi
    useEffect(() => {
        fetchHomes(currentPage, debouncedSearchTerm, filterType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearchTerm, filterType]);

    const handleCloseAddModal = () => {
        setShowAddModal(false);
    };

    const handleHomeAdded = () => {
        setShowAddModal(false);
        toast.success(t("success.home_added"));
        // refresh trang hiện tại
        fetchHomes(currentPage, debouncedSearchTerm, filterType);
    };

    const handleHomeEdited = () => {
        setHomeToEdit(null);
        fetchHomes(currentPage, debouncedSearchTerm, filterType);
    };

    const handleDelete = async () => {
        try {
            setIsFetching(true);
            const res = await homeApi.deleteHome(homeToDelete);
            if (res.success) {
                toast.success(t("success.home_deleted"));
                // nếu xóa phần tử cuối cùng trên trang (và page>1) -> chuyển page trước khi fetch
                const nextPage = currentPage > 1 && homes.length === 1 ? currentPage - 1 : currentPage;
                fetchHomes(nextPage, debouncedSearchTerm, filterType);
            } else {
                toast.error(res.message || t("error.delete_failed"));
            }
        } catch (err) {
            console.error("Error deleting home:", err);
            toast.error(t("error.delete_unknown"));
        } finally {
            setIsFetching(false);
            setHomeToDelete(null);
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                    <ChevronLeft size={16} />
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
                        {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="min-w-[40px] h-10 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
                <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                    <ChevronRight size={16} />
                </button>
            </nav>
        );
    };

    // nếu error và không đang confirm delete -> show error panel
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
                            // fetch lại trang đầu
                            setCurrentPage(1);
                            fetchHomes(1, debouncedSearchTerm, filterType);
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
                <div className="mb-8 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        title={t("ui.back")}
                        className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm flex-shrink-0 h-10 w-10 flex items-center justify-center"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 ml-4">
                        {t("ui.home_management")}
                    </h1>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 w-full">
                    <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200 flex items-center justify-center h-12 min-w-[180px]">
                        <span className="text-lg font-semibold text-gray-900">
                            {t("ui.showing")} {totalCount} {t("ui.homes")}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1 items-center">
                        <div className="relative flex-grow w-full sm:w-auto">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Search className="text-gray-400" size={22} />
                            </div>
                            <input
                                placeholder={t("ui.search_by_name_or_address")}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 h-12 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <FilterDropdown
                            t={t}
                            filterType={filterType}
                            setFilterType={setFilterType}
                            homeTypeLabels={homeTypeLabels}
                            homeTypeIcons={homeTypeIcons}
                            className="w-full sm:w-48 flex-shrink-0"
                        />

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md h-12 w-full sm:w-36"
                        >
                            <Plus size={20} />
                            <span>{t("ui.add_new")}</span>
                        </button>
                    </div>
                </div>

                {/* TABLE VIEW - SKELETON + LOADING INDICATOR */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative">
                    <div className="overflow-x-auto">
                        {/* Nếu initialLoading && đang fetch -> show skeleton (lần đầu). Ngược lại show data (kể cả khi isFetching=true) */}
                        {initialLoading && isFetching ? (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-normal">
                                            {t("ui.type")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-normal">
                                            {t("ui.home_name")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-normal hidden md:table-cell">
                                            {t("ui.address")}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-normal">
                                            {t("ui.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {[...Array(6)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="h-5 bg-gray-200 rounded w-32"></div>
                                                <div className="h-3 bg-gray-200 rounded w-48 mt-2 md:hidden"></div>
                                            </td>
                                            <td className="px-6 py-5 hidden md:table-cell">
                                                <div className="h-4 bg-gray-200 rounded w-64"></div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : homes.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">Nhà</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
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
                                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                                >
                                    {t("ui.clear_filter")}
                                </button>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-normal">
                                            {t("ui.type")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-normal">
                                            {t("ui.home_name")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-normal hidden md:table-cell">
                                            {t("ui.address")}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-normal">
                                            {t("ui.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {homes.map((home, index) => (
                                        <tr
                                            key={home.id}
                                            className={`hover:bg-blue-50/50 transition-colors ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                            }`}
                                        >
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <div className="text-blue-600">
                                                            {homeTypeIcons[home.type] || homeTypeIcons["house"]}
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {t(homeTypeLabels[home.type] || homeTypeLabels["house"])}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-base font-semibold text-gray-900">
                                                    {home.name || t("ui.property_title")}
                                                </div>
                                                <div className="text-sm text-gray-500 md:hidden mt-1">
                                                    <MapPin size={14} className="inline mr-1" />
                                                    {home.address}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 hidden md:table-cell">
                                                <div className="flex items-start gap-2 max-w-md">
                                                    <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span className="text-sm text-gray-600">
                                                        {home.address}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setHomeToEdit(home)}
                                                        title={t("ui.edit_address")}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/home-items/${home.id}`)}
                                                        title={t("ui.manage_rooms_devices")}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                                    >
                                                        <Settings size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setHomeToDelete(home.id)}
                                                        title={t("ui.delete")}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Loading indicator nhỏ ở góc trên bên phải */}
                    {isFetching && !initialLoading && homes.length > 0 && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 text-sm text-gray-600 z-10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("ui.loading")}...
                        </div>
                    )}
                </div>

                {totalPages > 1 && renderPaginationButtons()}
            </div>

            {/* DELETE CONFIRM MODAL */}
            {homeToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{t("ui.confirm_delete")}</h3>
                        </div>
                        <p className="text-gray-600 mb-6">{t("ui.confirm_delete_message")}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setHomeToDelete(null)}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
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
            {showAddModal && <AddAddressPage onClose={handleCloseAddModal} onSuccess={handleHomeAdded} />}

            {/* EDIT MODAL */}
            {homeToEdit && (
                <EditHomePage homeData={homeToEdit} onClose={() => setHomeToEdit(null)} onSuccess={handleHomeEdited} />
            )}
        </div>
    );
}
