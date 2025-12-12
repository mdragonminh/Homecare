import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { toast } from "sonner";
import { getFileMetadata } from "../../services/fileApi";
import { EyeIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CameraIcon,
  BanknotesIcon,
  StarIcon as StarSolid,
} from "@heroicons/react/24/solid";
import { FeedbackModal } from "../../components/feedback/FeedbackModal";
import {
  BookingStatus,
  BookingStatusLabels,
  FeedbackSource,
} from "../../constants/enums";
import {
  PaymentStatus,
  getPaymentStatusText,
  BookingEquipmentStatus,
  getEquipmentStatusColor,
  getEquipmentStatusText,
} from "../../services/paymentApi";
import { motion } from "framer-motion";

const FILE_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, "");
const ImageViewerModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen || !imageUrl) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between bg-gray-50">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-2">
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

const getPaymentInfo = (payments) => {
  if (!payments || payments.length === 0)
    return { statusText: "Chưa thanh toán", isPaid: false };
  const servicePayment = payments.find((p) => p.type === 0);
  if (!servicePayment) return { statusText: "Chưa thanh toán", isPaid: false };
  const isPaid = servicePayment.status === PaymentStatus.Completed;
  return { statusText: getPaymentStatusText(servicePayment.status), isPaid };
};

const getStatusBadge = (status) =>
  status === BookingStatus.Completed
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN").format(value || 0);

