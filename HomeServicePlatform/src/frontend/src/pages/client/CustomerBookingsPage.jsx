import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ClipboardList,
  Calendar,
  CreditCard,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle, 
  Send,
  X
} from "lucide-react";
import { toast } from "sonner";
import { bookingApi } from "../../services/bookingApi";
import { paymentApi, getPaymentStatusText, PaymentStatus } from "../../services/paymentApi";
import { createTicket } from "../../services/ticketApi";
import { BookingStatus } from "../../constants/enums";
import { motion } from "framer-motion";
import StatusFilter from "../../components/StatusFilter";
const CustomerBookingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalCount: 0,
  });

  const [bookingPayments, setBookingPayments] = useState({});

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [selectedBookingForTicket, setSelectedBookingForTicket] = useState(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [isRefundRequested, setIsRefundRequested] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [pagination.currentPage, selectedStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getMyBookings(
        pagination.currentPage,
        pagination.pageSize,
        "",
        selectedStatus,
        null,
        null
      );

      setBookings(response.items || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.totalPages || 0,
        totalCount: response.totalCount || 0,
      }));

      if (response.items && response.items.length > 0) {
        loadPaymentStatuses(response.items);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Không thể tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStatuses = async (bookings) => {
    const paymentPromises = bookings.map(async (booking) => {
      try {
        const result = await paymentApi.getPaymentsByBookingId(booking.id);
        if (result.success && result.data && result.data.length > 0) {
          return { bookingId: booking.id, payment: result.data[0] };
        }
      } catch (error) {
        console.error(`Error loading payment for booking ${booking.id}:`, error);
      }
      return { bookingId: booking.id, payment: null };
    });

    const results = await Promise.all(paymentPromises);
    const paymentsMap = {};
    results.forEach(({ bookingId, payment }) => {
      paymentsMap[bookingId] = payment;
    });
    setBookingPayments(paymentsMap);
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/my-bookings/${bookingId}`);
  };

  const handlePayNow = (bookingId) => {
    navigate(`/payment/${bookingId}`);
  };

  const handleViewPayment = (paymentId) => {
    navigate(`/payment/result/${paymentId}`);
  };

  const openTicketModal = (booking) => {
    setSelectedBookingForTicket(booking);
    setIssueDescription("");
    setIsRefundRequested(false);
    setIsTicketModalOpen(true);
  };

  const closeTicketModal = () => {
    setIsTicketModalOpen(false);
    setSelectedBookingForTicket(null);
    setIssueDescription("");
    setIsRefundRequested(false);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) {
      toast.warning("Vui lòng nhập mô tả sự cố.");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const response = await createTicket({
        bookingId: selectedBookingForTicket.id,
        issueDescription: issueDescription,
        isRefundRequested: isRefundRequested
      });

      if (response.success) {
        toast.success("Đã gửi yêu cầu hỗ trợ thành công!");
        closeTicketModal();
      } else {
        toast.error(response.message || "Gửi yêu cầu thất bại.");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống khi tạo ticket.");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      0: { text: "Chờ xử lý", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      1: { text: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      2: { text: "Đang đến", color: "bg-indigo-100 text-indigo-800", icon: AlertCircle },
      3: { text: "Đang thực hiện", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
      4: { text: "Hoàn thành", color: "bg-green-100 text-green-800", icon: CheckCircle },
      5: { text: "Đã hủy", color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig[0];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    // Parse the date string - if it doesn't have timezone info, treat it as UTC
    let date;
    const dateStr = String(dateString);
    // Check if date string has timezone indicator
    if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/)) {
      // Has timezone info, parse normally
      date = new Date(dateStr);
    } else {
      // No timezone info, assume UTC and append 'Z'
      date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    }
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh"
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount || 0);
  };

  const canPayForBooking = (booking, payment) => {
    const isCompleted = booking.status === BookingStatus.Completed;
    const hasNoCompletedPayment =
      !payment || payment.status !== PaymentStatus.Completed;
    return isCompleted && hasNoCompletedPayment;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ClipboardList className="h-8 w-8 mr-3 text-blue-600" />
            Booking của tôi
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các booking và thanh toán của bạn
          </p>
        </div>

       <div className="mb-8 relative z-30"> {/* Thêm z-30 ở đây */}
  <StatusFilter 
    selectedStatus={selectedStatus} 
    setSelectedStatus={setSelectedStatus} 
    loadBookings={loadBookings} 
    loading={loading} 
  />
</div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Bạn chưa có booking nào</p>
            <button
              onClick={() => navigate("/services")}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm dịch vụ ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const payment = bookingPayments[booking.id];
              const canPay = canPayForBooking(booking, payment);

              return (
                <motion.div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-gray-500">Mã booking</p>
                          <p className="font-mono text-sm font-semibold text-gray-900">
                            {booking.id.substring(0, 8)}...
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {formatDate(booking.desiredDate)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span className="text-sm font-semibold">
                            {formatAmount(
                              (booking.items || []).reduce((sum, item) => sum + item.price, 0) +
                              (booking.equipments || []).reduce((sum, eq) => sum + eq.totalPrice, 0)
                            )} VNĐ
                          </span>
                        </div>
                      </div>

                      {payment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Trạng thái thanh toán:{" "}
                            <span
                              className={`font-semibold ${
                                payment.status === PaymentStatus.Completed
                                  ? "text-green-600"
                                  : payment.status === PaymentStatus.Failed
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {getPaymentStatusText(payment.status)}
                            </span>
                          </p>
                          {payment.paidAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Thanh toán lúc: {formatDate(payment.paidAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {/* Show report button only for Confirmed (1) or Completed (4) status */}
                      {(booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.Completed || booking.status === BookingStatus.InProgress) && (
                        <button
                          onClick={() => openTicketModal(booking)}
                          className="flex items-center justify-center px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span className="leading-tight">Báo cáo sự cố / Hoàn tiền</span>
                        </button>
                      )}

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleViewDetails(booking.id)}
                        className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </motion.button>

                      {/* {payment ? (
                        <button
                          onClick={() => handleViewPayment(payment.id)}
                          className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Xem thanh toán
                        </button>
                      ) : canPay ? (
                        <button
                          onClick={() => handlePayNow(booking.id)}
                          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Thanh toán ngay
                        </button>
                      ) : null} */}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && bookings.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: Math.max(1, prev.currentPage - 1),
                  }))
                }
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-gray-700">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
                  }))
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* MODAL TICKET */}
      {isTicketModalOpen && selectedBookingForTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeTicketModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitTicket}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Báo cáo sự cố / Khiếu nại / Hoàn tiền
                  </h3>
                  <button
                    type="button"
                    onClick={closeTicketModal}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                   <p><strong>Mã Booking:</strong> {selectedBookingForTicket.id}</p>
                   <p><strong>Ngày đặt:</strong> {formatDate(selectedBookingForTicket.desiredDate)}</p>
                </div>

                <div className="mb-4">
                  <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả vấn đề <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="issue"
                    rows={4}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với booking này..."
                    required
                  />
                </div>

                {/* Show refund checkbox only if payment is completed */}
                {bookingPayments[selectedBookingForTicket.id]?.status === PaymentStatus.Completed && (
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRefundRequested}
                        onChange={(e) => setIsRefundRequested(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Yêu cầu hoàn tiền
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmittingTicket ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBookingsPage;