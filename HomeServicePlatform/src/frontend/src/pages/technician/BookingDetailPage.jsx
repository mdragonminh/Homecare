import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../services/bookingApi";
import {
  BookingStatus,
  BookingStatusLabels,
  BookingStatusColors,
} from "../../constants/enums";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const BookingDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  useEffect(() => {
    if (id) {
      fetchBookingDetail();
    }
  }, [id]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getBookingDetail(id);
      setBooking(response);
    } catch (error) {
      console.error("Error fetching booking detail:", error);
      toast.error("Không thể tải chi tiết booking");
      navigate("/technician/bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBooking = async () => {
    if (window.confirm("Bạn có chắc chắn muốn hoàn thành booking này?")) {
      try {
        await bookingApi.completeBooking(id);
        toast.success("Đã hoàn thành booking thành công");
        fetchBookingDetail();
      } catch (error) {
        console.error("Error completing booking:", error);
        toast.error("Không thể hoàn thành booking");
      }
    }
  };

  const handleRejectBooking = () => {
    setShowRejectModal(true);
  };

  const submitRejectBooking = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await bookingApi.cancelBooking(id, rejectReason);
      toast.success("Đã từ chối booking thành công");
      setShowRejectModal(false);
      setRejectReason("");
      fetchBookingDetail();
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Không thể từ chối booking");
    }
  };

  const handleUpdateStatus = () => {
    setNewStatus(booking.status.toString());
    setShowStatusModal(true);
  };

  const submitUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Vui lòng chọn trạng thái");
      return;
    }

    try {
      await bookingApi.updateBookingStatus(
        id,
        parseInt(newStatus),
        statusNotes
      );
      toast.success("Đã cập nhật trạng thái thành công");
      setShowStatusModal(false);
      setNewStatus("");
      setStatusNotes("");
      fetchBookingDetail();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [BookingStatus.Pending]: { bg: "bg-orange-100", text: "text-orange-800" },
      [BookingStatus.Confirmed]: { bg: "bg-blue-100", text: "text-blue-800" },
      [BookingStatus.TechnicianOnTheWay]: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
      },
      [BookingStatus.InProgress]: {
        bg: "bg-purple-100",
        text: "text-purple-800",
      },
      [BookingStatus.Completed]: { bg: "bg-green-100", text: "text-green-800" },
      [BookingStatus.Cancelled]: { bg: "bg-red-100", text: "text-red-800" },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
    };
    const label = BookingStatusLabels[status] || "Không xác định";

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canCompleteBooking = (status) => {
    return status === BookingStatus.InProgress;
  };

  const canRejectBooking = (status) => {
    return (
      status === BookingStatus.Pending || status === BookingStatus.Confirmed
    );
  };

  const canUpdateStatus = (status) => {
    return (
      status !== BookingStatus.Completed && status !== BookingStatus.Cancelled
    );
  };

  const getAvailableStatuses = (currentStatus) => {
    const statuses = [];

    switch (currentStatus) {
      case BookingStatus.Pending:
        statuses.push(BookingStatus.Confirmed);
        break;
      case BookingStatus.Confirmed:
        statuses.push(
          BookingStatus.TechnicianOnTheWay,
          BookingStatus.InProgress
        );
        break;
      case BookingStatus.TechnicianOnTheWay:
        statuses.push(BookingStatus.InProgress);
        break;
      case BookingStatus.InProgress:
        statuses.push(BookingStatus.Completed);
        break;
    }

    return statuses;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Không tìm thấy booking</p>
          <button
            onClick={() => navigate("/technician/bookings")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/technician/bookings")}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết Booking
            </h1>
            <p className="text-gray-600">ID: {booking.id}</p>
          </div>

          <div className="flex items-center space-x-3">
            {getStatusBadge(booking.status)}

            {canUpdateStatus(booking.status) && (
              <button
                onClick={handleUpdateStatus}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cập nhật trạng thái
              </button>
            )}

            {canCompleteBooking(booking.status) && (
              <button
                onClick={handleCompleteBooking}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Hoàn thành
              </button>
            )}

            {canRejectBooking(booking.status) && (
              <button
                onClick={handleRejectBooking}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Từ chối
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin dịch vụ
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <span className="font-medium">
                    {booking.service?.name || "Dịch vụ không xác định"}
                  </span>
                  {booking.service?.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {booking.service.description}
                    </p>
                  )}
                </div>
              </div>

              {booking.service?.basePrice && (
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>
                    Giá cơ bản:{" "}
                    {booking.service.basePrice.toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
              )}

              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span>Ngày hẹn: {formatDate(booking.desiredDate)}</span>
              </div>
            </div>

            {booking.problemDescription && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Mô tả vấn đề</h4>
                <p className="text-gray-700">{booking.problemDescription}</p>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin khách hàng
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span>{booking.customer?.fullName || "Không có tên"}</span>
              </div>

              {booking.customer?.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{booking.customer.email}</span>
                </div>
              )}

              {booking.customer?.phoneNumber && (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{booking.customer.phoneNumber}</span>
                </div>
              )}

              {booking.customer?.address && (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <span>{booking.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback */}
          {booking.feedback && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Đánh giá
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < booking.feedback.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({booking.feedback.rating}/5)
                  </span>
                </div>

                {booking.feedback.comment && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700">{booking.feedback.comment}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation */}
          {booking.cancellation && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin hủy
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Ngày hủy:</strong>{" "}
                  {formatDate(booking.cancellation.cancelledAt)}
                </p>
                {booking.cancellation.reason && (
                  <div className="p-4 bg-red-50 rounded-md">
                    <p className="text-red-700">
                      {booking.cancellation.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lịch sử</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  Tạo: {formatDate(booking.dateCreated)}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  Cập nhật: {formatDate(booking.dateModified)}
                </span>
              </div>

              {booking.dateCompleted && (
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-600">
                    Hoàn thành: {formatDate(booking.dateCompleted)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Technician Info */}
          {booking.technician && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin kỹ thuật viên
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span>{booking.technician.fullName}</span>
                </div>

                {booking.technician.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{booking.technician.email}</span>
                  </div>
                )}

                {booking.technician.phoneNumber && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span>{booking.technician.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Từ chối Booking
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập lý do từ chối booking này..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={submitRejectBooking}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cập nhật trạng thái
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái mới <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Chọn trạng thái</option>
                  {getAvailableStatuses(booking.status).map((statusValue) => (
                    <option key={statusValue} value={statusValue}>
                      {BookingStatusLabels[statusValue]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập ghi chú (tùy chọn)..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setNewStatus("");
                    setStatusNotes("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  onClick={submitUpdateStatus}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Cập nhật
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
