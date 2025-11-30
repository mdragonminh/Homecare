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
  Modal,
  message,
  Rate,
} from "antd";
import {
  ToolOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  TechnicianApprovalStatus,
  TechnicianApprovalStatusColors,
  TechnicianApprovalStatusLabels,
} from "../../constants/enums";
import { technicianApi } from "../../services/technicianApi";
import { adminApi } from "../../services/adminApi";
import dayjs from "dayjs";

const { Search } = Input;
const { Option } = Select;

export default function OperatorTechniciansPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [technicianDetail, setTechnicianDetail] = useState(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Tải dữ liệu technicians từ API
  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const response = await technicianApi.getTechnicians();
      if (response.success) {
        // Map dữ liệu từ API để phù hợp với component
        const mappedData =
          response.data.items?.map((tech, index) => ({
            key: tech.id || index,
            id: tech.id,
            name: tech.fullName || tech.name,
            email: tech.email,
            phone: tech.phoneNumber || tech.phone,
            experience: tech.yearsOfExperience
              ? `${tech.yearsOfExperience} ${t("year")}`
              : tech.experience || t("technicians.unknown_status"),
            approvalStatus: tech.approvalStatus,
            rating: tech.averageRating || tech.rating || 0,
            completedJobs: tech.completedJobsCount || tech.completedJobs || 0,
            joinDate: tech.createdAt
              ? new Date(tech.createdAt).toLocaleDateString("vi-VN")
              : tech.joinDate,
            address: tech.address || t("technicians.modal.not_updated"),
          })) || [];

        setTechnicians(mappedData);
        setFilteredTechnicians(mappedData);
      } else {
        message.error(
          response.message || t("technicians.error_loading_list")
        );
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
      message.error(t("technicians.error_loading_list"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    let filtered = technicians;

    if (searchTerm) {
      filtered = filtered.filter(
        (tech) =>
          tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (tech) => tech.approvalStatus.toString() === statusFilter
      );
    }

    setFilteredTechnicians(filtered);
  }, [searchTerm, statusFilter, technicians]);

  const handleViewDetails = async (technician) => {
    // Nếu cần thông tin chi tiết hơn, gọi API getTechnicianById
    try {
      const response = await technicianApi.getTechnicianById(technician.id);
      if (response.success) {
        // response.data đã là dữ liệu đầy đủ, chứa:
        // { id, fullName, email, experienceYears, services: [...], certificateFiles: [...] }
        setTechnicianDetail(response.data); // <-- CHỈ CẦN SET TRỰC TIẾP
      } else {
        message.error(response.message || t("technicians.error_loading_detail"));
        setTechnicianDetail(technician); // Fallback
      }
    } catch (error) {
      console.error("Error getting technician details:", error);
      message.error(t("technicians.error_loading_detail"));
      setTechnicianDetail(technician); // Fallback
    }
    // Force re-render by setting to false first then true
    setDetailModalVisible(false);
    setTimeout(() => setDetailModalVisible(true), 10);
  };

  const handleApprove = (technicianId) => {
    setSelectedTechnicianId(technicianId);
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    try {
      setLoading(true);
      const response = await technicianApi.approveTechnician(
        selectedTechnicianId
      );
      if (response.success) {
        message.success(t("technicians.approve_success"));
        setApproveModalVisible(false);
        setSelectedTechnicianId(null);
        // Reload dữ liệu để cập nhật trạng thái
        loadTechnicians();
      } else {
        message.error(response.message || t("technicians.error_approving"));
      }
    } catch (error) {
      console.error("Error approving technician:", error);
      message.error(t("technicians.error_approving"));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (technicianId) => {
    setSelectedTechnicianId(technicianId);
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      message.error(t("technicians.select_at_least_one"));
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        rejectionReason: rejectionReason.trim(),
      };

      const response = await technicianApi.rejectTechnician(
        selectedTechnicianId,
        requestBody
      );

      if (response.success) {
        message.success(t("technicians.reject_success"));
        setRejectModalVisible(false);
        setSelectedTechnicianId(null);
        setRejectionReason("");
        loadTechnicians();
      } else {
        message.error(response.message || t("technicians.error_rejecting"));
      }
    } catch (error) {
      console.error("Error rejecting technician:", error);
      message.error(t("technicians.error_rejecting"));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "name",
      key: "avatar",
      width: 60,
      render: (name) => (
        <Avatar icon={<ToolOutlined />} style={{ backgroundColor: "#1890ff" }}>
          {name?.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: t("technicians.table.full_name"),
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t("technicians.table.email"),
      dataIndex: "email",
      key: "email",
    },
    {
      title: t("technicians.table.phone_number"),
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: t("technicians.table.status"),
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      render: (status) => (
        <Tag color={TechnicianApprovalStatusColors[status]}>
          {TechnicianApprovalStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: t("technicians.table.actions"),
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetails(record)}
          />
          {record.approvalStatus === TechnicianApprovalStatus.Pending && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                size="small"
                style={{ color: "#52c41a" }}
                onClick={() => handleApprove(record.id)}
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                size="small"
                style={{ color: "#ff4d4f" }}
                onClick={() => handleReject(record.id)}
              />
            </>
          )}
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
          🔧 {t("technicians.page_title")}
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          {t("technicians.page_description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
            {
              technicians.filter(
                (t) => t.approvalStatus === TechnicianApprovalStatus.Approved
              ).length
            }
          </div>
          <div style={{ color: "#8c8c8c" }}>{t("technicians.stats.approved")}</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>
            {
              technicians.filter(
                (t) => t.approvalStatus === TechnicianApprovalStatus.Pending
              ).length
            }
          </div>
          <div style={{ color: "#8c8c8c" }}>{t("technicians.stats.pending")}</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>
            {
              technicians.filter(
                (t) => t.approvalStatus === TechnicianApprovalStatus.Rejected
              ).length
            }
          </div>
          <div style={{ color: "#8c8c8c" }}>{t("technicians.stats.rejected")}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Search
            placeholder={t("technicians.search_placeholder")}
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder={t("technicians.approval_status_placeholder")}
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">{t("technicians.all_statuses")}</Option>
            <Option value={TechnicianApprovalStatus.Approved.toString()}>
              {t("technicians.stats.approved")}
            </Option>
            <Option value={TechnicianApprovalStatus.Pending.toString()}>
              {t("technicians.stats.pending")}
            </Option>
            <Option value={TechnicianApprovalStatus.Rejected.toString()}>
              {t("technicians.stats.rejected")}
            </Option>
          </Select>
          <div style={{ marginLeft: "auto", color: "#8c8c8c" }}>
            {t("technicians.stats.total")}: {filteredTechnicians.length} {t("technician")}
          </div>
        </div>
      </Card>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={filteredTechnicians}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              t("technicians.pagination_total", {
                start: range[0],
                end: range[1],
                total: total,
              }),
          }}
          scroll={{ x: 1400 }}
          loading={loading}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        key={technicianDetail?.id || "modal"}
        title={t("technicians.view_details")}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
        destroyOnHidden={true}
        centered
      >
        {technicianDetail && (
          <div>
            <div className="mb-4">
              <strong>{t("technicians.modal.username")}:</strong> {technicianDetail.fullName}
            </div>
            <div className="mb-4">
              <strong>{t("technicians.modal.email")}:</strong> {technicianDetail.email}
            </div>

            <div className="mb-4">
              <strong>{t("technicians.modal.experience")}:</strong> {technicianDetail.experienceYears}
            </div>

            {technicianDetail.citizenId && (
              <div className="mb-4">
                <strong>CCCD/CMND:</strong> {technicianDetail.citizenId}
              </div>
            )}

            <div className="mb-4">
              <strong>Đánh giá:</strong>{" "}
              <Rate disabled value={technicianDetail.rating || 0} allowHalf style={{ fontSize: 16 }} />
              {" "}({technicianDetail.rating || 0}/5 - {technicianDetail.ratingCount || 0} đánh giá)
            </div>

            <div className="mb-4">
              <strong>{t("technicians.modal.registration_date")}:</strong>{" "}
              {dayjs(technicianDetail.dateCreated).format("DD/MM/YYYY")}
            </div>

            {technicianDetail.services &&
              technicianDetail.services.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm mb-3 font-bold flex items-center gap-1.5">
                    {t("technicians.modal.skills_specialization")}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {technicianDetail.services.map((service) => (
                      <Tag
                        key={service.id}
                        color="blue"
                        className="text-[13px] px-2 py-1"
                      >
                        {service.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

            {/* Certificate Files */}
            {technicianDetail.certificateFiles &&
              technicianDetail.certificateFiles.length > 0 && (
                <div className="mb-5">
                  <div className="text-sm mb-3 font-bold flex items-center gap-1.5">
                    {t("technicians.modal.certifications")}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {technicianDetail.certificateFiles.map((file, index) => {
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 px-4 py-3 border border-sky-100 rounded-lg bg-sky-50 transition-all duration-300 ease-in-out shadow-sm hover:bg-sky-100 hover:border-blue-500 hover:shadow-md hover:-translate-y-px"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-base shadow-md shadow-blue-500/30">
                            📜
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 font-medium mb-0.5">
                              {file.fileName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {t("technicians.modal.certifications")} #{index + 1}
                            </div>
                          </div>
                          <Space size={8}>
                            <Button
                              size="small"
                              type="text"
                              onClick={() => {
                                const previewUrl = adminApi.previewFile(
                                  file.filePath
                                );
                                window.open(previewUrl, "_blank");
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
                              {t("technicians.modal.preview")}
                            </Button>
                            <Button
                              size="small"
                              type="primary"
                              onClick={async () => {
                                try {
                                  const result = await adminApi.downloadFile(
                                    file.filePath
                                  );
                                  if (result.success) {
                                    toast.success(t("success.download_success"));
                                  } else {
                                    toast.error(
                                      result.message || t("success.download_error")
                                    );
                                  }
                                } catch (error) {
                                  toast.error(t("success.download_error"));
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
                                boxShadow: "0 2px 4px rgba(82,196,26,0.3)",
                              }}
                            >
                              {t("technicians.modal.download")}
                            </Button>
                          </Space>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Legal Document */}
            {technicianDetail.legalDocument && 
              technicianDetail.legalDocument.length > 0 && (
              <div className="mb-5">
                <div className="text-sm mb-3 font-bold flex items-center gap-1.5">
                  {t("technician_register.legal_document.title")}
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-3 px-4 py-3 border border-purple-100 rounded-lg bg-purple-50 transition-all duration-300 ease-in-out shadow-sm hover:bg-purple-100 hover:border-purple-500 hover:shadow-md hover:-translate-y-px">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-400 flex items-center justify-center text-base shadow-md shadow-purple-500/30">
                      🆔
                    </div>

                    <div className="flex-1">
                      <div className="text-sm text-gray-800 font-medium mb-0.5">
                        {technicianDetail.legalDocument[0]?.fileName || t("technician_register.legal_document.title")}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t("technician_register.legal_document.title")}
                      </div>
                    </div>

                    <Space size={8}>
                      <Button
                        size="small"
                        type="text"
                        onClick={() => {
                          // Gọi API Preview
                          const previewUrl = adminApi.previewFile(
                            technicianDetail.legalDocument[0].filePath
                          );
                          window.open(previewUrl, "_blank");
                        }}
                        style={{
                          padding: "6px 12px",
                          height: "auto",
                          color: "#722ed1",
                          fontWeight: 500,
                          borderRadius: 6,
                          border: "1px solid #d9d9d9",
                        }}
                      >
                        {t("technicians.modal.preview")}
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={async () => {
                          try {
                            const result = await adminApi.downloadFile(
                              technicianDetail.legalDocument[0].filePath
                            );
                            if (result.success) {
                              toast.success(t("success.download_success"));
                            } else {
                              toast.error(
                                result.message || t("success.download_error")
                              );
                            }
                          } catch (error) {
                            toast.error(t("success.download_error"));
                          }
                        }}
                        style={{
                          padding: "6px 12px",
                          height: "auto",
                          fontSize: 12,
                          fontWeight: 500,
                          borderRadius: 6,
                          background:
                            "linear-gradient(135deg, #b37feb 0%, #722ed1 100%)", 
                          border: "none",
                          boxShadow: "0 2px 4px rgba(114, 46, 209, 0.3)",
                        }}
                      >
                        {t("technicians.modal.download")}
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <strong>{t("technicians.table.status")}: </strong>
              <Tag
                color={
                  TechnicianApprovalStatusColors[
                    technicianDetail.approvalStatus
                  ]
                }
              >
                {
                  TechnicianApprovalStatusLabels[
                    technicianDetail.approvalStatus
                  ]
                }
              </Tag>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckOutlined style={{ color: "#52c41a" }} />
            <span>{t("technicians.confirm_batch_approve")}</span>
          </div>
        }
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setSelectedTechnicianId(null);
        }}
        okText={t("technicians.approve")}
        cancelText={t("cancel")}
        confirmLoading={loading}
        okButtonProps={{ style: { backgroundColor: "#52c41a" } }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ExclamationCircleOutlined
            style={{ color: "#faad14", fontSize: 22 }}
          />
          <span>{t("technicians.confirm_batch_approve_message", { count: 1 })}</span>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CloseOutlined style={{ color: "#ff4d4f" }} />
            <span>{t("technicians.confirm_batch_reject")}</span>
          </div>
        }
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedTechnicianId(null);
          setRejectionReason("");
        }}
        okText={t("technicians.reject")}
        cancelText={t("cancel")}
        confirmLoading={loading}
        okType="danger"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ExclamationCircleOutlined
            style={{ color: "#faad14", fontSize: 22 }}
          />
          <span>{t("technicians.confirm_batch_reject_message", { count: 1 })}</span>
        </div>
        <br></br>
        <Input.TextArea
          rows={4}
          placeholder={t("rejection_reason_placeholder")}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
