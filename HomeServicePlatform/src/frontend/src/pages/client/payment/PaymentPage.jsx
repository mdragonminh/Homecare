import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CreditCard, Wallet, DollarSign, QrCode, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentApi, PaymentMethod } from "../../../services/paymentApi";
import { bookingApi } from "../../../services/bookingApi";

const PaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const location = useLocation();

  const isEquipmentPayment = location.state?.paymentType === 'equipment';
  const equipmentItemsToPay = location.state?.items || [];

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PaymentMethod.BankTransfer);
  const [amount, setAmount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee] = useState(50000);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      
      if (isEquipmentPayment) {
          if (equipmentItemsToPay.length === 0) {
              toast.error("Không có vật tư nào để thanh toán");
              navigate(`/customer/booking/${bookingId}`);
              return;
          }
          const equipmentTotal = equipmentItemsToPay.reduce((sum, item) => sum + item.totalPrice, 0);
          const total = equipmentTotal + shippingFee;
          setSubtotal(equipmentTotal);
          setAmount(total);
          setDescription(`Thanh toán ${equipmentItemsToPay.length} vật tư phát sinh - Booking ${bookingId.substring(0,8)}`);
          const result = await bookingApi.getBookingDetail(bookingId);
          setBooking(result);
      } else {
          const result = await bookingApi.getBookingDetail(bookingId);
          if (result) {
            setBooking(result);

            const serviceTotal = (result.items || []).reduce((sum, item) => sum + item.price, 0);

            setAmount(serviceTotal); 
            setDescription(`Thanh toán dịch vụ booking ${bookingId}`);
          } else {
            navigate("/");
          }
      }
    } catch (error) {
      toast.error("Lỗi khi tải thông tin booking");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!amount || amount <= 0) return toast.error("Số tiền không hợp lệ");

    try {
      setSubmitting(true);
      let result;

      if (isEquipmentPayment) {
          const paymentData = {
              bookingId: bookingId,
              bookingEquipmentIds: equipmentItemsToPay.map(e => e.id),
              amount: amount,
              paymentMethod: selectedMethod,
              description: description,
          };
          result = await paymentApi.createEquipmentPayment(paymentData);
      } else {
          const paymentData = {
              bookingId: bookingId,
              amount: amount,
              paymentMethod: selectedMethod,
              description: description,
          };
          result = await paymentApi.createPayment(paymentData);
      }

      if (result.success) {
        const payment = result.data.payment;
        const paymentUrl = result.data.paymentUrl; 
        toast.success("Tạo thanh toán thành công!");

        if (selectedMethod === PaymentMethod.Cash) {
          navigate(`/payment/result/${payment.id}`);
        } else {
             navigate(`/payment/instructions/${payment.id}`, { state: { payment, paymentUrl } });
        }
      } else {
        toast.error(result.message || "Không thể tạo thanh toán");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = [
    { id: PaymentMethod.Cash, name: "Tiền mặt", description: "Thanh toán khi hoàn thành", icon: <DollarSign className="h-6 w-6" />, color: "blue" },
    { id: PaymentMethod.BankTransfer, name: "Chuyển khoản / QR", description: "Quét mã QR SePay", icon: <QrCode className="h-6 w-6" />, color: "green" },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEquipmentPayment ? "Thanh toán Vật tư phát sinh" : "Thanh toán Dịch vụ"}
          </h1>
          <p className="text-gray-600">Chọn phương thức thanh toán phù hợp</p>
        </div>

        {booking && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết thanh toán</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Mã booking:</span><span className="font-medium">{booking.id}</span></div>
              
              <div className="pt-3 border-t border-gray-200 mt-3">
                  <span className="text-gray-600 font-medium mb-2 block">Nội dung thanh toán:</span>
                  <div className="space-y-1 bg-gray-50 p-3 rounded">
                    {isEquipmentPayment ? (
                        equipmentItemsToPay.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{item.equipmentName} (x{item.quantity})</span>
                                <span className="font-medium">{item.totalPrice.toLocaleString("vi-VN")} đ</span>
                            </div>
                        ))
                    ) : (
                        booking.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span>{item.serviceName}</span>
                                <span className="font-medium">{item.price.toLocaleString("vi-VN")} đ</span>
                            </div>
                        ))
                    )}
                  </div>
              </div>
              
              {isEquipmentPayment && (
                <>
                  <div className="flex justify-between pt-2 text-sm">
                    <span className="text-gray-600">Tạm tính vật tư:</span>
                    <span className="font-medium">{subtotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium text-blue-600">{shippingFee.toLocaleString("vi-VN")} đ</span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between pt-3 border-t border-gray-200 mt-3">
                <span className="text-gray-900 font-semibold">Tổng thanh toán:</span>
                <span className="font-bold text-lg text-blue-600">{amount.toLocaleString("vi-VN")} VNĐ</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button key={method.id} onClick={() => setSelectedMethod(method.id)} disabled={submitting}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-center ${selectedMethod === method.id ? `border-${method.color}-500 bg-${method.color}-50` : "border-gray-200"}`}>
                <div className={`text-${method.color}-600 mr-4`}>{method.icon}</div>
                <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                </div>
                {selectedMethod === method.id && <Check className="h-6 w-6 text-green-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <button onClick={handleSubmitPayment} disabled={submitting} className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center disabled:opacity-70">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CreditCard className="h-5 w-5 mr-2" />}
            {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
