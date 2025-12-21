import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { equipmentApi } from "../../services/equipmentApi";
import equipmentRequestApi, { BookingEquipmentStatus as EquipmentStatus } from "../../services/equipmentRequestApi";
import { uploadFile } from "../../services/fileApi";
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
  CameraIcon,
  CheckCircleIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import { FeedbackModal } from "../../components/feedback/FeedbackModal";
import { PaymentStatus, BookingEquipmentStatus, getEquipmentStatusText, getPaymentStatusText, getEquipmentStatusColor } from "../../services/paymentApi";
import { motion } from "framer-motion";

const getCheckStatus = (bookingId, type) => {
  return localStorage.getItem(`booking_${bookingId}_${type}`) === 'true';
};

const setCheckStatus = (bookingId, type, status) => {
  localStorage.setItem(`booking_${bookingId}_${type}`, status);
};

const getPaymentInfo = (payments) => {
  if (!payments || payments.length === 0)
    return { statusText: "Chưa thanh toán", isPaid: false };
  const servicePayment = payments.find((p) => p.type === 0);
  if (!servicePayment) return { statusText: "Chưa thanh toán", isPaid: false };
  const isPaid = servicePayment.status === PaymentStatus.Completed;
  return { statusText: getPaymentStatusText(servicePayment.status), isPaid };
};

