import React, { useState, useEffect, useCallback } from "react"; // Thêm useCallback
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { equipmentApi } from "../../services/equipmentApi";
import { uploadFile } from "../../services/fileApi"; // Import hàm upload file (Giả định path đúng)
import { BookingStatus, BookingStatusLabels, FeedbackSource } from "../../constants/enums";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  PlusCircleIcon,
  TrashIcon,
  TagIcon,
  QrCodeIcon,
  ExclamationTriangleIcon,
  CameraIcon, // Icon mới
  CheckCircleIcon // Icon mới
} from "@heroicons/react/24/outline";
import { FeedbackModal } from "../../components/feedback/FeedbackModal";
import { PaymentStatus } from "../../services/paymentApi";

// --- START: CUSTOM HOOKS/COMPONENTS FOR NEW FEATURE ---

// Giả lập lưu trữ trạng thái Check-in cục bộ 
// Chỉ dùng để đánh dấu bước Check-in đã hoàn thành (không còn cần cho Check-out)
const getCheckStatus = (bookingId, type) => {
  return localStorage.getItem(`booking_${bookingId}_${type}`) === 'true';
};

const setCheckStatus = (bookingId, type, status) => {
  localStorage.setItem(`booking_${bookingId}_${type}`, status); // Lưu 'true'/'false'
};

