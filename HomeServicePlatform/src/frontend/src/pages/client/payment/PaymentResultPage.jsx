import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  paymentApi,
  PaymentStatus,
  getPaymentStatusText,
  getPaymentMethodText,
} from "../../../services/paymentApi";

const PaymentResultPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { paymentId } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadPaymentDetails();

    // Auto-refresh for pending/processing payments
    const interval = setInterval(() => {
      if (payment && (payment.status === PaymentStatus.Pending || payment.status === PaymentStatus.Processing)) {
        loadPaymentDetails();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [paymentId, payment?.status]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const result = await paymentApi.getPaymentById(paymentId);

      if (result.success) {
        setPayment(result.data);
      } else {
        toast.error("Không tìm thấy thông tin thanh toán");
      }
    } catch (error) {
      console.error("Error loading payment:", error);
      toast.error("Lỗi khi tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      const result = await paymentApi.queryPaymentStatus(paymentId);

      if (result.success) {
        setPayment(result.data);
        toast.success("Đã cập nhật trạng thái thanh toán");
      } else {
        toast.error("Không thể kiểm tra trạng thái");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error("Lỗi khi kiểm tra trạng thái");
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PaymentStatus.Completed:
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case PaymentStatus.Failed:
        return <XCircle className="h-16 w-16 text-red-600" />;
      case PaymentStatus.Cancelled:
        return <XCircle className="h-16 w-16 text-gray-600" />;
      case PaymentStatus.Refunded:
        return <RefreshCw className="h-16 w-16 text-purple-600" />;
      case PaymentStatus.Processing:
        return <Clock className="h-16 w-16 text-blue-600" />;
      case PaymentStatus.Pending:
      default:
        return <Clock className="h-16 w-16 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PaymentStatus.Completed:
        return "green";
      case PaymentStatus.Failed:
        return "red";
      case PaymentStatus.Cancelled:
        return "gray";
      case PaymentStatus.Refunded:
        return "purple";
      case PaymentStatus.Processing:
        return "blue";
      case PaymentStatus.Pending:
      default:
        return "yellow";
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case PaymentStatus.Completed:
        return {
          title: "Thanh toán thành công!",
          message: "Giao dịch của bạn đã được xử lý thành công.",
        };
      case PaymentStatus.Failed:
        return {
          title: "Thanh toán thất bại",
          message: "Giao dịch không thành công. Vui lòng thử lại.",
        };
      case PaymentStatus.Cancelled:
        return {
          title: "Thanh toán đã bị hủy",
          message: "Giao dịch đã bị hủy bỏ.",
        };
      case PaymentStatus.Refunded:
        return {
          title: "Đã hoàn tiền",
          message: "Giao dịch đã được hoàn tiền thành công.",
        };
      case PaymentStatus.Processing:
        return {
          title: "Đang xử lý thanh toán",
          message: "Chúng tôi đang xử lý giao dịch của bạn. Vui lòng đợi...",
        };
      case PaymentStatus.Pending:
      default:
        return {
          title: "Chờ thanh toán",
          message: "Vui lòng hoàn tất thanh toán theo hướng dẫn.",
        };
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold text-lg mb-2">
            Không tìm thấy thông tin thanh toán
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage(payment.status);
  const statusColor = getStatusColor(payment.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon(payment.status)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {statusInfo.title}
          </h1>
          <p className="text-gray-600 mb-6">{statusInfo.message}</p>

          {(payment.status === PaymentStatus.Pending || payment.status === PaymentStatus.Processing) && (
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className={`inline-flex items-center px-6 py-3 bg-${statusColor}-600 text-white rounded-lg font-semibold hover:bg-${statusColor}-700 transition-colors disabled:opacity-50`}
            >
              <RefreshCw
                className={`h-5 w-5 mr-2 ${checking ? "animate-spin" : ""}`}
              />
              {checking ? "Đang kiểm tra..." : "Kiểm tra lại"}
            </button>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Chi tiết thanh toán
          </h2>

          <div className="space-y-4">
            {/* Payment ID */}
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Mã thanh toán</span>
              <span className="font-mono text-sm text-gray-900">
                {payment.id}
              </span>
            </div>

            {/* Booking ID */}
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Mã booking</span>
              <span className="font-mono text-sm text-gray-900">
                {payment.bookingId}
              </span>
            </div>

            {/* Amount */}
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Số tiền
              </span>
              <span className="font-bold text-lg text-blue-600">
                {formatAmount(payment.amount)} VNĐ
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                Phương thức
              </span>
              <span className="font-medium text-gray-900">
                {getPaymentMethodText(payment.paymentMethod)}
              </span>
            </div>

            {/* Status */}
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Trạng thái</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800`}
              >
                {getPaymentStatusText(payment.status)}
              </span>
            </div>

            {/* Created Date */}
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Ngày tạo
              </span>
              <span className="text-gray-900">
                {formatDate(payment.dateCreated)}
              </span>
            </div>

            {/* Paid Date */}
            {payment.paidAt && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Ngày thanh toán
                </span>
                <span className="text-gray-900">
                  {formatDate(payment.paidAt)}
                </span>
              </div>
            )}

            {/* Transaction ID */}
            {payment.transactionId && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Mã giao dịch</span>
                <span className="font-mono text-sm text-gray-900">
                  {payment.transactionId}
                </span>
              </div>
            )}

            {/* SePay Order ID */}
            {payment.sePayOrderId && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Mã đơn hàng SePay</span>
                <span className="font-mono text-sm text-gray-900">
                  {payment.sePayOrderId}
                </span>
              </div>
            )}

            {/* Description */}
            {payment.description && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Mô tả</span>
                <span className="text-gray-900 text-right max-w-md">
                  {payment.description}
                </span>
              </div>
            )}

            {/* Failure Reason */}
            {payment.failureReason && payment.status === PaymentStatus.Failed && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Lý do thất bại</span>
                <span className="text-red-600 text-right max-w-md">
                  {payment.failureReason}
                </span>
              </div>
            )}

            {/* Refund Info */}
            {payment.status === PaymentStatus.Refunded && (
              <>
                {payment.refundedAt && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Ngày hoàn tiền</span>
                    <span className="text-gray-900">
                      {formatDate(payment.refundedAt)}
                    </span>
                  </div>
                )}
                {payment.refundReason && (
                  <div className="flex justify-between py-3">
                    <span className="text-gray-600">Lý do hoàn tiền</span>
                    <span className="text-gray-900 text-right max-w-md">
                      {payment.refundReason}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Quay về trang chủ
          </button>
          {payment.status === PaymentStatus.Pending && payment.paymentMethod !== 0 && (
            <button
              onClick={() =>
                navigate(`/payment/instructions/${paymentId}`, {
                  state: { payment },
                })
              }
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Xem hướng dẫn thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
