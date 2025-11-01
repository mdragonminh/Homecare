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
              ? `${tech.yearsOfExperience} năm`
              : tech.experience || "Chưa xác định",
            approvalStatus: tech.approvalStatus,
            rating: tech.averageRating || tech.rating || 0,
            completedJobs: tech.completedJobsCount || tech.completedJobs || 0,
            joinDate: tech.createdAt
              ? new Date(tech.createdAt).toLocaleDateString("vi-VN")
              : tech.joinDate,
            address: tech.address || "Chưa cập nhật",
          })) || [];

        setTechnicians(mappedData);
        setFilteredTechnicians(mappedData);
      } else {
        message.error(
          response.message || "Không thể tải danh sách kỹ thuật viên"
        );
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
      message.error("Đã có lỗi xảy ra khi tải danh sách kỹ thuật viên");
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
      message.error(response.message || "Không thể tải chi tiết");
      setTechnicianDetail(technician); // Fallback
    }
  } catch (error) {
    console.error("Error getting technician details:", error);
    message.error("Lỗi khi tải chi tiết kỹ thuật viên");
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
        message.success("Đã duyệt thành công kỹ thuật viên");
        setApproveModalVisible(false);
        setSelectedTechnicianId(null);
        // Reload dữ liệu để cập nhật trạng thái
        loadTechnicians();
      } else {
        message.error(response.message || "Không thể duyệt kỹ thuật viên");
      }
    } catch (error) {
      console.error("Error approving technician:", error);
      message.error("Đã có lỗi xảy ra khi duyệt kỹ thuật viên");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (technicianId) => {
    setSelectedTechnicianId(technicianId);
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    try {
      setLoading(true);
      const response = await technicianApi.rejectTechnician(
        selectedTechnicianId
      );
      if (response.success) {
        message.success("Đã từ chối thành công kỹ thuật viên");
        setRejectModalVisible(false);
        setSelectedTechnicianId(null);
        // Reload dữ liệu để cập nhật trạng thái
        loadTechnicians();
      } else {
        message.error(response.message || "Không thể từ chối kỹ thuật viên");
      }
    } catch (error) {
      console.error("Error rejecting technician:", error);
      message.error("Đã có lỗi xảy ra khi từ chối kỹ thuật viên");
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
      title: "Tên kỹ thuật viên",
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
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      render: (status) => (
        <Tag color={TechnicianApprovalStatusColors[status]}>
          {TechnicianApprovalStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
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
          🔧 Quản lý kỹ thuật viên
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý và duyệt đăng ký của kỹ thuật viên
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
          <div style={{ color: "#8c8c8c" }}>Đã duyệt</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}>
            {
              technicians.filter(
                (t) => t.approvalStatus === TechnicianApprovalStatus.Pending
              ).length
            }
          </div>
          <div style={{ color: "#8c8c8c" }}>Chờ duyệt</div>
        </Card>
        <Card style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>
            {
              technicians.filter(
                (t) => t.approvalStatus === TechnicianApprovalStatus.Rejected
              ).length
            }
          </div>
          <div style={{ color: "#8c8c8c" }}>Đã từ chối</div>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Search
            placeholder="Tìm kiếm theo tên, email, số điện thoại"
            allowClear
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">Tất cả</Option>
            <Option value={TechnicianApprovalStatus.Approved.toString()}>
              Đã duyệt
            </Option>
            <Option value={TechnicianApprovalStatus.Pending.toString()}>
              Chờ duyệt
            </Option>
            <Option value={TechnicianApprovalStatus.Rejected.toString()}>
              Đã từ chối
            </Option>
          </Select>
          <div style={{ marginLeft: "auto", color: "#8c8c8c" }}>
            Tổng số: {filteredTechnicians.length} kỹ thuật viên
          </div>
        </div>
      </Card>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredTechnicians}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} kỹ thuật viên`,
          }}
          scroll={{ x: 1400 }}
          loading={loading}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        key={technicianDetail?.id || "modal"}
        title="Chi tiết kỹ thuật viên"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose={true}
        centered
      >
        {technicianDetail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>Tên:</strong> {technicianDetail.fullName}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Email:</strong> {technicianDetail.email}
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>Kinh nghiệm:</strong> {technicianDetail.experienceYears}
            </div>

            <div style={{ marginBottom: 16 }}>
              <strong>Ngày tham gia:</strong>{" "}
              {dayjs(technicianDetail.dateCreated).format("DD/MM/YYYY")}
            </div>

            {technicianDetail.services &&
              technicianDetail.services.length > 0 && (
                <div style={{ marginBottom: 20 }}>
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
                    Kỹ năng đăng ký
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {technicianDetail.services.map((service) => (
                      <Tag
                        key={service.id}
                        color="blue"
                        style={{
                          fontSize: 13,
                          padding: "4px 8px",
                        }}
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
                <div style={{ marginBottom: 20 }}>
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
                    Chứng chỉ
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {technicianDetail.certificateFiles.map(
                      (file, index) => {
                        return (
                          <div
                            key={file.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "12px 16px",
                              border: "1px solid #e8f4fd",
                              borderRadius: 8,
                              backgroundColor: "#f9fcff",
                              transition: "all 0.3s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#e8f4fd";
                              e.currentTarget.style.borderColor = "#1890ff";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(24,144,255,0.15)";
                              e.currentTarget.style.transform =
                                "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#f9fcff";
                              e.currentTarget.style.borderColor = "#e8f4fd";
                              e.currentTarget.style.boxShadow =
                                "0 1px 3px rgba(0,0,0,0.05)";
                              e.currentTarget.style.transform = "translateY(0)";
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
                                boxShadow: "0 2px 4px rgba(24,144,255,0.3)",
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
                                {file.fileName}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#999",
                                }}
                              >
                                Chứng chỉ #{index + 1}
                              </div>
                            </div>
                            <Space size={8}>
                              <Button
                                size="small"
                                type="text"
                                onClick={() => {
                                  const previewUrl =
                                    adminApi.previewFile(file.filePath);
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
                                Xem
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
                                      toast.success("Tải xuống thành công!");
                                    } else {
                                      toast.error(
                                        result.message || "Tải xuống thất bại!"
                                      );
                                    }
                                  } catch (error) {
                                    toast.error("Có lỗi xảy ra khi tải xuống!");
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

            <div style={{ marginBottom: 16 }}>
              <strong>Trạng thái: </strong>
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
            <span>Xác nhận duyệt kỹ thuật viên</span>
          </div>
        }
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setSelectedTechnicianId(null);
        }}
        okText="Duyệt"
        cancelText="Hủy"
        confirmLoading={loading}
        okButtonProps={{ style: { backgroundColor: "#52c41a" } }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ExclamationCircleOutlined
            style={{ color: "#faad14", fontSize: 22 }}
          />
          <span>Bạn có chắc chắn muốn duyệt kỹ thuật viên này?</span>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CloseOutlined style={{ color: "#ff4d4f" }} />
            <span>Xác nhận từ chối kỹ thuật viên</span>
          </div>
        }
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedTechnicianId(null);
        }}
        okText="Từ chối"
        cancelText="Hủy"
        confirmLoading={loading}
        okType="danger"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ExclamationCircleOutlined
            style={{ color: "#faad14", fontSize: 22 }}
          />
          <span>Bạn có chắc chắn muốn từ chối kỹ thuật viên này?</span>
        </div>
      </Modal>
    </div>
  );
}