// Component Modal cho việc Upload ảnh
const UploadPhotoModal = ({ isOpen, onClose, onUpload, uploadType }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Sửa tiêu đề cho Check-out
  const title = uploadType === 'CheckIn' ? 'Check-in: Gửi ảnh đến nơi' : 'Hoàn thành: Gửi ảnh công việc';

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      return toast.warning("Vui lòng chọn một tệp ảnh.");
    }
    setUploading(true);
    try {
      await onUpload(file, uploadType);
      // Thông báo thành công được chuyển vào handleUploadProof để đồng bộ với status update
      // onClose() được gọi trong handleUploadProof nếu thành công
    } catch (error) {
      console.error("Upload error details:", error.response?.data);
      toast.error(`Lỗi khi ${uploadType === 'CheckIn' ? 'Check-in' : 'Hoàn thành'}: ${error.response?.data?.message || error.message || "Không thể tải lên tệp"}`);
    } finally {
      setUploading(false);
      setFile(null); // Reset file sau khi submit
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-100 animate-scale-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <CameraIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          
          <p className="text-gray-600 mb-4 leading-relaxed text-sm">
            {uploadType === 'CheckIn' 
                ? "Vui lòng chụp ảnh chứng minh bạn đã đến địa điểm và bắt đầu công việc."
                : "Vui lòng chụp ảnh công việc đã hoàn thành để khách hàng xác nhận."
            }
          </p>

          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          {file && (
             <p className="mt-2 text-sm text-gray-700">Đã chọn: **{file.name}**</p>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => { onClose(); setFile(null); }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
              disabled={uploading}
            >
              Hủy bỏ
            </button>
            <button 
              onClick={handleSubmit}
              disabled={uploading || !file}
              className={`px-4 py-2 text-white rounded-md font-medium shadow-sm transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-offset-1
                ${uploading || !file 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
            >
              {uploading ? 'Đang tải lên...' : 'Gửi ảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- END: CUSTOM HOOKS/COMPONENTS FOR NEW FEATURE ---


const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NEW STATES FOR CHECK-IN/OUT ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  // const [isCheckedOut, setIsCheckedOut] = useState(false); // ĐÃ LOẠI BỎ
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState(''); // 'CheckIn' or 'CheckOut'
  // ------------------------------------

  const [equipments, setEquipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    content: "",
    isDanger: false,
    onConfirm: null
  });

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    d.setHours(d.getHours() + 7);
    return d.toLocaleString("vi-VN");
  };

  const fetchBookingDetail = async () => {
    try {
      const res = await bookingApi.getBookingDetail(id);
      setBooking(res);
      // Load trạng thái check-in từ localStorage
      setIsCheckedIn(getCheckStatus(id, 'CheckIn'));
      // setIsCheckedOut(getCheckStatus(id, 'CheckOut')); // ĐÃ LOẠI BỎ
      if (loading) setLoading(false);
    } catch {
      toast.error("Không thể tải chi tiết booking");
      navigate("/technician/bookings");
      setLoading(false);
    }
  };

  const handleSearchEquipment = async (term) => {
    try {
      setIsSearching(true);
      const res = await equipmentApi.getEquipmentForTech({
        PageNumber: 1,
        PageSize: 10,
        SearchTerm: term
      });
      if (res.success) {
        setEquipments(res.data?.items || res.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        handleSearchEquipment(searchTerm);
      } else {
        setEquipments([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddEquipment = async () => {
    if (!selectedEquipment) return toast.warning("Vui lòng chọn thiết bị");
    if (quantity <= 0) return toast.warning("Số lượng phải lớn hơn 0");

    try {
      await bookingApi.addEquipment(id, {
        equipmentId: selectedEquipment.id,
        quantity: parseInt(quantity)
      });
      
      toast.success("Đã thêm thiết bị thành công");
      setSelectedEquipment(null);
      setQuantity(1);
      setSearchTerm("");
      fetchBookingDetail(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm thiết bị");
    }
  };

  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
  
  const openConfirm = ({ title, content, isDanger, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      content,
      isDanger,
      onConfirm: async () => {
        await onConfirm();
        closeConfirm();
      }
    });
  };
  
  const onRemoveEquipmentClick = (bookingEquipmentId) => {
    openConfirm({
      title: "Xóa thiết bị",
      content: "Bạn có chắc chắn muốn xóa thiết bị này khỏi đơn hàng? Số lượng sẽ được hoàn trả về kho.",
      isDanger: true,
      onConfirm: async () => {
        try {
          await bookingApi.removeEquipment(id, bookingEquipmentId);
          toast.success("Đã xóa thiết bị");
          fetchBookingDetail();
        } catch (error) {
          toast.error(error.response?.data?.message || "Lỗi khi xóa");
        }
      }
    });
  };

  // Logic mới: Mở Modal Upload Ảnh cho hành động Hoàn thành
  const onCompleteBookingClick = () => {
    setUploadType('CheckOut'); 
    setIsUploadModalOpen(true);
  };

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await bookingApi.createFeedback(id, rating, comment);
      toast.success("Đã gửi đánh giá thành công");
      setIsFeedbackModalOpen(false);
      fetchBookingDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể gửi đánh giá");
      throw error; // Re-throw để FeedbackModal có thể xử lý
    }
  };

  const onRejectBookingClick = () => {
    openConfirm({
      title: "Từ chối Booking",
      content: "Bạn có chắc muốn từ chối booking này? Hệ thống sẽ chuyển đơn cho kỹ thuật viên khác.",
      isDanger: true,
      onConfirm: async () => {
        try {
          await bookingApi.technicianReject(id);
          toast.success("Đã từ chối booking");
          navigate("/technician/bookings");
        } catch (error) {
          toast.error(error.response?.data?.message || "Không thể từ chối booking");
        }
      }
    });
  };

  const handleAccept = async () => {
    try {
      await bookingApi.acceptBooking({ bookingId: id, token });
      toast.success("Bạn đã nhận booking thành công!");
      fetchBookingDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể nhận booking");
    }
  };

  // --- LOGIC MỚI: Xử lý Upload và Update Status ---
  const handleUploadProof = useCallback(async (file, type) => {

    const relationType = type === 'CheckIn' ? 'CheckInProof' : 'CheckOutProof';
    
    // 1. Upload File
    await uploadFile({
     
      objectId: id, 
      objectTypeName: 'booking', 
      relationType: relationType,
    }, file); 

    // 2. Cập nhật Status & State
    if (type === 'CheckIn') {
      await bookingApi.updateBookingStatus(id, BookingStatus.InProgress, "Kỹ thuật viên đã Check-in."); 
      setCheckStatus(id, 'CheckIn', 'true');
      setIsCheckedIn(true);
      toast.success(`Check-in thành công! Booking đã chuyển sang trạng thái Đang thực hiện.`);
    } else if (type === 'CheckOut') {
      await bookingApi.completeBooking(id); 
      localStorage.removeItem(`booking_${id}_CheckIn`);
      toast.success(`Hoàn thành công việc thành công! Booking đã chuyển sang trạng thái Hoàn thành.`);
    }
    
    setIsUploadModalOpen(false);
    fetchBookingDetail(); 
  }, [id]);
  // -------------------------------------------------


  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!booking) return <div className="p-6">Không tìm thấy booking</div>;


  // =========================================================================
  // --- ĐÃ SỬA: LOGIC KIỂM TRA ĐIỀU KIỆN HIỂN THỊ NÚT THEO LUỒNG MỚI ---
  // =========================================================================

  // Biến kiểm tra KTV đã nhận booking hay chưa
  const isAccepted = booking.status !== BookingStatus.Pending; 

  // Đã chấp nhận và chưa kết thúc (chưa hoàn thành, hủy, từ chối)
  const isInProgressFlow = isAccepted 
                       && booking.status !== BookingStatus.Completed
                       && booking.status !== BookingStatus.Rejected
                       && booking.status !== BookingStatus.Cancelled;

  // Nút Nhận Booking chỉ hiện khi đang Pending và chưa có KTV nhận
  const canAccept = booking.status === BookingStatus.Pending && (!booking.technicianId || booking.technicianId === "00000000-0000-0000-0000-000000000000");

  // Nút Check-in: Chỉ hiện khi status là Confirmed (1) hoặc TechnicianOnTheWay (2) và chưa Check-in
  const canCheckIn = isInProgressFlow 
                   && (booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.TechnicianOnTheWay)
                   && !isCheckedIn;

  // Nút Hoàn thành công việc (Tích hợp Check-out): Chỉ hiện khi đã Check-in và status đang là InProgress (3)
  const canComplete = isInProgressFlow 
                    && isCheckedIn 
                    && booking.status === BookingStatus.InProgress 
                    && booking.payments?.some(payment => payment.status === PaymentStatus.Completed);

  // Nút Chat & Thêm linh kiện: Chỉ hiện khi booking đang trong quá trình thực hiện
  const canOpenChat = isInProgressFlow;
  const canAddEquipment = isInProgressFlow; 
  // =========================================================================
  
  const paymentCompleted = booking.payments?.some(payment => payment.status === PaymentStatus.Completed) || false;
  const waitingForPayment = booking.status === BookingStatus.Completed && !paymentCompleted;

  // Lấy feedbacks từ booking
  const customerFeedback = booking.feedbacks?.find(f => f.source === FeedbackSource.Customer);
  const technicianFeedback = booking.feedbacks?.find(f => f.source === FeedbackSource.Technician);
  const canGiveFeedback = booking.status === BookingStatus.Completed && paymentCompleted && !technicianFeedback;

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <button onClick={() => navigate("/technician/bookings")} className="text-gray-500 hover:text-gray-700 inline-flex mb-4 items-center">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Quay lại
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Chi tiết Booking 
            <span className="text-sm font-normal px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
              {BookingStatusLabels[booking.status]}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Mã đơn: {booking.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Thông tin khách hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Họ tên</p>
                <p className="font-medium">{booking.customerName}</p>
                
                {/* Rating trung bình của customer từ các booking đã hoàn thành */}
                <div className="flex items-center mt-2">
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const rating = booking.customerAverageRating || 0;
                          return (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(rating)
                                  ? "text-yellow-400 fill-yellow-400" 
                                  : i < rating
                                  ? "text-yellow-400 fill-yellow-400 opacity-50"
                                  : "text-gray-300"
                              }`}
                            />
                          );
                        })}
                    </div>
                    {booking.customerAverageRating > 0 ? (
                      <>
                        <span className="ml-2 text-sm font-semibold text-gray-700">
                          {booking.customerAverageRating.toFixed(1)}/5
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({booking.customerRatingCount || 0} đánh giá)
                        </span>
                      </>
                    ) : (
                      <span className="ml-2 text-sm text-gray-500 italic">
                        Chưa có đánh giá
                      </span>
                    )}
                </div>

              </div>
              <div>
                <p className="text-gray-500 text-sm">Số điện thoại</p>
                <p className="font-medium flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {booking.customerPhone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 text-sm">Địa chỉ</p>
                <p className="font-medium flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-1 text-red-500 shrink-0 mt-0.5" />
                  {booking.address}
                </p>
              </div>
            </div>
          </div>

          {/* Services & Equipments */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold">Chi tiết công việc</h2>
                <div className="text-right">
                    <span className="text-sm text-gray-500 block">Tổng cộng</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(booking.totalPrice)}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <WrenchScrewdriverIcon className="h-5 w-5 mr-2" /> Dịch vụ đăng ký
                   </h3>
                   <ul className="space-y-2">
                      {booking.items?.map((item) => (
                         <li key={item.serviceId} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="text-sm">{item.serviceName}</span>
                            <span className="font-medium text-sm text-gray-600">{formatCurrency(item.price)}</span>
                         </li>
                      ))}
                   </ul>
                </div>

                <div>
                   <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <WrenchScrewdriverIcon className="h-5 w-5 mr-2" /> Linh kiện / Thiết bị
                   </h3>
                   {booking.equipments && booking.equipments.length > 0 ? (
                      <ul className="space-y-2">
                        {booking.equipments.map((eq) => (
                           <li key={eq.id} className="bg-blue-50 p-2 rounded text-sm group relative border border-blue-100">
                              <div className="flex justify-between font-medium items-start pr-6">
                                 <div><span className="text-gray-800">{eq.equipmentName}</span></div>
                                 <span className="text-gray-600">x{eq.quantity}</span>
                              </div>
                              <div className="text-right text-gray-500 text-xs mt-1">{formatCurrency(eq.unitPrice)}</div>
                              <div className="text-right font-bold text-blue-700 text-xs mt-1 border-t border-blue-200 pt-1">
                                 = {formatCurrency(eq.totalPrice)}
                              </div>
                              {canAddEquipment && (
                                <button 
                                    onClick={() => onRemoveEquipmentClick(eq.id)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition p-1 bg-white rounded-full shadow-sm"
                                    title="Xóa khỏi đơn"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                           </li>
                        ))}
                      </ul>
                   ) : (
                      <p className="text-gray-400 text-sm italic">Chưa sử dụng linh kiện nào.</p>
                   )}
                </div>
             </div>
             <div className="mt-6 pt-4 border-t bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-lg">
                <p className="text-gray-600 text-sm"><strong>Mô tả vấn đề:</strong> {booking.problemDescription || "Không có mô tả"}</p>
                <p className="text-gray-600 text-sm mt-1"><strong>Thời gian hẹn:</strong> {formatDate(booking.desiredDate)}</p>
             </div>
          </div>

          {/* Feedbacks Section */}
          {(customerFeedback || technicianFeedback || canGiveFeedback || waitingForPayment) && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center">
                <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Đánh giá và Phản hồi
              </h2>
              
              <div className="space-y-4">
                {/* Customer Feedback về Technician */}
                {customerFeedback ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">Đánh giá từ khách hàng về bạn</h3>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-5 w-5 ${
                              i < customerFeedback.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {customerFeedback.rating}/5
                        </span>
                      </div>
                    </div>
                    {customerFeedback.comment && (
                      <p className="text-gray-700 text-sm mt-2 italic">
                        "{customerFeedback.comment}"
                      </p>
                    )}
                  </div>
                ) : booking.status === BookingStatus.Completed && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
                    Khách hàng chưa đánh giá
                  </div>
                )}

                {/* Technician Feedback về Customer */}
                {technicianFeedback ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">Đánh giá của bạn về khách hàng</h3>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-5 w-5 ${
                              i < technicianFeedback.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {technicianFeedback.rating}/5
                        </span>
                      </div>
                    </div>
                    {technicianFeedback.comment && (
                      <p className="text-gray-700 text-sm mt-2 italic">
                        "{technicianFeedback.comment}"
                      </p>
                    )}
                  </div>
                ) : waitingForPayment ? (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-700">
                      Khách hàng chưa hoàn tất thanh toán. Bạn có thể đánh giá sau khi thanh toán thành công.
                    </p>
                  </div>
                ) : canGiveFeedback && (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-700 mb-2">
                      Khách hàng đã thanh toán. Vui lòng đánh giá để hoàn tất booking.
                    </p>
                    <button
                      onClick={() => setIsFeedbackModalOpen(true)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-medium text-sm transition"
                    >
                      Đánh giá khách hàng
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
              {/* Nút từ chối chỉ hiện khi đang Pending */}
              {booking.status === BookingStatus.Pending && (
                <button onClick={onRejectBookingClick} className="bg-red-100 text-red-700 hover:bg-red-200 px-5 py-3 rounded font-medium transition">
                  Từ chối
                </button>
              )}
              {/* Nút Nhận booking chỉ hiện khi đang Pending */}
              {canAccept && (
                <button onClick={handleAccept} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded font-medium transition shadow-sm">
                  Nhận booking
                </button>
              )}
              
              {/* --- CÁC NÚT HÀNH ĐỘNG THEO LUỒNG MỚI --- */}
              
              {canCheckIn && (
                 <button 
                    onClick={() => { setUploadType('CheckIn'); setIsUploadModalOpen(true); }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-3 rounded font-medium transition shadow-sm flex items-center gap-2"
                 >
                    <CheckCircleIcon className="h-5 w-5" /> Check-in (Gửi ảnh đến nơi)
                 </button>
              )}

              {/* canCheckOut ĐÃ BỊ LOẠI BỎ */}

              {canComplete && (
                <button onClick={onCompleteBookingClick} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded font-medium transition shadow-sm flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" /> Hoàn thành công việc
                </button>
              )}
              {/* ------------------------------------------- */}
              
              {/* Nút Chat chỉ hiện khi booking chưa kết thúc */}
              {canOpenChat && (
                <button onClick={() => window.open(`/technician/chat`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded font-medium flex items-center gap-2 transition shadow-sm">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" /> Chat với khách
                </button>
              )}
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-1">
           <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-4">
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <PlusCircleIcon className="h-6 w-6 text-blue-600 mr-2" /> Thêm linh kiện
              </h2>
              {/* canAddEquipment chỉ là TRUE khi booking đang trong quá trình (isInProgressFlow = true) */}
              {!canAddEquipment ? (
                 <div className="text-center p-4 bg-gray-50 rounded text-gray-500 text-sm border border-gray-100">
                    Bạn cần <strong>Nhận Booking</strong> hoặc đang trong trạng thái <strong>Thực hiện</strong> để sử dụng chức năng này.
                 </div>
              ) : (
                 <>
                    <div className="mb-4">
                       <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm thiết bị</label>
                       <input 
                          type="text" placeholder="Nhập tên, mã hoặc hãng..." 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                       />
                    </div>
                    <div className="mb-4 max-h-80 overflow-y-auto border border-gray-200 rounded-md bg-white shadow-inner">
                       {isSearching && <p className="p-3 text-xs text-center text-gray-500">Đang tìm...</p>}
                       {!isSearching && equipments.length === 0 && searchTerm && (
                          <p className="p-3 text-xs text-center text-gray-500">Không tìm thấy thiết bị nào.</p>
                       )}
                       {equipments.map(item => (
                          <div 
                             key={item.id} onClick={() => setSelectedEquipment(item)}
                             className={`p-3 border-b last:border-0 cursor-pointer text-sm hover:bg-blue-50 transition 
                                ${selectedEquipment?.id === item.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                          >
                             <div className="flex justify-between items-start">
                                 <p className="font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                                 <span className="text-blue-600 font-bold text-xs whitespace-nowrap ml-2">{formatCurrency(item.unitPrice)}</span>
                             </div>
                             <div className="flex flex-wrap gap-2 mt-1.5 mb-1.5">
                                {item.equipmentCode && (
                                    <span className="inline-flex items-center bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">
                                        <QrCodeIcon className="h-3 w-3 mr-1" /> {item.equipmentCode}
                                    </span>
                                )}
                                {item.brand && (
                                    <span className="inline-flex items-center bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] border border-gray-200">
                                        <TagIcon className="h-3 w-3 mr-1" /> {item.brand}
                                    </span>
                                )}
                             </div>
                             <div className="text-xs text-gray-500 flex justify-between">
                                <span>ĐVT: {item.unitOfMeasure}</span>
                                <span>Kho: <span className={`font-medium ${item.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>{item.quantity}</span></span>
                             </div>
                          </div>
                       ))}
                    </div>
                    {selectedEquipment && (
                       <div className="animate-fade-in-up bg-blue-50 p-3 rounded-md border border-blue-100">
                          <div className="mb-3">
                             <p className="text-sm font-medium text-gray-800 mb-2">Đang chọn: <span className="text-blue-600">{selectedEquipment.name}</span></p>
                             <div className="flex items-center justify-between">
                                <label className="text-sm text-gray-600">Số lượng:</label>
                                <input 
                                   type="number" min="1" max={selectedEquipment.quantity}
                                   className="border border-gray-300 rounded px-2 py-1 w-24 text-center text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                   value={quantity}
                                   onChange={(e) => setQuantity(e.target.value)}
                                />
                             </div>
                             <p className="text-xs text-right text-gray-500 mt-1">Tạm tính: <span className="font-bold text-blue-700">{formatCurrency(selectedEquipment.unitPrice * quantity)}</span></p>
                          </div>
                          <button 
                             onClick={handleAddEquipment}
                             disabled={selectedEquipment.quantity <= 0}
                             className={`w-full flex justify-center items-center py-2 rounded-md font-medium transition text-sm
                                ${selectedEquipment.quantity > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                          >
                             <PlusCircleIcon className="h-5 w-5 mr-1" /> {selectedEquipment.quantity > 0 ? "Thêm vào đơn" : "Hết hàng"}
                          </button>
                       </div>
                    )}
                 </>
              )}
           </div>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL UI --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all scale-100 animate-scale-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {confirmModal.isDanger ? (
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                        <ExclamationTriangleIcon className="h-6 w-6" />
                    </div>
                ) : (
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{confirmModal.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {confirmModal.content}
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={closeConfirm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 text-white rounded-md font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1
                    ${confirmModal.isDanger 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FEEDBACK MODAL --- */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        title="Đánh giá khách hàng"
        subtitle="Chia sẻ trải nghiệm của bạn về khách hàng"
        ratingLabel="Bạn đánh giá khách hàng như thế nào?"
        commentLabel="Nhận xét về khách hàng (tùy chọn)"
        commentPlaceholder="Nhập nhận xét về khách hàng..."
        submitButtonText="Gửi đánh giá"
        maxCommentLength={1000}
      />
      
      {/* --- NEW: UPLOAD PHOTO MODAL --- */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadProof}
        uploadType={uploadType}
      />
    </div>
  );
};

export default BookingDetailPage;