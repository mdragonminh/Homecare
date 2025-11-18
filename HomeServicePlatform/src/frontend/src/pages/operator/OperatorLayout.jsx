import { useMemo, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Layout, Menu, Button, Typography, Space } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  HomeOutlined,
  ToolOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

export default function OperatorLayout({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith("/operator/customers"))
      return ["customers"];
    if (location.pathname.startsWith("/operator/bookings"))
      return ["bookings"];
    if (location.pathname.startsWith("/operator/technicians"))
      return ["technicians"];
    if (location.pathname.startsWith("/operator/settings")) return ["settings"];
    return ["customers"];
  }, [location.pathname]);

  if (!loggedInUser || loggedInUser.role !== "operator") {
    return null;
  }

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={260}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
          borderRight: "none",
          zIndex: 100,
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid #f0f0f0",
            background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
          }}
        >
          <Space align="center">
            <div
              style={{
                width: 36,
                height: 36,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TeamOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            {!collapsed && (
              <Title
                level={4}
                style={{ margin: 0, color: "#fff", fontWeight: 600 }}
              >
                {t("operator.panel_title", "Operator Panel")}
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
            if (key === "customers") navigate("/operator/customers");
            if (key === "bookings") navigate("/operator/bookings");
            if (key === "technicians") navigate("/operator/technicians");
            if (key === "settings") navigate("/operator/settings");
          }}
          items={[
            {
              key: "customers",
              icon: <UserOutlined />,
              label: t("operator.menu.customers", "Customers"),
              style: { marginBottom: 4 },
            },
            {
              key: "bookings",
              icon: <CalendarOutlined />,
              label: t("operator.menu.bookings", "Bookings"),
              style: { marginBottom: 4 },
            },
            {
              key: "technicians",
              icon: <ToolOutlined />,
              label: t("operator.menu.tech", "Tech"),
              style: { marginBottom: 4 },
            },
            {
              key: "settings",
              icon: <SettingOutlined />,
              label: t("operator.menu.settings", "Operator Settings"),
              style: { marginBottom: 4 },
            },
          ]}
        />
      </Sider>

      <Layout
        style={{
          background: "#f5f5f5",
          marginLeft: collapsed ? 80 : 260,
          transition: "margin-left 0.2s ease",
        }}
      >
        <Header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Title level={3} style={{ margin: 0, color: "#262626" }}>
            🏠 {t("operator.platform_title", "Operator Dashboard")}
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
                fontWeight: 500,
              }}
            >
              {t("ui.back_to_home")}
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            margin: "24px",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ padding: "24px" }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
