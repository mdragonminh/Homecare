import {
  DashboardOutlined,
  HomeOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Space, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

export default function AdminLayout({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith("/admin/dashboard")) return ["dashboard"];
    if (location.pathname.startsWith("/admin/accounts")) return ["accounts"];
    if (location.pathname.startsWith("/admin/home-services")) return ["homeservices"];
    if (location.pathname.startsWith("/admin/settings")) return ["settings"];
    return ["dashboard"];
  }, [location.pathname]);

  if (!loggedInUser || loggedInUser.role !== "admin") {
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
          boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
          borderRight: "none",
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid #f0f0f0",
            background: "linear-gradient(135deg, #103af3ff 0%, #1140a7ff 100%)",
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
              <DashboardOutlined style={{ color: "#fff", fontSize: 18 }} />
            </div>
            {!collapsed && (
              <Title
                level={4}
                style={{ margin: 0, color: "#fff", fontWeight: 600 }}
              >
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
            if (key === "dashboard") navigate("/admin/dashboard");
            if (key === "accounts") navigate("/admin/accounts");
            if (key === "homeservices") navigate("/admin/home-services");
            if (key === "settings") navigate("/admin/settings");
          }}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: t("admin.menu.dashboard", "Dashboard"),
              style: { marginBottom: 4 },
            },
            {
              key: "accounts",
              icon: <TeamOutlined />,
              label: t("admin.menu.manage_accounts", "Manager Accounts"),
              style: { marginBottom: 4 },
            },
            {
              key: "homeservices",
              icon: <HomeOutlined  />,
              label: t("admin.menu.home_service_manage", "Manager Home Services"),
              style: { marginBottom: 4 },
            },
            {
              key: "settings",
              icon: <ToolOutlined />,
              label: t("admin.menu.settings", "Settings"),
              style: { marginBottom: 4 },
            },
          ]}
        />
      </Sider>

      <Layout style={{ background: "#f5f5f5" }}>
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
