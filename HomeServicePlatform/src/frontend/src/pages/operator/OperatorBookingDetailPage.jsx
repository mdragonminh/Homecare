import { useState, useEffect } from "react";
import {
  Card,
  Descriptions,
  Tag,
  Space,
  Button,
  Spin,
  Empty,
  Divider,
  Row,
  Col,
  Timeline,
  Rate,
  Typography,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  ToolOutlined,
  CreditCardOutlined,
  StarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { bookingApi } from "../../services/bookingApi";
import { paymentApi, getPaymentStatusText, getPaymentMethodText, getPaymentStatusColor } from "../../services/paymentApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text, Paragraph } = Typography;

// Booking Status enum
const BookingStatus = {
  Draft: 0,
  Pending: 1,
  Confirmed: 2,
  InProgress: 3,
  Completed: 4,
  Cancelled: 5,
};

// Feedback Source Enum
const FeedbackSource = {
  Customer: 1,
  Technician: 2,
};

const getBookingStatusText = (status) => {
  const statusMap = {
    [BookingStatus.Draft]: "Nháp",
    [BookingStatus.Pending]: "Chờ xác nhận",
    [BookingStatus.Confirmed]: "Đã xác nhận",
    [BookingStatus.InProgress]: "Đang thực hiện",
    [BookingStatus.Completed]: "Hoàn thành",
    [BookingStatus.Cancelled]: "Đã hủy",
  };
  return statusMap[status] || "Không xác định";
};

const getBookingStatusColor = (status) => {
  const colorMap = {
    [BookingStatus.Draft]: "default",
    [BookingStatus.Pending]: "gold",
    [BookingStatus.Confirmed]: "blue",
    [BookingStatus.InProgress]: "processing",
    [BookingStatus.Completed]: "success",
    [BookingStatus.Cancelled]: "error",
  };
  return colorMap[status] || "default";
};

export default function OperatorBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    loadBookingDetail();
  }, [id]);

  useEffect(() => {
    if (booking?.id) {
      loadPaymentInfo();
    }
  }, [booking]);

  const loadBookingDetail = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getBookingDetail(id);
      
      if (response) {
        setBooking(response);
      }
    } catch (error) {
      console.error("Load booking detail error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentInfo = async () => {
    try {
      setLoadingPayment(true);
      const result = await paymentApi.getPaymentsByBookingId(booking.id);
      
      if (result.success && result.data && result.data.length > 0) {
        setPayment(result.data[0]); // Get first payment
      }
    } catch (error) {
      console.error("Load payment info error:", error);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleViewCustomer = () => {
    if (booking?.customerId) {
      navigate(`/operator/customers`);
    }
  };

  const handleViewTechnician = () => {
    if (booking?.technicianId) {
      navigate(`/admin/accounts`);
    }
  };

  // Helper function to extract feedbacks
  const getFeedbackBySource = (source) => {
    return booking?.feedbacks?.find(f => f.source === source);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!booking) {
    return (
      <Card>
        <Empty description="Không tìm thấy thông tin đặt lịch" />
      </Card>
    );
  }

  const customerFeedback = getFeedbackBySource(FeedbackSource.Customer);
  const technicianFeedback = getFeedbackBySource(FeedbackSource.Technician);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/operator/bookings")}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Title level={2} style={{ margin: 0 }}>
            Chi tiết đặt lịch
          </Title>
          <Tag color={getBookingStatusColor(booking.status)} style={{ fontSize: 14 }}>
            {getBookingStatusText(booking.status)}
          </Tag>
        </Space>
        <Text type="secondary">
          Mã đặt lịch: <Text code>{booking.id}</Text>
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Left Column - Booking Info */}
        <Col xs={24} lg={12}>
          {/* Customer Information */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Thông tin khách hàng</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Button size="small" onClick={handleViewCustomer}>
                Xem chi tiết
              </Button>
            }
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Họ và tên">
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <Text strong>{booking.customerName || "N/A"}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={<Space><PhoneOutlined /> Số điện thoại</Space>}>
                {booking.customerPhone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
                {booking.customerEmail || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><EnvironmentOutlined /> Địa chỉ</Space>}>
                {booking.address || "Chưa cập nhật"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Technician Information */}
          <Card
            title={
              <Space>
                <ToolOutlined />
                <span>Thông tin kỹ thuật viên</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              booking.technicianId && (
                <Button size="small" onClick={handleViewTechnician}>
                  Xem chi tiết
                </Button>
              )
            }
          >
            {booking.technicianId ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Họ và tên">
                  <Space>
                    <Avatar icon={<ToolOutlined />} size="small" />
                    <Text strong>{booking.technicianName || "N/A"}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={<Space><PhoneOutlined /> Số điện thoại</Space>}>
                  {booking.technicianPhone || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Kinh nghiệm">
                  {booking.technicianExperience ? `${booking.technicianExperience} năm` : "N/A"}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="Chưa phân công kỹ thuật viên" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          {/* Booking Details */}
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>Chi tiết đặt lịch</span>
              </Space>
            }
          >
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Ngày hẹn">
                {dayjs.utc(booking.desiredDate).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {dayjs(booking.dateCreated).format("DD/MM/YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả vấn đề">
                <Paragraph style={{ margin: 0 }}>
                  {booking.problemDescription || "Không có mô tả"}
                </Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú">
                <Paragraph style={{ margin: 0 }}>
                  {booking.notes || "Không có ghi chú"}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Services List */}
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Dịch vụ yêu cầu:
              </Text>
              {booking.items && booking.items.length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {booking.items.map((item, index) => (
                    <Card key={index} size="small" style={{ backgroundColor: "#fafafa" }}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Text strong>{item.serviceName || `Dịch vụ ${index + 1}`}</Text>
                        <Text type="secondary">
                          Giá:{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(item.price || 0)}
                        </Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Empty description="Không có dịch vụ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>

            <Divider />

            <div style={{ textAlign: "right" }}>
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text>Tổng cộng:</Text>
                  <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(booking.totalPrice || 0)}
                  </Title>
                </div>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Right Column - Payment & Rating */}
        <Col xs={24} lg={12}>
          {/* Payment Information */}
          <Card
            title={
              <Space>
                <CreditCardOutlined />
                <span>Thông tin thanh toán</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            loading={loadingPayment}
          >
            {payment ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Mã thanh toán">
                  <Text code>{payment.sePayOrderId || payment.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền">
                  <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(payment.amount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phương thức">
                  {getPaymentMethodText(payment.paymentMethod)}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={getPaymentStatusColor(payment.status)}>
                    {getPaymentStatusText(payment.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {dayjs(payment.dateCreated).format("DD/MM/YYYY HH:mm")}
                </Descriptions.Item>
                {payment.paidAt && (
                  <Descriptions.Item label="Ngày thanh toán">
                    {dayjs(payment.paidAt).format("DD/MM/YYYY HH:mm")}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Empty description="Chưa có thông tin thanh toán" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          {/* Rating Information */}
          {booking.status === BookingStatus.Completed && (
            <Card
              title={
                <Space>
                  <StarOutlined />
                  <span>Đánh giá & Phản hồi</span>
                </Space>
              }
            >
              {/* Feedback từ Khách hàng */}
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  <UserOutlined /> Khách hàng đánh giá:
                </Text>
                {customerFeedback ? (
                  <Space direction="vertical" style={{ width: "100%" }} size="small">
                    <div>
                      <Rate disabled value={customerFeedback.rating} />
                      <Text strong style={{ marginLeft: 8 }}>
                        {customerFeedback.rating}/5
                      </Text>
                    </div>
                    {customerFeedback.comment && (
                      <Paragraph
                        style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: "#fafafa",
                          borderRadius: 8,
                        }}
                      >
                        {customerFeedback.comment}
                      </Paragraph>
                    )}
                  </Space>
                ) : (
                  <Text type="secondary" italic>Khách hàng chưa đánh giá</Text>
                )}
              </div>

              <Divider />

              {/* Feedback từ Kỹ thuật viên */}
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  <ToolOutlined /> Kỹ thuật viên đánh giá:
                </Text>
                {technicianFeedback ? (
                  <Space direction="vertical" style={{ width: "100%" }} size="small">
                    <div>
                      <Rate disabled value={technicianFeedback.rating} />
                      <Text strong style={{ marginLeft: 8 }}>
                        {technicianFeedback.rating}/5
                      </Text>
                    </div>
                    {technicianFeedback.comment && (
                      <Paragraph
                        style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: "#f0f5ff",
                          borderRadius: 8,
                          border: "1px solid #adc6ff"
                        }}
                      >
                        {technicianFeedback.comment}
                      </Paragraph>
                    )}
                  </Space>
                ) : (
                  <Text type="secondary" italic>Kỹ thuật viên chưa đánh giá</Text>
                )}
              </div>
            </Card>
          )}

          {/* Booking Timeline */}
          <Card
            title="Lịch sử trạng thái"
            style={{ marginTop: 16 }}
          >
            <Timeline>
              <Timeline.Item color="blue">
                <Text strong>Tạo đơn</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(booking.dateCreated).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Timeline.Item>
              
              {booking.status >= BookingStatus.Confirmed && (
                <Timeline.Item color="green">
                  <Text strong>Đã xác nhận</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(booking.dateModified).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Timeline.Item>
              )}
              
              {booking.status === BookingStatus.InProgress && (
                <Timeline.Item color="processing">
                  <Text strong>Đang thực hiện</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(booking.dateModified).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Timeline.Item>
              )}
              
              {booking.status === BookingStatus.Completed && (
                <Timeline.Item color="green">
                  <Text strong>Hoàn thành</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(booking.completedAt || booking.dateModified).format("DD/MM/YYYY HH:mm")}
                  </Text>
                </Timeline.Item>
              )}
              
              {booking.status === BookingStatus.Cancelled && (
                <Timeline.Item color="red">
                  <Text strong>Đã hủy</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(booking.cancelledAt || booking.dateModified).format("DD/MM/YYYY HH:mm")}
                  </Text>
                  {booking.cancelReason && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Lý do: {booking.cancelReason}
                      </Text>
                    </>
                  )}
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
}