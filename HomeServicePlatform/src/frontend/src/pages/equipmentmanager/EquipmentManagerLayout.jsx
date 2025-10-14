import { useMemo, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { Layout, Menu, Typography, Space, Button } from "antd";
import {
  WrenchScrewdriverIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher.jsx";

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

export default function EquipmentManagerLayout({ loggedInUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  const selectedKeys = useMemo(() => {
    if (location.pathname.startsWith("/warehouse")) return ["warehouse"];
    if (location.pathname.startsWith("/equipments")) return ["equipments"];

    return ["warehouse"];
  }, [location.pathname]);

  if (!loggedInUser || loggedInUser.role !== "equipmentmanager") {
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
            background: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
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
              <WrenchScrewdriverIcon
                style={{ color: "#fff", fontSize: 18, width: 20, height: 20 }}
              />
            </div>
            {!collapsed && (
              <Title
                level={4}
                style={{ margin: 0, color: "#fff", fontWeight: 600 }}
              >
                {t("equipment.panel_title", "Equipment Manager")}
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
            if (key === "warehouse") navigate("/warehouse");
            if (key === "equipments") navigate("/warehouse/equipments");
          }}
          items={[
            {
              key: "warehouse",
              icon: <CubeIcon style={{ width: 16, height: 16 }} />,
              label: t("equipment.menu.warehouses", "Warehouses"),
              style: { marginBottom: 4 },
            },
            {
              key: "equipments",
              icon: <WrenchScrewdriverIcon style={{ width: 16, height: 16 }} />,
              label: t("equipment.menu.equipments", "Equipments"),
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
            🔧 {t("equipment.platform_title", "Equipment Management")}
          </Title>
          <Space>
            <LanguageSwitcher />
            <Button
              type="default"
              icon={<HomeIcon style={{ width: 16, height: 16 }} />}
              onClick={() => navigate("/")}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
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
