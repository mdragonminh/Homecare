import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Input,
  Select,
  message,
  Spin,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { accountApi } from "../../services/accountApi";

const { Search } = Input;
const { Option } = Select;

export default function OperatorCustomersPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Load customers data from API
  useEffect(() => {
    loadCustomers();
  }, [pagination.current, pagination.pageSize]);

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when searching
      setPagination((prev) => ({ ...prev, current: 1 }));
      loadCustomers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
      };

      if (searchTerm) {
        params.searchTerm = searchTerm;
      }

      const result = await accountApi.getCustomers(params);

      if (result.success) {
        const data = result.data;
        // API returns { data: [...], totalCount: x, pageNumber: x, pageSize: x, totalPages: x }
        const customerList = data.data || [];

        // Transform data to match the expected format
        const transformedCustomers = customerList.map((customer) => ({
          key: customer.id,
          id: customer.id?.substring(0, 8) + "..." || "N/A",
          name: customer.fullName || "N/A",
          email: customer.email || "N/A",
          phone: customer.phoneNumber || "N/A",
          address: "Chưa cập nhật", // CustomerProfile API doesn't return address
          status: "active", // Assume active since they are in the system
          joinDate: new Date(customer.dateCreated).toLocaleDateString("vi-VN"),
          totalServices: customer.totalHomes || 0, // Use totalHomes as service count
        }));

        setCustomers(transformedCustomers);
        setFilteredCustomers(transformedCustomers);

        // Update pagination with data from API response
        setPagination((prev) => ({
          ...prev,
          total: data.totalCount || 0,
          current: data.pageNumber || prev.current,
          pageSize: data.pageSize || prev.pageSize,
        }));
      } else {
        message.error(result.message || "Lỗi khi tải danh sách khách hàng");
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách khách hàng");
      console.error("Load customers error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on status (search is handled server-side)
  useEffect(() => {
    let filtered = customers;

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.status === statusFilter
      );
    }

    setFilteredCustomers(filtered);
  }, [statusFilter, customers]);

  const handleTableChange = (paginationConfig) => {
    setPagination({
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
      total: paginationConfig.total,
    });
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "name",
      key: "avatar",
      width: 60,
      render: (name) => (
        <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#87d068" }}>
          {name.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: "Tên khách hàng",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "joinDate",
      key: "joinDate",
      sorter: (a, b) => new Date(a.joinDate) - new Date(b.joinDate),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            disabled={record.status === "active" && record.totalServices > 0}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
        >
          👥 Quản lý khách hàng
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý thông tin và dịch vụ của khách hàng
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Search
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">Tất cả</Option>
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Không hoạt động</Option>
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadCustomers()}
            loading={loading}
          >
            Tải lại
          </Button>
          <div style={{ marginLeft: "auto", color: "#8c8c8c" }}>
            Hiển thị: {filteredCustomers.length} / Tổng số: {pagination.total}{" "}
            khách hàng
          </div>
        </div>
      </Card>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total:
                statusFilter !== "all"
                  ? filteredCustomers.length
                  : pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} khách hàng`,
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
