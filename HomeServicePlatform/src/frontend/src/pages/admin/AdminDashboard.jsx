import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Progress, Table, Tag, DatePicker, Select, Button } from "antd";
import {
  UserOutlined,
  ToolOutlined,
  ShopOutlined,
  RiseOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CalendarOutlined,
  DollarOutlined,
  ReloadOutlined,
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
  BarChart,
  Bar,
} from "recharts";
import { bookingApi } from "../../services/bookingApi";
import { paymentApi, PaymentStatus } from "../../services/paymentApi";
import { adminApi } from "../../services/adminApi";
import { getFileMetadata } from "../../services/fileApi";
import { FeedbackSource } from "../../constants/enums";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    totalTechnicians: 0,
    activeTechnicians: 0,
    totalCustomers: 0,
  });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [chartData, setChartData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [customerSatisfaction, setCustomerSatisfaction] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [technicianPerformance, setTechnicianPerformance] = useState([]);

  const { RangePicker } = DatePicker;

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const fromDate = dateRange[0].startOf('day').format('YYYY-MM-DD');
      const toDate = dateRange[1].endOf('day').format('YYYY-MM-DD HH:mm:ss');

      const bookingsResponse = await bookingApi.getAllBookingsForAdmin(
        1, 
        1000, 
        "", 
        null, 
        fromDate, 
        toDate
      );

      const paymentsResponse = await paymentApi.getAllPayments({
        pageNumber: 1,
        pageSize: 1000,
        fromDate,
        toDate
      });

      const techniciansResponse = await adminApi.getTechnicians({
        pageNumber: 1,
        pageSize: 1000
      });

      if (bookingsResponse.success) {
        const bookings = bookingsResponse.data.items || [];
        const completedCount = bookings.filter(b => b.status === 4 || b.status === 'Completed').length;
        const pendingCount = bookings.filter(b => 
          b.status === 0 || b.status === 1 || b.status === 2 || b.status === 3 ||
          b.status === 'Pending' || b.status === 'Confirmed' || b.status === 'TechnicianOnTheWay' || b.status === 'InProgress'
        ).length;
        const cancelledCount = bookings.filter(b => b.status === 5 || b.status === 'Cancelled').length;

        const chartDataMap = {};
        bookings.forEach(booking => {
          const date = dayjs(booking.dateCreated).format('YYYY-MM-DD');
          if (!chartDataMap[date]) {
            chartDataMap[date] = { date, bookings: 0, completed: 0, revenue: 0 };
          }
          chartDataMap[date].bookings++;
          if (booking.status === 4 || booking.status === 'Completed') {
            chartDataMap[date].completed++;
          }
        });

        if (paymentsResponse.success) {
          const payments = paymentsResponse.data.items || [];
          const totalRevenue = payments
            .filter(p => p.status === PaymentStatus.Completed)
            .reduce((sum, p) => sum + p.amount, 0);

          payments.forEach(payment => {
            const date = dayjs(payment.dateCreated).format('YYYY-MM-DD');
            if (chartDataMap[date] && payment.status === PaymentStatus.Completed) {
              chartDataMap[date].revenue += payment.amount;
            }
          });

          setDashboardData(prev => ({
            ...prev,
            totalRevenue
          }));
        }

        const chartArray = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));
        setChartData(chartArray);

        const totalBookingsCount = bookings.length;
        const completionPercentage = totalBookingsCount > 0 
          ? Math.round((completedCount / totalBookingsCount) * 100)
          : 0;
        setCompletionRate(completionPercentage);

        const bookingsWithCustomerFeedback = bookings
            .map(b => b.feedbacks?.find(f => f.source === FeedbackSource.Customer))
            .filter(f => f !== undefined && f !== null);

        if (bookingsWithCustomerFeedback.length > 0) {
            const totalRating = bookingsWithCustomerFeedback.reduce((sum, f) => sum + f.rating, 0);
            const avgRating = totalRating / bookingsWithCustomerFeedback.length;
              const satisfactionPercentage = Math.round((avgRating / 5) * 100);
              setCustomerSatisfaction(satisfactionPercentage);
            } else {
              setCustomerSatisfaction(0);
            }

        setBookingStatusData([
          { name: 'Hoàn thành', value: completedCount, color: '#52c41a' },
          { name: 'Đang xử lý', value: pendingCount, color: '#1890ff' },
          { name: 'Đã hủy', value: cancelledCount, color: '#ff4d4f' }
        ]);

        setDashboardData(prev => ({
          ...prev,
          totalBookings: bookings.length,
          completedBookings: completedCount,
          pendingBookings: pendingCount,
          cancelledBookings: cancelledCount
        }));
      }

      if (techniciansResponse.success) {
        const technicians = techniciansResponse.data.items || [];
        const activeTechnicians = technicians.filter(t => 
          t.approvalStatus === 1 || t.approvalStatus === 'Approved'
        ).length;
        
        setDashboardData(prev => ({
          ...prev,
          totalTechnicians: technicians.length,
          activeTechnicians
        }));

        if (bookingsResponse.success) {
          const bookings = bookingsResponse.data.items || [];
          const payments = paymentsResponse.success ? (paymentsResponse.data.items || []) : [];
          
          const techPerformanceMap = {};
          
          technicians.forEach(tech => {
            techPerformanceMap[tech.id] = {
              id: tech.id,
              name: tech.fullName || tech.userName || 'Unknown',
              email: tech.email || 'Unknown',
              totalBookings: 0,
              completedBookings: 0,
              totalRevenue: 0,
              totalServiceTime: 0,
            };
          });

          bookings.forEach(booking => {
            if (booking.technicianId && techPerformanceMap[booking.technicianId]) {
              const tech = techPerformanceMap[booking.technicianId];
              tech.totalBookings++;
              
              if (booking.status === 4 || booking.status === 'Completed') {
                tech.completedBookings++;
                
                const bookingPayments = payments.filter(p => 
                  p.bookingId === booking.id && 
                  p.status === PaymentStatus.Completed
                );
                tech.totalRevenue += bookingPayments.reduce((sum, p) => sum + p.amount, 0);
              }
            }
          });

          // Fetch file relations to calculate actual service times from CheckIn/CheckOut proofs
          const fetchServiceTimes = async () => {
            for (const booking of bookings) {
              if (booking.technicianId && techPerformanceMap[booking.technicianId] && 
                  (booking.status === 4 || booking.status === 'Completed')) {
                try {
                  const checkInFiles = await getFileMetadata({
                    objectTypeName: 'booking',
                    objectId: booking.id,
                    relationType: 'CheckInProof'
                  });

                  const checkOutFiles = await getFileMetadata({
                    objectTypeName: 'booking',
                    objectId: booking.id,
                    relationType: 'CheckOutProof'
                  });

                  if (checkInFiles && checkInFiles.length > 0 && checkOutFiles && checkOutFiles.length > 0) {
                    const checkInTime = dayjs(checkInFiles[0].dateCreated);
                    const checkOutTime = dayjs(checkOutFiles[0].dateCreated);
                    const serviceTimeMinutes = checkOutTime.diff(checkInTime, 'minute');
                    
                    if (serviceTimeMinutes > 0) {
                      techPerformanceMap[booking.technicianId].totalServiceTime += serviceTimeMinutes;
                    }
                  }
                } catch (error) {
                  console.error(`Error fetching file relations for booking ${booking.id}:`, error);
                }
              }
            }

            const techPerformanceArray = Object.values(techPerformanceMap)
              .filter(tech => tech.totalBookings > 0)
              .sort((a, b) => b.totalRevenue - a.totalRevenue);
            
            setTechnicianPerformance(techPerformanceArray);
          };

          fetchServiceTimes();
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1
              style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
            >
              📊 Dashboard Admin
            </h1>
            <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
              Tổng quan về hệ thống và các chỉ số quan trọng
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange(dates);
                } else {
                  setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
                }
              }}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear={false}
            />
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchDashboardData}
              loading={loading}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng Booking"
              value={dashboardData.totalBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Kỹ thuật viên"
              value={dashboardData.activeTechnicians}
              prefix={<ToolOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix={
                <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                  /{dashboardData.totalTechnicians}
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Dịch vụ hoàn thành"
              value={dashboardData.completedBookings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Doanh thu (VNĐ)"
              value={dashboardData.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#eb2f96" }}
              formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Xu hướng Booking theo ngày" style={{ height: 400 }} loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => dayjs(value).format('DD/MM')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Tổng Booking"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Hoàn thành"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title="Tỷ lệ hoàn thành dịch vụ"
            style={{ textAlign: "center" }}
            loading={loading}
          >
            <div style={{ padding: "20px 0" }}>
              <Progress
                type="circle"
                percent={completionRate}
                format={(percent) => `${percent}%`}
                strokeColor="#1890ff"
                width={200}
              />
              <div style={{ marginTop: 16, fontSize: 16, color: "#8c8c8c" }}>
                {dashboardData.completedBookings} / {dashboardData.totalBookings} dịch vụ hoàn thành
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Độ hài lòng khách hàng" style={{ textAlign: "center" }} loading={loading}>
            <div style={{ padding: "20px 0" }}>
              <Progress
                type="circle"
                percent={customerSatisfaction}
                format={(percent) => `${percent}%`}
                strokeColor="#722ed1"
                width={200}
              />
              <div style={{ marginTop: 16, fontSize: 16, color: "#8c8c8c" }}>
                Đánh giá tích cực
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Doanh thu theo ngày (VNĐ)" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => dayjs(value).format('DD/MM')}
                />
                <YAxis 
                  tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
                />
                <Tooltip 
                  labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                  formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value), 'Doanh thu']}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="#eb2f96"
                  name="Doanh thu (VNĐ)"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="Hiệu suất & Doanh thu Kỹ thuật viên" 
            loading={loading}
            extra={
              <Tag color="blue">
                {technicianPerformance.length} kỹ thuật viên
              </Tag>
            }
          >
            <Table
              dataSource={technicianPerformance}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} kỹ thuật viên`
              }}
              scroll={{ x: 1000 }}
              columns={[
                {
                  title: 'Kỹ thuật viên',
                  dataIndex: 'name',
                  key: 'name',
                  width: 200,
                  render: (text, record) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{text}</div>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.email}</div>
                    </div>
                  ),
                },
                {
                  title: 'Doanh thu (VNĐ)',
                  dataIndex: 'totalRevenue',
                  key: 'totalRevenue',
                  width: 180,
                  align: 'right',
                  sorter: (a, b) => a.totalRevenue - b.totalRevenue,
                  render: (value) => (
                    <span style={{ fontWeight: 600, color: '#eb2f96' }}>
                      {new Intl.NumberFormat('vi-VN').format(value)}
                    </span>
                  ),
                },
                {
                  title: 'Hiệu suất (Tổng thời gian)',
                  dataIndex: 'totalServiceTime',
                  key: 'totalServiceTime',
                  width: 180,
                  align: 'center',
                  sorter: (a, b) => a.totalServiceTime - b.totalServiceTime,
                  render: (value) => {
                    if (value === 0) return <span style={{ color: '#8c8c8c' }}>N/A</span>;
                    
                    const hours = Math.floor(value / 60);
                    const minutes = value % 60;
                    const days = Math.floor(hours / 24);
                    const remainingHours = hours % 24;
                    
                    let displayText = '';
                    if (days > 0) {
                      displayText = `${days}d ${remainingHours}h ${minutes}m`;
                    } else if (hours > 0) {
                      displayText = `${hours}h ${minutes}m`;
                    } else {
                      displayText = `${minutes}m`;
                    }
                    
                    let color = '#52c41a';
                    if (value > 1440) color = '#ff4d4f'; 
                    else if (value > 480) color = '#faad14'; 
                    
                    return (
                      <Tag color={color}>
                        {displayText}
                      </Tag>
                    );
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
