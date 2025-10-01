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
  UserAddOutlined,
  HomeOutlined
} from "@ant-design/icons";
import { adminApi } from "../../services/adminApi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

export default function AdminLayout({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith("/admin/accounts")) return ["accounts"];
    if (location.pathname.startsWith("/admin/technicians")) return ["technicians"];
    return ["accounts"];
  }, [location.pathname]);

  if (!loggedInUser || loggedInUser.role !== "admin") {
    return null;
  }

  const onCreateOperator = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const res = await adminApi.createOperator(values);
      if (res.success) {
        message.success(t("admin.create_operator_success"));
        setOpenCreate(false);
        form.resetFields();
      } else {
        message.error(res.message || t("admin.create_operator_failed"));
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
          background: "linear-gradient(135deg, #103af3ff 0%, #1140a7ff 100%)"
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
                {t("admin.panel_title")}
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
              label: t("admin.menu.account_management"),
              style: { marginBottom: 4 }
            },
            { 
              key: "technicians", 
              icon: <UserOutlined />, 
              label: t("admin.menu.technicians"),
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
              background: "linear-gradient(135deg, #103af3ff 0%, #1140a7ff 100%)",
              border: "none",
              borderRadius: 8,
              height: 44,
              fontWeight: 500
            }}
          >
            {!collapsed && t("admin.create_operator")}
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
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Title level={3} style={{ margin: 0, color: "#262626" }}>
            🏠 {t("admin.platform_title")}
          </Title>
          <Space>
            <LanguageSwitcher />
            <Button 
              type="default"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 500
              }}
            >
              {t("ui.back_to_home")}
            </Button>
          </Space>
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
            <span>{t("admin.create_operator_account")}</span>
          </Space>
        }
        open={openCreate}
        onOk={onCreateOperator}
        onCancel={() => {
          setOpenCreate(false);
          form.resetFields();
        }}
        okText={t("admin.create_account")}
        cancelText={t("ui.cancel")}
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
            label={`📧 ${t("form.label.email")}`}
            name="email" 
            rules={[
              { required: true, message: t("validation.email_required") }, 
              { type: 'email', message: t("validation.email_invalid") }
            ]}
          >
            <Input 
              prefix={<MailOutlined />}
              placeholder={t("form.placeholder.operator_email")}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          
          <Form.Item 
            label={`👤 ${t("form.label.username")}`}
            name="username" 
            rules={[
              { required: true, message: t("validation.username_required") }, 
              { min: 3, message: t("validation.username_min") }
            ]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder={t("form.placeholder.operator_username")}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
          
          <Form.Item 
            label={`🔒 ${t("form.label.password")}`}
            name="password" 
            rules={[
              { required: true, message: t("validation.password_required") }, 
              { min: 8, message: t("validation.password_min") }
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
