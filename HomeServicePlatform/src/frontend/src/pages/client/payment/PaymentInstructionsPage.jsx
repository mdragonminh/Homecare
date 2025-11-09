import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  CreditCard,
  Hash,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  paymentApi,
  PaymentStatus,
  getPaymentStatusText,
} from "../../../services/paymentApi";

const PaymentInstructionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const location = useLocation();

  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!payment);
  const [checking, setChecking] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Bank information from backend config
  const bankInfo = {
    bankName: "TPBank",
    accountNumber: "0916502175",
    accountName: "CAO QUANG MINH",
    branch: "Chi nhánh TP HCM",
  };

  useEffect(() => {
    if (!payment) {
      loadPaymentDetails();
    }

    // Auto-check payment status every 10 seconds
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [paymentId]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const result = await paymentApi.getPaymentById(paymentId);

      if (result.success) {
        setPayment(result.data);

        // If payment is already completed, redirect to result page
        if (result.data.status === PaymentStatus.Completed) {
          navigate(`/payment/result/${paymentId}`);
        }
      } else {
        toast.error("Không tìm thấy thông tin thanh toán");
        navigate("/");
      }
    } catch (error) {
      console.error("Error loading payment:", error);
      toast.error("Lỗi khi tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      setChecking(true);
      const result = await paymentApi.queryPaymentStatus(paymentId);

      if (result.success) {
        setPayment(result.data);

        // If payment is completed, redirect to result page
        if (result.data.status === PaymentStatus.Completed) {
          toast.success("Thanh toán thành công!");
          navigate(`/payment/result/${paymentId}`);
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Đã sao chép!");

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
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
            className="text-blue-600 hover:text-blue-700"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Status Banner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Đang chờ thanh toán
                </h2>
                <p className="text-sm text-gray-600">
                  Vui lòng chuyển khoản theo hướng dẫn bên dưới
                </p>
              </div>
            </div>
            <button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`}
              />
              {checking ? "Đang kiểm tra..." : "Kiểm tra"}
            </button>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Hướng dẫn chuyển khoản
          </h2>

          <div className="space-y-4">
            {/* Bank Name */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Ngân hàng</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bankInfo.bankName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Number */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Số tài khoản</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {bankInfo.accountNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(bankInfo.accountNumber, "account")
                  }
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copiedField === "account" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center">
                <Hash className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Tên tài khoản</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {bankInfo.accountName}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Số tiền</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatAmount(payment.amount)} VNĐ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(payment.amount.toString(), "amount")
                  }
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {copiedField === "amount" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Transfer Content - IMPORTANT */}
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-2">
                    Nội dung chuyển khoản (BẮT BUỘC)
                  </p>
                  <div className="flex items-center justify-between bg-white rounded-lg p-3">
                    <p className="text-xl font-mono font-bold text-gray-900">
                      {payment.sePayOrderId || `HSP${payment.id.substring(0, 8)}`}
                    </p>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          payment.sePayOrderId || `HSP${payment.id.substring(0, 8)}`,
                          "content"
                        )
                      }
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {copiedField === "content" ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-yellow-800 mt-2">
                    ⚠️ Vui lòng nhập CHÍNH XÁC nội dung này khi chuyển khoản để
                    hệ thống tự động xác nhận thanh toán của bạn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-blue-50 rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Lưu ý quan trọng
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Sau khi chuyển khoản thành công, hệ thống sẽ tự động xác nhận
                trong vòng 1-2 phút
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Vui lòng chuyển khoản ĐÚNG số tiền và ĐÚNG nội dung để được xử
                lý tự động
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Nếu sau 10 phút vẫn chưa được xác nhận, vui lòng liên hệ hỗ trợ
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Bạn có thể nhấn nút "Kiểm tra" để cập nhật trạng thái thanh toán
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Quay về trang chủ
          </button>
          <button
            onClick={() => navigate(`/payment/result/${paymentId}`)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Xem trạng thái thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructionsPage;
