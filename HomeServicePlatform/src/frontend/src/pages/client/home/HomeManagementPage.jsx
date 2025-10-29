import { useState, useEffect, useCallback } from "react";
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
    const [homes, setHomes] = useState([]);
    const [loading, setLoading] = useState(false);
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

    const fetchHomes = useCallback(async (
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
                ownerName: item.customerProfileName || "ui.no_name",  
                type: item.type ? item.type.toLowerCase() : "house",
            }));
            setHomes(mappedHomes);
            setCurrentPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
            setTotalCount(res.data.totalCount);
        } else {
            setError(res.message || "error.fetch_failed");  
        }
    } catch (error) {
        console.error("Error fetching homes:", error);
        setError("error.fetch_failed");  
    } finally {
        setLoading(false);
    }
}, [debouncedSearchTerm, filterType]); 
    const handleCloseAddModal = () => {
        setShowAddModal(false);
    };

    const handleHomeAdded = () => {
        setShowAddModal(false);
        toast.success(t("success.home_added"));
        fetchHomes(currentPage);
    };

    const handleHomeEdited = () => {
        setHomeToEdit(null);
        fetchHomes(currentPage);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, filterType]);

    useEffect(() => {
        fetchHomes(currentPage, debouncedSearchTerm, filterType);
    }, [currentPage, debouncedSearchTerm, filterType, fetchHomes]);

    const handleDelete = async () => {
        try {
            const res = await homeApi.deleteHome(homeToDelete);
            if (res.success) {
                toast.success(t("success.home_deleted"));
                fetchHomes(
                    currentPage > 1 && homes.length === 1 ? currentPage - 1 : currentPage
                );
            } else {
                toast.error(res.message || t("error.delete_failed"));
            }
        } catch (error) {
            console.error("Error deleting home:", error);
            toast.error(t("error.delete_unknown"));
        } finally {
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
                    onClick={() => setCurrentPage(currentPage - 1)}
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
                    className="p-2 text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                    <ChevronRight size={16} />
                </button>
            </nav>
        );
    };

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
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="mb-8 flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        title={t("ui.back")}
                        className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm flex-shrink-0 h-8 w-8 flex items-center justify-center"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3 ml-4">
                        {t("ui.home_management")}
                    </h1>
                </div>
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 w-full">
                    {/* Stats/Total Count */}
                    <div className="bg-white rounded-xl px-6 py-3 shadow-sm border border-gray-200 flex items-center justify-center h-12 min-w-[180px]">
                        <span className="text-lg font-semibold text-gray-900">
                            {t("ui.showing")} {totalCount} {t("ui.homes")}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1 items-center">
                        {/* Search Bar */}
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

                        {/* Add Button */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md h-12 w-full sm:w-36"
                        >
                            <Plus size={20} />
                            <span>{t("ui.add_new")}</span>
                        </button>
                    </div>
                </div>

                {/* Property Cards */}
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-10 rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                    )}

                    {homes.length === 0 ? (
                        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-md border border-gray-200">
                            <div className="text-6xl mb-4">🏠</div>
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
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm h-12"
                            >
                                {t("ui.clear_filter")}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                            {homes.map((home) => (
                                <div
                                    key={home.id}
                                    className="group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="relative bg-blue-100 h-48 sm:h-64 overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-400/20"></div>
                                        <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                                            <div className="text-blue-600 scale-125">
                                                {homeTypeIcons[home.type] || homeTypeIcons["house"]}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setHomeToDelete(home.id)}
                                            className="absolute top-4 right-4 w-10 h-10 bg-white/90 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-300 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size= {16} className="mx-auto" />
                                        </button>

                                        <div className="absolute bottom-4 right-4 px-3 py-1 bg-white rounded-lg text-xs font-medium text-gray-700 border border-gray-200 shadow-sm">
                                            {t(homeTypeLabels[home.type] || homeTypeLabels["house"])}
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-6">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 line-clamp-1">
                                            {home.name || t("ui.property_title")}
                                        </h3>

                                        <div className="space-y-3 sm:space-y-4 text-gray-600 mb-4 sm:mb-6">
                                            <div className="flex items-start gap-2">
                                                <MapPin
                                                    size={16}
                                                    className="text-gray-400 flex-shrink-0 mt-0.5"
                                                />
                                                <span className="text-xs sm:text-sm line-clamp-2 leading-relaxed">
                                                    {home.address}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 line-clamp-3">
                                                {t("ui.short_description")}
                                            </p>

                                            <div className="flex gap-4 text-xs font-medium text-gray-500 pt-1">
                                                <span>{t("ui.rooms", { count: 8 })}</span>
                                                <span>{t("ui.area", { size: 15 })}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => setHomeToEdit(home)}
                                                title={t("ui.edit_address")}
                                                className="w-10 h-10 p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                                            >
                                                <Pencil size={18} className="mx-auto" />
                                            </button>

                                            <button
                                                onClick={() => navigate(`/home-items/${home.id}`)}
                                                title={t("ui.manage_rooms_devices")}
                                                className="w-10 h-10 p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                            >
                                                <Settings size={18} className="mx-auto" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {totalPages > 1 && renderPaginationButtons()}
            </div>

            {homeToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {t("ui.confirm_delete") || "Xác nhận xóa"}
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            {t("ui.confirm_delete_message")}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setHomeToDelete(null)}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium h-12"
                            >
                                {t("ui.cancel")}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 shadow-sm transition-all duration-200 font-medium h-12"
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