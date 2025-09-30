import { Card, Empty } from "antd";

export default function TechniciansPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}>
          🔧 Quản lý Kỹ thuật viên
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý và duyệt hồ sơ kỹ thuật viên
        </p>
      </div>

      <Card style={{ borderRadius: 12, textAlign: "center", minHeight: 300 }}>
        <Empty 
          description="Tính năng đang được phát triển"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
}
