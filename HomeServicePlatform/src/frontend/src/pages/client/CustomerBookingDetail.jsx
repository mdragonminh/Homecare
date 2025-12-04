"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  StarIcon as StarSolid,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { FeedbackModal } from "../../components/feedback/FeedbackModal";

import {
  BookingStatus,
  BookingStatusLabels,
  FeedbackSource,
} from "../../constants/enums";
import { PaymentStatus, getPaymentStatusText } from "../../services/paymentApi";

const getPaymentInfo = (payments) => {
  if (!payments || payments.length === 0) {
    return {
      statusText: "Chưa thanh toán",
      isPaid: false,
    };
  }
  const latestPayment = payments[0];
  const isPaid = latestPayment.status === PaymentStatus.Completed;

  return {
    statusText: getPaymentStatusText(latestPayment.status),
    isPaid: isPaid,
  };
};

const getStatusBadge = (status) => {
  if (status === BookingStatus.Completed) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
};

const formatDateTime = (value) => {
  if (!value) return "Đang cập nhật";
  const dateStr = String(value);
  let date;
  if (dateStr.includes("Z") || dateStr.includes("+") || dateStr.match(/-\d{2}:\d{2}$/)) {
    date = new Date(dateStr);
  } else {
    date = new Date(dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`);
  }
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN").format(value || 0);

export default function CustomerBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const shouldOpenRating = location.state?.openRating;

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.getBookingDetail(id);
      setBooking(data);
    } catch (error) {
      toast.error("Không thể tải chi tiết booking.");
      navigate("/my-bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await bookingApi.createFeedback(booking.id, rating, comment);
      toast.success("Cảm ơn bạn đã đánh giá!");
      setIsFeedbackModalOpen(false);
      fetchBookingDetail();
    } catch (error) {
      const message = error.response?.data?.message || "Đã xảy ra lỗi";
      toast.error(message);
    }
  };

  const paymentInfo = getPaymentInfo(booking?.payments);

  const customerFeedback = booking?.feedbacks?.find(
    (f) => f.source === FeedbackSource.Customer
  );

  const canRateBooking =
    !!booking &&
    (booking.status === BookingStatus.Completed ||
      booking.status === BookingStatus.Confirmed) &&
    paymentInfo.isPaid &&
    !customerFeedback;

  useEffect(() => {
    if (!shouldOpenRating) return;
    if (!booking) return;
    if (!canRateBooking) return;
    setIsFeedbackModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [booking, canRateBooking, navigate, location.pathname, shouldOpenRating]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Không tìm thấy booking.</p>
      </div>
    );
  }

  const primaryPayment =
    booking.payments && booking.payments.length > 0
      ? booking.payments[0]
      : null;

  const displayPrice =
    primaryPayment?.amount ??
    booking.totalPrice ??
    0;
  
  const desiredDateText = formatDateTime(booking.desiredDate);
  const completedDateText = booking.dateCompleted
    ? formatDateTime(booking.dateCompleted)
    : null;
  const serviceItems = booking.items || [];
  const hasServices = serviceItems.length > 0;
  const showCompletionBanner = booking.status === BookingStatus.Completed;
  const showPaymentButton = showCompletionBanner && !paymentInfo.isPaid;
  const shortId = (value) =>
    value ? String(value).substring(0, 8) : "N/A";

  // Calculate total costs
  const serviceTotalPrice = serviceItems.reduce((sum, item) => sum + item.price, 0);
  const equipmentTotalPrice = (booking.equipments || []).reduce(
    (sum, eq) => sum + eq.totalPrice,
    0
  );
  const totalPrice = serviceTotalPrice + equipmentTotalPrice;
  const formattedTotalPrice = formatCurrency(totalPrice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/my-bookings")}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Quay lại Booking của tôi
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chi tiết Booking
          </h1>
        </div>

        {canRateBooking && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                <StarSolid className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {booking.status === BookingStatus.Completed
                    ? "Dịch vụ đã hoàn thành!"
                    : "Dịch vụ đã được xác nhận!"}
                </p>
                <p className="text-sm text-gray-600">
                  Hãy chia sẻ trải nghiệm của bạn
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap ml-4"
            >
              Đánh giá ngay
            </button>
          </div>
        )}

        {showCompletionBanner && (
          <div className="mb-6 border border-emerald-200 bg-emerald-50 rounded-xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">
                  Kỹ thuật viên đã hoàn thành dịch vụ
                </p>
                <p className="text-sm text-emerald-800">
                  {completedDateText
                    ? `Hoàn thành lúc ${completedDateText}`
                    : "Vui lòng xác nhận lại chất lượng trước khi thanh toán."}
                </p>
              </div>
            </div>
            {showPaymentButton && (
              <button
                onClick={() => navigate(`/payment/${booking.id}`)}
                className="inline-flex items-center justify-center px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Thanh toán ngay
              </button>
            )}
          </div>
        )}

        {customerFeedback && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Đánh giá của bạn
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarSolid
                    key={i}
                    className={`h-5 w-5 ${
                      i < customerFeedback.rating
                        ? "text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {customerFeedback.rating}/5
              </span>
            </div>
            {customerFeedback.comment && (
              <p className="text-gray-700 text-sm italic leading-relaxed">
                "{customerFeedback.comment}"
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Technician Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Technician
            </h3>
            <p className="text-xl font-semibold text-gray-900">
              {booking.technicianName || "Chưa có thông tin"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {booking.technicianEmail || "Chưa cập nhật email"}
            </p>
            {booking.technicianPhone && (
              <p className="text-sm text-gray-600">{booking.technicianPhone}</p>
            )}
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booking Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Trạng thái Booking
              </h3>
              <div
                className={`inline-block px-4 py-2 rounded-lg border font-semibold text-sm ${getStatusBadge(
                  booking.status
                )}`}
              >
                {BookingStatusLabels[booking.status] || "Không xác định"}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Trạng thái Thanh toán
              </h3>
              <div
                className={`inline-block px-4 py-2 rounded-lg border font-semibold text-sm ${
                  paymentInfo.isPaid
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {paymentInfo.statusText}
              </div>
              {paymentInfo.isPaid && primaryPayment?.paidAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Đã thanh toán lúc {formatDateTime(primaryPayment.paidAt)}
                </p>
              )}
              {showPaymentButton && (
                <button
                  onClick={() => navigate(`/payment/${booking.id}`)}
                  className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Thanh toán ngay
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Thông tin lịch hẹn
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Mã booking</dt>
                <dd className="font-mono text-gray-900">{booking.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Thời gian hẹn</dt>
                <dd className="text-gray-900">{desiredDateText}</dd>
              </div>
              {completedDateText && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Hoàn thành</dt>
                  <dd className="text-gray-900">{completedDateText}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Trạng thái</dt>
                <dd className="font-semibold text-gray-900">
                  {BookingStatusLabels[booking.status] || "Không xác định"}
                </dd>
              </div>
            </dl>
          </div>

          {hasServices && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Dịch vụ đã chọn
              </h3>
              <ul className="divide-y divide-gray-100">
                {serviceItems.map((item) => (
                  <li
                    key={item.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.serviceName || "Dịch vụ"}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {shortId(item.serviceId || item.id)}...
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price)} VNĐ
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Mô tả dịch vụ
            </h3>
            {hasServices ? (
              <ul className="space-y-4">
                {serviceItems.map((item) => (
                  <li key={item.id} className="border-l-4 border-blue-400 pl-4">
                    <p className="font-semibold text-gray-900 mb-1">
                      {item.serviceName || "Dịch vụ"}
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {item.description || "Không có mô tả cho dịch vụ này"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {booking.problemDescription || "Không có mô tả"}
              </p>
            )}
          </div>

          {/* Equipment Card */}
          {booking.equipments && booking.equipments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Thiết bị sử dụng
              </h3>
              <ul className="divide-y divide-gray-100">
                {booking.equipments.map((equipment) => (
                  <li
                    key={equipment.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {equipment.equipmentName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          Số lượng: {equipment.quantity}
                        </p>
                        <p className="text-xs text-gray-500">
                          Đơn giá: {formatCurrency(equipment.unitPrice)} VNĐ
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(equipment.totalPrice)} VNĐ
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600">
                  Tổng tiền thiết bị
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(
                    booking.equipments.reduce(
                      (sum, eq) => sum + eq.totalPrice,
                      0
                    )
                  )}{" "}
                  VNĐ
                </p>
              </div>
            </div>
          )}

          {/* Price Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Chi tiết thanh toán
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Tiền dịch vụ</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(serviceTotalPrice)} VNĐ
                </span>
              </div>
              {equipmentTotalPrice > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Tiền thiết bị</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(equipmentTotalPrice)} VNĐ
                  </span>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-blue-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Tổng tiền</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formattedTotalPrice}
                  <span className="text-base font-normal text-gray-600 ml-2">
                    VNĐ
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
}
