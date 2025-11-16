import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Tooltip,
  Divider,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { homeApi } from "../../services/homeServiceApi";

const { Option } = Select;
const { TextArea } = Input;

export default function ServiceManagementPage() {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    searchTerm: "",
    isDeleted: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [pagination.current, pagination.pageSize, filters.searchTerm, filters.isDeleted]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = {
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        Search: filters.searchTerm || undefined,
        IsDeleted: filters.isDeleted !== null ? filters.isDeleted : undefined,
      };

      const response = await homeApi.listHomeService(params);
      
      if (response.success) {
        setServices(response.data.items || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount || 0,
        }));
      } else {
        toast.error("Không thể tải danh sách dịch vụ");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Không thể tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = () => {
    setEditingService(null);
    setIsViewOnly(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleViewService = (service) => {
    setEditingService(service);
    setIsViewOnly(true);
    form.setFieldsValue(service);
    setShowModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setIsViewOnly(false);
    form.setFieldsValue(service);
    setShowModal(true);
  };

  const handleSaveService = async (values) => {
    try {
      setLoading(true);

      let response;
      if (editingService) {
        response = await homeApi.updateHomeService(editingService.id, values);
      } else {
        response = await homeApi.createHomeService(values);
      }

      if (response && response.success) {
        toast.success(
          editingService ? "Cập nhật dịch vụ thành công" : "Tạo dịch vụ thành công"
        );
        setShowModal(false);
        fetchServices();
      } else {
        toast.error(response?.message || "Lưu dịch vụ thất bại");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Lưu dịch vụ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleService = async (service) => {
    try {
      setLoading(true);
      const updateData = {
        name: service.name,
        price: service.price,
        description: service.description,
        isDeleted: !service.isDeleted, 
      };

      const response = await homeApi.updateHomeService(service.id, updateData);

      if (response && response.success) {
        toast.success(
          service.isDeleted ? "Kích hoạt dịch vụ thành công" : "Vô hiệu hóa dịch vụ thành công"
        );
        fetchServices();
      } else {
        toast.error(response?.message || "Thay đổi trạng thái dịch vụ thất bại");
      }
    } catch (error) {
      console.error("Error toggling service:", error);
      toast.error("Thay đổi trạng thái dịch vụ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      setLoading(true);
      const response = await homeApi.deleteHomeService(serviceId);

      if (response && response.success) {
        toast.success("Xóa dịch vụ thành công");
        fetchServices();
      } else {
        toast.error(response?.message || "Xóa dịch vụ thất bại");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Xóa dịch vụ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div style={{ fontWeight: 500 }}>{text}</div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Giá (VNĐ)",
      key: "price",
      render: (_, record) => (
        <div>
          {new Intl.NumberFormat("vi-VN").format(record.price)} VNĐ
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isDeleted",
      key: "isDeleted",
      render: (isDeleted) => (
        <Tag color={!isDeleted ? "green" : "red"}>
          {!isDeleted ? "Hoạt động" : "Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewService(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditService(record)}
            />
          </Tooltip>
          <Tooltip title={record.isDeleted ? "Kích hoạt" : "Vô hiệu hóa dịch vụ"}>
            <Popconfirm
              title={`Bạn có chắc muốn ${record.isDeleted ? "kích hoạt" : "vô hiệu hóa"} dịch vụ này?`}
              onConfirm={() => handleToggleService(record)}
            >
              <Button
                type="text"
                icon={record.isDeleted ? <CheckCircleOutlined /> : <StopOutlined />}
                style={{
                  color: record.isDeleted ? "#52c41a" : "#ff4d4f",
                }}
              />
            </Popconfirm>
          </Tooltip>
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
          🔧 Quản lý dịch vụ
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý các dịch vụ sửa chữa và bảo trì
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Input.Search
              placeholder="Tìm kiếm dịch vụ..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              onSearch={fetchServices}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Trạng thái"
              value={filters.isDeleted}
              onChange={(value) => setFilters({ ...filters, isDeleted: value })}
              allowClear
              style={{ width: "100%" }}
            >
              <Option value={false}>Hoạt động</Option>
              <Option value={true}>Tạm dừng</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateService}
              >
                Thêm dịch vụ
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchServices}
                loading={loading}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Services Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} dịch vụ`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>

      {/* Service Modal */}
      <Modal
        title={isViewOnly ? "Chi tiết dịch vụ" : (editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới")}
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveService}
          disabled={isViewOnly}
        >
          <Form.Item
            label="Tên dịch vụ"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={3} placeholder="Nhập mô tả dịch vụ" />
          </Form.Item>

          <Form.Item
            label="Giá (VNĐ)"
            name="price"
            rules={[{ required: true, message: "Vui lòng nhập giá" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              {!isViewOnly && (
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingService ? "Cập nhật" : "Tạo mới"}
                </Button>
              )}
              <Button onClick={() => setShowModal(false)}>
                {isViewOnly ? "Đóng" : "Hủy"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