export default function CustomerBookingDetail() {
  const params = useParams();
  const bookingId = params.id || params.bookingId;
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [checkInProof, setCheckInProof] = useState(null);
  const [checkOutProof, setCheckOutProof] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [currentImageTitle, setCurrentImageTitle] = useState("");

  const fetchFileMetadata = async (id, relationType) => {
    if (!id || !relationType) return null;
    try {
      const metadataResult = await getFileMetadata({
        objectTypeName: "booking",
        objectId: id,
        relationType,
      });
      const fileData =
        Array.isArray(metadataResult) && metadataResult.length > 0
          ? metadataResult[0]
          : null;
      if (
        fileData &&
        (fileData.url ||
          fileData.fullUrl ||
          fileData.filePath ||
          fileData.FilePath)
      )
        return fileData;
      return null;
    } catch {
      return null;
    }
  };

  const fetchBookingDetail = useCallback(async (id) => {
    if (!id || id === "undefined" || id === "null") {
      console.warn("Invalid ID detected, skipping API call:", id);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      if (typeof bookingApi.getBookingDetail !== "function") {
        console.error(
          "bookingApi.getBookingDetail is not a function!",
          bookingApi
        );
        toast.error(
          "Lỗi hệ thống: API client chưa sẵn sàng. Vui lòng tải lại trang."
        );
        return;
      }

      const data = await bookingApi.getBookingDetail(id);
      setBooking(data);
      setCheckInProof(await fetchFileMetadata(id, "CheckInProof"));
      setCheckOutProof(await fetchFileMetadata(id, "CheckOutProof"));
    } catch (error) {
      console.error("Error fetching detail:", error);
      if (error.code !== "ERR_CANCELED") {
        toast.error("Không thể tải chi tiết booking.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetail(bookingId);
    } else {
      console.error("Booking ID not found in URL params. Params:", params);
      setLoading(false);
    }
  }, [bookingId, fetchBookingDetail]);

  const openImageViewer = (fileMetadata) => {
    let imageUrl = fileMetadata.fullUrl || fileMetadata.url;
    const relativePath = fileMetadata.filePath || fileMetadata.FilePath;
    if (!imageUrl && relativePath) {
      let path = relativePath.startsWith("/")
        ? relativePath.substring(1)
        : relativePath;
      imageUrl = `${FILE_BASE_URL}/${path}`;
    }
    if (!imageUrl) {
      toast.error("Không tìm thấy đường dẫn ảnh.");
      return;
    }
    setCurrentImageUrl(imageUrl);
    setCurrentImageTitle(fileMetadata.fileName || "Ảnh đính kèm");
    setIsImageViewerOpen(true);
  };

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await bookingApi.createFeedback(booking.id, rating, comment);
      toast.success("Cảm ơn bạn đã đánh giá!");
      setIsFeedbackModalOpen(false);
      fetchBookingDetail(booking.id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  if (!booking)
    return (
      <div className="flex justify-center items-center h-screen flex-col gap-4">
        <p className="text-lg text-gray-600">
          Không tìm thấy thông tin booking.
        </p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => navigate("/my-bookings")}
        >
          <ArrowLeftIcon className="h-4 w-4 inline mr-2" /> Quay lại danh sách
        </button>
      </div>
    );

  const paymentInfo = getPaymentInfo(booking.payments);

  const equipments = booking.equipments || [];
  const unpaidEquipments = equipments.filter(
    (e) => e.status === BookingEquipmentStatus.Submitted
  );
  const unpaidEquipmentSubtotal = unpaidEquipments.reduce(
    (sum, e) => sum + e.totalPrice,
    0
  );
  const shippingFee = unpaidEquipments.length > 0 ? 50000 : 0;
  const unpaidEquipmentTotal = unpaidEquipmentSubtotal + shippingFee;

  // Calculate service price
  const servicePrice = (booking.items || []).reduce(
    (sum, item) => sum + item.price,
    0
  );

  // Group equipment by payment to show shipping fees
  const equipmentPayments = booking.payments?.filter((p) => p.type === 1) || [];
  const equipmentsByPayment = equipmentPayments.map((payment) => {
    const paymentEquipments = equipments.filter(
      (eq) => eq.paymentId === payment.id
    );
    return {
      payment,
      equipments: paymentEquipments,
      subtotal: paymentEquipments.reduce((sum, eq) => sum + eq.totalPrice, 0),
      shippingFee: payment.shippingFee || 0,
      total: payment.amount,
    };
  });

  const handlePayEquipments = () => {
    navigate(`/payment/${booking.id}`, {
      state: {
        paymentType: "equipment",
        items: unpaidEquipments,
      },
    });
  };

  const showCompletionBanner = booking.status === BookingStatus.InProgress;
  const showServicePaymentButton = showCompletionBanner && !paymentInfo.isPaid;
  const formattedTotalPrice = formatCurrency(booking.totalPrice);

  const canRateBooking =
    booking.status === BookingStatus.Completed && !booking.feedbackId;
  const canOpenChat =
    booking.status >= BookingStatus.Confirmed &&
    booking.status !== BookingStatus.Cancelled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="mb-8">
          <button
            onClick={() => navigate("/my-bookings")}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Quay lại Booking của tôi
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Chi tiết Booking
            </h1>
          </div>
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
                  Vui lòng xác nhận lại chất lượng trước khi thanh toán.
                </p>
              </div>
            </div>
            {showServicePaymentButton && (
              <button
                onClick={() => navigate(`/payment/${booking.id}`)}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                Thanh toán Dịch vụ
              </button>
            )}
          </div>
        )}

        {unpaidEquipments.length > 0 && (
          <div className="mb-6 border border-amber-200 bg-amber-50 rounded-xl p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-pulse-slow">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <BanknotesIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  Có vật tư phát sinh cần thanh toán
                </p>
                <p className="text-sm text-amber-800">
                  Bạn có {unpaidEquipments.length} mục vật tư mới (
                  {formatCurrency(unpaidEquipmentSubtotal)} đ + phí ship{" "}
                  {formatCurrency(shippingFee)} đ ={" "}
                  {formatCurrency(unpaidEquipmentTotal)} VNĐ).
                </p>
              </div>
            </div>
            <button
              onClick={handlePayEquipments}
              className="px-5 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 shadow-sm whitespace-nowrap"
            >
              Thanh toán Vật tư
            </button>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Trạng thái Booking
              </h3>
              <div
                className={`inline-flex px-4 py-2 rounded-lg border font-semibold text-sm ${getStatusBadge(
                  booking.status
                )}`}
              >
                {BookingStatusLabels[booking.status]}
              </div>
            </div>
            {canOpenChat && (
              <button
                onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Chat với KTV
              </button>
            )}
          </div>
        </div>

        {/* Ảnh bằng chứng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {checkInProof && (
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <CameraIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-700">
                    Ảnh Check-in
                  </p>
                  <p className="text-xs text-gray-500">KTV đã đến nơi</p>
                </div>
              </div>
              <button
                onClick={() => openImageViewer(checkInProof)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <EyeIcon className="h-4 w-4" /> Xem
              </button>
            </div>
          )}
          {checkOutProof && (
            <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-700">
                    Ảnh Hoàn thành
                  </p>
                  <p className="text-xs text-gray-500">Công việc kết thúc</p>
                </div>
              </div>
              <button
                onClick={() => openImageViewer(checkOutProof)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <EyeIcon className="h-4 w-4" /> Xem
              </button>
            </div>
          )}
        </div>

        {/* Service Price Panel */}
        {booking.items && booking.items.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Dịch vụ
              </h3>
              <div
                className={`inline-flex px-3 py-1 rounded-lg border font-semibold text-xs ${
                  paymentInfo.isPaid
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {paymentInfo.statusText}
              </div>
            </div>
            <ul className="divide-y divide-gray-100">
              {booking.items.map((item, index) => (
                <li
                  key={index}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {item.serviceName}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.price)} VNĐ
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm font-medium text-gray-600">
                Tổng tiền dịch vụ
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(servicePrice)} VNĐ
              </p>
            </div>
          </div>
        )}

        {/* Equipment List */}
        {booking.equipments && booking.equipments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
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
                        SL: {equipment.quantity} x{" "}
                        {formatCurrency(equipment.unitPrice)}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${getEquipmentStatusColor(
                          equipment.status
                        )}`}
                      >
                        {getEquipmentStatusText(equipment.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(equipment.totalPrice)} VNĐ
                  </p>
                </li>
              ))}
            </ul>

            {/* Show shipping fees for paid equipment */}
            {equipmentsByPayment.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                {equipmentsByPayment.map((ep, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">
                        Tiền thiết bị (Đơn {idx + 1})
                      </p>
                      <p className="text-gray-900">
                        {formatCurrency(ep.subtotal)} VNĐ
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-gray-600">Phí vận chuyển</p>
                      <p className="text-gray-900">
                        {formatCurrency(ep.shippingFee)} VNĐ
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <p className="text-gray-700">Tổng đơn {idx + 1}</p>
                      <p className="text-gray-900">
                        {formatCurrency(ep.total)} VNĐ
                      </p>
                    </div>
                    {idx < equipmentsByPayment.length - 1 && (
                      <div className="border-t border-gray-100 my-2"></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t-2 border-gray-300 flex justify-between items-center">
              <p className="text-sm font-medium text-gray-600">
                Tổng tiền thiết bị
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(
                  booking.equipments.reduce(
                    (sum, eq) => sum + eq.totalPrice,
                    0
                  ) +
                    equipmentsByPayment.reduce(
                      (sum, ep) => sum + ep.shippingFee,
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
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Tổng chi phí
          </h3>
          <div className="space-y-3">
            {booking.items && booking.items.length > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">Dịch vụ</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(servicePrice)} VNĐ
                </p>
              </div>
            )}
            {booking.equipments && booking.equipments.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">Thiết bị</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      booking.equipments.reduce(
                        (sum, eq) => sum + eq.totalPrice,
                        0
                      )
                    )}{" "}
                    VNĐ
                  </p>
                </div>
                {equipmentsByPayment.reduce(
                  (sum, ep) => sum + ep.shippingFee,
                  0
                ) > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-700">Phí vận chuyển</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        equipmentsByPayment.reduce(
                          (sum, ep) => sum + ep.shippingFee,
                          0
                        )
                      )}{" "}
                      VNĐ
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="pt-3 mt-3 border-t border-blue-300">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Tổng cộng</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(
                  servicePrice +
                    booking.equipments.reduce(
                      (sum, eq) => sum + eq.totalPrice,
                      0
                    ) +
                    equipmentsByPayment.reduce(
                      (sum, ep) => sum + ep.shippingFee,
                      0
                    )
                )}
                <span className="text-base font-normal text-gray-600 ml-2">
                  VNĐ
                </span>
              </p>
            </div>
          </div>
        </div>

        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
        />
        <ImageViewerModal
          isOpen={isImageViewerOpen}
          onClose={() => setIsImageViewerOpen(false)}
          imageUrl={currentImageUrl}
          title={currentImageTitle}
        />
      </motion.div>
    </div>
  );
}
