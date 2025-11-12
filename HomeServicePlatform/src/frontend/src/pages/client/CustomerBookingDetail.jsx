"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bookingApi } from "../../services/bookingApi"
import { toast } from "sonner"
import { ArrowLeftIcon, StarIcon as StarSolid } from "@heroicons/react/24/solid"
import { FeedbackModal } from "../../components/feedback/FeedbackModal"

import { BookingStatus, BookingStatusLabels } from "../../constants/enums"
import { PaymentStatus, getPaymentStatusText } from "../../services/paymentApi"

const getPaymentInfo = (payments) => {
  if (!payments || payments.length === 0) {
    return {
      statusText: "Chưa thanh toán",
      isPaid: false,
    }
  }
  const latestPayment = payments[0]
  const isPaid = latestPayment.status === PaymentStatus.Completed

  return {
    statusText: getPaymentStatusText(latestPayment.status),
    isPaid: isPaid,
  }
}

const getStatusBadge = (status) => {
  if (status === BookingStatus.Completed) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
  return "bg-amber-50 text-amber-700 border-amber-200"
}

export default function CustomerBookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)

  useEffect(() => {
    fetchBookingDetail()
  }, [id])

  const fetchBookingDetail = async () => {
    try {
      setLoading(true)
      const data = await bookingApi.getBookingDetail(id)
      setBooking(data)
    } catch (error) {
      toast.error("Không thể tải chi tiết booking.")
      navigate("/my-bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async (rating, comment) => {
    try {
      await bookingApi.createFeedback(booking.id, rating, comment)
      toast.success("Cảm ơn bạn đã đánh giá!")
      setIsFeedbackModalOpen(false)
      fetchBookingDetail()
    } catch (error) {
      const message = error.response?.data?.message || "Đã xảy ra lỗi"
      toast.error(message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Không tìm thấy booking.</p>
      </div>
    )
  }

  const paymentInfo = getPaymentInfo(booking.payments)

  const canRateBooking = booking.status === BookingStatus.Completed && paymentInfo.isPaid && !booking.feedback

  const primaryPayment = booking.payments && booking.payments.length > 0 ? booking.payments[0] : null

  const displayPrice = primaryPayment ? primaryPayment.amount : booking.totalPrice

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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chi tiết Booking</h1>
        </div>

        {canRateBooking && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                <StarSolid className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Dịch vụ đã hoàn thành!</p>
                <p className="text-sm text-gray-600">Hãy chia sẻ trải nghiệm của bạn</p>
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

        {booking.feedback && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Đánh giá của bạn</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarSolid
                    key={i}
                    className={`h-5 w-5 ${i < booking.feedback.rating ? "text-amber-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">{booking.feedback.rating}/5</span>
            </div>
            {booking.feedback.comment && (
              <p className="text-gray-700 text-sm italic leading-relaxed">"{booking.feedback.comment}"</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Technician Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Technician</h3>
            <p className="text-xl font-semibold text-gray-900">{booking.technicianName || "Chưa có thông tin"}</p>
            <p className="text-sm text-gray-600 mt-1">technician@example.com</p>
          </div>

          {/* Status Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booking Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Trạng thái Booking</h3>
              <div
                className={`inline-block px-4 py-2 rounded-lg border font-semibold text-sm ${getStatusBadge(booking.status)}`}
              >
                {BookingStatusLabels[booking.status] || "Không xác định"}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Trạng thái Thanh toán
              </h3>
              <div
                className={`inline-block px-4 py-2 rounded-lg border font-semibold text-sm ${
                  paymentInfo.isPaid
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {paymentInfo.statusText}
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mô tả dịch vụ</h3>
            <p className="text-gray-700 leading-relaxed">{booking.problemDescription || "Không có mô tả"}</p>
          </div>

          {/* Price Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Tổng tiền</h3>
            <p className="text-4xl font-bold text-blue-600">
              {displayPrice.toLocaleString("vi-VN")}
              <span className="text-lg font-normal text-gray-600 ml-2">VNĐ</span>
            </p>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  )
}
