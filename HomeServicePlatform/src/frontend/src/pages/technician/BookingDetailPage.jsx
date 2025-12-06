import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { equipmentApi } from "../../services/equipmentApi";
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
import { PaymentStatus, BookingEquipmentStatus, getEquipmentStatusText, getEquipmentStatusColor } from "../../services/paymentApi";

const getCheckStatus = (bookingId, type) => {
  return localStorage.getItem(`booking_${bookingId}_${type}`) === 'true';
};

const setCheckStatus = (bookingId, type, status) => {
  localStorage.setItem(`booking_${bookingId}_${type}`, status);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-scale-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <CameraIcon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => { onClose(); setFile(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md">Hủy bỏ</button>
            <button onClick={handleSubmit} disabled={uploading || !file} className={`px-4 py-2 text-white rounded-md ${uploading || !file ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
              {uploading ? 'Đang tải lên...' : 'Gửi ảnh'}
            </button>
          </div>
        </div>
      </div>
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
    await uploadFile({ objectId: id, objectTypeName: 'booking', relationType }, file); 
    if (type === 'CheckIn') {
      await bookingApi.updateBookingStatus(id, BookingStatus.InProgress, "Kỹ thuật viên đã Check-in."); 
      setCheckStatus(id, 'CheckIn', 'true');
      setIsCheckedIn(true);
      toast.success("Check-in thành công!");
    } else if (type === 'CheckOut') {
      await bookingApi.completeBooking(id); 
      localStorage.removeItem(`booking_${id}_CheckIn`);
      toast.success("Booking đã hoàn thành!");
    }
    setIsUploadModalOpen(false);
    fetchBookingDetail(); 
  }, [id]);

  useEffect(() => { fetchBookingDetail(); }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!booking) return <div className="p-6">Không tìm thấy booking</div>;

  const isAccepted = booking.status !== BookingStatus.Pending; 
  const isInProgressFlow = isAccepted && booking.status !== BookingStatus.Completed && booking.status !== BookingStatus.Rejected && booking.status !== BookingStatus.Cancelled;
  const canAccept = booking.status === BookingStatus.Pending && (!booking.technicianId || booking.technicianId === "00000000-0000-0000-0000-000000000000");
  const canCheckIn = isInProgressFlow && (booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.TechnicianOnTheWay) && !isCheckedIn;
  const canComplete = isInProgressFlow && isCheckedIn && booking.status === BookingStatus.InProgress && booking.payments?.some(payment => payment.status === PaymentStatus.Completed);
  const canOpenChat = isInProgressFlow;
  const canAddEquipment = isInProgressFlow; 
  
  const hasDraftEquipments = booking.equipments?.some(e => e.status === BookingEquipmentStatus.Draft);

  const paymentCompleted = booking.payments?.some(payment => payment.status === PaymentStatus.Completed) || false;
  const customerFeedback = booking.feedbacks?.find(f => f.source === FeedbackSource.Customer);

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
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Thông tin khách hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-gray-500 text-sm">Họ tên</p><p className="font-medium">{booking.customerName}</p></div>
              <div><p className="text-gray-500 text-sm">SĐT</p><p className="font-medium flex items-center"><PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />{booking.customerPhone}</p></div>
              <div className="md:col-span-2"><p className="text-gray-500 text-sm">Địa chỉ</p><p className="font-medium flex items-start"><MapPinIcon className="h-5 w-5 mr-1 text-red-500 shrink-0 mt-0.5" />{booking.address}</p></div>
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
                   <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><WrenchScrewdriverIcon className="h-5 w-5 mr-2" /> Dịch vụ đăng ký</h3>
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
                   <div className="flex justify-between items-center mb-3">
                       <h3 className="font-semibold text-gray-700 flex items-center"><WrenchScrewdriverIcon className="h-5 w-5 mr-2" /> Linh kiện / Thiết bị</h3>
                       {hasDraftEquipments && (
                           <button onClick={handleSubmitEquipment} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded flex items-center hover:bg-indigo-700 transition" title="Gửi danh sách cho khách">
                               <PaperAirplaneIcon className="h-3 w-3 mr-1" /> Gửi khách
                           </button>
                       )}
                   </div>
                   
                   {booking.equipments && booking.equipments.length > 0 ? (
                      <ul className="space-y-2">
                        {booking.equipments.map((eq) => (
                           <li key={eq.id} className="bg-blue-50 p-2 rounded text-sm group relative border border-blue-100">
                              <div className="flex justify-between font-medium items-start pr-6">
                                 <div><span className="text-gray-800">{eq.equipmentName}</span></div>
                                 <span className="text-gray-600">x{eq.quantity}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                  {/* Hiển thị Status Badge */}
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getEquipmentStatusColor(eq.status)}`}>
                                      {getEquipmentStatusText(eq.status)}
                                  </span>
                                  <div className="text-right font-bold text-blue-700 text-xs">
                                     = {formatCurrency(eq.totalPrice)}
                                  </div>
                              </div>
                              
                              {/* Chỉ cho phép xóa khi còn là Draft */}
                              {canAddEquipment && eq.status === BookingEquipmentStatus.Draft && (
                                <button onClick={() => onRemoveEquipmentClick(eq.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition p-1 bg-white rounded-full shadow-sm">
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                           </li>
                        ))}
                      </ul>
                   ) : ( <p className="text-gray-400 text-sm italic">Chưa sử dụng linh kiện nào.</p> )}
                </div>
             </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
              {booking.status === BookingStatus.Pending && <button onClick={onRejectBookingClick} className="bg-red-100 text-red-700 px-5 py-3 rounded font-medium">Từ chối</button>}
              {canAccept && <button onClick={handleAccept} className="bg-blue-600 text-white px-5 py-3 rounded font-medium">Nhận booking</button>}
              
              {canCheckIn && (
                 <button onClick={() => { setUploadType('CheckIn'); setIsUploadModalOpen(true); }} className="bg-yellow-600 text-white px-5 py-3 rounded font-medium flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" /> Check-in
                 </button>
              )}

              {canComplete && (
                <button onClick={onCompleteBookingClick} className="bg-green-600 text-white px-5 py-3 rounded font-medium flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" /> Hoàn thành công việc
                </button>
              )}
              
              {canOpenChat && (
                <button onClick={() => window.open(`/technician/chat`)} className="bg-indigo-600 text-white px-5 py-3 rounded font-medium flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" /> Chat với khách
                </button>
              )}
          </div>
        </div>

        <div className="lg:col-span-1">
           <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-4">
              <h2 className="text-lg font-bold mb-4 flex items-center"><PlusCircleIcon className="h-6 w-6 text-blue-600 mr-2" /> Thêm linh kiện</h2>
              {!canAddEquipment ? (
                 <div className="text-center p-4 bg-gray-50 text-gray-500 text-sm">Cần nhận đơn hoặc đang thực hiện để thêm linh kiện.</div>
              ) : (
                 <>
                    <input type="text" placeholder="Tìm thiết bị..." className="w-full border rounded-md px-3 py-2 text-sm mb-4" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <div className="mb-4 max-h-80 overflow-y-auto border rounded-md bg-white">
                       {equipments.map(item => (
                          <div key={item.id} onClick={() => setSelectedEquipment(item)} className={`p-3 border-b cursor-pointer text-sm hover:bg-blue-50 ${selectedEquipment?.id === item.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}>
                             <div className="flex justify-between"><p className="font-semibold">{item.name}</p><span className="text-blue-600 font-bold">{formatCurrency(item.unitPrice)}</span></div>
                             <div className="text-xs text-gray-500">Kho: {item.quantity}</div>
                          </div>
                       ))}
                    </div>
                    {selectedEquipment && (
                       <div className="bg-blue-50 p-3 rounded-md mb-3">
                          <p className="text-sm mb-2">Đang chọn: <b>{selectedEquipment.name}</b></p>
                          <div className="flex justify-between items-center mb-2">
                             <label className="text-sm">Số lượng:</label>
                             <input type="number" min="1" max={selectedEquipment.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-16 border rounded px-1 text-center"/>
                          </div>
                          <button onClick={handleAddEquipment} className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Thêm vào đơn (Nháp)</button>
                       </div>
                    )}
                 </>
              )}
           </div>
        </div>
      </div>

      {/* Modals */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{confirmModal.title}</h3>
            <p className="text-gray-600 mb-6">{confirmModal.content}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 bg-gray-100 rounded">Hủy</button>
              <button onClick={confirmModal.onConfirm} className={`px-4 py-2 text-white rounded ${confirmModal.isDanger ? 'bg-red-600' : 'bg-green-600'}`}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} onSubmit={handleFeedbackSubmit} />
      <UploadPhotoModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUploadProof} uploadType={uploadType} />
    </div>
  );
};

export default BookingDetailPage;
