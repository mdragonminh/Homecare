import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../../services/bookingApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const { RangePicker } = DatePicker;
const { Option } = Select;

const BookingStatus = {
  Draft: 0,
  Pending: 1,
  Confirmed: 2,
  InProgress: 3,
  Completed: 4,
  Cancelled: 5,
};

const getBookingStatusText = (status) => {
  const statusMap = {
    [BookingStatus.Draft]: "Nháp",
    [BookingStatus.Pending]: "Chờ xác nhận",
    [BookingStatus.Confirmed]: "Đã xác nhận",
    [BookingStatus.InProgress]: "Đang thực hiện",
    [BookingStatus.Completed]: "Hoàn thành",
    [BookingStatus.Cancelled]: "Đã hủy",
  };
  return statusMap[status] || "Không xác định";
};

const getBookingStatusColor = (status) => {
  const colorMap = {
    [BookingStatus.Draft]: "default",
    [BookingStatus.Pending]: "gold",
    [BookingStatus.Confirmed]: "blue",
    [BookingStatus.InProgress]: "processing",
    [BookingStatus.Completed]: "success",
    [BookingStatus.Cancelled]: "error",
  };
  return colorMap[status] || "default";
};

export default function OperatorBookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadBookings();
  }, [pagination.current, pagination.pageSize]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.current !== 1) {
        setPagination((prev) => ({ ...prev, current: 1 }));
      } else {
        loadBookings();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (pagination.current !== 1) {
      setPagination((prev) => ({ ...prev, current: 1 }));
    } else {
      loadBookings();
    }
  }, [dateRange]);

  const loadBookings = async () => {
    try {
      setLoading(true);

      const fromDate = dateRange ? dayjs(dateRange[0]).format("YYYY-MM-DD") : null;
      const toDate = dateRange ? dayjs(dateRange[1]).format("YYYY-MM-DD") : null;

      const response = await bookingApi.getAllBookingsForAdmin(
        pagination.current,
        pagination.pageSize,
        searchTerm || "",
        statusFilter !== "" ? parseInt(statusFilter) : null,
        fromDate,
        toDate
      );

      if (response?.success && response?.data?.items) {
        const bookingList = response.data.items.map((booking) => ({
          key: booking.id,
          id: booking.id,
          customerName: booking.customer?.fullName || booking.customer?.email || "N/A",
          customerId: booking.customerProfileId,
          technicianName: booking.technician?.fullName || booking.technician?.email || "Chưa phân công",
          technicianId: booking.technicianId,
          desiredDate: booking.desiredDate,
          status: booking.status,
          totalPrice: booking.totalPrice || 0,
          problemDescription: booking.problemDescription || "",
          dateCreated: booking.dateCreated,
        }));

        setBookings(bookingList);

        setPagination((prev) => ({
          ...prev,
          total: response.data.totalCount || 0,
        }));

        // Calculate statistics
        setStatistics({
          total: response.data.totalCount || 0,
          pending: bookingList.filter(
            (b) =>
              b.status === BookingStatus.Pending ||
              b.status === BookingStatus.Confirmed
          ).length,
          completed: bookingList.filter((b) => b.status === BookingStatus.Completed)
            .length,
          cancelled: bookingList.filter((b) => b.status === BookingStatus.Cancelled)
            .length,
        });
      } else {
        console.error("Invalid response structure:", response);
        message.error("Không thể tải danh sách đặt lịch");
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách đặt lịch");
      console.error("Load bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    navigate(`/operator/bookings/${record.id}`);
  };

  const handleTableChange = (paginationConfig) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: paginationConfig.total,
    });
  };

  const columns = [
    {
      title: "Mã đặt lịch",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => (
        <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
          {id.substring(0, 8)}...
        </span>
      ),
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
      width: 150,
    },
    {
      title: "Kỹ thuật viên",
      dataIndex: "technicianName",
      key: "technicianName",
      width: 150,
    },
    {
      title: "Ngày hẹn",
      dataIndex: "desiredDate",
      key: "desiredDate",
      width: 150,
      render: (date) => dayjs.utc(date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => {
        const dateA = dayjs.utc(a.desiredDate).valueOf();
        const dateB = dayjs.utc(b.desiredDate).valueOf();
        return dateA - dateB;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={getBookingStatusColor(status)}>
          {getBookingStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalPrice",
      key: "totalPrice",
      width: 120,
      render: (price) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Ngày tạo",
      dataIndex: "dateCreated",
      key: "dateCreated",
      width: 150,
      render: (date) => dayjs.utc(date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetails(record)}
          title="Xem chi tiết"
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
        >
          📅 Quản lý đặt lịch
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý toàn bộ lịch đặt dịch vụ của khách hàng
        </p>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ backgroundColor: "#f0f5ff" }}>
            <Statistic
              title="Tổng số đặt lịch"
              value={statistics.total}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ backgroundColor: "#fffbe6" }}>
            <Statistic
              title="Đang chờ"
              value={statistics.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ backgroundColor: "#f6ffed" }}>
            <Statistic
              title="Hoàn thành"
              value={statistics.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ backgroundColor: "#fff1f0" }}>
            <Statistic
              title="Đã hủy"
              value={statistics.cancelled}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%" }}
        >
          <Space wrap style={{ width: "100%" }}>
            <Input
              placeholder="Tìm kiếm theo khách hàng, kỹ thuật viên..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              <Option value="">Tất cả</Option>
              <Option value={BookingStatus.Pending}>Chờ xác nhận</Option>
              <Option value={BookingStatus.Confirmed}>Đã xác nhận</Option>
              <Option value={BookingStatus.InProgress}>Đang thực hiện</Option>
              <Option value={BookingStatus.Completed}>Hoàn thành</Option>
              <Option value={BookingStatus.Cancelled}>Đã hủy</Option>
            </Select>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ width: 260 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadBookings}
              loading={loading}
            >
              Tải lại
            </Button>
          </Space>
          <div style={{ color: "#8c8c8c", fontSize: "14px" }}>
            Hiển thị: {bookings.length} / Tổng số: {pagination.total} đặt lịch
          </div>
        </Space>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={bookings}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} đặt lịch`,
              onChange: handleTableChange,
            }}
            scroll={{ x: 1200 }}
            size="small"
          />
        </Spin>
      </Card>
    </div>
  );
}
