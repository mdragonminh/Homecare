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

  const [currentBookings, setCurrentBookings] = useState([]); // Completed bookings
  const [pendingBookings, setPendingBookings] = useState([]); // Pending/need action bookings
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
  }, []);

  useEffect(() => {
    fetchPendingBookings();
  }, [pagination.currentPage, searchTerm, statusFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Fetch all bookings for technician, then filter on frontend
      const allBookings = await bookingApi.getAllBookings(
        1,
        100,
        "",
        "", // No status filter - get all
        "",
        ""
      );

      // Filter active bookings (TechnicianOnTheWay, InProgress, Completed) for left side
      const activeBookings = (allBookings.items || []).filter(
        (booking) =>
          booking.status === BookingStatus.TechnicianOnTheWay ||
          booking.status === BookingStatus.InProgress ||
          booking.status === BookingStatus.Completed
      );

      setCurrentBookings(activeBookings);
    } catch (error) {
      console.error("Error fetching active bookings:", error);
      toast.error("Không thể tải danh sách booking đang thực hiện");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      // Fetch pending/waiting bookings with filters for right side
      const pendingResponse = await bookingApi.getAllBookings(
        pagination.currentPage,
        pagination.pageSize,
        searchTerm,
        statusFilter, // Single status only
        dateFilter.fromDate,
        dateFilter.toDate
      );

      // Filter to only show Pending, Confirmed, Cancelled if no specific status filter
      let filteredBookings = pendingResponse.items || [];
      if (!statusFilter) {
        filteredBookings = filteredBookings.filter(
          (booking) =>
            booking.status === BookingStatus.Pending ||
            booking.status === BookingStatus.Confirmed ||
            booking.status === BookingStatus.Cancelled
        );
      }

      setPendingBookings(filteredBookings);
      setPagination((prev) => ({
        ...prev,
        totalPages: pendingResponse.totalPages || 0,
        totalCount: pendingResponse.totalCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching pending bookings:", error);
      toast.error("Không thể tải danh sách booking cần xử lý");
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

  const handleAcceptBooking = async (bookingId) => {
    if (window.confirm("Bạn có chắc chắn muốn xác nhận booking này?")) {
      try {
        await bookingApi.updateBookingStatus(
          bookingId,
          BookingStatus.Confirmed
        );
        toast.success("Đã xác nhận booking thành công");
        fetchBookings();
        fetchPendingBookings();
      } catch (error) {
        console.error("Error accepting booking:", error);
        toast.error("Không thể xác nhận booking");
      }
    }
  };

  const handleStartWork = async (bookingId) => {
    if (window.confirm("Bạn có chắc chắn muốn bắt đầu công việc này?")) {
      try {
        await bookingApi.updateBookingStatus(
          bookingId,
          BookingStatus.TechnicianOnTheWay
        );
        toast.success("Đã bắt đầu công việc thành công");
        fetchBookings();
        fetchPendingBookings();
      } catch (error) {
        console.error("Error starting work:", error);
        toast.error("Không thể bắt đầu công việc");
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
      fetchPendingBookings();
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

  const getDayOfWeek = (dateString) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const groupBookingsByDay = (bookings) => {
    const grouped = {};
    bookings.forEach((booking) => {
      const day = getDayOfWeek(booking.desiredDate);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(booking);
    });
    return grouped;
  };

  const renderBookingCard = (booking, isPending = false) => {
    return (
      <div
        key={booking.id}
        className="bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow duration-200"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {booking.service?.name || "Dịch vụ không xác định"}
            </h3>
            <div className="text-xs text-gray-500 mb-2">
              {formatTime(booking.desiredDate)} -{" "}
              {formatDate(booking.desiredDate)}
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          <div className="flex items-center mb-1">
            <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
            {booking.customer?.fullName || "Khách hàng"}
          </div>
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2 text-green-500" />
            {booking.customer?.phoneNumber || "N/A"}
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetail(booking.id)}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
          >
            Chi tiết
          </button>

          {isPending ? (
            <>
              {booking.status === BookingStatus.Pending && (
                <button
                  onClick={() => handleAcceptBooking(booking.id)}
                  className="flex-1 px-3 py-2 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
                >
                  Xác nhận
                </button>
              )}
              {canRejectBooking(booking.status) && (
                <button
                  onClick={() => handleRejectBooking(booking.id)}
                  className="flex-1 px-3 py-2 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                  Từ chối
                </button>
              )}
            </>
          ) : (
            <>
              {canCompleteBooking(booking.status) && (
                <button
                  onClick={() => handleCompleteBooking(booking.id)}
                  className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  Hoàn thành
                </button>
              )}
              {booking.status === BookingStatus.Confirmed && (
                <button
                  onClick={() => handleStartWork(booking.id)}
                  className="flex-1 px-3 py-2 text-xs bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200"
                >
                  Bắt đầu
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Booking</h1>
        <p className="text-gray-600">Xem và quản lý các booking được giao</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Schedule - Left Side (Active Bookings) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-600" />
              Current Schedule
            </h2>

            <div className="space-y-4">
              {(() => {
                const groupedCurrent = groupBookingsByDay(currentBookings);
                const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

                return days.map((day) => (
                  <div
                    key={day}
                    className="border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-700">{day}</h3>
                      <span className="text-sm text-gray-500">
                        {groupedCurrent[day]?.length || 0} booking
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupedCurrent[day]?.length > 0 ? (
                        groupedCurrent[day].map((booking) =>
                          renderBookingCard(booking, false)
                        )
                      ) : (
                        <div className="col-span-2 p-4 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                          Không có booking nào
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Available Requests - Right Side */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-orange-600" />
              Available requests
            </h2>

            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">Bộ lọc</h4>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setDateFilter({ fromDate: "", toDate: "" });
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm theo tên dịch vụ, khách hàng..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value={BookingStatus.Pending}>Chờ xử lý</option>
                  <option value={BookingStatus.Confirmed}>Đã xác nhận</option>
                  <option value={BookingStatus.Cancelled}>Đã hủy</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFilter.fromDate}
                  onChange={(e) => handleDateFilter("fromDate", e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="date"
                  value={dateFilter.toDate}
                  onChange={(e) => handleDateFilter("toDate", e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-3">
              {pendingBookings.length > 0 ? (
                pendingBookings.map((booking) =>
                  renderBookingCard(booking, true)
                )
              ) : (
                <div className="p-6 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  Không có booking nào khả dụng
                </div>
              )}
            </div>

            {/* Pagination for Pending Requests */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {pagination.totalCount} booking khả dụng
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
                      className="px-2 py-1 border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all duration-200"
                    >
                      <ChevronLeftIcon className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-gray-700 px-2">
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
                      className="px-2 py-1 border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-all duration-200"
                    >
                      <ChevronRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
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
