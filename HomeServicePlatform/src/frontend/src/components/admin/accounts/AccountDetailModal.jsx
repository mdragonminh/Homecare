import { Avatar, Button, Descriptions, Modal, Tag, Space, Typography, Tabs, Table, Spin, Rate, Empty, message } from "antd";
import { UserOutlined, FileTextOutlined, CreditCardOutlined, HomeOutlined, CalendarOutlined, IdcardOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { homeApi } from "../../../services/homeApi";
import { bookingApi } from "../../../services/bookingApi";
import { paymentApi, getPaymentStatusText, getPaymentMethodText, getPaymentStatusColor } from "../../../services/paymentApi";
import { adminApi } from "../../../services/adminApi";
import { toast } from "sonner";

const { Text } = Typography;

export default function AccountDetailModal({ visible, account, onClose, accountType }) {
  const [activeTab, setActiveTab] = useState("info");
  const [homes, setHomes] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [payments, setPayments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentPagination, setPaymentPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    if (visible && account) {
      if (accountType === "customer" && activeTab === "info") {
        loadCustomerData();
      } else if (accountType === "customer" && activeTab === "payments") {
        loadPaymentHistory();
      }
    }
  }, [visible, account, activeTab, accountType, paymentPagination.current]);

  const loadCustomerData = async () => {
    if (!account?.id) return;
    
    try {
      setLoadingData(true);
      
      const homesResult = await homeApi.getHomesByCustomerId(account.id, 1, 100);
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
      setLoadingData(false);
    }
  };

  const loadPaymentHistory = async () => {
    if (!account?.id) return;

    try {
      setLoadingPayments(true);
      const result = await paymentApi.getAllPayments({
        customerId: account.id,
        pageNumber: paymentPagination.current,
        pageSize: paymentPagination.pageSize,
      });

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

  const handlePreviewFile = (filePath) => {
    if (!filePath) return;
    const previewUrl = adminApi.previewFile(filePath);
    window.open(previewUrl, "_blank");
  };

  const renderApprovalStatus = (status) => {
    const statusMap = {
      0: { color: "warning", text: "Chờ phê duyệt" },
      1: { color: "success", text: "Đã phê duyệt" },
      2: { color: "error", text: "Từ chối" },
      Pending: { color: "warning", text: "Chờ phê duyệt" },
      Approved: { color: "success", text: "Đã phê duyệt" },
      Rejected: { color: "error", text: "Từ chối" },
    };
    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
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

  // Render Customer Detail with Tabs
  const renderCustomerDetail = () => {
    const tabItems = [
      {
        key: "info",
        label: (
          <span>
            <UserOutlined /> Thông tin khách hàng
          </span>
        ),
        children: (
          <Descriptions bordered column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="Avatar">
              <Avatar
                src={account.avatar ? adminApi.previewFile(account.avatar) : null}
                icon={<UserOutlined />}
                size={64}
                style={{ backgroundColor: "#87d068" }}
              >
                {account.fullName?.charAt(0)}
              </Avatar>
            </Descriptions.Item>
            <Descriptions.Item label="Họ và tên">
              {account.fullName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {account.email || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {account.phoneNumber || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">
              {loadingData ? (
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
              <Tag color={account.isActive ? "green" : "red"}>
                {account.isActive ? "Hoạt động" : "Không hoạt động"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {dayjs(account.createdAt || account.dateCreated).format("DD/MM/YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng số đặt lịch">
              {loadingData ? <Spin size="small" /> : totalBookings}
            </Descriptions.Item>
          </Descriptions>
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

    return <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />;
  };

  // Render Technician Detail
  const renderTechnicianDetail = () => {
    return (
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Avatar">
          <Avatar
            src={account.avatar?.[0] ? adminApi.previewFile(account.avatar[0].filePath) : null}
            icon={<UserOutlined />}
            size={64}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Họ và tên">
          {account.fullName || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {account.email || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {account.phoneNumber || "N/A"}
        </Descriptions.Item>
        {account.citizenId && (
          <Descriptions.Item label="CCCD/CMND">
            {account.citizenId}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Kinh nghiệm">
          {account.experienceYears || 0} năm
        </Descriptions.Item>
        <Descriptions.Item label="Đánh giá">
          <Space>
            <Rate disabled value={account.rating || 0} allowHalf />
            <span>({account.rating || 0}/5 - {account.ratingCount || 0} đánh giá)</span>
          </Space>
        </Descriptions.Item>
        {account.approvalStatus !== undefined && account.approvalStatus !== null && (
          <Descriptions.Item label="Trạng thái phê duyệt">
            {renderApprovalStatus(account.approvalStatus)}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Trạng thái tài khoản">
          <Tag color={account.isActive ? "success" : "error"}>
            {account.isActive ? "Hoạt động" : "Vô hiệu hóa"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {dayjs(account.createdAt || account.dateCreated).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>

        {/* Services */}
        {account.services && account.services.length > 0 && (
          <Descriptions.Item label="Dịch vụ">
            <Space wrap>
              {account.services.map((service) => (
                <Tag color="blue" key={service.id || service}>
                  {typeof service === "object" ? service.name : service}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
        )}

        {/* Certificate Files */}
        {account.certificateFiles && account.certificateFiles.length > 0 && (
          <Descriptions.Item label="Chứng chỉ">
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              {account.certificateFiles.map((file, index) => (
                <div
                  key={file.id}
                  style={{
                    padding: 12,
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 24 }}>📜</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{file.fileName}</div>
                    <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                      Chứng chỉ #{index + 1}
                    </div>
                  </div>
                  <Button
                    size="small"
                    type="text"
                    onClick={() => handlePreviewFile(file.filePath)}
                    style={{
                      padding: "4px 12px",
                      height: "auto",
                      color: "#722ed1",
                      fontWeight: 500,
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                    }}
                  >
                    Xem
                  </Button>
                </div>
              ))}
            </Space>
          </Descriptions.Item>
        )}

        {/* Legal Document */}
        {account.legalDocument && account.legalDocument.length > 0 && (
          <Descriptions.Item label="Giấy tờ pháp lý (CCCD/CMND)">
            <div
              style={{
                padding: 12,
                border: "1px solid #e9d8fd",
                borderRadius: 8,
                backgroundColor: "#f9f0ff",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 24 }}>🆔</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>
                  {account.legalDocument[0].fileName}
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                  Giấy tờ tùy thân
                </div>
              </div>
              <Button
                size="small"
                type="text"
                onClick={() => handlePreviewFile(account.legalDocument[0].filePath)}
                style={{
                  padding: "4px 12px",
                  height: "auto",
                  color: "#722ed1",
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid #d9d9d9",
                }}
              >
                Xem
              </Button>
            </div>
          </Descriptions.Item>
        )}
      </Descriptions>
    );
  };

  // Render default (staff) detail
  const renderStaffDetail = () => {
    return (
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Avatar">
          <Avatar
            src={account.avatar}
            icon={<UserOutlined />}
            size={64}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Họ và tên">
          {account.fullName || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Tên tài khoản">
          {account.userName || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {account.email || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {account.phoneNumber || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái tài khoản">
          <Tag color={account.isActive ? "success" : "error"}>
            {account.isActive ? "Hoạt động" : "Vô hiệu hóa"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {dayjs(account.createdAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
      </Descriptions>
    );
  };

  return (
    <Modal
      title="Chi tiết tài khoản"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={accountType === "customer" ? 900 : 700}
      destroyOnClose
    >
      {account && (
        <>
          {accountType === "customer" ? renderCustomerDetail() : 
           accountType === "technician" ? renderTechnicianDetail() : 
           renderStaffDetail()}
        </>
      )}
    </Modal>
  );
}
