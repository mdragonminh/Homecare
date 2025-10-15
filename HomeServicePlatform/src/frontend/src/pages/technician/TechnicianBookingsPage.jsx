import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import {
  BookingStatus,
  BookingStatusLabels,
  BookingStatusColors,
} from "../../constants/enums";
import { toast } from "sonner";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const TechnicianBookingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
  });

  const [dateFilter, setDateFilter] = useState({
    fromDate: "",
    toDate: "",
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.currentPage, searchTerm, statusFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getAllBookings(
        pagination.currentPage,
        pagination.pageSize,
        searchTerm,
        statusFilter,
        dateFilter.fromDate,
        dateFilter.toDate
      );
      setBookings(response.items || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.totalPages || 0,
        totalCount: response.totalCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Không thể tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleDateFilter = (field, value) => {
    setDateFilter((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewDetail = (bookingId) => {
    navigate(`/technician/bookings/${bookingId}`);
  };

  const handleCompleteBooking = async (bookingId) => {
    if (window.confirm("Bạn có chắc chắn muốn hoàn thành booking này?")) {
      try {
        await bookingApi.completeBooking(bookingId);
        toast.success("Đã hoàn thành booking thành công");
        fetchBookings();
      } catch (error) {
        console.error("Error completing booking:", error);
        toast.error("Không thể hoàn thành booking");
      }
    }
  };

  const handleRejectBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowRejectModal(true);
  };

  const submitRejectBooking = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await bookingApi.cancelBooking(selectedBookingId, rejectReason);
      toast.success("Đã từ chối booking thành công");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedBookingId(null);
      fetchBookings();
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Không thể từ chối booking");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [BookingStatus.Pending]: { bg: "bg-orange-100", text: "text-orange-800" },
      [BookingStatus.Confirmed]: { bg: "bg-blue-100", text: "text-blue-800" },
      [BookingStatus.TechnicianOnTheWay]: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
      },
      [BookingStatus.InProgress]: {
        bg: "bg-purple-100",
        text: "text-purple-800",
      },
      [BookingStatus.Completed]: { bg: "bg-green-100", text: "text-green-800" },
      [BookingStatus.Cancelled]: { bg: "bg-red-100", text: "text-red-800" },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
    };
    const label = BookingStatusLabels[status] || "Không xác định";

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCompleteBooking = (status) => {
    return status === BookingStatus.InProgress;
  };

  const canRejectBooking = (status) => {
    return (
      status === BookingStatus.Pending || status === BookingStatus.Confirmed
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Booking</h1>
        <p className="text-gray-600">Xem và quản lý các booking được giao</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Bộ lọc tìm kiếm
          </h3>
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setDateFilter({ fromDate: "", toDate: "" });
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm theo tên dịch vụ, khách hàng..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(BookingStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFilter.fromDate}
              onChange={(e) => handleDateFilter("fromDate", e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateFilter.toDate}
              onChange={(e) => handleDateFilter("toDate", e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách Booking
                </h3>
                <p className="text-sm text-gray-600">
                  {pagination.totalCount > 0
                    ? `Tổng cộng ${pagination.totalCount} booking`
                    : "Chưa có booking nào"}
                </p>
              </div>
            </div>
            {pagination.totalCount > 0 && (
              <div className="text-sm text-gray-500">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
            </div>
            <p className="text-gray-500 font-medium">
              Đang tải danh sách booking...
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có booking nào
            </h3>
            <p className="text-gray-500">
              Thử thay đổi bộ lọc hoặc kiểm tra lại sau.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bookings.map((booking, index) => (
              <li
                key={booking.id}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            #
                            {(pagination.currentPage - 1) *
                              pagination.pageSize +
                              index +
                              1}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.service?.name || "Dịch vụ không xác định"}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <UserIcon className="flex-shrink-0 mr-2 h-4 w-4 text-blue-500" />
                          <span className="font-medium">
                            {booking.customer?.fullName || "Khách hàng"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <PhoneIcon className="flex-shrink-0 mr-2 h-4 w-4 text-green-500" />
                          <span>{booking.customer?.phoneNumber || "N/A"}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <CalendarIcon className="flex-shrink-0 mr-2 h-4 w-4 text-orange-500" />
                          <span>
                            <span className="font-medium">Ngày hẹn:</span>{" "}
                            {formatDate(booking.desiredDate)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                          <ClockIcon className="flex-shrink-0 mr-2 h-4 w-4 text-purple-500" />
                          <span>
                            <span className="font-medium">Tạo:</span>{" "}
                            {formatDate(booking.dateCreated)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {booking.problemDescription && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong className="text-amber-900">
                            Mô tả vấn đề:
                          </strong>{" "}
                          {booking.problemDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-6">
                    <button
                      onClick={() => handleViewDetail(booking.id)}
                      className="inline-flex items-center px-4 py-2 border border-indigo-200 shadow-sm text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
                    >
                      <EyeIcon className="h-4 w-4 mr-1.5" />
                      Chi tiết
                    </button>

                    {canCompleteBooking(booking.status) && (
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                        Hoàn thành
                      </button>
                    )}

                    {canRejectBooking(booking.status) && (
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1.5" />
                        Từ chối
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile pagination */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: Math.max(prev.currentPage - 1, 1),
                    }))
                  }
                  disabled={pagination.currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Trước
                </button>
                <span className="text-sm text-gray-700 px-4 py-2">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      currentPage: Math.min(
                        prev.currentPage + 1,
                        prev.totalPages
                      ),
                    }))
                  }
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Sau
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>

              {/* Desktop pagination */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị{" "}
                    <span className="font-semibold text-indigo-600">
                      {(pagination.currentPage - 1) * pagination.pageSize + 1}
                    </span>{" "}
                    đến{" "}
                    <span className="font-semibold text-indigo-600">
                      {Math.min(
                        pagination.currentPage * pagination.pageSize,
                        pagination.totalCount
                      )}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-semibold text-indigo-600">
                      {pagination.totalCount}
                    </span>{" "}
                    booking
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: Math.max(prev.currentPage - 1, 1),
                      }))
                    }
                    disabled={pagination.currentPage <= 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = [];
                      const current = pagination.currentPage;
                      const total = pagination.totalPages;

                      // Always show first page
                      if (current > 3) {
                        pages.push(1);
                        if (current > 4) pages.push("...");
                      }

                      // Show pages around current
                      for (
                        let i = Math.max(1, current - 1);
                        i <= Math.min(total, current + 1);
                        i++
                      ) {
                        pages.push(i);
                      }

                      // Always show last page
                      if (current < total - 2) {
                        if (current < total - 3) pages.push("...");
                        pages.push(total);
                      }

                      return pages.map((page, index) => {
                        if (page === "...") {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-3 py-2 text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }

                        return (
                          <button
                            key={page}
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                currentPage: page,
                              }))
                            }
                            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              pagination.currentPage === page
                                ? "z-10 bg-indigo-600 text-white shadow-md"
                                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: Math.min(
                          prev.currentPage + 1,
                          prev.totalPages
                        ),
                      }))
                    }
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto border w-full max-w-md shadow-2xl rounded-2xl bg-white transform transition-all">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Từ chối Booking
                  </h3>
                  <p className="text-sm text-gray-500">
                    Vui lòng cho biết lý do từ chối booking này
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="block w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Ví dụ: Không có thời gian, thiết bị không đầy đủ, khu vực quá xa..."
                />
                <p className="mt-2 text-xs text-gray-500">
                  Lý do này sẽ được gửi đến khách hàng và quản lý.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setSelectedBookingId(null);
                  }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={submitRejectBooking}
                  disabled={!rejectReason.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md hover:shadow-lg"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianBookingsPage;
