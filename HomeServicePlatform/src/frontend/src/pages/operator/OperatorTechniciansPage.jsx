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
} from "antd";
import {
  ToolOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  TechnicianApprovalStatus,
  TechnicianApprovalStatusColors,
  TechnicianApprovalStatusLabels,
} from "../../constants/enums";

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

  // Mock data - sẽ thay bằng API call thực tế
  useEffect(() => {
    const mockData = [
      {
        key: "1",
        id: "T001",
        name: "Lê Văn C",
        email: "levanc@gmail.com",
        phone: "0912345678",
        skills: ["Điện", "Nước", "Điều hòa"],
        experience: "5 năm",
        approvalStatus: TechnicianApprovalStatus.Approved,
        rating: 4.8,
        completedJobs: 45,
        joinDate: "2024-01-10",
        address: "123 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM",
      },
      {
        key: "2",
        id: "T002",
        name: "Nguyễn Minh D",
        email: "nguyenminhd@gmail.com",
        phone: "0908765432",
        skills: ["Điện tử", "Máy giặt"],
        experience: "3 năm",
        approvalStatus: TechnicianApprovalStatus.Pending,
        rating: 0,
        completedJobs: 0,
        joinDate: "2024-03-15",
        address: "456 Cộng Hòa, Q.Tân Bình, TP.HCM",
      },
      {
        key: "3",
        id: "T003",
        name: "Trần Văn E",
        email: "tranvane@gmail.com",
        phone: "0919876543",
        skills: ["Nước", "Gas"],
        experience: "7 năm",
        approvalStatus: TechnicianApprovalStatus.Rejected,
        rating: 0,
        completedJobs: 0,
        joinDate: "2024-02-20",
        address: "789 Nguyễn Văn Cừ, Q.5, TP.HCM",
      },
    ];
    setTechnicians(mockData);
    setFilteredTechnicians(mockData);
  }, []);

  useEffect(() => {
    let filtered = technicians;

    if (searchTerm) {
      filtered = filtered.filter(
        (tech) =>
          tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tech.phone.includes(searchTerm) ||
          tech.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (tech) => tech.approvalStatus.toString() === statusFilter
      );
    }

    setFilteredTechnicians(filtered);
  }, [searchTerm, statusFilter, technicians]);

  const handleViewDetails = (technician) => {
    setTechnicianDetail(technician);
    setDetailModalVisible(true);
  };

  const handleApprove = (technicianId) => {
    // API call để approve technician
    console.log("Approve technician:", technicianId);
  };

  const handleReject = (technicianId) => {
    // API call để reject technician
    console.log("Reject technician:", technicianId);
  };

  const columns = [
    {
      title: "Avatar",
      dataIndex: "name",
      key: "avatar",
      width: 60,
      render: (name) => (
        <Avatar icon={<ToolOutlined />} style={{ backgroundColor: "#1890ff" }}>
          {name.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
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
      title: "Kỹ năng",
      dataIndex: "skills",
      key: "skills",
      render: (skills) => (
        <div>
          {skills.slice(0, 2).map((skill) => (
            <Tag key={skill} color="blue" style={{ marginBottom: 2 }}>
              {skill}
            </Tag>
          ))}
          {skills.length > 2 && <Tag color="default">+{skills.length - 2}</Tag>}
        </div>
      ),
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "experience",
      key: "experience",
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => (
        <span>{rating > 0 ? `⭐ ${rating}/5` : "Chưa có"}</span>
      ),
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
          {record.approvalStatus === TechnicianApprovalStatus.Approved && (
            <Button type="text" icon={<EditOutlined />} size="small" />
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
            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc kỹ năng"
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
        title="Chi tiết kỹ thuật viên"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {technicianDetail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>Tên:</strong> {technicianDetail.name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Email:</strong> {technicianDetail.email}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Số điện thoại:</strong> {technicianDetail.phone}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Địa chỉ:</strong> {technicianDetail.address}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Kinh nghiệm:</strong> {technicianDetail.experience}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Kỹ năng:</strong>
              <div style={{ marginTop: 8 }}>
                {technicianDetail.skills.map((skill) => (
                  <Tag key={skill} color="blue">
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Trạng thái:</strong>
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
            {technicianDetail.approvalStatus ===
              TechnicianApprovalStatus.Approved && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <strong>Đánh giá:</strong>{" "}
                  {technicianDetail.rating > 0
                    ? `⭐ ${technicianDetail.rating}/5`
                    : "Chưa có"}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <strong>Công việc đã hoàn thành:</strong>{" "}
                  {technicianDetail.completedJobs}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
