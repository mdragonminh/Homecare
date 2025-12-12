import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  XCircle,
  X,
  Send,
  Eye,
  MapPin,
  Calendar,
  User,
  Phone,
  CreditCard,
  Package,
  Wrench,
  Star
} from "lucide-react";
dayjs.extend(utc);
dayjs.extend(timezone);
import {
  getMyTickets,
  assignTechnician,
  updateTicketStatus
} from "../../services/ticketApi";
import { technicianApi } from "../../services/technicianApi";
import { getPaymentStatusText, getPaymentMethodText } from "../../services/paymentApi";
import { toast } from "sonner";


const statusMap = {
  "NotAccepted": 0,
  "Pending": 1,
  "InProgress": 2,
  "Complete": 3
};

const statusOptions = [
  { value: 0, label: "Chưa chấp nhận (Not Accepted)" },
  { value: 1, label: "Đang chờ (Pending)" },
  { value: 2, label: "Đang xử lý (In Progress)" },
  { value: 3, label: "Hoàn thành (Complete)" }
];

const TicketManagementPage = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState(0);

  // Assign Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [technicianList, setTechnicianList] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");

  // Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
    };

    const response = await getMyTickets(params);

    if (response.success) {
      setTickets(response.data.items);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.totalPages,
        totalCount: response.data.totalCount,
        pageNumber: response.data.currentPage,
      }));
    } else {
      setError(response.message);
      setTickets([]);
      toast.error(response.message || "Lỗi khi tải tickets.");
    }
    setLoading(false);
  }, [pagination.pageNumber, pagination.pageSize]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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

  // MODAL STATU
  const openStatusModal = (ticket) => {
    setSelectedTicket(ticket);
    const currentStatusValue = statusMap[ticket.status] ?? 0;
    setNewStatus(currentStatusValue);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedTicket(null);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || isSubmitting) return;

    setIsSubmitting(true);
    const response = await updateTicketStatus({
      ticketId: selectedTicket.id,
      newStatus: parseInt(newStatus)
    });

    if (response.success) {
      toast.success("Cập nhật trạng thái thành công!");
      closeStatusModal();
      await fetchTickets();
    } else {
      toast.error(response.message || "Cập nhật thất bại.");
    }
    setIsSubmitting(false);
  };

  // ASSIGN TECH 
  const openAssignModal = async (ticket) => {
    setSelectedTicket(ticket);
    setIsAssignModalOpen(true);
    setSelectedTechnicianId(ticket.technicianId || "");

    const res = await technicianApi.getTechnicians({ ApprovalStatus: 1, PageSize: 500, PageNumber: 1 });

    if (res.success) {
      setTechnicianList(res.data.items);
    } else {
      toast.error(res.message);
    }
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedTicket(null);
    setTechnicianList([]);
    setSelectedTechnicianId("");
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !selectedTechnicianId || isSubmitting) {
      toast.warning("Vui lòng chọn một kỹ thuật viên.");
      return;
    }

    setIsSubmitting(true);
    const response = await assignTechnician({
      ticketId: selectedTicket.id,
      technicianId: selectedTechnicianId
    });

    if (response.success) {
      toast.success("Gán kỹ thuật viên thành công!");
      closeAssignModal();
      await fetchTickets();
    } else {
      toast.error(response.message || "Gán thất bại.");
    }
    setIsSubmitting(false);
  };

  // DETAILS MODAL
  const openDetailsModal = (ticket) => {
    setSelectedTicketDetails(ticket);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedTicketDetails(null);
  };

  const getStatusBadge = (statusString) => {
    const statusConfig = {
      NotAccepted: {
        label: "Chưa chấp nhận",
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
      },
      Pending: {
        label: "Đang chờ",
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: Clock,
      },
      InProgress: {
        label: "Đang xử lý",
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Zap,
      },
      Complete: {
        label: "Hoàn thành",
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
      },
    };
    const config = statusConfig[statusString] || {
      label: statusString,
      bg: "bg-gray-100",
      text: "text-gray-800",
      icon: AlertCircle,
    };
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4 mr-1.5" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dayjs.utc(dateString).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
  };

  // --- Render Loading/Error ---
  if (loading && tickets.length === 0) {
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
              <h3 className="font-medium text-red-900">Lỗi khi tải tickets</h3>
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
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tickets</h1>
          <p className="text-gray-600 mt-2">
            Danh sách các ticket hỗ trợ. Tổng cộng: {pagination.totalCount}
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Không tìm thấy ticket nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 mb-8">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col items-start gap-2 mb-2">
                        {getStatusBadge(ticket.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.issueDescription || "(Chưa có mô tả)"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">
                          ID: {ticket.id}
                        </p>
                        {ticket.isRefundRequested && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                            Yêu cầu hoàn tiền
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-gray-200">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Ngày tạo
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(ticket.dateCreated)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Khách hàng
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {ticket.customerName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Kỹ thuật viên
                      </p>
                      <p className="text-sm text-gray-900">
                        {ticket.technicianName || "Chưa gán"}
                      </p>
                    </div>
                  </div>

                  {ticket.bookingId && (
                    <div className="mb-6">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Liên kết Booking</p>
                      <p className="text-sm text-blue-600 font-mono">{ticket.bookingId}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => openDetailsModal(ticket)}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem Chi tiết
                    </button>
                    <button
                      onClick={() => openStatusModal(ticket)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      Cập nhật Trạng thái
                    </button>
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
                  Hiển thị <span className="font-medium">{tickets.length}</span> trên tổng số <span className="font-medium">{pagination.totalCount}</span>
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

      {/* MODAL STATUS */}
      {isStatusModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeStatusModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleStatusSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cập nhật trạng thái</h3>
                  <button type="button" onClick={closeStatusModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">Ticket: <span className="font-medium text-gray-800">{selectedTicket.issueDescription || "(Chưa có mô tả)"}</span></p>
                <p className="text-sm text-gray-600 mb-4">Trạng thái hiện tại: {getStatusBadge(selectedTicket.status)}</p>
                <div>
                  <label htmlFor="statusSelect" className="block text-sm font-medium text-gray-700 mb-1">Chọn trạng thái mới</label>
                  <select id="statusSelect" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button type="button" onClick={closeStatusModal} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4 mr-2" />{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ASSIGN */}
      {isAssignModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeAssignModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAssignSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Gán Kỹ thuật viên</h3>
                  <button type="button" onClick={closeAssignModal} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Ticket: <span className="font-medium text-gray-800">{selectedTicket.issueDescription || "(Chưa có mô tả)"}</span></p>
                <div>
                  <label htmlFor="techSelect" className="block text-sm font-medium text-gray-700 mb-1">Chọn Kỹ thuật viên</label>
                  {technicianList.length > 0 ? (
                    <select id="techSelect" value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="">-- Chọn một KTV --</option>
                      {technicianList.map((tech) => (
                        <option key={tech.id} value={tech.id}>{tech.fullName} (ID: ...{tech.id.substring(tech.id.length - 6)})</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">Đang tải danh sách KTV...</p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button type="button" onClick={closeAssignModal} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting || !selectedTechnicianId} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4 mr-2" />{isSubmitting ? "Đang gán..." : "Gán Kỹ thuật viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && selectedTicketDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeDetailsModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Chi tiết Ticket & Booking</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {selectedTicketDetails.id}</p>
                </div>
                <button type="button" onClick={closeDetailsModal} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Information */}
              {selectedTicketDetails.bookingDetail && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Thông tin Booking
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày hẹn</p>
                      <p className="text-sm text-gray-900">{selectedTicketDetails.bookingDetail.desiredDate ? formatDate(selectedTicketDetails.bookingDetail.desiredDate) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Trạng thái</p>
                      <p className="text-sm text-gray-900">{selectedTicketDetails.bookingDetail.status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày tạo</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedTicketDetails.bookingDetail.dateCreated)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày cập nhật</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedTicketDetails.bookingDetail.dateModified)}</p>
                    </div>

                    {/* <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Vị trí
                      </p>
                      <p className="text-sm text-gray-900">Lat: {selectedTicketDetails.bookingDetail.latitude.toFixed(6)}, Long: {selectedTicketDetails.bookingDetail.longitude.toFixed(6)}</p>
                    </div> */}
                  </div>
                </div>
              )}

              {/* Customer & Technician Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTicketDetails.bookingDetail?.customer && (
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-600" />
                      Thông tin Khách hàng
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tên</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedTicketDetails.bookingDetail.customer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          Số điện thoại
                        </p>
                        <p className="text-sm text-gray-900">{selectedTicketDetails.bookingDetail.customer.phoneNumber || "N/A"}</p>
                      </div>
                      {/* <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Đánh giá</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-gray-900 ml-1">
                              {selectedTicketDetails.bookingDetail.customer.averageRating > 0 
                                ? selectedTicketDetails.bookingDetail.customer.averageRating.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ({selectedTicketDetails.bookingDetail.customer.totalReviews} đánh giá)
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}

                {selectedTicketDetails.bookingDetail?.technician && (
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Wrench className="w-5 h-5 mr-2 text-purple-600" />
                      Thông tin Kỹ thuật viên
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tên</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedTicketDetails.bookingDetail.technician.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          Số điện thoại
                        </p>
                        <p className="text-sm text-gray-900">{selectedTicketDetails.bookingDetail.technician.phoneNumber || "N/A"}</p>
                      </div>
                      {/* <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Đánh giá</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold text-gray-900 ml-1">
                              {selectedTicketDetails.bookingDetail.technician.averageRating > 0 
                                ? selectedTicketDetails.bookingDetail.technician.averageRating.toFixed(1)
                                : "N/A"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            ({selectedTicketDetails.bookingDetail.technician.totalReviews} đánh giá)
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}
              </div>

              {/* Services */}
              {selectedTicketDetails.bookingDetail?.services && selectedTicketDetails.bookingDetail.services.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-yellow-600" />
                    Dịch vụ
                  </h4>
                  <div className="space-y-2">
                    {selectedTicketDetails.bookingDetail.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-yellow-200 last:border-0">
                        <span className="text-sm text-gray-900">{service.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{service.price.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment */}
              {selectedTicketDetails.bookingDetail?.equipments && selectedTicketDetails.bookingDetail.equipments.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Wrench className="w-5 h-5 mr-2 text-orange-600" />
                    Thiết bị
                  </h4>
                  <div className="space-y-2">
                    {selectedTicketDetails.bookingDetail.equipments.map((equipment, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-orange-200 last:border-0">
                        <div className="flex-1">
                          <span className="text-sm text-gray-900">{equipment.name}</span>
                          <span className="text-xs text-gray-500 ml-2">x{equipment.quantity}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{equipment.unitPrice.toLocaleString('vi-VN')} ₫/cái</p>
                          <p className="text-sm font-semibold text-gray-900">{equipment.total.toLocaleString('vi-VN')} ₫</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {/* {selectedTicketDetails.paymentDetail && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
                    Thông tin Thanh toán
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tổng tiền</p>
                      <p className="text-xl font-bold text-emerald-700">{selectedTicketDetails.paymentDetail.amount.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Phương thức</p>
                      <p className="text-sm text-gray-900">{getPaymentMethodText(selectedTicketDetails.paymentDetail.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Trạng thái</p>
                      <p className="text-sm text-gray-900">{getPaymentStatusText(selectedTicketDetails.paymentDetail.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ngày thanh toán</p>
                      <p className="text-sm text-gray-900">{selectedTicketDetails.paymentDetail.paidAt ? formatDate(selectedTicketDetails.paymentDetail.paidAt) : "Chưa thanh toán"}</p>
                    </div>
                    {selectedTicketDetails.paymentDetail.transactionId && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mã giao dịch</p>
                        <p className="text-sm text-gray-900 font-mono">{selectedTicketDetails.paymentDetail.transactionId}</p>
                      </div>
                    )}
                    {selectedTicketDetails.paymentDetail.description && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mô tả</p>
                        <p className="text-sm text-gray-900">{selectedTicketDetails.paymentDetail.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )} */}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
              <button
                type="button"
                onClick={closeDetailsModal}
                className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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

export default TicketManagementPage;