// CustomerBookingDetail.jsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Thêm useCallback
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { toast } from "sonner";
import { getFileMetadata } from "../../services/fileApi";
import { EyeIcon } from "@heroicons/react/24/outline";
import {
  ArrowLeftIcon,
  StarIcon as StarSolid,
  CheckCircleIcon,
  CameraIcon // Thêm CameraIcon nếu cần thiết cho tiêu đề
} from "@heroicons/react/24/solid";
import { FeedbackModal } from "../../components/feedback/FeedbackModal";

import {
  BookingStatus,
  BookingStatusLabels,
  FeedbackSource,
} from "../../constants/enums";
import { PaymentStatus, getPaymentStatusText } from "../../services/paymentApi";

// --- START: CUSTOM COMPONENTS (ImageViewerModal) ---

/**
 * Component Modal đơn giản để xem ảnh kích thước lớn.
 */
const FILE_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
const ImageViewerModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all animate-fade-in-scale-up">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800 truncate">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 transition-colors rounded-full"
            title="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-2 flex justify-center items-center w-full h-full">
          <img 
            src={imageUrl} 
            alt={title} 
            // Giữ ảnh nằm trong khung hình và không bị kéo dãn
            className="max-w-full max-h-[80vh] h-auto object-contain rounded-lg" 
          />
        </div>
      </div>
    </div>
  );
};

// --- END: CUSTOM COMPONENTS ---


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
  // Lấy ID từ URL
  const { id } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // XÓA DÒNG NÀY: const { bookingId } = useParams(); // <-- DÒNG BỊ LỖI
  
  // --- STATES CHO PHOTO PROOF ---
  const [checkInProof, setCheckInProof] = useState(null); // Metadata ảnh Check-in
  const [checkOutProof, setCheckOutProof] = useState(null); // Metadata ảnh Check-out
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageTitle, setCurrentImageTitle] = useState('');
  // ------------------------------------

  const shouldOpenRating = location.state?.openRating;

