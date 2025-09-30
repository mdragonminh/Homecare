import { useMemo, useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Modal, Form, Input, Typography, message, Card, Space } from "antd";
import { 
  DashboardOutlined, 
  UserOutlined, 
  TeamOutlined, 
  PlusOutlined,
  MailOutlined,
  LockOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { adminApi } from "../../services/adminApi";

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

export default function AdminLayout({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Kiểm tra auth trong useEffect để tránh lỗi hook order
  useEffect(() => {
    if (!loggedInUser || loggedInUser.role !== "admin") {
      navigate("/login");
    }
  }, [loggedInUser, navigate]);

  if (!loggedInUser || loggedInUser.role !== "admin") {
    return null;
  }

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith("/admin/accounts")) return ["accounts"];
    if (location.pathname.startsWith("/admin/technicians")) return ["technicians"];
    return [];
  }, [location.pathname]);

  const onCreateOperator = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const res = await adminApi.createOperator(values);
      if (res.success) {
        message.success("Tạo operator thành công!");
        setOpenCreate(false);
        form.resetFields();
      } else {
        message.error(res.message || "Tạo operator thất bại");
      }
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed} 
        theme="light" 
        width={260}
        style={{ 
          boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
          borderRight: "none"
        }}
      >
        {/* Logo Section */}
        <div style={{ 
          padding: "24px 20px", 
          borderBottom: "1px solid #f0f0f0",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }}>
          <Space align="center">
            <div style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <DashboardOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            {!collapsed && (
              <Title level={4} style={{ margin: 0, color: "#fff", fontWeight: 600 }}>
                Admin Panel
              </Title>
            )}
          </Space>
        </div>

        {/* Navigation Menu */}
        <Menu 
          mode="inline" 
          selectedKeys={selectedKeys}
          style={{ borderRight: "none", marginTop: 8 }}
          onClick={({ key }) => {
            if (key === "accounts") navigate("/admin/accounts");
            if (key === "technicians") navigate("/admin/technicians");
          }}
          items={[
            { 
              key: "accounts", 
              icon: <TeamOutlined />, 
              label: "Quản lý tài khoản",
              style: { marginBottom: 4 }
            },
            { 
              key: "technicians", 
              icon: <UserOutlined />, 
              label: "Kỹ thuật viên",
              style: { marginBottom: 4 }
            },
          ]}
        />

        {/* Create Operator Button */}
        <div style={{ padding: "16px 20px", marginTop: "auto" }}>
          <Button 
            type="primary" 
            block 
            size="large"
            icon={<PlusOutlined />} 
            onClick={() => setOpenCreate(true)}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 8,
              height: 44,
              fontWeight: 500
            }}
          >
            {!collapsed && "Tạo Operator"}
          </Button>
        </div>
      </Sider>

      <Layout style={{ background: "#f5f5f5" }}>
        <Header style={{ 
          background: "#fff", 
          borderBottom: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "0 24px",
          display: "flex",
          alignItems: "center"
        }}>
          <Title level={3} style={{ margin: 0, color: "#262626" }}>
            🏠 Home Service Platform - Admin
          </Title>
        </Header>
        
        <Content style={{ 
          margin: "24px", 
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
        }}>
          <div style={{ padding: "24px" }}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: "#1890ff" }} />
            <span>Tạo tài khoản Operator</span>
          </Space>
        }
        open={openCreate}
        onOk={onCreateOperator}
        onCancel={() => {
          setOpenCreate(false);
          form.resetFields();
        }}
        okText="Tạo tài khoản"
        cancelText="Hủy bỏ"
        confirmLoading={loading}
        width={480}
        styles={{
          header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 16 },
          body: { paddingTop: 20 }
        }}
      >
        <Form 
          layout="vertical" 
          form={form} 
          initialValues={{ email: "", username: "", password: "" }}
          size="large"
        >
          <Form.Item 
            label="📧 Email" 
            name="email" 
            rules={[
              { required: true, message: "Vui lòng nhập email" }, 
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />}
              placeholder="operator@example.com" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          
          <Form.Item 
            label="👤 Username" 
            name="username" 
            rules={[
              { required: true, message: "Vui lòng nhập username" }, 
              { min: 3, message: 'Tối thiểu 3 ký tự' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="operator001" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          
          <Form.Item 
            label="🔒 Mật khẩu" 
            name="password" 
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" }, 
              { min: 8, message: 'Tối thiểu 8 ký tự' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="••••••••" 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