const UploadPhotoModal = ({ isOpen, onClose, onUpload, uploadType }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const title = uploadType === 'CheckIn' ? 'Check-in: Gửi ảnh đến nơi' : 'Hoàn thành: Gửi ảnh công việc';

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return toast.warning("Vui lòng chọn một tệp ảnh.");
    setUploading(true);
    try {
      await onUpload(file, uploadType);
    } catch (error) {
      toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <CameraIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
          </div>

          <p className="text-gray-600 mb-4 leading-relaxed text-sm">
            {uploadType === 'CheckIn'
              ? "Vui lòng chụp ảnh chứng minh bạn đã đến địa điểm và bắt đầu công việc."
              : "Vui lòng chụp ảnh công việc đã hoàn thành để khách hàng xác nhận."
            }
          </p>

          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors" />

          {file && (
            <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-200">Đã chọn: <strong>{file.name}</strong></p>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { onClose(); setFile(null); }} className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Hủy bỏ</button>
            <button onClick={handleSubmit} disabled={uploading || !file} className={`px-5 py-2.5 text-white rounded-xl font-semibold transition-all ${uploading || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200'}`}>
              {uploading ? 'Đang tải lên...' : 'Gửi ảnh'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState('');

  const [equipments, setEquipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", content: "", isDanger: false, onConfirm: null });
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const formatCurrency = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
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
      setIsCheckedIn(getCheckStatus(id, 'CheckIn'));
      setIsCheckedOut(getCheckStatus(id, 'CheckOut'));
      setLoading(false);
    } catch {
      toast.error("Không thể tải chi tiết booking");
      navigate("/technician/bookings");
    }
  };

  const handleSearchEquipment = async (term) => {
    try {
      setIsSearching(true);
      const res = await equipmentApi.getEquipmentForTech({ PageNumber: 1, PageSize: 10, SearchTerm: term });
      if (res.success) setEquipments(res.data?.items || res.data || []);
    } catch (error) { console.error(error); } finally { setIsSearching(false); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) handleSearchEquipment(searchTerm);
      else setEquipments([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddEquipment = async () => {
    if (!selectedEquipment) return toast.warning("Vui lòng chọn thiết bị");
    if (quantity <= 0) return toast.warning("Số lượng phải lớn hơn 0");

    try {
      await bookingApi.addEquipment(id, { equipmentId: selectedEquipment.id, quantity: parseInt(quantity) });
      toast.success("Đã thêm thiết bị (Nháp)");
      setSelectedEquipment(null);
      setQuantity(1);
      setSearchTerm("");
      fetchBookingDetail();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm thiết bị");
    }
  };

  const handleSubmitEquipment = async () => {
    const draftItems = booking.equipments.filter(e => e.status === BookingEquipmentStatus.Draft);
    if (draftItems.length === 0) return;

    const draftIds = draftItems.map(e => e.id);

    setConfirmModal({
      isOpen: true,
      title: "Xác nhận gửi danh sách",
      content: `Bạn có chắc muốn gửi ${draftItems.length} thiết bị này cho khách hàng xác nhận và thanh toán không?`,
      isDanger: false,
      onConfirm: async () => {
        try {
          await bookingApi.submitEquipments(id, draftIds);
          toast.success("Đã gửi danh sách cho khách hàng");
          fetchBookingDetail();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Lỗi khi gửi danh sách");
        }
      }
    });
  };

  const onRemoveEquipmentClick = (bookingEquipmentId) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa thiết bị",
      content: "Bạn có chắc chắn muốn xóa thiết bị này khỏi đơn hàng?",
      isDanger: true,
      onConfirm: async () => {
        try {
          await bookingApi.removeEquipment(id, bookingEquipmentId);
          toast.success("Đã xóa thiết bị");
          fetchBookingDetail();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Lỗi khi xóa");
        }
      }
    });
  };

  const handleConfirmReceipt = async (bookingEquipmentId, equipmentName) => {
    setConfirmModal({
      isOpen: true,
      title: "Xác nhận đã nhận thiết bị",
      content: `Bạn xác nhận đã nhận thiết bị "${equipmentName}"?`,
      isDanger: false,
      onConfirm: async () => {
        try {
          await equipmentRequestApi.confirmReceipt(id, [bookingEquipmentId]);
          toast.success("Đã xác nhận nhận thiết bị");
          fetchBookingDetail();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          toast.error(error.response?.data?.message || "Lỗi khi xác nhận");
        }
      }
    });
  };

  const onCompleteBookingClick = () => { setUploadType('CheckOut'); setIsUploadModalOpen(true); };

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await bookingApi.createFeedback(id, rating, comment);
      toast.success("Đã gửi đánh giá thành công");
      setIsFeedbackModalOpen(false);
      fetchBookingDetail();
    } catch (error) { toast.error("Không thể gửi đánh giá"); }
  };

  const onRejectBookingClick = () => {
    setConfirmModal({
      isOpen: true,
      title: "Từ chối Booking",
      content: "Bạn có chắc muốn từ chối booking này?",
      isDanger: true,
      onConfirm: async () => {
        try {
          await bookingApi.technicianReject(id);
          toast.success("Đã từ chối booking");
          navigate("/technician/bookings");
        } catch (error) { toast.error("Không thể từ chối"); }
      }
    });
  };

  const handleAccept = async () => {
    try {
      await bookingApi.acceptBooking({ bookingId: id, token });
      toast.success("Đã nhận booking thành công!");
      fetchBookingDetail();
    } catch (error) { toast.error("Không thể nhận booking"); }
  };

  const handleUploadProof = useCallback(async (file, type) => {
    const relationType = type === 'CheckIn' ? 'CheckInProof' : 'CheckOutProof';
    
    if (type === 'CheckIn') {
      await bookingApi.updateBookingStatus(id, BookingStatus.InProgress, "Kỹ thuật viên đã Check-in.");
      await uploadFile({ objectId: id, objectTypeName: 'booking', relationType }, file);
      setCheckStatus(id, 'CheckIn', 'true');
      setIsCheckedIn(true);
      toast.success("Check-in thành công!");
    } else if (type === 'CheckOut') {
      await uploadFile({ objectId: id, objectTypeName: 'booking', relationType }, file);
      await bookingApi.completeBooking(id);
      setCheckStatus(id, 'CheckOut', 'true');
      setIsCheckedOut(true);
      localStorage.removeItem(`booking_${id}_CheckIn`);
      toast.success("Check-out thành công!");
    }
    setIsUploadModalOpen(false);
    fetchBookingDetail();
  }, [id]);

  useEffect(() => { fetchBookingDetail(); }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-600 font-semibold">Đang tải...</p>
      </div>
    </div>
  );
  if (!booking) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 text-lg mb-4">Không tìm thấy booking</p>
        <button
          onClick={() => navigate("/technician/bookings")}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Quay lại
        </button>
      </div>
    </div>
  );

  const isAccepted = booking.status !== BookingStatus.Pending;
  const isInProgressFlow = isAccepted && booking.status !== BookingStatus.Completed && booking.status !== BookingStatus.Rejected && booking.status !== BookingStatus.Cancelled;
  const canAccept = booking.status === BookingStatus.Pending && (!booking.technicianId || booking.technicianId === "00000000-0000-0000-0000-000000000000");
  const canCheckIn = isInProgressFlow && (booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.TechnicianOnTheWay) && !isCheckedIn;

  // Check if all equipment are delivered (or no equipment at all)
  const allEquipmentsDelivered = !booking.equipments || booking.equipments.length === 0 ||
    booking.equipments.every(e => e.status === BookingEquipmentStatus.Delivered);

  const canComplete = isInProgressFlow && isCheckedIn && booking.status === BookingStatus.InProgress && allEquipmentsDelivered;
  const canOpenChat = isInProgressFlow;
  const canAddEquipment = isInProgressFlow && !isCheckedOut;
  const hasDraftEquipments = booking.equipments?.some(e => e.status === BookingEquipmentStatus.Draft);

  const paymentCompleted = booking.payments?.some(payment => payment.status === PaymentStatus.Completed) || false;
  const waitingForPayment = booking.status === BookingStatus.Completed && !paymentCompleted;
  const customerFeedback = booking.feedbacks?.find(f => f.source === FeedbackSource.Customer);
  const technicianFeedback = booking.feedbacks?.find(f => f.source === FeedbackSource.Technician);
  const canGiveFeedback = booking.status === BookingStatus.Completed && paymentCompleted && !technicianFeedback;
  const paymentInfo = getPaymentInfo(booking.payments);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/30 blur-3xl z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-100/20 blur-3xl z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button onClick={() => navigate("/technician/bookings")} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ArrowLeftIcon className="h-4 w-4" /> Quay lại
          </button>

          <div className="mb-8 p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl shadow-blue-200/50 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                  Chi tiết Booking
                </h1>
                <p className="text-blue-100 font-medium opacity-90">
                  Quản lý và theo dõi công việc của bạn
                </p>
              </div>
              <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl border border-white/30 font-bold text-sm">
                {BookingStatusLabels[booking.status]}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <h2 className="text-lg font-extrabold mb-4 pb-3 border-b border-gray-200 text-gray-900">Thông tin khách hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1.5">Họ tên</p>
                  <p className="font-bold text-gray-900 text-lg mb-3">{booking.customerName}</p>

                  {/* Rating trung bình của customer từ các booking đã hoàn thành */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const rating = booking.customerAverageRating || 0;
                        return (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(rating)
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
                        <span className="ml-2 text-sm font-bold text-gray-700">
                          {booking.customerAverageRating.toFixed(1)}/5
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({booking.customerRatingCount || 0} đánh giá)
                        </span>
                      </>
                    ) : (
                      <span className="ml-2 text-xs text-gray-500 italic">
                        Chưa có đánh giá
                      </span>
                    )}
                  </div>

                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1.5">Số điện thoại</p>
                  <p className="font-semibold flex items-center text-gray-900">
                    <PhoneIcon className="h-4 w-4 mr-2 text-blue-500" />
                    {booking.customerPhone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1.5">Địa chỉ</p>
                  <p className="font-semibold flex items-start text-gray-900">
                    <MapPinIcon className="h-5 w-5 mr-2 text-red-500 shrink-0 mt-0.5" />
                    {booking.address}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Services & Equipments */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-extrabold text-gray-900">Chi tiết công việc</h2>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter block mb-1">Tổng cộng</span>
                  <span className="text-2xl font-black text-blue-600">{formatCurrency(booking.totalPrice)} <span className="text-sm font-normal text-gray-600">VNĐ</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-gray-900 flex items-center text-sm"><WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-blue-600" /> Dịch vụ đăng ký</h3>
                    <div
                      className={`inline-flex px-3 py-1.5 rounded-xl border font-bold text-xs ${paymentInfo.isPaid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                    >
                      {paymentInfo.statusText}
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {booking.items?.map((item) => (
                      <li key={item.serviceId} className="flex justify-between items-center bg-blue-50/50 p-3 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors">
                        <span className="text-sm font-semibold text-gray-800">{item.serviceName}</span>
                        <span className="font-bold text-sm text-blue-700">{formatCurrency(item.price)} VNĐ</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-gray-900 flex items-center text-sm"><WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-indigo-600" /> Linh kiện / Thiết bị</h3>
                    {hasDraftEquipments && (
                      <button onClick={handleSubmitEquipment} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-xl flex items-center hover:bg-indigo-700 transition-all shadow-sm font-bold" title="Gửi danh sách cho khách">
                        <PaperAirplaneIcon className="h-3.5 w-3.5 mr-1.5" /> Gửi khách
                      </button>
                    )}
                  </div>

                  {hasDraftEquipments && (
                    <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 font-semibold">
                      <strong>Lưu ý:</strong> Khi gửi thiết bị cho khách, phí vận chuyển 50,000đ sẽ tự động được thêm vào tổng thanh toán.
                    </div>
                  )}

                  {booking.equipments && booking.equipments.length > 0 ? (
                    <ul className="space-y-2">
                      {booking.equipments.map((eq) => (
                        <li key={eq.id} className="bg-indigo-50/50 p-3 rounded-xl text-sm group relative border border-indigo-100 hover:bg-indigo-50 transition-colors">
                          <div className="flex justify-between font-bold items-start pr-8">
                            <div><span className="text-gray-900">{eq.equipmentName}</span></div>
                            <span className="text-gray-600">x{eq.quantity}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 gap-2">
                            {/* Hiển thị Status Badge */}
                            <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${getEquipmentStatusColor(eq.status)}`}>
                              {getEquipmentStatusText(eq.status)}
                            </span>

                            {/* Nút xác nhận đã nhận thiết bị */}
                            {eq.status === EquipmentStatus.AwaitingDelivery && (
                              <button
                                onClick={() => handleConfirmReceipt(eq.id, eq.equipmentName)}
                                className="text-[10px] px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-1 font-bold shadow-sm"
                                title="Xác nhận đã nhận thiết bị"
                              >
                                <CheckCircleIcon className="h-3 w-3" />
                                Đã nhận
                              </button>
                            )}

                            <div className="text-right font-black text-indigo-700 text-xs ml-auto">
                              = {formatCurrency(eq.totalPrice)} VNĐ
                            </div>
                          </div>

                          {/* Chỉ cho phép xóa khi còn là Draft */}
                          {canAddEquipment && eq.status === BookingEquipmentStatus.Draft && (
                            <button onClick={() => onRemoveEquipmentClick(eq.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition p-1.5 bg-white rounded-full shadow-md hover:shadow-lg">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (<p className="text-gray-400 text-sm italic bg-gray-50 p-3 rounded-xl border border-gray-100">Chưa sử dụng linh kiện nào.</p>)}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <p className="text-gray-600 text-sm font-semibold"><span className="text-gray-500 font-normal">Thời gian hẹn:</span> {formatDate(booking.desiredDate)}</p>
              </div>
            </motion.div>

            {/* Feedbacks Section */}
            {(customerFeedback || technicianFeedback || canGiveFeedback || waitingForPayment) && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-extrabold mb-4 pb-3 border-b border-gray-200 text-gray-900 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2 text-yellow-500" />
                  Đánh giá và Phản hồi
                </h2>

                <div className="space-y-4">
                  {/* Customer Feedback về Technician */}
                  {customerFeedback ? (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">Đánh giá từ khách hàng về bạn</h3>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-5 w-5 ${i < customerFeedback.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                                }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-bold text-gray-700">
                            {customerFeedback.rating}/5
                          </span>
                        </div>
                      </div>
                      {customerFeedback.comment && (
                        <p className="text-gray-700 text-sm mt-2 italic bg-white p-3 rounded-lg border border-blue-100">
                          "{customerFeedback.comment}"
                        </p>
                      )}
                    </div>
                  ) : booking.status === BookingStatus.Completed && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center text-gray-500 text-sm">
                      Khách hàng chưa đánh giá
                    </div>
                  )}

                  {/* Technician Feedback về Customer */}
                  {technicianFeedback ? (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">Đánh giá của bạn về khách hàng</h3>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-5 w-5 ${i < technicianFeedback.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                                }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-bold text-gray-700">
                            {technicianFeedback.rating}/5
                          </span>
                        </div>
                      </div>
                      {technicianFeedback.comment && (
                        <p className="text-gray-700 text-sm mt-2 italic bg-white p-3 rounded-lg border border-green-100">
                          "{technicianFeedback.comment}"
                        </p>
                      )}
                    </div>
                  ) : waitingForPayment ? (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <p className="text-sm text-gray-700 font-semibold">
                        Khách hàng chưa hoàn tất thanh toán. Bạn có thể đánh giá sau khi thanh toán thành công.
                      </p>
                    </div>
                  ) : canGiveFeedback && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <p className="text-sm text-gray-700 mb-3 font-semibold">
                        Khách hàng đã thanh toán. Vui lòng đánh giá để hoàn tất booking.
                      </p>
                      <button
                        onClick={() => setIsFeedbackModalOpen(true)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-yellow-200"
                      >
                        Đánh giá khách hàng
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {booking.status === BookingStatus.Pending && (
                <button onClick={onRejectBookingClick} className="bg-red-50 text-red-700 px-5 py-3 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all shadow-sm">
                  Từ chối
                </button>
              )}
              {canAccept && (
                <button onClick={handleAccept} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                  Nhận booking
                </button>
              )}

              {canCheckIn && (
                <button onClick={() => { setUploadType('CheckIn'); setIsUploadModalOpen(true); }} className="bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-700 transition-all shadow-lg shadow-yellow-200">
                  <CheckCircleIcon className="h-5 w-5" /> Check-in
                </button>
              )}

              {canComplete && (
                <button onClick={onCompleteBookingClick} className="bg-green-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200">
                  <CheckCircleIcon className="h-5 w-5" /> Checkout
                </button>
              )}

              {/* Show message if can't complete due to pending equipment delivery */}
              {isInProgressFlow && isCheckedIn && booking.status === BookingStatus.InProgress && !allEquipmentsDelivered && (
                <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 font-semibold">
                    <strong>Chưa thể checkout:</strong> Cần xác nhận đã nhận tất cả thiết bị trước khi hoàn thành công việc.
                  </div>
                </div>
              )}

              {canOpenChat && (
                <button onClick={() => window.open(`/technician/chat`)} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" /> Chat với khách
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-4"
            >
              <h2 className="text-lg font-extrabold mb-4 flex items-center text-gray-900"><PlusCircleIcon className="h-6 w-6 text-blue-600 mr-2" /> Thêm linh kiện</h2>
              {!canAddEquipment ? (
                <div className="text-center p-4 bg-gray-50 text-gray-500 text-sm rounded-xl border border-gray-100 font-semibold">Cần nhận đơn hoặc đang thực hiện để thêm linh kiện.</div>
              ) : (
                <>
                  <input type="text" placeholder="Tìm thiết bị..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <div className="mb-4 max-h-80 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                    {equipments.map(item => (
                      <div key={item.id} onClick={() => setSelectedEquipment(item)} className={`p-3 border-b border-gray-100 cursor-pointer text-sm hover:bg-blue-50 transition-colors ${selectedEquipment?.id === item.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}>
                        <div className="flex justify-between mb-1"><p className="font-bold text-gray-900">{item.name}</p><span className="text-blue-600 font-black">{formatCurrency(item.unitPrice)} VNĐ</span></div>
                        <div className="text-xs text-gray-500 font-semibold">Kho: {item.quantity}</div>
                      </div>
                    ))}
                  </div>
                  {selectedEquipment && (
                    <div className="bg-blue-50 p-4 rounded-xl mb-3 border border-blue-100">
                      <p className="text-sm mb-3 font-bold text-gray-900">Đang chọn: <span className="text-blue-700">{selectedEquipment.name}</span></p>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-semibold text-gray-700">Số lượng:</label>
                        <input type="number" min="1" max={selectedEquipment.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-20 border border-gray-300 rounded-xl px-3 py-1.5 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <button onClick={handleAddEquipment} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Thêm vào đơn (Nháp)</button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-extrabold mb-4 text-gray-900">{confirmModal.title}</h3>
            <p className="text-gray-600 mb-6 font-medium">{confirmModal.content}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-5 py-2.5 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors">Hủy</button>
              <button onClick={confirmModal.onConfirm} className={`px-5 py-2.5 text-white rounded-xl font-bold transition-all shadow-lg ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}>Xác nhận</button>
            </div>
          </motion.div>
        </div>
      )}
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
      <UploadPhotoModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUploadProof} uploadType={uploadType} />
    </div>
  );
};

export default BookingDetailPage;
