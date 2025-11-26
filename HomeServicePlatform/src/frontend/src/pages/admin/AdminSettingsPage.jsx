import React, { useState, useEffect } from "react";
import {
  Input,
  Tabs,
  Typography,
  Card,
  Form,
  Button,
  Switch,
  InputNumber,
  Table,
  Modal,
  Space,
  Popconfirm,
  Row,
  Col,
  Divider,
  Select,
  DatePicker,
  Tag,
  Tooltip,
} from "antd";
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  EyeOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { systemSettingApi } from "../../services/systemSettingApi";
import { auditLogApi, AuditAction, getActionText, getActionColor } from "../../services/auditLogApi";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("General");
  const [form] = Form.useForm();
  const [settingsByGroup, setSettingsByGroup] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [modalForm] = Form.useForm();

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditLogsPagination, setAuditLogsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [auditLogsFilters, setAuditLogsFilters] = useState({
    userRole: null,
    action: null,
    searchTerm: "",
    dateRange: null,
  });
  const [showAuditDetailModal, setShowAuditDetailModal] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "ActivityLogs") {
      fetchAuditLogs();
    }
  }, [activeTab, auditLogsPagination.current, auditLogsPagination.pageSize]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingApi.getSettingsByGroup();
      
      if (response.success) {
        setSettingsByGroup(response.data);
        // Set first group as active tab if exists
        const groups = Object.keys(response.data);
        if (groups.length > 0 && !groups.includes(activeTab)) {
          setActiveTab(groups[0]);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (setting) => {
    try {
      setLoading(true);
      const value = form.getFieldValue(setting.key);
      
      const response = await systemSettingApi.updateSettingById(setting.id, {
        value: String(value),
        description: setting.description,
      });

      if (response.success) {
        toast.success("Cập nhật cài đặt thành công");
        fetchSettings();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Không thể lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    modalForm.setFieldsValue({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      group: setting.group,
      isSensitive: setting.isSensitive,
    });
    setShowModal(true);
  };

  const handleDeleteSetting = async (id) => {
    try {
      setLoading(true);
      const response = await systemSettingApi.deleteSetting(id);

      if (response.success) {
        toast.success("Xóa cài đặt thành công");
        fetchSettings();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error deleting setting:", error);
      toast.error("Không thể xóa cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (values) => {
    try {
      setLoading(true);

      const response = await systemSettingApi.updateSettingById(editingSetting.id, {
        value: values.value,
        description: values.description,
      });

      if (response.success) {
        toast.success("Cập nhật thành công");
        setShowModal(false);
        fetchSettings();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Không thể lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLogsLoading(true);
      const response = await auditLogApi.getAllAuditLogs({
        ...auditLogsFilters,
        pageNumber: auditLogsPagination.current,
        pageSize: auditLogsPagination.pageSize,
      });

      if (response.success) {
        setAuditLogs(response.data.items);
        setAuditLogsPagination({
          ...auditLogsPagination,
          total: response.data.totalCount,
        });
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error(t("auditLog.fetchError") || "Failed to fetch audit logs");
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const handleAuditLogsFilterChange = () => {
    setAuditLogsPagination({ ...auditLogsPagination, current: 1 });
    fetchAuditLogs();
  };

  const handleClearAuditFilters = () => {
    setAuditLogsFilters({
      userRole: null,
      action: null,
      searchTerm: "",
      dateRange: null,
    });
    setAuditLogsPagination({ current: 1, pageSize: 10, total: 0 });
  };

  const handleViewAuditDetail = (record) => {
    setSelectedAuditLog(record);
    setShowAuditDetailModal(true);
  };

  const handleAuditTableChange = (pagination) => {
    setAuditLogsPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: auditLogsPagination.total,
    });
  };

  const renderSettingInput = (setting) => {
    const value = setting.value;
    
    // Try to determine the type
    if (value === "true" || value === "false") {
      return (
        <Form.Item
          name={setting.key}
          initialValue={value === "true"}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      );
    } else if (!isNaN(value) && value !== "") {
      return (
        <Form.Item
          name={setting.key}
          initialValue={Number(value)}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    } else {
      return (
        <Form.Item
          name={setting.key}
          initialValue={value}
        >
          <Input disabled={setting.isSensitive} />
        </Form.Item>
      );
    }
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: 200,
    },
    {
      title: "Giá trị",
      key: "value",
      render: (_, record) => (
        <Form form={form}>
          {renderSettingInput(record)}
        </Form>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={() => handleSaveSetting(record)}
            loading={loading}
          >
            Lưu
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSetting(record)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa cài đặt này?"
            onConfirm={() => handleDeleteSetting(record.id)}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1
              style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
            >
              ⚙️ Cài đặt hệ thống
            </h1>
            <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
              Quản lý cài đặt và cấu hình toàn hệ thống
            </p>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSettings}
              loading={loading}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            ...Object.keys(settingsByGroup).map(group => ({
              key: group,
              label: group,
              children: (
                <Table
                  columns={columns}
                  dataSource={settingsByGroup[group] || []}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                />
              ),
            })),
            {
              key: "ActivityLogs",
              label: (
                <span>
                  <HistoryOutlined /> {t("auditLog.title") || "Activity Logs"}
                </span>
              ),
              children: (
                <div>
                  {/* Filters Section */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Input.Search
                        placeholder={t("auditLog.searchPlaceholder") || "Search by user or entity"}
                        value={auditLogsFilters.searchTerm}
                        onChange={(e) =>
                          setAuditLogsFilters({ ...auditLogsFilters, searchTerm: e.target.value })
                        }
                        onSearch={handleAuditLogsFilterChange}
                        allowClear
                      />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Select
                        placeholder={t("auditLog.selectRole") || "Select Role"}
                        style={{ width: "100%" }}
                        value={auditLogsFilters.userRole}
                        onChange={(value) => {
                          setAuditLogsFilters({ ...auditLogsFilters, userRole: value });
                        }}
                        allowClear
                      >
                        <Select.Option value="Admin">Admin</Select.Option>
                        <Select.Option value="Operator">Operator</Select.Option>
                        <Select.Option value="EquipmentManager">Equipment Manager</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                      <Select
                        placeholder={t("auditLog.selectAction") || "Select Action"}
                        style={{ width: "100%" }}
                        value={auditLogsFilters.action}
                        onChange={(value) => {
                          setAuditLogsFilters({ ...auditLogsFilters, action: value });
                        }}
                        allowClear
                      >
                        <Select.Option value={0}>{getActionText(0)}</Select.Option>
                        <Select.Option value={1}>{getActionText(1)}</Select.Option>
                        <Select.Option value={2}>{getActionText(2)}</Select.Option>
                        <Select.Option value={3}>{getActionText(3)}</Select.Option>
                        <Select.Option value={4}>{getActionText(4)}</Select.Option>
                        <Select.Option value={5}>{getActionText(5)}</Select.Option>
                        <Select.Option value={6}>{getActionText(6)}</Select.Option>
                        <Select.Option value={99}>{getActionText(99)}</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <DatePicker.RangePicker
                        style={{ width: "100%" }}
                        value={auditLogsFilters.dateRange}
                        onChange={(dates) => {
                          setAuditLogsFilters({ ...auditLogsFilters, dateRange: dates });
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={2}>
                      <Space>
                        <Button onClick={handleAuditLogsFilterChange} type="primary">
                          {t("common.filter") || "Filter"}
                        </Button>
                        <Tooltip title={t("common.clearFilters") || "Clear Filters"}>
                          <Button icon={<ClearOutlined />} onClick={handleClearAuditFilters} />
                        </Tooltip>
                      </Space>
                    </Col>
                  </Row>

                  {/* Audit Logs Table */}
                  <Table
                    columns={[
                      {
                        title: t("auditLog.userName") || "User Name",
                        dataIndex: "userName",
                        key: "userName",
                        width: 150,
                      },
                      {
                        title: t("auditLog.userRole") || "Role",
                        dataIndex: "userRole",
                        key: "userRole",
                        width: 120,
                        render: (role) => <Tag color="blue">{role}</Tag>,
                      },
                      {
                        title: t("auditLog.action") || "Action",
                        dataIndex: "action",
                        key: "action",
                        width: 100,
                        render: (action) => (
                          <Tag color={getActionColor(action)}>{getActionText(action)}</Tag>
                        ),
                      },
                      {
                        title: t("auditLog.entityName") || "Entity",
                        dataIndex: "entityName",
                        key: "entityName",
                        width: 150,
                      },
                      {
                        title: t("auditLog.description") || "Description",
                        dataIndex: "description",
                        key: "description",
                        ellipsis: true,
                      },
                      {
                        title: t("auditLog.dateCreated") || "Date",
                        dataIndex: "dateCreated",
                        key: "dateCreated",
                        width: 180,
                        render: (date) => new Date(date).toLocaleString(),
                      },
                      {
                        title: t("common.actions") || "Actions",
                        key: "actions",
                        width: 80,
                        render: (_, record) => (
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewAuditDetail(record)}
                          >
                            {t("common.view") || "View"}
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={auditLogs}
                    rowKey="id"
                    loading={auditLogsLoading}
                    pagination={{
                      current: auditLogsPagination.current,
                      pageSize: auditLogsPagination.pageSize,
                      total: auditLogsPagination.total,
                      showSizeChanger: true,
                      showTotal: (total) => `${t("common.total") || "Total"} ${total} ${t("common.items") || "items"}`,
                    }}
                    onChange={handleAuditTableChange}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Edit Setting Modal */}
      <Modal
        title="Chỉnh sửa cài đặt"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            label="Giá trị"
            name="value"
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
          >
            <Input placeholder="e.g., true, false, 100" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={3} placeholder="Mô tả về cài đặt này" />
          </Form.Item>

          <Form.Item
            label="Sensitive"
            name="isSensitive"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Audit Detail Modal */}
      <Modal
        title={t("auditLog.detailTitle") || "Audit Log Details"}
        open={showAuditDetailModal}
        onCancel={() => setShowAuditDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowAuditDetailModal(false)}>
            {t("common.close") || "Close"}
          </Button>,
        ]}
        width={800}
      >
        {selectedAuditLog && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>{t("auditLog.userName") || "User Name"}:</strong> {selectedAuditLog.userName}
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.userRole") || "Role"}:</strong>{" "}
                <Tag color="blue">{selectedAuditLog.userRole}</Tag>
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.action") || "Action"}:</strong>{" "}
                <Tag color={getActionColor(selectedAuditLog.action)}>
                  {getActionText(selectedAuditLog.action)}
                </Tag>
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.entityName") || "Entity"}:</strong> {selectedAuditLog.entityName}
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.entityId") || "Entity ID"}:</strong> {selectedAuditLog.entityId || "N/A"}
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.dateCreated") || "Date"}:</strong>{" "}
                {new Date(selectedAuditLog.dateCreated).toLocaleString()}
              </Col>
              <Col span={24}>
                <strong>{t("auditLog.description") || "Description"}:</strong>
                <p>{selectedAuditLog.description || "N/A"}</p>
              </Col>
              {selectedAuditLog.oldValue && (
                <Col span={24}>
                  <strong>{t("auditLog.oldValue") || "Old Value"}:</strong>
                  <pre style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                    {JSON.stringify(JSON.parse(selectedAuditLog.oldValue), null, 2)}
                  </pre>
                </Col>
              )}
              {selectedAuditLog.newValue && (
                <Col span={24}>
                  <strong>{t("auditLog.newValue") || "New Value"}:</strong>
                  <pre style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px" }}>
                    {JSON.stringify(JSON.parse(selectedAuditLog.newValue), null, 2)}
                  </pre>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
