import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { equipmentApi } from "../../services/equipmentApi";
import { BookingStatus, BookingStatusLabels } from "../../constants/enums";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  PlusCircleIcon,
  TrashIcon,
  TagIcon,
  QrCodeIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const onCompleteBookingClick = () => {
    openConfirm({
      title: "Xác nhận hoàn thành",
      content: "Bạn đã hoàn thành công việc và muốn đóng booking này? Hành động này không thể hoàn tác.",
      isDanger: false,
      onConfirm: async () => {
        try {
          await bookingApi.completeBooking(id);
          toast.success("Đã hoàn thành booking");
          fetchBookingDetail();
        } catch {
          toast.error("Không thể hoàn thành booking");
        }
      }
    });
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

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!booking) return <div className="p-6">Không tìm thấy booking</div>;

  const canAccept = booking.status === BookingStatus.Pending && (!booking.technicianId || booking.technicianId === "00000000-0000-0000-0000-000000000000");
  const canComplete = booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.InProgress;
  const canOpenChat = booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.InProgress;
  const canAddEquipment = booking.status === BookingStatus.Confirmed || booking.status === BookingStatus.InProgress;

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* Back Button */}
      <button onClick={() => navigate("/technician/bookings")} className="text-gray-500 hover:text-gray-700 inline-flex mb-4 items-center">
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Quay lại
      </button>

      {/* Header & Status */}
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
              {booking.status === BookingStatus.Pending && (
                <button onClick={onRejectBookingClick} className="bg-red-100 text-red-700 hover:bg-red-200 px-5 py-3 rounded font-medium transition">
                  Từ chối
                </button>
              )}
              {canAccept && (
                <button onClick={handleAccept} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded font-medium transition shadow-sm">
                  Nhận booking
                </button>
              )}
              {canComplete && (
                <button onClick={onCompleteBookingClick} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded font-medium transition shadow-sm">
                  Hoàn thành công việc
                </button>
              )}
              {canOpenChat && (
                <button onClick={() => navigate(`/technician/chat`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded font-medium flex items-center gap-2 transition shadow-sm">
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
    </div>
  );
};

export default BookingDetailPage;