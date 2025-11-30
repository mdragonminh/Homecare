import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Table,
  Space,
  Button,
  Form,
  Input,
  Select,
  message,
  Badge,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  UserOutlined,
  ToolOutlined,
  CrownOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { accountApi } from "../../services/accountApi";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../services/adminApi";
import { getCustomerColumns, getTechnicianColumns, getStaffColumns } from "../../components/admin/accounts/accountColumns";
import AccountDetailModal from "../../components/admin/accounts/AccountDetailModal";
import CreateAccountModal from "../../components/admin/accounts/CreateAccountModal";
import EditAccountModal from "../../components/admin/accounts/EditAccountModal";

export default function AccountsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("operator");
  const [loading, setLoading] = useState(false);

  // Data states for each role
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [operators, setOperators] = useState([]);
  const [equipmentManagers, setEquipmentManagers] = useState([]);
  const [supporters, setSupporters] = useState([]);

  const [statistics, setStatistics] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [form] = Form.useForm();

  // Technician filters
  const [technicianFilters, setTechnicianFilters] = useState({
    searchTerm: "",
    approvalStatus: undefined,
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab, pagination.current, pagination.pageSize]);

  // Reload technicians when filters change
  useEffect(() => {
    if (activeTab === "technician") {
      loadTechnicians();
    }
  }, [technicianFilters]);

  const loadTabData = async () => {
    switch (activeTab) {
      case "customer":
        await loadCustomers();
        break;
      case "technician":
        await loadTechnicians();
        break;
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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getAccounts({
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        role: "customer",
      });

      if (result.success) {
        setCustomers(result.data.items || []);
        setPagination((prev) => ({
          ...prev,
          total: result.data.totalCount || 0,
        }));
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getTechnicians({
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
        searchTerm: technicianFilters.searchTerm || undefined,
        approvalStatus: technicianFilters.approvalStatus,
      });

      if (result.success) {
        setTechnicians(result.data.items || []);
        setPagination((prev) => ({
          ...prev,
          total: result.data.totalCount || 0,
        }));
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách kỹ thuật viên");
    } finally {
      setLoading(false);
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
        const data = result.data;
        setStatistics({
          operatorCount: data.operators?.total || 0,
          equipmentManagerCount: data.equipmentManagers?.total || 0,
          supporterCount: data.supporters?.total || 0,
          totalAccounts: data.totalAccounts || 0,
          customerCount: data.customers?.total || 0,
          technicianCount: data.technicians?.total || 0,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    }
  };

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
          const generalError = antErrors.find((e) => e.name === "general");
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

  const handleToggleStatus = async (record) => {
    try {
      let result;
      const accountId = activeTab === "technician" 
        ? (record.userId || record.user?.id) 
        : (record.id || record.userId);
      
      if (record.isActive || record.user?.isActive) {
        result = await adminApi.suspendAccount(
          accountId,
          "Vô hiệu hóa bởi admin"
        );
      } else {
        result = await adminApi.unsuspendAccount(accountId);
      }

      if (result.success) {
        message.success(
          `${
            record.isActive || record.user?.isActive
              ? "Vô hiệu hóa"
              : "Kích hoạt"
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

  const handleApproveTechnician = async (technicianId) => {
    try {
      const result = await adminApi.approveTechnician(technicianId);
      if (result.success) {
        message.success("Phê duyệt kỹ thuật viên thành công!");
        loadTechnicians();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi phê duyệt");
    }
  };

  const handleRejectTechnician = async (technicianId) => {
    try {
      const result = await adminApi.rejectTechnician(technicianId);
      if (result.success) {
        message.success("Từ chối kỹ thuật viên thành công!");
        loadTechnicians();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error("Lỗi khi từ chối");
    }
  };

  const handleViewDetails = async (record) => {
    if (activeTab === "technician" && record.id) {
      try {
        const response = await adminApi.getTechnicianById(record.id);
        if (response.success) {
          setSelectedAccount(response.data);
        } else {
          message.error(response.message || "Không thể tải chi tiết");
          setSelectedAccount(record);
        }
      } catch (error) {
        console.error("Error getting technician details:", error);
        message.error("Lỗi khi tải chi tiết kỹ thuật viên");
        setSelectedAccount(record);
      }
    } else {
      setSelectedAccount(record);
    }
    setDetailModalVisible(true);
  };

  // Column definitions using imported functions
  const customerColumns = getCustomerColumns(handleViewDetails, handleToggleStatus);

  const technicianColumns = getTechnicianColumns(
    handleViewDetails,
    handleApproveTechnician,
    handleRejectTechnician,
    handleToggleStatus
  );

  // Staff columns (Operator, Equipment Manager, Supporter)
  const staffColumns = getStaffColumns(
    handleToggleStatus,
    setSelectedAccount,
    form,
    setEditModalVisible
  );

  const tabItems = [
    {
      key: "operator",
      label: (
        <span>
          <UserOutlined /> Operator
        </span>
      ),
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                form.setFieldValue("role", "operator");
                setCreateModalVisible(true);
              }}
            >
              Thêm Operator
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => loadOperators()}>
              Làm mới
            </Button>
          </Space>
          <Table
            columns={staffColumns}
            dataSource={operators}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </>
      ),
    },
    {
      key: "customer",
      label: (
        <span>
          <TeamOutlined /> Khách hàng
        </span>
      ),
      children: (
        <Table
          columns={customerColumns}
          dataSource={customers}
          rowKey={(record) => record.id || record.userId}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} khách hàng`,
            onChange: (page, pageSize) => {
              setPagination({
                current: page,
                pageSize,
                total: pagination.total,
              });
            },
          }}
          scroll={{ x: 1200 }}
        />
      ),
    },
    {
      key: "technician",
      label: (
        <span>
          <ToolOutlined /> Kỹ thuật viên
        </span>
      ),
      children: (
        <>
          <Space style={{ marginBottom: 16, width: "100%" }} wrap>
            <Input.Search
              placeholder="Tìm kiếm theo tên, email, số điện thoại"
              allowClear
              style={{ width: 300 }}
              value={technicianFilters.searchTerm}
              onChange={(e) =>
                setTechnicianFilters((prev) => ({
                  ...prev,
                  searchTerm: e.target.value,
                }))
              }
              onSearch={() => loadTechnicians()}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 180 }}
              value={technicianFilters.approvalStatus}
              onChange={(value) =>
                setTechnicianFilters((prev) => ({
                  ...prev,
                  approvalStatus: value,
                }))
              }
              allowClear
            >
              <Select.Option value={0}>Chờ phê duyệt</Select.Option>
              <Select.Option value={1}>Đã phê duyệt</Select.Option>
              <Select.Option value={2}>Từ chối</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => loadTechnicians()}>
              Làm mới
            </Button>
          </Space>
          <Table
            columns={technicianColumns}
            dataSource={technicians}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} kỹ thuật viên`,
              onChange: (page, pageSize) => {
                setPagination({
                  current: page,
                  pageSize,
                  total: pagination.total,
                });
              },
            }}
            scroll={{ x: 1400 }}
          />
        </>
      ),
    },
    {
      key: "equipment-manager",
      label: (
        <span>
          <ShoppingOutlined /> Quản lý thiết bị
        </span>
      ),
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                form.setFieldValue("role", "equipmentmanager");
                setCreateModalVisible(true);
              }}
            >
              Thêm Equipment Manager
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadEquipmentManagers()}
            >
              Làm mới
            </Button>
          </Space>
          <Table
            columns={staffColumns}
            dataSource={equipmentManagers}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </>
      ),
    },
    {
      key: "supporter",
      label: (
        <span>
          <CrownOutlined /> Supporter
        </span>
      ),
      children: (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                form.setFieldValue("role", "supporter");
                setCreateModalVisible(true);
              }}
            >
              Thêm Supporter
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => loadSupporters()}>
              Làm mới
            </Button>
          </Space>
          <Table
            columns={staffColumns}
            dataSource={supporters}
            rowKey="id"
            loading={loading}
            pagination={false}
            scroll={{ x: 1200 }}
          />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ fontSize: 24 }} />
            <span style={{ fontSize: 20, fontWeight: 600 }}>
              Quản lý tài khoản
            </span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadTabData();
              loadStatistics();
            }}
          >
            Làm mới tất cả
          </Button>
        }
      >
        {/* Statistics */}
        {statistics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Operator"
                  value={statistics.operatorCount || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Khách hàng"
                  value={statistics.customerCount || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Kỹ thuật viên"
                  value={statistics.technicianCount || 0}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Quản lý thiết bị"
                  value={statistics.equipmentManagerCount || 0}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Supporter"
                  value={statistics.supporterCount || 0}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: "#eb2f96" }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Tổng cộng"
                  value={statistics.totalAccounts || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#13c2c2", fontWeight: "bold" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Create Modal */}
      <CreateAccountModal
        visible={createModalVisible}
        form={form}
        loading={loading}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        onSubmit={handleCreate}
      />

      {/* Edit Modal */}
      <EditAccountModal
        visible={editModalVisible}
        form={form}
        loading={loading}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedAccount(null);
          form.resetFields();
        }}
        onSubmit={handleEdit}
      />

      {/* Detail Modal */}
      <AccountDetailModal
        visible={detailModalVisible}
        account={selectedAccount}
        accountType={activeTab}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedAccount(null);
        }}
      />
    </div>
  );
}
