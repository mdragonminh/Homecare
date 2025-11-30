import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Tooltip,
  Modal,
} from "antd";
import {
  HistoryOutlined,
  EyeOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { auditLogApi, getActionText, getActionColor } from "../../services/auditLogApi";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export default function ActivityLogsPage() {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    userRole: null,
    action: null,
    searchTerm: "",
    dateRange: null,
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.current, pagination.pageSize]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogApi.getAllAuditLogs({
        ...filters,
        pageNumber: pagination.current,
        pageSize: pagination.pageSize,
      });

      if (response.success) {
        setAuditLogs(response.data.items);
        setPagination({
          ...pagination,
          total: response.data.totalCount,
        });
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error(t("auditLog.fetchError", "Failed to fetch audit logs"));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setPagination({ ...pagination, current: 1 });
    fetchAuditLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      userRole: null,
      action: null,
      searchTerm: "",
      dateRange: null,
    });
    setPagination({ current: 1, pageSize: 10, total: 0 });
  };

  const handleViewDetail = (record) => {
    setSelectedLog(record);
    setShowDetailModal(true);
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total,
    });
  };

  const columns = [
    {
      title: t("auditLog.userName", "User Name"),
      dataIndex: "userName",
      key: "userName",
      width: 150,
    },
    {
      title: t("auditLog.userRole", "Role"),
      dataIndex: "userRole",
      key: "userRole",
      width: 120,
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: t("auditLog.action", "Action"),
      dataIndex: "action",
      key: "action",
      width: 100,
      render: (action) => (
        <Tag color={getActionColor(action)}>{getActionText(action)}</Tag>
      ),
    },
    {
      title: t("auditLog.entityName", "Entity"),
      dataIndex: "entityName",
      key: "entityName",
      width: 150,
    },
    {
      title: t("auditLog.description", "Description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: t("auditLog.dateCreated", "Date"),
      dataIndex: "dateCreated",
      key: "dateCreated",
      width: 180,
      render: (date) => dayjs(date).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: t("common.actions", "Actions"),
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          {t("common.view", "View")}
        </Button>
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
              <HistoryOutlined /> {t("auditLog.title", "Activity Logs")}
            </h1>
            <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
              Theo dõi các hoạt động và thay đổi trong hệ thống
            </p>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAuditLogs}
              loading={loading}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        {/* Filters Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder={t("auditLog.searchPlaceholder", "Search by user or entity")}
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              onSearch={handleFilterChange}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder={t("auditLog.selectRole", "Select Role")}
              style={{ width: "100%" }}
              value={filters.userRole}
              onChange={(value) => {
                setFilters({ ...filters, userRole: value });
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
              placeholder={t("auditLog.selectAction", "Select Action")}
              style={{ width: "100%" }}
              value={filters.action}
              onChange={(value) => {
                setFilters({ ...filters, action: value });
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
            <RangePicker
              style={{ width: "100%" }}
              value={filters.dateRange}
              onChange={(dates) => {
                setFilters({ ...filters, dateRange: dates });
              }}
            />
          </Col>
          <Col xs={24} sm={24} md={2}>
            <Space>
              <Button onClick={handleFilterChange} type="primary">
                {t("common.filter", "Filter")}
              </Button>
              <Tooltip title={t("common.clearFilters", "Clear Filters")}>
                <Button icon={<ClearOutlined />} onClick={handleClearFilters} />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {/* Audit Logs Table */}
        <Table
          columns={columns}
          dataSource={auditLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `${t("common.total", "Total")} ${total} ${t("common.items", "items")}`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={t("auditLog.detailTitle", "Audit Log Details")}
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            {t("common.close", "Close")}
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>{t("auditLog.userName", "User Name")}:</strong> {selectedLog.userName}
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.userRole", "Role")}:</strong>{" "}
                <Tag color="blue">{selectedLog.userRole}</Tag>
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.action", "Action")}:</strong>{" "}
                <Tag color={getActionColor(selectedLog.action)}>
                  {getActionText(selectedLog.action)}
                </Tag>
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.entityName", "Entity")}:</strong> {selectedLog.entityName}
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.entityId", "Entity ID")}:</strong> {selectedLog.entityId || "N/A"}
              </Col>
              <Col span={12}>
                <strong>{t("auditLog.dateCreated", "Date")}:</strong>{" "}
                {dayjs(selectedLog.dateCreated).format("DD/MM/YYYY HH:mm:ss")}
              </Col>
              <Col span={24}>
                <strong>{t("auditLog.description", "Description")}:</strong>
                <p>{selectedLog.description || "N/A"}</p>
              </Col>
              {selectedLog.oldValue && (
                <Col span={24}>
                  <strong>{t("auditLog.oldValue", "Old Value")}:</strong>
                  <pre style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", maxHeight: "200px", overflow: "auto" }}>
                    {JSON.stringify(JSON.parse(selectedLog.oldValue), null, 2)}
                  </pre>
                </Col>
              )}
              {selectedLog.newValue && (
                <Col span={24}>
                  <strong>{t("auditLog.newValue", "New Value")}:</strong>
                  <pre style={{ background: "#f5f5f5", padding: "8px", borderRadius: "4px", maxHeight: "200px", overflow: "auto" }}>
                    {JSON.stringify(JSON.parse(selectedLog.newValue), null, 2)}
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
