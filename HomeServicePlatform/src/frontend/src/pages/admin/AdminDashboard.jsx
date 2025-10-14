import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Progress, Table, Tag } from "antd";
import {
  UserOutlined,
  ToolOutlined,
  ShopOutlined,
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);

  // Mock data
  const monthlyData = [
    { name: "Thg 1", users: 120, services: 89, revenue: 4500 },
    { name: "Thg 2", users: 180, services: 134, revenue: 6200 },
    { name: "Thg 3", users: 240, services: 178, revenue: 8100 },
    { name: "Thg 4", users: 320, services: 245, revenue: 11200 },
    { name: "Thg 5", users: 450, services: 320, revenue: 15600 },
    { name: "Thg 6", users: 580, services: 410, revenue: 19800 },
  ];

  const userTypeData = [
    { name: "Khách hàng", value: 580, color: "#8884d8" },
    { name: "Kỹ thuật viên", value: 42, color: "#82ca9d" },
    { name: "Operator", value: 8, color: "#ffc658" },
  ];

  const recentActivities = [
    {
      key: "1",
      activity: "Kỹ thuật viên mới đăng ký",
      user: "Nguyễn Văn A",
      time: "5 phút trước",
      status: "pending",
    },
    {
      key: "2",
      activity: "Hoàn thành dịch vụ sửa chữa",
      user: "Trần Thị B",
      time: "15 phút trước",
      status: "success",
    },
    {
      key: "3",
      activity: "Yêu cầu dịch vụ mới",
      user: "Lê Minh C",
      time: "1 giờ trước",
      status: "pending",
    },
    {
      key: "4",
      activity: "Thanh toán thành công",
      user: "Phạm Thị D",
      time: "2 giờ trước",
      status: "success",
    },
  ];

  const activityColumns = [
    {
      title: "Hoạt động",
      dataIndex: "activity",
      key: "activity",
    },
    {
      title: "Người dùng",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "success" ? "green" : "orange"}>
          {status === "success" ? "Thành công" : "Đang xử lý"}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
        >
          📊 Dashboard Admin
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Tổng quan về hệ thống và các chỉ số quan trọng
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={630}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#3f8600" }}
              suffix={
                <span style={{ fontSize: 14, color: "#52c41a" }}>(+12%)</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Kỹ thuật viên"
              value={42}
              prefix={<ToolOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix={
                <span style={{ fontSize: 14, color: "#1890ff" }}>(+5)</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dịch vụ hoàn thành"
              value={410}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
              suffix={
                <span style={{ fontSize: 14, color: "#722ed1" }}>(+28)</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu (triệu VNĐ)"
              value={19.8}
              prefix={<RiseOutlined />}
              valueStyle={{ color: "#eb2f96" }}
              precision={1}
              suffix={
                <span style={{ fontSize: 14, color: "#eb2f96" }}>(+25%)</span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Xu hướng tăng trưởng" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Người dùng"
                />
                <Area
                  type="monotone"
                  dataKey="services"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Dịch vụ"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bố người dùng" style={{ height: 400 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card title="Hiệu suất hệ thống" style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={87}
              format={(percent) => `${percent}%`}
              strokeColor="#52c41a"
            />
            <div style={{ marginTop: 16, color: "#8c8c8c" }}>
              Tình trạng hoạt động tốt
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="Tỷ lệ hoàn thành dịch vụ"
            style={{ textAlign: "center" }}
          >
            <Progress
              type="circle"
              percent={94}
              format={(percent) => `${percent}%`}
              strokeColor="#1890ff"
            />
            <div style={{ marginTop: 16, color: "#8c8c8c" }}>
              Chất lượng dịch vụ tốt
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Độ hài lòng khách hàng" style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={91}
              format={(percent) => `${percent}%`}
              strokeColor="#722ed1"
            />
            <div style={{ marginTop: 16, color: "#8c8c8c" }}>
              Đánh giá tích cực
            </div>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Doanh thu theo tháng (Triệu VNĐ)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#eb2f96"
                  strokeWidth={2}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Hoạt động gần đây">
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
