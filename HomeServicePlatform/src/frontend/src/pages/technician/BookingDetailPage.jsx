import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import { BookingStatus, BookingStatusLabels } from "../../constants/enums";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getBookingDetail(id);
      setBooking(res);
    } catch {
      toast.error("Không thể tải chi tiết booking");
      navigate("/technician/bookings");
    } finally {
      setLoading(false);
    }
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
  const formatDate = (date) => {
    if (!date) return "";

    // Convert to JS date
    const d = new Date(date);

    // Add 7 hours (UTC+7)
    d.setHours(d.getHours() + 7);

    return d.toLocaleString("vi-VN");
  };

  const handleCompleteBooking = async () => {
    if (!window.confirm("Xác nhận hoàn thành booking?")) return;
    try {
      await bookingApi.completeBooking(id);
      toast.success("Đã hoàn thành booking");
      fetchBookingDetail();
    } catch {
      toast.error("Không thể hoàn thành booking");
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Bạn có chắc muốn từ chối booking này?")) return;

    try {
      await bookingApi.technicianReject(id);
      toast.success("Đã từ chối — hệ thống sẽ chuyển cho KTV khác.");
      navigate("/technician/bookings");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể từ chối booking");
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;

  if (!booking)
    return (
      <div className="p-6">
        <p>Không tìm thấy booking</p>
      </div>
    );

  // const formatDate = (date) =>
  //   new Date(date).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  const canAccept =
    booking.status === BookingStatus.Pending &&
    (!booking.technicianId ||
      booking.technicianId === "00000000-0000-0000-0000-000000000000");

  const canComplete = booking.status === BookingStatus.Confirmed;

  // ⭐ Cho phép mở chat nếu booking đã được nhận
  const canOpenChat =
    booking.status === BookingStatus.Confirmed ||
    booking.status === BookingStatus.InProgress;

  return (
    <div className="p-6">
      {/* Back */}
      <button
        onClick={() => navigate("/technician/bookings")}
        className="text-gray-500 hover:text-gray-700 inline-flex mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Quay lại
      </button>

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Chi tiết Booking</h1>
      </div>

      {/* Status */}
      <div className="mt-2">
        <span className="px-3 py-1 bg-gray-200 rounded">
          {BookingStatusLabels[booking.status]}
        </span>
      </div>

      {/* CARD */}
      <div className="mt-6 bg-white p-6 rounded shadow">
        {/* CUSTOMER INFO */}
        <h2 className="text-lg font-semibold mb-3">Thông tin khách hàng</h2>
        <p>
          <strong>Tên:</strong> {booking.customerName}
        </p>

        <p className="flex items-center mt-1">
          <PhoneIcon className="h-4 w-4 mr-1 text-gray-600" />
          {booking.customerPhone}
        </p>

        {/* Rating */}
        <div className="mt-2 flex items-center text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              className={`h-5 w-5 ${i < booking.customerAverageRating ? "fill-yellow-500" : ""
                }`}
            />
          ))}
          <span className="ml-2 text-gray-600">
            {booking.customerAverageRating.toFixed(1)} (
            {booking.customerRatingCount} đánh giá)
          </span>
        </div>

        {/* Address */}
        <h2 className="text-lg font-semibold mt-6 mb-3">Địa chỉ</h2>
        <p className="flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
          {booking.address}
        </p>

        {/* Services */}
        <h2 className="text-lg font-semibold mt-6 mb-3">Dịch vụ</h2>
        <ul className="list-disc ml-5">
          {booking.items?.map((item) => (
            <li key={item.serviceId}>{item.serviceName}</li>
          ))}
        </ul>

        {/* Time */}
        <h2 className="text-lg font-semibold mt-6 mb-3">Thời gian hẹn</h2>
        <p>{formatDate(booking.desiredDate)}</p>

        {/* --- ACTION BUTTONS (BOTTOM OF CARD) --- */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
          {/* Reject */}
          {booking.status === BookingStatus.Pending && (
            <button
              onClick={handleReject}
              className="bg-red-600 text-white px-5 py-3 rounded"
            >
              Từ chối
            </button>
          )}

          {/* Accept */}
          {canAccept && (
            <button
              onClick={handleAccept}
              className="bg-blue-600 text-white px-5 py-3 rounded"
            >
              Nhận booking
            </button>
          )}

          {/* Complete */}
          {canComplete && (
            <button
              onClick={handleCompleteBooking}
              className="bg-green-600 text-white px-5 py-3 rounded"
            >
              Hoàn thành
            </button>
          )}

          {/* ⭐ OPEN CHAT BUTTON ⭐ */}
          {canOpenChat && (
            <button
              onClick={() =>
                navigate(
                  `/technician/chat`
                )
              }
              className="bg-indigo-600 text-white px-5 py-3 rounded flex items-center gap-2"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              Mở chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
