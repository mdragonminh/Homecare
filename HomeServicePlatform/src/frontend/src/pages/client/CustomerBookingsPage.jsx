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
import { paymentApi, getPaymentStatusText, PaymentStatus, BookingEquipmentStatus } from "../../services/paymentApi";
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
          // Get service payment (type === 0) for payment status display
          const servicePayment = result.data.find(p => p.type === 0) || result.data[0];
          // Store all payments for shipping fee calculation
          return { bookingId: booking.id, payment: servicePayment, allPayments: result.data };
        }
      } catch (error) {
        console.error(`Error loading payment for booking ${booking.id}:`, error);
      }
      return { bookingId: booking.id, payment: null, allPayments: [] };
    });

    const results = await Promise.all(paymentPromises);
    const paymentsMap = {};
    results.forEach(({ bookingId, payment, allPayments }) => {
      paymentsMap[bookingId] = { servicePayment: payment, allPayments: allPayments || [] };
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
      0: { text: "Chờ xử lý", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
      1: { text: "Đã xác nhận", color: "bg-sky-50 text-sky-700 border-sky-200", icon: CheckCircle },
      2: { text: "Đang đến", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: AlertCircle },
      3: { text: "Đang thực hiện", color: "bg-violet-50 text-violet-700 border-violet-200", icon: AlertCircle },
      4: { text: "Hoàn thành", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
      5: { text: "Đã hủy", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig[0];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${config.color}`}>
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    let date;
    const dateStr = String(dateString);
    if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/)) {
      date = new Date(dateStr);
    } else {
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

  const calculateTotalPrice = (booking, paymentData) => {
    // Calculate service price
    const servicePrice = (booking.items || []).reduce((sum, item) => sum + item.price, 0);
    
    // Calculate equipment price
    const equipmentPrice = (booking.equipments || []).reduce((sum, eq) => sum + eq.totalPrice, 0);
    
    // Calculate shipping fees from equipment payments (type === 1)
    // Merge payments from both sources to ensure we don't miss any
    let allPayments = [];
    
    // Add payments from booking object (if API returns it)
    if (booking.payments && Array.isArray(booking.payments)) {
      allPayments = [...booking.payments];
    }
    
    // Add payments from paymentData (merge to avoid duplicates)
    if (paymentData && paymentData.allPayments && Array.isArray(paymentData.allPayments)) {
      paymentData.allPayments.forEach(payment => {
        // Only add if not already in allPayments (check by id)
        if (!allPayments.find(p => p.id === payment.id)) {
          allPayments.push(payment);
        }
      });
    }
    
    // Calculate shipping fee from equipment payments
    // Method 1: Sum shipping fees from all equipment payments (type === 1)
    const equipmentPayments = allPayments.filter(p => p.type === 1);
    let shippingFee = equipmentPayments.reduce((sum, p) => sum + (p.shippingFee || 0), 0);
    
    // Method 2: Also check equipment paymentIds to ensure we don't miss any
    // This handles cases where payment might not be in allPayments but equipment has paymentId
    const paidEquipments = (booking.equipments || []).filter(
      (e) => e.paymentId && e.status !== BookingEquipmentStatus.Submitted
    );
    const equipmentPaymentIds = [...new Set(paidEquipments.map(e => e.paymentId))];
    equipmentPaymentIds.forEach(paymentId => {
      // Find payment by id (could be type 1 or other type)
      const payment = allPayments.find(p => p.id === paymentId);
      if (payment && payment.type === 1 && payment.shippingFee) {
        // Check if already included
        const alreadyIncluded = equipmentPayments.some(p => p.id === paymentId);
        if (!alreadyIncluded) {
          shippingFee += payment.shippingFee;
        }
      }
    });
    
    // Add shipping fee for unpaid equipment (if any)
    const unpaidEquipments = (booking.equipments || []).filter(
      (e) => e.status === BookingEquipmentStatus.Submitted
    );
    if (unpaidEquipments.length > 0) {
      shippingFee += 50000; // Shipping fee for unpaid equipment order
    }
    
    return servicePrice + equipmentPrice + shippingFee;
  };

  const getStatusThemeColor = (status) => {
    const colors = {
      0: "border-l-amber-400",
      1: "border-l-sky-500",
      2: "border-l-indigo-500",
      3: "border-l-violet-500",
      4: "border-l-emerald-500",
      5: "border-l-rose-500",
    };
    return colors[status] || "border-l-gray-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-3xl z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-100/20 blur-3xl z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl shadow-blue-200/50 text-white">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
              <ClipboardList className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight tracking-wide">
                Booking của tôi
              </h1>
              <p className="text-blue-100 mt-1 font-medium opacity-90">
                Quản lý các lịch trình và theo dõi tiến độ dịch vụ của bạn
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 relative z-30">
          <StatusFilter 
            selectedStatus={selectedStatus} 
            setSelectedStatus={setSelectedStatus} 
            loadBookings={loadBookings} 
            loading={loading} 
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-blue-600 font-semibold animate-pulse">Đang tải dữ liệu...</p>
          </div>
        ) : bookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-xl font-medium">Bạn chưa có booking nào</p>
            <button
              onClick={() => navigate("/services")}
              className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
            >
              Tìm dịch vụ ngay
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const paymentData = bookingPayments[booking.id];
              const payment = paymentData?.servicePayment;
              const themeColorClass = getStatusThemeColor(booking.status);
              const totalPrice = calculateTotalPrice(booking, paymentData);

              return (
                <motion.div
                  key={booking.id}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-[6px] ${themeColorClass} p-6 hover:shadow-md transition-all group`}
                  whileHover={{ x: 5 }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(booking.status)}
                            <div className="flex items-center text-gray-500 text-xs ml-1">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              <span className="font-medium">{formatDate(booking.desiredDate)}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                            #{booking.id.substring(0, 8)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                          <div className="flex items-center text-blue-700 mb-1">
                            <CreditCard className="h-3.5 w-3.5 mr-2" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Tổng chi phí</span>
                          </div>
                          <p className="text-xl font-black text-blue-900">
                            {formatAmount(totalPrice)} <small className="text-sm font-normal">VNĐ</small>
                          </p>
                        </div>

                        {payment && (
                          <div className={`p-4 rounded-2xl border ${
                            payment.status === PaymentStatus.Completed 
                            ? "bg-emerald-50/50 border-emerald-100/50" 
                            : "bg-amber-50/50 border-amber-100/50"
                          }`}>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-tighter">Trạng thái thanh toán</p>
                            <div className="flex items-center gap-2">
                               <div className={`w-1.5 h-1.5 rounded-full ${payment.status === PaymentStatus.Completed ? "bg-emerald-500" : "bg-amber-500"}`} />
                               <span className={`font-bold text-sm ${payment.status === PaymentStatus.Completed ? "text-emerald-700" : "text-amber-700"}`}>
                                 {getPaymentStatusText(payment.status)}
                               </span>
                            </div>
                            {payment.paidAt && (
                              <p className="text-[10px] text-gray-400 mt-1 italic leading-none">
                                Lúc: {formatDate(payment.paidAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-3 shrink-0">
                      <button
                        onClick={() => handleViewDetails(booking.id)}
                        className="flex-1 lg:w-44 flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:border-blue-500 hover:text-blue-600 hover:shadow-sm transition-all"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </button>

                      {(booking.status === BookingStatus.Confirmed || 
                        booking.status === BookingStatus.Completed || 
                        booking.status === BookingStatus.InProgress) && (
                        <button
                          onClick={() => openTicketModal(booking)}
                          className="flex-1 lg:w-44 flex items-center justify-center px-4 py-2.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-xl font-bold hover:bg-orange-100 transition-all shadow-sm shadow-orange-100/50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Hỗ trợ / Báo lỗi
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && bookings.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <nav className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: Math.max(1, prev.currentPage - 1),
                  }))
                }
                disabled={pagination.currentPage === 1}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <div className="flex items-center px-4">
                <span className="text-sm font-bold text-gray-400 mr-1">Trang</span>
                <span className="text-sm font-black text-blue-600">{pagination.currentPage}</span>
                <span className="text-sm font-bold text-gray-400 mx-1">/</span>
                <span className="text-sm font-bold text-gray-600">{pagination.totalPages}</span>
              </div>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
                  }))
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </nav>
          </div>
        )}
      </div>

      {isTicketModalOpen && selectedBookingForTicket && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={closeTicketModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmitTicket}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    Báo cáo sự cố
                  </h3>
                  <button
                    type="button"
                    onClick={closeTicketModal}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                   <p className="flex justify-between mb-1">
                     <span className="font-medium text-gray-400 uppercase text-[10px]">Mã Booking:</span> 
                     <span className="font-mono font-bold text-blue-600">{selectedBookingForTicket.id.substring(0, 12)}...</span>
                   </p>
                   <p className="flex justify-between">
                     <span className="font-medium text-gray-400 uppercase text-[10px]">Ngày đặt:</span> 
                     <span className="font-bold">{formatDate(selectedBookingForTicket.desiredDate)}</span>
                   </p>
                </div>

                <div className="mb-5">
                  <label htmlFor="issue" className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    Mô tả vấn đề <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="issue"
                    rows={4}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                    placeholder="Vui lòng mô tả chi tiết vấn đề..."
                    required
                  />
                </div>

                {bookingPayments[selectedBookingForTicket.id]?.servicePayment?.status === PaymentStatus.Completed && (
                  <div className="mb-2">
                    <label className="flex items-center p-3 rounded-xl bg-blue-50/50 border border-blue-100 cursor-pointer group transition-colors hover:bg-blue-50">
                      <input
                        type="checkbox"
                        checked={isRefundRequested}
                        onChange={(e) => setIsRefundRequested(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm font-bold text-blue-800">
                        Yêu cầu hoàn tiền
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-5 flex gap-3">
                <button
                  type="button"
                  onClick={closeTicketModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-sm font-bold rounded-xl text-gray-600 bg-white hover:bg-gray-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  {isSubmittingTicket ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSubmittingTicket ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CustomerBookingsPage;