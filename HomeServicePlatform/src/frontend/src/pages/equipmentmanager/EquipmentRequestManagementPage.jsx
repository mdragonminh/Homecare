import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import equipmentRequestApi, { BookingEquipmentStatus, getEquipmentRequestStatusText, getEquipmentRequestStatusColor } from "../../services/equipmentRequestApi";
import { 
  AlertCircle, 
  Eye, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  Wrench, 
  CreditCard, 
  Send
} from "lucide-react";

const EquipmentRequestManagementPage = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [pagination.pageNumber]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipmentRequestApi.getAllRequests({
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
      });

      setRequests(data.items || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách yêu cầu");
      toast.error("Lỗi khi tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.pageNumber < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, pageNumber: prev.pageNumber + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.pageNumber > 1) {
      setPagination((prev) => ({ ...prev, pageNumber: prev.pageNumber - 1 }));
    }
  };

  const openDetailsModal = async (request) => {
    try {
      const detail = await equipmentRequestApi.getRequestDetail(request.id);
      setSelectedRequestDetails(detail);
      setIsDetailsModalOpen(true);
    } catch (err) {
      toast.error("Không thể tải chi tiết yêu cầu");
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRequestDetails(null);
  };

  const handleApproveRequest = async (request) => {
    if (!confirm(`Xác nhận duyệt yêu cầu ${request.equipmentName} (x${request.quantity}) cho booking ${request.bookingCode}?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      await equipmentRequestApi.approveRequest(request.bookingId, [request.id]);
      toast.success("Đã duyệt yêu cầu thành công!");
      fetchRequests();
      if (isDetailsModalOpen) {
        closeDetailsModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể duyệt yêu cầu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("vi-VN");
  };

  const getPaymentMethodText = (method) => {
    const methodMap = {
      Cash: "Tiền mặt",
      BankTransfer: "Chuyển khoản",
      CreditCard: "Thẻ tín dụng",
    };
    return methodMap[method] || method;
  };

  const getPaymentStatusText = (status) => {
    const statusMap = {
      Pending: "Chờ thanh toán",
      Processing: "Đang xử lý",
      Paid: "Đã thanh toán",
      Failed: "Thất bại",
      Refunded: "Đã hoàn tiền",
    };
    return statusMap[status] || status;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="font-medium text-red-900">Lỗi khi tải yêu cầu</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Yêu cầu Thiết bị</h1>
          <p className="text-gray-600 mt-2">
            Danh sách các yêu cầu thiết bị cần xét duyệt. Tổng cộng: {pagination.totalCount}
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Không có yêu cầu thiết bị nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 mb-8">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col items-start gap-2 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getEquipmentRequestStatusColor(request.status)}`}>
                          {getEquipmentRequestStatusText(request.status)}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.equipmentName} (x{request.quantity})
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-500">
                          Booking: <span className="font-mono font-medium">{request.bookingCode}</span>
                        </p>
                        <p className="text-sm font-semibold text-blue-600">
                          {formatCurrency(request.totalPrice)} VNĐ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-gray-200">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Ngày yêu cầu
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(request.dateModified)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Khách hàng
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {request.customerName}
                      </p>
                      {request.customerPhone && (
                        <p className="text-xs text-gray-500">{request.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Kỹ thuật viên
                      </p>
                      <p className="text-sm text-gray-900">
                        {request.technicianName}
                      </p>
                      {request.technicianPhone && (
                        <p className="text-xs text-gray-500">{request.technicianPhone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openDetailsModal(request)}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem Chi tiết
                    </button>
                    {request.status === BookingEquipmentStatus.Paid && (
                      <button
                        onClick={() => handleApproveRequest(request)}
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Xác nhận Gửi Thiết bị
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Hiển thị <span className="font-medium">{requests.length}</span> trên tổng số <span className="font-medium">{pagination.totalCount}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.pageNumber <= 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </button>
                <div className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-gray-50 min-w-20 text-center">
                  {pagination.pageNumber} / {pagination.totalPages || 1}
                </div>
                <button
                  onClick={handleNextPage}
                  disabled={pagination.pageNumber >= pagination.totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeDetailsModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Chi tiết Yêu cầu Thiết bị</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedRequestDetails.equipmentName} (x{selectedRequestDetails.quantity})
                  </p>
                </div>
                <button type="button" onClick={closeDetailsModal} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Equipment Request Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  Thông tin Thiết bị
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tên thiết bị</p>
                    <p className="text-sm text-gray-900 font-semibold">{selectedRequestDetails.equipmentName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Số lượng</p>
                    <p className="text-sm text-gray-900">x{selectedRequestDetails.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Đơn giá</p>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedRequestDetails.unitPrice)} VNĐ</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tổng tiền</p>
                    <p className="text-lg font-bold text-purple-700">{formatCurrency(selectedRequestDetails.totalPrice)} VNĐ</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Trạng thái</p>
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${getEquipmentRequestStatusColor(selectedRequestDetails.status)}`}>
                      {getEquipmentRequestStatusText(selectedRequestDetails.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              {selectedRequestDetails.bookingDetail && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Thông tin Booking
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày hẹn</p>
                      <p className="text-sm text-gray-900">{selectedRequestDetails.bookingDetail.desiredDate ? formatDate(selectedRequestDetails.bookingDetail.desiredDate) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Trạng thái</p>
                      <p className="text-sm text-gray-900">{selectedRequestDetails.bookingDetail.status}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Vị trí
                      </p>
                      <p className="text-sm text-gray-900">Lat: {selectedRequestDetails.bookingDetail.latitude?.toFixed(6)}, Long: {selectedRequestDetails.bookingDetail.longitude?.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer & Technician Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRequestDetails.bookingDetail?.customer && (
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-600" />
                      Khách hàng
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tên</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedRequestDetails.bookingDetail.customer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          Số điện thoại
                        </p>
                        <p className="text-sm text-gray-900">{selectedRequestDetails.bookingDetail.customer.phoneNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequestDetails.bookingDetail?.technician && (
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Wrench className="w-5 h-5 mr-2 text-purple-600" />
                      Kỹ thuật viên
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tên</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedRequestDetails.bookingDetail.technician.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          Số điện thoại
                        </p>
                        <p className="text-sm text-gray-900">{selectedRequestDetails.bookingDetail.technician.phoneNumber || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* All Equipment in Booking */}
              {selectedRequestDetails.bookingDetail?.allEquipments && selectedRequestDetails.bookingDetail.allEquipments.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-orange-600" />
                    Tất cả Thiết bị trong Booking
                  </h4>
                  <div className="space-y-2">
                    {selectedRequestDetails.bookingDetail.allEquipments.map((equipment, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-orange-200 last:border-0">
                        <div className="flex-1">
                          <span className="text-sm text-gray-900 font-medium">{equipment.name}</span>
                          <span className="text-xs text-gray-500 ml-2">x{equipment.quantity}</span>
                          <span className={`ml-3 inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${getEquipmentRequestStatusColor(equipment.status)}`}>
                            {getEquipmentRequestStatusText(equipment.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{formatCurrency(equipment.unitPrice)} VNĐ/cái</p>
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(equipment.total)} VNĐ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedRequestDetails.paymentDetail && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
                    Thông tin Thanh toán
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tổng tiền</p>
                      <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedRequestDetails.paymentDetail.amount)} VNĐ</p>
                      {selectedRequestDetails.paymentDetail.shippingFee > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          (Phí ship: {formatCurrency(selectedRequestDetails.paymentDetail.shippingFee)} VNĐ)
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phương thức</p>
                      <p className="text-sm text-gray-900">{getPaymentMethodText(selectedRequestDetails.paymentDetail.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Trạng thái</p>
                      <p className="text-sm text-gray-900">{getPaymentStatusText(selectedRequestDetails.paymentDetail.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày thanh toán</p>
                      <p className="text-sm text-gray-900">{selectedRequestDetails.paymentDetail.paidAt ? formatDate(selectedRequestDetails.paymentDetail.paidAt) : "Chưa thanh toán"}</p>
                    </div>
                    {selectedRequestDetails.paymentDetail.transactionId && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mã giao dịch</p>
                        <p className="text-sm text-gray-900 font-mono">{selectedRequestDetails.paymentDetail.transactionId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex gap-3">
              {selectedRequestDetails.status === BookingEquipmentStatus.Paid && (
                <button
                  onClick={() => handleApproveRequest(selectedRequestDetails)}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận Gửi Thiết bị"}
                </button>
              )}
              <button
                type="button"
                onClick={closeDetailsModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentRequestManagementPage;
