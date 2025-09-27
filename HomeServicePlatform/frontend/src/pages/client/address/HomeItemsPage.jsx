import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { homeApi } from "../../../services/homeApi";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Filter,
  Grid3x3,
  List
} from "lucide-react";

export default function HomeItemsInterface() {
  const { homeId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const pageSize = 10;

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const fetchHomeItems = useCallback(
    async (page, search) => {
      if (!homeId) {
        setError("Thiếu ID nhà để xem vật phẩm.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await homeApi.listHomeItems(homeId, page, pageSize, search);
        if (res.success) {
          setItems(res.data.items || []);
          setCurrentPage(res.data.currentPage || 1);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.totalCount ?? 0);
        } else {
          setError(res.message);
        }
      } catch (err) {
        console.error("Error fetching home items:", err);
        setError("Không thể tải danh sách vật phẩm. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    },
    [homeId]
  );

  const debouncedFetch = useCallback(
    debounce((search) => {
      setCurrentPage(1);
      fetchHomeItems(1, search);
    }, 500),
    [fetchHomeItems]
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedFetch(searchTerm);
    } else {
      fetchHomeItems(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, fetchHomeItems, debouncedFetch]);

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
      <nav className="flex items-center justify-center gap-1 mt-6">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <ChevronLeft size={20} />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
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
            className={`px-3 py-1 rounded font-medium ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
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
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <ChevronRight size={20} />
        </button>
      </nav>
    );
  };

  const getItemIcon = (type) => {
    const typeMap = {
      'electronics': '📺',
      'appliance': '❄️', 
      'furniture': '🛋️',
      'device': '📱',
      'air_purifier': '💨'
    };
    return typeMap[type?.toLowerCase()] || '📦';
  };

  const getItemColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600', 
      'bg-purple-100 text-purple-600',
      'bg-orange-100 text-orange-600',
      'bg-red-100 text-red-600'
    ];
    return colors[index % colors.length];
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-lg border animate-pulse flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-600 mb-4">Lỗi: {error}</h3>
          <button
            onClick={() => fetchHomeItems(currentPage, searchTerm)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-500 space-x-2">
              <span>Trang chủ</span>
              <ChevronRight className="w-4 h-4" />
              <span>Quản lý nhà</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900">Vật phẩm trong nhà</span>
            </nav>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700">
                <FileSpreadsheet size={18} />
                Xuất Excel
              </button>
              <button
                onClick={() => navigate(`/homes/${homeId}/items/add`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Thêm vật phẩm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Vật phẩm trong nhà</h1>
          <p className="text-gray-600">Quản lý thiết bị và vật dụng trong ngôi nhà của bạn</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              placeholder="Tìm kiếm theo tên, thương hiệu, model..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white min-w-[140px]">
            <option>Tất cả loại</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white min-w-[160px]">
            <option>Tất cả thương hiệu</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">
              📦
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng vật phẩm</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl">
              📺
            </div>
            <div>
              <p className="text-sm text-gray-500">Điện tử</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xl">
              🛋️
            </div>
            <div>
              <p className="text-sm text-gray-500">Nội thất</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xl">
              ⚠️
            </div>
            <div>
              <p className="text-sm text-gray-500">Cần bảo trì</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách vật phẩm</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Hiển thị {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} trong {totalCount} kết quả
            </span>
            <div className="flex border rounded-lg">
              <button className="p-2 border-r hover:bg-gray-50">
                <Grid3x3 size={18} />
              </button>
              <button className="p-2 hover:bg-gray-50 bg-gray-50">
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          renderSkeleton()
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg border p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl">
              📦
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Không có vật phẩm nào
            </h3>
            <p className="text-gray-500 mb-6">
              Hãy thêm vật phẩm/thiết bị đầu tiên vào nhà này.
            </p>
            <button
              onClick={() => navigate(`/homes/${homeId}/items/add`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thêm vật phẩm
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border divide-y">
              {items.map((item, index) => (
                <div key={item.id} className="p-5 flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${getItemColor(index)}`}>
                    {getItemIcon(item.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {item.type || "Chưa phân loại"}
                      </span>
                      <span className="text-gray-600">
                        {item.brand || "N/A"}
                      </span>
                      <span className="text-gray-500">
                        Model: {item.modelNumber || "N/A"}
                      </span>
                      {item.serialNumber && (
                        <span className="text-gray-400">
                          Serial: {item.serialNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="text-green-600">Hoạt động tốt</span>
                      <span>Mua ngày: 10/01/2023</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate(`/homes/${homeId}/items/${item.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/homes/${homeId}/items/${item.id}/edit`)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                    >
                      <Pencil size={18} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalCount)} trong {totalCount} kết quả
              </div>
              {totalPages > 1 && renderPaginationButtons()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}