import { useState, useEffect, useCallback } from "react";
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
  PlusCircle, 
  Database, 
} from "lucide-react";
import { 
  getMyTickets, 
  assignTechnician, 
  updateTicketStatus,
  createTicket 
} from "../../services/ticketApi";
import { technicianApi } from "../../services/technicianApi"; 
import { equipmentApi } from "../../services/equipmentApi"; 
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
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState(0); 

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [technicianList, setTechnicianList] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]); 
  const [newTicketData, setNewTicketData] = useState({
    equipmentId: "",
    issueDescription: ""
  });

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

  const openCreateModal = async () => {
    setIsSubmitting(true); 
    const res = await equipmentApi.getEquipmentList({ PageSize: 500, PageNumber: 1 });
    if (res.success) {
      setEquipmentList(res.data.items || res.data); 
    } else {
      toast.error(res.message || "Lỗi tải danh sách thiết bị.");
    }
    setIsSubmitting(false);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEquipmentList([]);
    setNewTicketData({ equipmentId: "", issueDescription: "" });
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setNewTicketData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTicketData.equipmentId) {
        toast.warning("Vui lòng chọn một thiết bị.");
        return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    const response = await createTicket(newTicketData); 

    if (response.success) {
        toast.success("Tạo ticket thành công!");
        closeCreateModal();
        await fetchTickets(); 
    } else {
        toast.error(response.message || "Tạo ticket thất bại.");
    }
    setIsSubmitting(false);
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
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
            Danh sách các tickets được gán cho bạn. Tổng cộng: {pagination.totalCount}
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          disabled={isSubmitting} 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Tạo Ticket Mới
        </button>
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
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(ticket.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ticket.issueDescription || "(Chưa có mô tả)"}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        ID: {ticket.id}
                      </p>
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
                        Kỹ thuật viên
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {ticket.technicianName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Thiết bị
                      </p>
                      <p className="text-sm text-gray-900">
                        {ticket.equipmentName}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openAssignModal(ticket)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Gán Tech
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
                  Hiển thị{" "}
                  <span className="font-medium">{tickets.length}</span> trên
                  tổng số{" "}
                  <span className="font-medium">
                    {pagination.totalCount}
                  </span>{" "}
                  kết quả
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

      {isStatusModalOpen && selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeStatusModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()} 
          >
            <form onSubmit={handleStatusSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cập nhật trạng thái
                  </h3>
                  <button
                    type="button"
                    onClick={closeStatusModal}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ticket:{" "}
                  <span className="font-medium text-gray-800">
                    {selectedTicket.issueDescription || "(Chưa có mô tả)"}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Trạng thái hiện tại:{" "}
                  {getStatusBadge(selectedTicket.status)}
                </p>

                <div>
                  <label
                    htmlFor="statusSelect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Chọn trạng thái mới
                  </label>
                  <select
                    id="statusSelect"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAssignModalOpen && selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeAssignModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAssignSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Gán Kỹ thuật viên
                  </h3>
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Ticket:{" "}
                  <span className="font-medium text-gray-800">
                    {selectedTicket.issueDescription || "(Chưa có mô tả)"}
                  </span>
                </p>

                <div>
                  <label
                    htmlFor="techSelect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Chọn Kỹ thuật viên
                  </label>
                  {technicianList.length > 0 ? (
                    <select
                      id="techSelect"
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn một KTV --</option>
                      {technicianList.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.fullName} (ID: ...{tech.id.substring(tech.id.length - 6)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">Đang tải danh sách KTV...</p>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTechnicianId}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Đang gán..." : "Gán Kỹ thuật viên"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tạo Ticket Mới
                  </h3>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <label
                    htmlFor="equipmentId"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Thiết bị gặp sự cố
                  </label>

                  {!isSubmitting && equipmentList.length > 0 ? (
                    <select
                      id="equipmentId"
                      name="equipmentId"
                      value={newTicketData.equipmentId}
                      onChange={handleCreateFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn một thiết bị --</option>
                      {equipmentList.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.equipmentCode} ({eq.name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500 flex items-center">
                       <Database className="w-4 h-4 mr-2 animate-spin" />
                       Đang tải danh sách thiết bị...
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="issueDescription"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mô tả sự cố (Không bắt buộc)
                  </label>
                  <textarea
                    id="issueDescription"
                    name="issueDescription"
                    rows={4}
                    value={newTicketData.issueDescription}
                    onChange={handleCreateFormChange}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mô tả chi tiết về sự cố..."
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTicketData.equipmentId}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Đang tạo..." : "Tạo Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManagementPage;