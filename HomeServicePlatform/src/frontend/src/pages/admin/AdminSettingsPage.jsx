import { Input, Select, Tabs, Typography } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

export default function AdminSettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
        >
          ⚙️ Cài đặt hệ thống
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý cài đặt và cấu hình toàn hệ thống
        </p>
      </div>
    </div>
  );
}
