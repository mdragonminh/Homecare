import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Wallet,
  DollarSign,
  QrCode,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  paymentApi,
  PaymentMethod,
  getPaymentMethodText,
} from "../../../services/paymentApi";
import { bookingApi } from "../../../services/bookingApi";

const PaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PaymentMethod.BankTransfer);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const result = await bookingApi.getBookingDetail(bookingId);

      if (result) {
        setBooking(result);
        // Set default amount based on booking services
        const totalAmount = result.totalPrice || 0;
        setAmount(totalAmount);
        setDescription(`Thanh toán cho booking ${bookingId}`);
      } else {
        toast.error("Không tìm thấy thông tin booking");
        navigate("/");
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      toast.error("Lỗi khi tải thông tin booking");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleSubmitPayment = async () => {
    if (!selectedMethod && selectedMethod !== 0) {
      toast.error("Vui lòng chọn phương thức thanh toán");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    try {
      setSubmitting(true);

      const paymentData = {
        bookingId: bookingId,
        amount: amount,
        paymentMethod: selectedMethod,
        description: description,
      };

      const result = await paymentApi.createPayment(paymentData);

      if (result.success) {
        const payment = result.data.payment;
        const paymentUrl = result.data.paymentUrl;

        toast.success("Tạo yêu cầu thanh toán thành công!");

        // Redirect based on payment method
        if (selectedMethod === PaymentMethod.Cash) {
          // For cash payment, just show success
          navigate(`/payment/result/${payment.id}`);
        } else {
          // For bank transfer, redirect to instructions page
          navigate(`/payment/instructions/${payment.id}`, {
            state: { payment, paymentUrl },
          });
        }
      } else {
        toast.error(result.message || "Không thể tạo thanh toán");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Lỗi khi tạo thanh toán");
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    {
      id: PaymentMethod.Cash,
      name: "Tiền mặt",
      description: "Thanh toán bằng tiền mặt khi hoàn thành dịch vụ",
      icon: <DollarSign className="h-6 w-6" />,
      color: "blue",
    },
    {
      id: PaymentMethod.BankTransfer,
      name: "Chuyển khoản ngân hàng",
      description: "Chuyển khoản qua ngân hàng",
      icon: <CreditCard className="h-6 w-6" />,
      color: "green",
    },
    {
      id: PaymentMethod.QRCode,
      name: "Mã QR",
      description: "Quét mã QR để thanh toán",
      icon: <QrCode className="h-6 w-6" />,
      color: "purple",
      disabled: true,
    },
    {
      id: PaymentMethod.EWallet,
      name: "Ví điện tử",
      description: "Thanh toán qua ví điện tử",
      icon: <Wallet className="h-6 w-6" />,
      color: "orange",
      disabled: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán dịch vụ
          </h1>
          <p className="text-gray-600">
            Chọn phương thức thanh toán phù hợp với bạn
          </p>
        </div>

        {/* Booking Summary */}
        {booking && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin booking
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã booking:</span>
                <span className="font-medium">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày hẹn:</span>
                <span className="font-medium">
                  {new Date(booking.desiredDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              
              {/* Services List */}
              {booking.items && booking.items.length > 0 && (
                <div className="pt-3 border-t border-gray-200 mt-3">
                  <span className="text-gray-600 font-medium mb-2 block">
                    Dịch vụ:
                  </span>
                  <div className="space-y-1">
                    {booking.items.map((item, index) => (
                      <div key={item.id || index} className="flex justify-between pl-4">
                        <span className="text-gray-700">{item.serviceName || 'Dịch vụ'}</span>
                        <span className="text-gray-900">{item.price.toLocaleString("vi-VN")} VNĐ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t border-gray-200 mt-3">
                <span className="text-gray-900 font-semibold">Tổng tiền:</span>
                <span className="font-bold text-lg text-blue-600">
                  {amount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Chọn phương thức thanh toán
          </h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => !method.disabled && handlePaymentMethodSelect(method.id)}
                disabled={method.disabled || submitting}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === method.id
                    ? `border-${method.color}-500 bg-${method.color}-50`
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  method.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`text-${method.color}-600 mr-4 flex-shrink-0`}
                  >
                    {method.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 flex items-center">
                      {method.name}
                      {method.disabled && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Sắp ra mắt)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {method.description}
                    </div>
                  </div>
                  {selectedMethod === method.id && (
                    <Check className="h-6 w-6 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Số tiền thanh toán
          </h2>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập số tiền"
            disabled={submitting}
          />
          <p className="mt-2 text-sm text-gray-500">
            Số tiền được làm tròn đến nghìn đồng
          </p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Thêm ghi chú cho thanh toán (không bắt buộc)"
            disabled={submitting}
          />
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={handleSubmitPayment}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Xác nhận thanh toán
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
