import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
} from "antd";
import {
  UserOutlined,
  ToolOutlined,
  CrownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { accountApi } from "../../services/accountApi";

const { TabPane } = Tabs;
const { confirm } = Modal;

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("operator");
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState([]);
  const [equipmentManagers, setEquipmentManagers] = useState([]);
  const [supporters, setSupporters] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [form] = Form.useForm();

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadData = async () => {
    await Promise.all([
      loadOperators(),
      loadEquipmentManagers(),
      loadSupporters(),
    ]);
  };

  const loadTabData = async () => {
    switch (activeTab) {
      case "operator":
        await loadOperators();
        break;
      case "equipment-manager":
        await loadEquipmentManagers();
        break;
      case "supporter":
        await loadSupporters();
        break;
    }
  };

  const loadOperators = async () => {
    try {
      setLoading(true);
      const result = await accountApi.getAccountsByRole("operator");

      if (result.success) {
        setOperators(result.data || []);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách operator");
    } finally {
      setLoading(false);
    }
  };

  const loadEquipmentManagers = async () => {
    try {
      setLoading(true);
      const result = await accountApi.getAccountsByRole("equipmentmanager");

      if (result.success) {
        setEquipmentManagers(result.data || []);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách quản lý thiết bị");
    } finally {
      setLoading(false);
    }
  };

  const loadSupporters = async () => {
    try {
      setLoading(true);
      const result = await accountApi.getAccountsByRole("supporter");

      if (result.success) {
        setSupporters(result.data || []);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách supporter");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await accountApi.getAccountStatistics();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    }
  };

  // Handle actions
  const handleCreate = async (values) => {
    try {
      setLoading(true);
      const result = await accountApi.createAccount(values);

      if (result.success) {
        message.success("Tạo tài khoản thành công!");
        setCreateModalVisible(false);
        form.resetFields();
        loadTabData();
        loadStatistics();
      } else {
        if (result.errors) {
          const antErrors = Object.keys(result.errors).map((key) => ({
            name: key.toLowerCase(), 
            errors: result.errors[key],
          }));

          form.setFields(antErrors);

          const generalError = antErrors.find(e => e.name === 'general');
          if (generalError) {
             message.error(generalError.errors[0]);
          }

        } else {
          message.error(result.message);
        }
        
      }
    } catch (error) {
      message.error("Lỗi khi tạo tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values) => {
    try {
      setLoading(true);
      const result = await accountApi.updateAccount(selectedAccount.id, values);

      if (result.success) {
        message.success("Cập nhật tài khoản thành công!");
        setEditModalVisible(false);
        setSelectedAccount(null);
        form.resetFields();
        loadTabData();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (record) => {
    confirm({
      title: "Xác nhận xóa tài khoản",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa tài khoản "${record.email}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const result = await accountApi.deleteAccount(record.id);
          if (result.success) {
            message.success("Xóa tài khoản thành công!");
            loadTabData();
            loadStatistics();
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error("Lỗi khi xóa tài khoản");
        }
      },
    });
  };

  const handleToggleStatus = async (record) => {
    try {
      let result;
      if (record.isActive) {
        result = await accountApi.disableAccount(record.id, {
          reason: "Vô hiệu hóa bởi admin",
        });
      } else {
        result = await accountApi.enableAccount(record.id);
      }

      if (result.success) {
        message.success(
          `${
            record.isActive ? "Vô hiệu hóa" : "Kích hoạt"
          } tài khoản thành công!`
        );
        loadTabData();
        loadStatistics();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi thay đổi trạng thái tài khoản");
    }
  };

  const managementAccountColumns = (role) => [
    {
      title: "Avatar",
      dataIndex: "fullName",
      key: "avatar",
      width: 60,
      render: (name) => (
        <Avatar
          icon={
            role === "operator" ? (
              <CrownOutlined />
            ) : role === "equipmentmanager" ? (
              <ToolOutlined />
            ) : (
              <UserOutlined />
            )
          }
          style={{
            backgroundColor:
              role === "operator"
                ? "#722ed1"
                : role === "equipmentmanager"
                ? "#52c41a"
                : "#fa8c16",
          }}
        />
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space>
          {/* <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            title="Xem chi tiết"
          /> */}
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            title="Chỉnh sửa"
            onClick={() => {
              setSelectedAccount(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          />
          <Button
            type="text"
            icon={record.isActive ? <DeleteOutlined /> : <ReloadOutlined />}
            size="small"
            title={record.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
            onClick={() => handleToggleStatus(record)}
          />
          {/* <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            title="Xóa"
            onClick={() => handleDelete(record)}
          /> */}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "operator",
      label: (
        <span>
          <CrownOutlined />
          Operator ({operators.length})
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Table
            columns={managementAccountColumns("operator")}
            dataSource={operators.map((item) => ({ ...item, key: item.id }))}
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
          />
        </Spin>
      ),
    },
    {
      key: "equipment-manager",
      label: (
        <span>
          <ToolOutlined />
          Quản lý thiết bị ({equipmentManagers.length})
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Table
            columns={managementAccountColumns("equipmentmanager")}
            dataSource={equipmentManagers.map((item) => ({
              ...item,
              key: item.id,
            }))}
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
          />
        </Spin>
      ),
    },
    {
      key: "supporter",
      label: (
        <span>
          <UserOutlined />
          Supporter ({supporters.length})
        </span>
      ),
      children: (
        <Spin spinning={loading}>
          <Table
            columns={managementAccountColumns("supporter")}
            dataSource={supporters.map((item) => ({ ...item, key: item.id }))}
            pagination={false}
            scroll={{ x: 1400 }}
            size="small"
          />
        </Spin>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              margin: 0,
              color: "#262626",
            }}
          >
            👥 Quản lý tài khoản quản trị
          </h1>
          <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
            Quản lý tài khoản Operator, Equipment Manager và Supporter
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            form.setFieldValue("role", "operator");
            setCreateModalVisible(true);
          }}
          style={{
            backgroundColor: "#1890ff",
            borderColor: "#1890ff",
            boxShadow: "0 2px 8px rgba(24, 144, 255, 0.2)",
          }}
        >
          Tạo tài khoản mới
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#1890ff" }}>
                {statistics.totalAccounts}
              </div>
              <div style={{ color: "#8c8c8c" }}>Tổng tài khoản quản lý</div>
            </Card>

            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#722ed1" }}>
                {statistics.operators?.total || 0}
              </div>
              <div style={{ color: "#8c8c8c" }}>
                Operator ({statistics.operators?.active || 0} hoạt động)
              </div>
            </Card>

            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#52c41a" }}>
                {statistics.equipmentManagers?.total || 0}
              </div>
              <div style={{ color: "#8c8c8c" }}>
                Quản lý thiết bị ({statistics.equipmentManagers?.active || 0}{" "}
                hoạt động)
              </div>
            </Card>

            <Card size="small" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#fa8c16" }}>
                {statistics.supporters?.total || 0}
              </div>
              <div style={{ color: "#8c8c8c" }}>
                Supporter ({statistics.supporters?.active || 0} hoạt động)
              </div>
            </Card>
          </div>
        </div>
      )}

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ margin: 0 }}
          tabBarStyle={{
            margin: 0,
            paddingLeft: 24,
            paddingRight: 24,
            borderBottom: "1px solid #f0f0f0",
          }}
        />
      </Card>

      {/* Create Account Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusOutlined style={{ color: "#1890ff" }} />
            <span>Tạo tài khoản quản trị mới</span>
          </div>
        }
        open={createModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        confirmLoading={loading}
        width={700}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ role: "operator" }}
        >
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="operator">Operator</Select.Option>
              <Select.Option value="equipmentmanager">
                Equipment Manager (Quản lý thiết bị)
              </Select.Option>
              <Select.Option value="supporter">Supporter</Select.Option>
            </Select>
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input placeholder="example@company.com" />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: "Vui lòng nhập username!" },
                {
                  pattern: /^[a-zA-Z0-9]+$/,
                  message: "Username chỉ được chứa chữ cái (a-z) và số (0-9), không chứa dấu cách.",
                }
              ]}
            >
              <Input placeholder="username123" />
            </Form.Item>
          </div>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
            ]}
          >
            <Input.Password placeholder="Tối thiểu 8 ký tự" />
          </Form.Item>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Form.Item name="fullName" label="Họ tên">
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item name="phoneNumber" label="Số điện thoại">
              <Input placeholder="0901234567" />
            </Form.Item>
          </div>

          <Form.Item name="department" label="Phòng ban">
            <Input placeholder="IT, HR, Admin, ..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        title="Chỉnh sửa tài khoản"
        open={editModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedAccount(null);
          form.resetFields();
        }}
        okText="Cập nhật"
        cancelText="Hủy"
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="fullName" label="Họ tên">
            <Input />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item name="department" label="Phòng ban">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
