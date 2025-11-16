import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Avatar,
  Badge,
  Descriptions,
  Tabs,
  Alert,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { adminApi } from "../../services/adminApi";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function AccountManagementPage() {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [suspendForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    searchTerm: "",
    role: "",
    isActive: null,
  });

  useEffect(() => {
    fetchAccounts();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: filters.searchTerm || undefined,
        role: filters.role || undefined,
        isActive: filters.isActive,
      };

      const response = await adminApi.getAccounts(params);
      
      if (response.success) {
        setAccounts(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount || 0,
        }));
      } else {
        toast.error("Không thể tải danh sách tài khoản");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAccount = (account) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
  };

  const handleSuspendAccount = (account) => {
    setSelectedAccount(account);
    suspendForm.resetFields();
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = async (values) => {
    try {
      setLoading(true);
      const response = await adminApi.suspendAccount(selectedAccount.id, values.reason);

      if (response.success) {
        toast.success("Khóa tài khoản thành công");
        setShowSuspendModal(false);
        fetchAccounts();
      } else {
        toast.error(response.message || "Khóa tài khoản thất bại");
      }
    } catch (error) {
      console.error("Error suspending account:", error);
      toast.error("Khóa tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspendAccount = async (accountId) => {
    try {
      setLoading(true);
      const response = await adminApi.unsuspendAccount(accountId);

      if (response.success) {
        toast.success("Khôi phục tài khoản thành công");
        fetchAccounts();
      } else {
        toast.error(response.message || "Khôi phục tài khoản thất bại");
      }
    } catch (error) {
      console.error("Error unsuspending account:", error);
      toast.error("Khôi phục tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "red",
      operator: "orange",
      technician: "blue",
      customer: "green",
    };
    return colors[role] || "default";
  };

  const getRoleText = (role) => {
    const texts = {
      admin: "Quản trị viên",
      operator: "Điều hành viên",
      technician: "Kỹ thuật viên",
      customer: "Khách hàng",
    };
    return texts[role] || role;
  };

  const columns = [
    {
      title: "Người dùng",
      key: "user",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={40}
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.fullName || record.username}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone) => phone || "Chưa cập nhật",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Badge
            status={record.isActive ? "success" : "error"}
            text={record.isActive ? "Hoạt động" : "Khóa"}
          />
          {record.isEmailVerified && (
            <Tag color="blue" size="small">
              Email đã xác thực
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Đăng nhập cuối",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (date) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "Chưa đăng nhập",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewAccount(record)}
            />
          </Tooltip>
          {record.isActive ? (
            <Tooltip title="Khóa tài khoản">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => handleSuspendAccount(record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Khôi phục tài khoản">
              <Popconfirm
                title="Bạn có chắc muốn khôi phục tài khoản này?"
                onConfirm={() => handleUnsuspendAccount(record.id)}
              >
                <Button
                  type="text"
                  style={{ color: "#52c41a" }}
                  icon={<CheckCircleOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
        >
          👥 Quản lý tài khoản
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý tài khoản người dùng và phân quyền
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Input.Search
              placeholder="Tìm kiếm theo tên, email..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              onSearch={fetchAccounts}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Vai trò"
              value={filters.role}
              onChange={(value) => setFilters({ ...filters, role: value })}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value="admin">Quản trị viên</Option>
              <Option value="operator">Điều hành viên</Option>
              <Option value="technician">Kỹ thuật viên</Option>
              <Option value="customer">Khách hàng</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Trạng thái"
              value={filters.isActive}
              onChange={(value) => setFilters({ ...filters, isActive: value })}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={true}>Hoạt động</Option>
              <Option value={false}>Khóa</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAccounts}
              loading={loading}
              style={{ width: "100%" }}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Accounts Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} tài khoản`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>

      {/* Account Detail Modal */}
      <Modal
        title="Chi tiết tài khoản"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedAccount && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="Thông tin cơ bản" key="info">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <Avatar
                  size={64}
                  src={selectedAccount.avatar}
                  icon={<UserOutlined />}
                />
                <div>
                  <h3 style={{ margin: 0 }}>
                    {selectedAccount.fullName || selectedAccount.username}
                  </h3>
                  <Tag color={getRoleColor(selectedAccount.role)}>
                    {getRoleText(selectedAccount.role)}
                  </Tag>
                  <Badge
                    status={selectedAccount.isActive ? "success" : "error"}
                    text={selectedAccount.isActive ? "Hoạt động" : "Khóa"}
                    style={{ marginLeft: 8 }}
                  />
                </div>
              </div>

              <Descriptions bordered column={2}>
                <Descriptions.Item label="Email" span={2}>
                  <Space>
                    <MailOutlined />
                    {selectedAccount.email}
                    {selectedAccount.isEmailVerified && (
                      <Tag color="blue" size="small">Đã xác thực</Tag>
                    )}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  <Space>
                    <PhoneOutlined />
                    {selectedAccount.phoneNumber || "Chưa cập nhật"}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(selectedAccount.dateCreated).format("DD/MM/YYYY HH:mm")}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Đăng nhập cuối">
                  <Space>
                    <CalendarOutlined />
                    {selectedAccount.lastLoginAt 
                      ? dayjs(selectedAccount.lastLoginAt).format("DD/MM/YYYY HH:mm")
                      : "Chưa đăng nhập"
                    }
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              {selectedAccount.suspendReason && (
                <Alert
                  message="Lý do khóa"
                  description={selectedAccount.suspendReason}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </TabPane>

            <TabPane tab="Thống kê hoạt động" key="stats">
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Card>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
                        {selectedAccount.totalBookings || 0}
                      </div>
                      <div style={{ color: "#666" }}>Tổng booking</div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
                        {selectedAccount.completedBookings || 0}
                      </div>
                      <div style={{ color: "#666" }}>Hoàn thành</div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>
                        {selectedAccount.averageRating || 0}
                      </div>
                      <div style={{ color: "#666" }}>Đánh giá trung bình</div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Suspend Account Modal */}
      <Modal
        title="Khóa tài khoản"
        open={showSuspendModal}
        onCancel={() => setShowSuspendModal(false)}
        footer={null}
      >
        <Alert
          message="Cảnh báo"
          description="Tài khoản sẽ bị khóa và không thể đăng nhập vào hệ thống."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={suspendForm}
          layout="vertical"
          onFinish={handleConfirmSuspend}
        >
          <Form.Item
            label="Lý do khóa"
            name="reason"
            rules={[{ required: true, message: "Vui lòng nhập lý do khóa" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập lý do khóa tài khoản..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit" loading={loading}>
                Khóa tài khoản
              </Button>
              <Button onClick={() => setShowSuspendModal(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
