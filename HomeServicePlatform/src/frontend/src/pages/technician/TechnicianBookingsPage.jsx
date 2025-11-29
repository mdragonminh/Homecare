import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import {
  BookingStatus,
  BookingStatusLabels,
} from "../../constants/enums";
import { toast } from "sonner";
import {
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const TechnicianBookingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [pendingRequests, setPendingRequests] = useState([]); 
  
  const [historyRequests, setHistoryRequests] = useState([]); 
  
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
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    fetchHistoryRequests();
  }, [pagination.currentPage, searchTerm, statusFilter, dateFilter]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const allBookings = await bookingApi.getAllBookings(
        1,
        100, 
        "",
        "", 
        "",
        ""
      );
      
      const activeSchedule = (allBookings.items || []).filter(
        (booking) => 
          booking.status === BookingStatus.Pending ||
          booking.status === BookingStatus.Confirmed ||
          booking.status === BookingStatus.TechnicianOnTheWay ||
          booking.status === BookingStatus.InProgress
      );
      
      setPendingRequests(activeSchedule);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Không thể tải lịch trình");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryRequests = async () => {
    try {
      const historyResponse = await bookingApi.getAllBookings(
        pagination.currentPage,
        pagination.pageSize,
        searchTerm,
        statusFilter,
        dateFilter.fromDate,
        dateFilter.toDate
      );

      let filteredBookings = historyResponse.items || [];
      if (!statusFilter) {
        filteredBookings = filteredBookings.filter(
          (booking) =>
            booking.status === BookingStatus.Completed ||
            booking.status === BookingStatus.Cancelled
        );
      }

      setHistoryRequests(filteredBookings);
      setPagination((prev) => ({
        ...prev,
        totalPages: historyResponse.totalPages || 0,
        totalCount: historyResponse.totalCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Không thể tải lịch sử booking");
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

  const handleAcceptBooking = async (bookingId) => {
    if (window.confirm("Bạn có chắc chắn muốn nhận booking này?")) {
      try {
        await bookingApi.updateBookingStatus(
          bookingId,
          BookingStatus.Confirmed
        );
        toast.success("Đã nhận booking thành công!");
        await fetchPendingRequests();
      } catch (error) {
        console.error("Error accepting booking:", error);
        toast.error("Không thể xác nhận booking");
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
      toast.success("Đã từ chối booking");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedBookingId(null);
      await Promise.all([fetchPendingRequests(), fetchHistoryRequests()]);
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Không thể từ chối booking");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [BookingStatus.Pending]: { bg: "bg-orange-100", text: "text-orange-800" },
      [BookingStatus.Confirmed]: { bg: "bg-blue-100", text: "text-blue-800" },
      [BookingStatus.TechnicianOnTheWay]: { bg: "bg-indigo-100", text: "text-indigo-800" },
      [BookingStatus.InProgress]: { bg: "bg-purple-100", text: "text-purple-800" },
      [BookingStatus.Completed]: { bg: "bg-green-100", text: "text-green-800" },
      [BookingStatus.Cancelled]: { bg: "bg-red-100", text: "text-red-800" },
    };
    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {BookingStatusLabels[status] || "Không xác định"}
      </span>
    );
  };

  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const formatDayHeader = (dateObj, isToday) => {
    const days = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const dayOfWeek = days[dateObj.getDay()];
    
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    if (isToday) {
      return `${formattedDate} (${dayOfWeek}) (Hôm nay)`;
    }
    return `${formattedDate} (${dayOfWeek})`;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit",
    });
  };

  // Render Card Booking
  const renderBookingCard = (booking, isHistoryColumn = false) => {
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
            <div className="text-xs text-gray-500 mb-2 flex items-center">
               <ClockIcon className="h-3 w-3 mr-1"/>
              {formatTime(booking.desiredDate)} - {formatDate(booking.desiredDate)}
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          <div className="flex items-center mb-1">
            <UserIcon className="h-4 w-4 mr-2 text-blue-500" />
            {booking.customer?.fullName || booking.customerName || "Khách hàng"}
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

          {!isHistoryColumn && booking.status === BookingStatus.Pending && (
            <>
              <button
                onClick={() => handleAcceptBooking(booking.id)}
                className="flex-1 px-3 py-2 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
              >
                Nhận
              </button>
              <button
                onClick={() => handleRejectBooking(booking.id)}
                className="flex-1 px-3 py-2 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
              >
                Từ chối
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Booking</h1>
        <p className="text-gray-600">Xem yêu cầu mới và lịch sử công việc</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-600" />
              Current Schedule
            </h2>

            <div className="space-y-4">
              {(() => {
                const sevenDays = getNextSevenDays();
                
                return sevenDays.map((dateObj, index) => {
                  const isToday = index === 0;
                  const bookingsForDay = pendingRequests.filter(b => isSameDay(b.desiredDate, dateObj));
                  
                  return (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-4 last:border-b-0"
                    >
                      <div className={`flex items-center justify-between mb-3 p-2 rounded ${isToday ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                        <h3 className={`font-bold text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                            {formatDayHeader(dateObj, isToday)}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bookingsForDay.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                          {bookingsForDay.length} yêu cầu
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {bookingsForDay.length > 0 ? (
                          bookingsForDay.map((booking) =>
                            renderBookingCard(booking, false)
                          )
                        ) : (
                          <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-lg">
                            <p className="text-xs text-gray-400">No pending requests</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-gray-600" />
              All requests
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

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 appearance-none"
                >
                  <option value="">Tất cả (Hoàn thành & Đã hủy)</option>
                  <option value={BookingStatus.Completed}>Đã hoàn thành</option>
                  <option value={BookingStatus.Cancelled}>Đã hủy</option>
                </select>
              </div>

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
              {historyRequests.length > 0 ? (
                historyRequests.map((booking) =>
                  renderBookingCard(booking, true)
                )
              ) : (
                <div className="p-6 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                  Không tìm thấy lịch sử phù hợp
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {pagination.totalCount} bản ghi
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
        <div
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          className="fixed inset-0  bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
        >
          <div className="relative mx-auto border w-full max-w-md shadow-2xl rounded-2xl bg-white transform transition-all">
            <div className="p-6">
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

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="block w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Ví dụ: Không có thời gian, thiết bị không đầy đủ..."
                />
              </div>

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