const fetchFileMetadata = async (bookingId, relationType) => { 
    if (!bookingId || !relationType) return null; 
    const objectTypeName = 'booking'; 
    
    try {
      const metadataResult = await getFileMetadata({ 
        objectTypeName, 
        objectId: bookingId, 
        relationType, 
      });
      
      // 💡 BƯỚC DEBUG: Log kết quả thô để xác định tên trường
      console.log(`[File API Success] Dữ liệu thô cho ${relationType}:`, metadataResult); 
      
      // 1. Logic trích xuất đơn giản (vẫn giữ nguyên)
      const fileData = Array.isArray(metadataResult) && metadataResult.length > 0
          ? metadataResult[0]
          : null;

      // 2. 💡 SỬA: Ưu tiên kiểm tra 'filePath' (camelCase)
      if (fileData && (fileData.url || fileData.fullUrl || fileData.filePath || fileData.FilePath)) { 
        console.log(`[File Data Found] ${relationType}:`, fileData); // Log object metadata đã trích xuất
        return fileData; 
      }
      
      // Nếu không có dữ liệu hoặc không có đường dẫn
      return null;
    } catch (error) {
       console.error(`Lỗi khi lấy file ${relationType} cho booking ${bookingId}:`, error);
       return null; 
    }
};
  
  // Dùng useCallback để tránh lỗi linting và tối ưu hiệu suất
  const fetchBookingDetail = useCallback(async (bookingId) => {
    // 🚨 BƯỚC SỬA LỖI: Kiểm tra bookingId
    if (!bookingId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const data = await bookingApi.getBookingDetail(bookingId); // Dùng bookingId
      setBooking(data);
      
      // GỌI API ĐỂ LẤY THÔNG TIN ẢNH (ASYNC)
      // Truyền bookingId vào fetchFileMetadata
      const checkInMeta = await fetchFileMetadata(bookingId, 'CheckInProof');
      const checkOutMeta = await fetchFileMetadata(bookingId, 'CheckOutProof');
      
      setCheckInProof(checkInMeta);
      setCheckOutProof(checkOutMeta);

    } catch (error) {
      toast.error("Không thể tải chi tiết booking.");
      // Chỉ chuyển hướng nếu lỗi nghiêm trọng, không phải lỗi file metadata
      // navigate("/my-bookings"); 
    } finally {
      setLoading(false);
    }
  }, []); // Thêm dependencies nếu cần (hiện tại không cần vì dùng bookingId từ tham số)


  useEffect(() => {
    if (id) {
        fetchBookingDetail(id); // Truyền 'id' từ useParams vào hàm
    }
  }, [id, fetchBookingDetail]); // Dependency là 'id' và hàm fetchBookingDetail

  // --- HÀM XỬ LÝ MỞ MODAL ẢNH ---
 const openImageViewer = (fileMetadata) => {
    // 1. Ưu tiên các trường URL đầy đủ (url, fullUrl)
    let imageUrl = fileMetadata.fullUrl || fileMetadata.url; 
    
    // 2. Nếu không có URL đầy đủ, kiểm tra FilePath/filePath và tạo URL
    const relativePath = fileMetadata.filePath || fileMetadata.FilePath; // Kiểm tra cả 2 case
    
    if (!imageUrl && relativePath) {
        let path = relativePath;
        
        // Đảm bảo path bắt đầu bằng '/' nhưng không bị trùng (Base URL không có / cuối cùng)
        if (path.startsWith('/')) {
            path = path.substring(1); // Loại bỏ '/' đầu tiên
        }
        
        // Tạo Full URL bằng cách nối Base URL và Path
        // Nếu API/Server yêu cầu phải có một tiền tố (ví dụ: '/file-storage/'), bạn cần thêm vào đây.
        // Giả sử FilePath là đường dẫn từ gốc server (VD: 'uploads/2025/photo.jpg')
        imageUrl = `${FILE_BASE_URL}/${path}`; 
    }
    
    // 💡 BƯỚC DEBUG CỰC KỲ QUAN TRỌNG
    console.log("Final Image URL:", imageUrl); 
    
    if (!imageUrl) {
        toast.error("Không tìm thấy đường dẫn ảnh để hiển thị.");
        return; // Thoát khỏi hàm nếu URL vẫn không hợp lệ
    }
    
    // 3. Gán state và mở modal
    setCurrentImageUrl(imageUrl);
    setCurrentImageTitle(fileMetadata.fileName || "Ảnh đính kèm"); // Dùng fileName thay vì title
    setIsImageViewerOpen(true); // <-- Đây là dòng mở modal
};
  // --------------------------------

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await bookingApi.createFeedback(booking.id, rating, comment);
      toast.success("Cảm ơn bạn đã đánh giá!");
      setIsFeedbackModalOpen(false);
      fetchBookingDetail(booking.id); // Gọi lại fetchDetail sau khi đánh giá
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
        
        {/* --- PHẦN MỚI: HIỂN THỊ HÌNH ẢNH MINH CHỨNG (Proof Photos) --- */}
        {(checkInProof || checkOutProof) && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-3 flex items-center">
              <CameraIcon className="w-5 h-5 mr-2 text-gray-600"/> Ảnh minh chứng công việc
            </h3>
            <div className="space-y-4">
              
              {/* Ảnh Check-in */}
              {checkInProof && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 text-blue-600 mr-3" />
                    <p className="font-medium text-blue-800">Ảnh **Check-in** tại địa điểm</p>
                  </div>
                  <button
                    onClick={() => openImageViewer(checkInProof)} // Truyền metadata vào
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Xem ảnh Check-in"
                  >
                    <EyeIcon className="w-6 h-6" />
                  </button>
                </div>
              )}
              
              {/* Ảnh Check-out (Hoàn thành) */}
              {checkOutProof && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                    <p className="font-medium text-green-800">Ảnh **Hoàn thành** công việc</p>
                  </div>
                  <button
                    onClick={() => openImageViewer(checkOutProof)} // Truyền metadata vào
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors flex items-center justify-center shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="Xem ảnh Hoàn thành"
                  >
                    <EyeIcon className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* --- KẾT THÚC PHẦN ẢNH MINH CHỨNG --- */}


        <div className="grid grid-cols-1 gap-4">
          {/* Technician Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
  
  {/* Container chính sử dụng Flexbox để căn chỉnh thông tin và nút */}
  <div className="flex justify-between items-start">
    
    {/* Phần chứa thông tin Kỹ thuật viên (Phần bên trái) */}
    <div className="flex-grow"> 
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

    {/* Phần chứa nút Chat (Phần bên phải) */}
    <div className="ml-4 flex-shrink-0"> 
      <button
        // Mở tab mới
        onClick={() => window.open(`/chat`, '_blank')}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
        title="Chat với Kỹ thuật viên (Mở tab mới)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.772 9.772 0 01-6.75-2.884l-.88.66A.75.75 0 013 18.25V18a10.5 10.5 0 01-2.25-6c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        Chat
      </button>
    </div>
    
  </div>
</div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booking Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Trạng thái Booking
              </h3>
              <div
                className={`inline-flex px-4 py-2 rounded-lg border font-semibold text-sm ${getStatusBadge(
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div
                    className={`inline-flex px-4 py-2 rounded-lg border font-semibold text-sm ${
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
                </div>
              </div>
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
      
      {/* --- RENDER IMAGE VIEWER MODAL --- */}
      <ImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        imageUrl={currentImageUrl}
        title={currentImageTitle}
      />
    </div>
  );
}