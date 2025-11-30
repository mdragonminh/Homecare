import { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Descriptions,
  Avatar,
  Tag,
  Table,
  Space,
  Button,
  Spin,
  Empty,
  message,
} from "antd";
import {
  UserOutlined,
  CreditCardOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { paymentApi, getPaymentStatusText, getPaymentMethodText, getPaymentStatusColor } from "../../services/paymentApi";
import { homeApi } from "../../services/homeApi";
import { bookingApi } from "../../services/bookingApi";
import { adminApi } from "../../services/adminApi";
import dayjs from "dayjs";

export default function CustomerDetailModal({ visible, customer, onClose }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("info");
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [homes, setHomes] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);
  const [paymentPagination, setPaymentPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    if (visible && customer?.fullId) {
      if (activeTab === "payments") {
        loadPaymentHistory();
      } else if (activeTab === "info") {
        loadCustomerData();
      }
    }
  }, [visible, activeTab, customer, paymentPagination.current]);

  const loadCustomerData = async () => {
    if (!customer?.fullId) return;

    try {
      setLoadingCustomerData(true);

      const homesResult = await homeApi.getHomesByCustomerId(customer.fullId, 1, 100);
      if (homesResult.success && homesResult.data.items) {
        setHomes(homesResult.data.items);
      }

      // Load customer bookings count using admin endpoint
      const bookingsResult = await bookingApi.getAllBookingsForAdmin(1, 1);
      if (bookingsResult.success) {
        setTotalBookings(bookingsResult.data.totalCount || 0);
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
    } finally {
      setLoadingCustomerData(false);
    }
  };

  const loadPaymentHistory = async () => {
    if (!customer?.id) {
      console.log("No customer ID available");
      return;
    }

    try {
      setLoadingPayments(true);
      console.log("Loading payments for customer ID:", customer.fullId || customer.id);
      
      const result = await paymentApi.getAllPayments({
        customerId: customer.fullId || customer.id,
        pageNumber: paymentPagination.current,
        pageSize: paymentPagination.pageSize,
      });

      console.log("Payment API result:", result);

      if (result.success) {
        setPayments(result.data.items || []);
        setPaymentPagination((prev) => ({
          ...prev,
          total: result.data.totalCount || 0,
        }));
      } else {
        message.error(result.message || "Không thể tải lịch sử thanh toán");
      }
    } catch (error) {
      console.error("Load payment history error:", error);
      message.error("Lỗi khi tải lịch sử thanh toán");
    } finally {
      setLoadingPayments(false);
    }
  };

  const paymentColumns = [
    {
      title: "Mã thanh toán",
      dataIndex: "sePayOrderId",
      key: "sePayOrderId",
      width: 140,
      render: (code) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
          {code || "N/A"}
        </span>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 140,
      render: (method) => getPaymentMethodText(method),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {getPaymentStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "dateCreated",
      key: "dateCreated",
      width: 150,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Ngày thanh toán",
      dataIndex: "paidAt",
      key: "paidAt",
      width: 150,
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-"),
    },
  ];

  const tabItems = [
    {
      key: "info",
      label: (
        <span>
          <UserOutlined /> Thông tin khách hàng
        </span>
      ),
      children: customer ? (
        <Descriptions bordered column={1} style={{ marginTop: 16 }}>
          <Descriptions.Item label="Avatar">
            <Avatar
              src={customer.avatar ? adminApi.previewFile(customer.avatar) : null}
              icon={<UserOutlined />}
              size={64}
              style={{ backgroundColor: "#87d068" }}
            >
              {customer.name?.charAt(0)}
            </Avatar>
          </Descriptions.Item>
          <Descriptions.Item label="Họ và tên">
            {customer.name || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {customer.email || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {customer.phone || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">
            {loadingCustomerData ? (
              <Spin size="small" />
            ) : homes.length > 0 ? (
              <div>
                {homes.map((home, index) => (
                  <div key={home.id} style={{ marginBottom: index < homes.length - 1 ? 8 : 0 }}>
                    <Tag color="blue">{home.name}</Tag> {home.address}
                  </div>
                ))}
              </div>
            ) : (
              "Chưa có địa chỉ"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={customer.status === "active" ? "green" : "red"}>
              {customer.status === "active" ? "Hoạt động" : "Không hoạt động"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tham gia">
            {customer.joinDate || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng số dịch vụ">
            {customer.totalServices || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng số đặt lịch">
            {loadingCustomerData ? <Spin size="small" /> : totalBookings}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="Không có dữ liệu" />
      ),
    },
    {
      key: "payments",
      label: (
        <span>
          <CreditCardOutlined /> Lịch sử thanh toán
        </span>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <Spin spinning={loadingPayments}>
            <Table
              columns={paymentColumns}
              dataSource={payments}
              rowKey="id"
              pagination={{
                current: paymentPagination.current,
                pageSize: paymentPagination.pageSize,
                total: paymentPagination.total,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} thanh toán`,
                onChange: (page, pageSize) => {
                  setPaymentPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize,
                  }));
                },
              }}
              scroll={{ x: 900 }}
              size="small"
              locale={{
                emptyText: "Chưa có lịch sử thanh toán",
              }}
            />
          </Spin>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Chi tiết khách hàng"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={900}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
}
