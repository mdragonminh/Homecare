import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  TechnicianApprovalStatus,
  TechnicianApprovalStatusColors,
  TechnicianApprovalStatusLabels,
} from "../../constants/enums";
import { adminApi } from "../../services/adminApi";

const { Option } = Select;
const { confirm } = Modal;

export default function TechniciansPage() {
  const { t } = useTranslation();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    searchTerm: "",
    approvalStatus: undefined,
  });
  const [technicianDetail, setTechnicianDetail] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Approval status options
  const approvalStatusOptions = [
    { value: undefined, label: t("technicians.all_statuses") },
    {
      value: TechnicianApprovalStatus.Pending,
      label: TechnicianApprovalStatusLabels[TechnicianApprovalStatus.Pending],
    },
    {
      value: TechnicianApprovalStatus.Approved,
      label: TechnicianApprovalStatusLabels[TechnicianApprovalStatus.Approved],
    },
    {
      value: TechnicianApprovalStatus.Rejected,
      label: TechnicianApprovalStatusLabels[TechnicianApprovalStatus.Rejected],
    },
  ];

  // Get approval status tag
  const getApprovalStatusTag = (status) => {
    const label = TechnicianApprovalStatusLabels[status];
    const color = TechnicianApprovalStatusColors[status];

    if (label && color) {
      return <Tag color={color}>{label}</Tag>;
    }

    return <Tag>{t("technicians.unknown_status")}</Tag>;
  };

  // Fetch technicians
  const fetchTechnicians = async (params = {}) => {
    setLoading(true);
    try {
      const response = await adminApi.getTechnicians({
        pageNumber: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize,
        searchTerm: filters.searchTerm,
        ...(filters.approvalStatus && {
          approvalStatus: filters.approvalStatus,
        }),
      });

      if (response.success) {
        setTechnicians(response.data.items || []);
        setPagination({
          current: response.data.currentPage || 1,
          pageSize: response.data.pageSize || 10,
          total: response.data.totalCount || 0,
        });
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(t("technicians.error_loading_list"));
    }
    setLoading(false);
  };

  // Handle search
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle approve technician
  const handleApprove = async (technicianId) => {
    try {
      const response = await adminApi.approveTechnician(technicianId);
      if (response.success) {
        toast.success(t("technicians.approve_success"));
        fetchTechnicians();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(t("technicians.error_approving"));
    }
  };

  // Handle reject technician
  const handleReject = async (technicianId) => {
    try {
      const response = await adminApi.rejectTechnician(technicianId);
      if (response.success) {
        toast.success(t("technicians.reject_success"));
        fetchTechnicians();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(t("technicians.error_rejecting"));
    }
  };

  // Handle view technician details
  const handleViewDetails = async (technicianId) => {
    try {
      const response = await adminApi.getTechnicianById(technicianId);
      if (response.success) {
        setTechnicianDetail(response.data);
        setDetailModalVisible(true);
      } else {
        toast.error(response?.message ?? "Cannot load technician details");
      }
    } catch (error) {
      toast.error(t("technicians.error_loading_detail"));
    }
  };

  // Handle suspend account
  const handleSuspendAccount = (userId, fullName) => {
    confirm({
      title: t("technicians.suspend_confirm_title"),
      content: t("technicians.suspend_confirm_content", { name: fullName }),
      okText: t("ui.confirm"),
      cancelText: t("ui.cancel"),
      okType: "danger",
      onOk: async () => {
        try {
          const response = await adminApi.suspendAccount(
            userId,
            "Account suspended by admin"
          );
          if (response.success) {
            toast.success(t("technicians.suspend_success"));
            fetchTechnicians();
          } else {
            toast.error(response.message);
          }
        } catch (error) {
          toast.error(t("technicians.error_suspending"));
        }
      },
    });
  };

  // Handle unsuspend account
  const handleUnsuspendAccount = (userId, fullName) => {
    confirm({
      title: t("technicians.unsuspend_confirm_title"),
      content: t("technicians.unsuspend_confirm_content", { name: fullName }),
      okText: t("ui.confirm"),
      cancelText: t("ui.cancel"),
      onOk: async () => {
        try {
          const response = await adminApi.unsuspendAccount(userId);
          if (response.success) {
            toast.success(t("technicians.unsuspend_success"));
            fetchTechnicians();
          } else {
            toast.error(response.message);
          }
        } catch (error) {
          toast.error(t("technicians.error_unsuspending"));
        }
      },
    });
  };

  // Table columns
  const columns = [
    {
      title: t("technicians.table.full_name"),
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: t("technicians.table.email"),
      dataIndex: "email",
      key: "email",
    },
    {
      title: t("technicians.table.phone_number"),
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: t("technicians.table.skills"),
      dataIndex: "services",
      key: "services",
      render: (services) => {
        if (!services || services.length === 0) {
          return <span style={{ color: "#8c8c8c" }}>Chưa có dịch vụ</span>;
        }

        const displayServices = services.slice(0, 2);
        const remainingCount = services.length - 2;

        return (
          <Tooltip
            title={services.map(s => s.name).join(", ")}
          >
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {displayServices.map((service) => (
                  <Tag key={service.id} size="small" color="blue">
                    {service.name}
                  </Tag>
                ))}
                {remainingCount > 0 && (
                  <Tag size="small" color="default">
                    +{remainingCount}
                  </Tag>
                )}
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: t("technicians.table.experience"),
      dataIndex: "experienceYears",
      key: "experienceYears",
      render: (years) => t("technicians.years_experience", { years }),
      width: 120,
    },
    {
      title: t("technicians.table.status"),
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      render: (status) => getApprovalStatusTag(status),
      width: 130,
    },
    {
      title: t("technicians.table.account_status"),
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive
            ? t("technicians.account_active")
            : t("technicians.account_locked")}
        </Tag>
      ),
      width: 130,
    },
    {
      title: t("technicians.table.created_date"),
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      width: 120,
    },
    {
      title: t("technicians.table.actions"),
      key: "action",
      width: 200,
      align: "center",
      render: (_, record) => (
        <Space>
          <Tooltip title={t("technicians.view_details")}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          {record.isActive ? (
            <Tooltip title={t("technicians.lock_account")}>
              <Button
                type="text"
                danger
                icon={<LockOutlined />}
                onClick={() =>
                  handleSuspendAccount(record.userId, record.fullName)
                }
              />
            </Tooltip>
          ) : (
            <Tooltip title={t("technicians.unlock_account")}>
              <Button
                type="text"
                style={{ color: "#52c41a" }}
                icon={<UnlockOutlined />}
                onClick={() =>
                  handleUnsuspendAccount(record.userId, record.fullName)
                }
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchTechnicians();
  }, [filters.searchTerm, filters.approvalStatus]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}
        >
          🔧 {t("technicians.page_title")}
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          {t("technicians.page_description")}
        </p>
      </div>

      <Card style={{ borderRadius: 12 }}>
        {/* Filters */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Input.Search
            placeholder={t("technicians.search_placeholder")}
            style={{ width: 300 }}
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />

          <Select
            placeholder={t("technicians.approval_status_placeholder")}
            style={{ width: 180 }}
            value={filters.approvalStatus}
            onChange={(value) => {
              handleFilterChange("approvalStatus", value);
            }}
          >
            {approvalStatusOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>

        {/* Statistics */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)",
              borderRadius: 8,
              border: "1px solid #ffd591",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 120,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#fa8c16",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {
                technicians.filter(
                  (t) => t.approvalStatus === TechnicianApprovalStatus.Pending
                ).length
              }
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#d4680a" }}>
              {t("technicians.stats.pending")}
            </span>
          </div>

          <div
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
              borderRadius: 8,
              border: "1px solid #b7eb8f",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 120,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#52c41a",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {
                technicians.filter(
                  (t) => t.approvalStatus === TechnicianApprovalStatus.Approved
                ).length
              }
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#389e0d" }}>
              {t("technicians.stats.approved")}
            </span>
          </div>

          <div
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)",
              borderRadius: 8,
              border: "1px solid #ffa39e",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 120,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#ff4d4f",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {
                technicians.filter(
                  (t) => t.approvalStatus === TechnicianApprovalStatus.Rejected
                ).length
              }
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#cf1322" }}>
              {t("technicians.stats.rejected")}
            </span>
          </div>

          <div
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #f0f0f0 0%, #d9d9d9 100%)",
              borderRadius: 8,
              border: "1px solid #bfbfbf",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 120,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#595959",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {technicians.length}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#434343" }}>
              {t("technicians.stats.total")}
            </span>
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={technicians}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t("technicians.pagination_total", {
                start: range[0],
                end: range[1],
                total,
              }),
            pageSizeOptions: ["5", "10", "20", "50"],
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                <div style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>
                  {t("technicians.no_technicians")}
                </div>
                <div style={{ fontSize: 14, color: "#999" }}>
                  {filters.searchTerm || filters.approvalStatus !== undefined
                    ? t("technicians.no_results_with_filters")
                    : t("technicians.no_registrations")}
                </div>
              </div>
            ),
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={null}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setTechnicianDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            {t("ui.close")}
          </Button>,
          ...(technicianDetail?.approvalStatus ===
          TechnicianApprovalStatus.Pending
            ? [
                <Button
                  key="reject"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    handleReject(technicianDetail.id);
                    setDetailModalVisible(false);
                  }}
                >
                  {t("technicians.reject")}
                </Button>,
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleApprove(technicianDetail.id);
                    setDetailModalVisible(false);
                  }}
                >
                  {t("technicians.approve")}
                </Button>,
              ]
            : []),
        ]}
        width={700}
      >
        {technicianDetail && (
          <div>
            {/* Header */}
            <div
              style={{
                marginBottom: 24,
                textAlign: "center",
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 16,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  backgroundColor: "#1890ff",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: "bold",
                  margin: "0 auto 12px auto",
                }}
              >
                {technicianDetail.fullName?.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                {technicianDetail.fullName}
              </h2>
              <div style={{ marginTop: 8 }}>
                {getApprovalStatusTag(technicianDetail.approvalStatus)}
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {/* Basic Info */}
              <Card
                size="small"
                title={`🔍 ${t("technicians.modal.basic_info")}`}
                style={{ height: "fit-content" }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>
                      {t("technicians.modal.username")}:
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {technicianDetail.userName}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>
                      {t("technicians.modal.email")}:
                    </span>
                    <span style={{ fontWeight: 500, color: "#1890ff" }}>
                      {technicianDetail.email}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>
                      {t("technicians.modal.phone")}:
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {technicianDetail.phoneNumber ||
                        t("technicians.modal.not_updated")}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>
                      {t("technicians.modal.experience")}:
                    </span>
                    <Tag color="blue">
                      {t("technicians.years_experience", {
                        years: technicianDetail.experienceYears,
                      })}
                    </Tag>
                  </div>
                </div>
              </Card>

              {/* Skills */}
              <Card
                size="small"
                title={`🛠️ ${t("technicians.modal.skills_specialization")}`}
                style={{ height: "fit-content" }}
              >
                <div>
                  {/* Services */}
                  {technicianDetail.services &&
                    technicianDetail.services.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#666",
                            marginBottom: 8,
                          }}
                        >
                          Dịch vụ:
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          {technicianDetail.services.map((service) => (
                            <Tag key={service.id} color="green">
                              {service.name}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Certificate Files */}
                  {technicianDetail.certificateFiles &&
                    technicianDetail.certificateFiles.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#1890ff",
                            marginBottom: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          🏆 {t("technicians.modal.certificate_files")}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          {technicianDetail.certificateFiles.map(
                            (certFile, index) => {
                              return (
                                <div
                                  key={certFile.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "12px 16px",
                                    border: "1px solid #e8f4fd",
                                    borderRadius: 8,
                                    backgroundColor: "#f9fcff",
                                    transition: "all 0.3s ease",
                                    boxShadow:
                                      "0 1px 3px rgba(0,0,0,0.05)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#e8f4fd";
                                    e.currentTarget.style.borderColor =
                                      "#1890ff";
                                    e.currentTarget.style.boxShadow =
                                      "0 2px 8px rgba(24,144,255,0.15)";
                                    e.currentTarget.style.transform =
                                      "translateY(-1px)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#f9fcff";
                                    e.currentTarget.style.borderColor =
                                      "#e8f4fd";
                                    e.currentTarget.style.boxShadow =
                                      "0 1px 3px rgba(0,0,0,0.05)";
                                    e.currentTarget.style.transform =
                                      "translateY(0)";
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 8,
                                      background:
                                        "linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 16,
                                      boxShadow:
                                        "0 2px 4px rgba(24,144,255,0.3)",
                                    }}
                                  >
                                    📜
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div
                                      style={{
                                        fontSize: 14,
                                        color: "#333",
                                        fontWeight: 500,
                                        marginBottom: 2,
                                      }}
                                    >
                                      {certFile.fileName}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#999",
                                      }}
                                    >
                                      {certFile.fileType}
                                    </div>
                                  </div>
                                  <Space size={8}>
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={
                                        <span style={{ fontSize: 14 }}>
                                          👁️
                                        </span>
                                      }
                                      onClick={() => {
                                        const previewUrl =
                                          adminApi.previewFile(
                                            certFile.filePath
                                          );
                                        window.open(
                                          previewUrl,
                                          "_blank"
                                        );
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        height: "auto",
                                        color: "#1890ff",
                                        fontWeight: 500,
                                        borderRadius: 6,
                                        border: "1px solid #d9d9d9",
                                      }}
                                    >
                                      Xem
                                    </Button>
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={
                                        <span style={{ fontSize: 12 }}>
                                          ⬇️
                                        </span>
                                      }
                                      onClick={async () => {
                                        try {
                                          const result =
                                            await adminApi.downloadFile(
                                              certFile.filePath
                                            );
                                          if (result.success) {
                                            toast.success(
                                              "Tải xuống thành công!"
                                            );
                                          } else {
                                            toast.error(
                                              result.message ||
                                                "Tải xuống thất bại!"
                                            );
                                          }
                                        } catch (error) {
                                          toast.error(
                                            "Có lỗi xảy ra khi tải xuống!"
                                          );
                                        }
                                      }}
                                      style={{
                                        padding: "6px 12px",
                                        height: "auto",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        borderRadius: 6,
                                        background:
                                          "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
                                        border: "none",
                                        boxShadow:
                                          "0 2px 4px rgba(82,196,26,0.3)",
                                      }}
                                    >
                                      Tải xuống
                                    </Button>
                                  </Space>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </Card>
            </div>

            {/* Timeline */}
            <Card
              size="small"
              title={`📅 ${t("technicians.modal.timeline")}`}
              style={{ marginTop: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    {t("technicians.modal.registration_date")}
                  </div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>
                    {new Date(technicianDetail.dateCreated).toLocaleDateString(
                      "vi-VN"
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {new Date(technicianDetail.dateCreated).toLocaleTimeString(
                      "vi-VN"
                    )}
                  </div>
                </div>

                {technicianDetail.approvedAt && (
                  <>
                    <div
                      style={{
                        width: 60,
                        height: 2,
                        backgroundColor:
                          technicianDetail.approvalStatus ===
                          TechnicianApprovalStatus.Approved
                            ? "#52c41a"
                            : "#ff4d4f",
                        margin: "0 16px",
                      }}
                    />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        {technicianDetail.approvalStatus ===
                        TechnicianApprovalStatus.Approved
                          ? t("technicians.modal.approval_date")
                          : t("technicians.modal.rejection_date")}
                      </div>
                      <div style={{ fontWeight: 500, marginTop: 4 }}>
                        {new Date(
                          technicianDetail.approvedAt
                        ).toLocaleDateString("vi-VN")}
                      </div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {new Date(
                          technicianDetail.approvedAt
                        ).toLocaleTimeString("vi-VN")}
                      </div>
                      {technicianDetail.approvedBy && (
                        <div
                          style={{ fontSize: 12, color: "#666", marginTop: 4 }}
                        >
                          {t("technicians.modal.by")}:{" "}
                          {technicianDetail.approvedBy}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
