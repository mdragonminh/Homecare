import { useState, useEffect } from "react";
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Input, 
  Select, 
  Space, 
  message, 
  Modal, 
  Tooltip,
  Dropdown,
  Badge
} from "antd";
import { 
  SearchOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  EyeOutlined,
  DownOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { adminApi } from "../../services/adminApi";
import { 
  TechnicianApprovalStatus, 
  TechnicianApprovalStatusLabels, 
  TechnicianApprovalStatusColors 
} from "../../constants/enums";

const { Option } = Select;
const { confirm } = Modal;

export default function TechniciansPage() {
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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [technicianDetail, setTechnicianDetail] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Approval status options
  const approvalStatusOptions = [
    { value: undefined, label: "Tất cả trạng thái" },
    { value: TechnicianApprovalStatus.Pending, label: TechnicianApprovalStatusLabels[TechnicianApprovalStatus.Pending] },
    { value: TechnicianApprovalStatus.Approved, label: TechnicianApprovalStatusLabels[TechnicianApprovalStatus.Approved] },
    { value: TechnicianApprovalStatus.Rejected, label: TechnicianApprovalStatusLabels[TechnicianApprovalStatus.Rejected] },
  ];

  // Get approval status tag
  const getApprovalStatusTag = (status) => {
    const label = TechnicianApprovalStatusLabels[status];
    const color = TechnicianApprovalStatusColors[status];
    
    if (label && color) {
      return <Tag color={color}>{label}</Tag>;
    }
    
    return <Tag>Không xác định</Tag>;
  };

  // Fetch technicians
  const fetchTechnicians = async (params = {}) => {
    setLoading(true);
    try {
      const response = await adminApi.getTechnicians({
        pageNumber: params.current || pagination.current,
        pageSize: params.pageSize || pagination.pageSize,
        searchTerm: filters.searchTerm,
        ...(filters.approvalStatus && { approvalStatus: filters.approvalStatus }),
      });

      if (response.success) {
        setTechnicians(response.data.items || []);
        setPagination({
          current: response.data.currentPage || 1,
          pageSize: response.data.pageSize || 10,
          total: response.data.totalCount || 0,
        });
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi tải danh sách kỹ thuật viên");
    }
    setLoading(false);
  };


  // Handle search
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle approve technician
  const handleApprove = async (technicianId) => {
    try {
      const response = await adminApi.approveTechnician(technicianId);
      if (response.success) {
        message.success("Duyệt kỹ thuật viên thành công!");
        fetchTechnicians();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi duyệt kỹ thuật viên");
    }
  };

  // Handle reject technician
  const handleReject = async (technicianId) => {
    try {
      const response = await adminApi.rejectTechnician(technicianId);
      if (response.success) {
        message.success("Từ chối kỹ thuật viên thành công!");
        fetchTechnicians();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi từ chối kỹ thuật viên");
    }
  };

  // Handle batch operations
  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một kỹ thuật viên");
      return;
    }

    confirm({
      title: "Xác nhận duyệt hàng loạt",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn duyệt ${selectedRowKeys.length} kỹ thuật viên được chọn?`,
      async onOk() {
        try {
          const response = await adminApi.batchApproveTechnicians(selectedRowKeys);
          if (response.success) {
            message.success(`Duyệt thành công ${response.data.successCount}/${response.data.totalCount} kỹ thuật viên`);
            setSelectedRowKeys([]);
            fetchTechnicians();
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error("Có lỗi xảy ra khi duyệt hàng loạt");
        }
      },
    });
  };

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một kỹ thuật viên");
      return;
    }

    confirm({
      title: "Xác nhận từ chối hàng loạt",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn từ chối ${selectedRowKeys.length} kỹ thuật viên được chọn?`,
      async onOk() {
        try {
          const response = await adminApi.batchRejectTechnicians(selectedRowKeys);
          if (response.success) {
            message.success(`Từ chối thành công ${response.data.successCount}/${response.data.totalCount} kỹ thuật viên`);
            setSelectedRowKeys([]);
            fetchTechnicians();
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error("Có lỗi xảy ra khi từ chối hàng loạt");
        }
      },
    });
  };

  // Handle view technician details
  const handleViewDetails = async (technicianId) => {
    try {
      const response = await adminApi.getTechnicianById(technicianId);
      if (response.success) {
        setTechnicianDetail(response.data);
        setDetailModalVisible(true);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi tải thông tin kỹ thuật viên");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text) => <strong>{text}</strong>,
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
      title: "Kỹ năng",
      dataIndex: "skillSet",
      key: "skillSet",
      render: (text) => {
        try {
          const skillData = JSON.parse(text);
          const specializations = skillData.specializations || [];
          
          if (specializations.length === 0) {
            return (
              <Tooltip title={text}>
                <span style={{ maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {text}
                </span>
              </Tooltip>
            );
          }

          const displayText = specializations.slice(0, 2).join(", ");
          const remainingCount = specializations.length - 2;
          
          return (
            <Tooltip title={`Chuyên môn: ${specializations.join(", ")}\n${skillData.bio ? `Mô tả: ${skillData.bio}` : ''}`}>
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {specializations.slice(0, 2).map((spec, index) => (
                    <Tag key={index} size="small" color="blue">{spec}</Tag>
                  ))}
                  {remainingCount > 0 && (
                    <Tag size="small" color="default">+{remainingCount}</Tag>
                  )}
                </div>
              </div>
            </Tooltip>
          );
        } catch (error) {
          return (
            <Tooltip title={text}>
              <span style={{ maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {text}
              </span>
            </Tooltip>
          );
        }
      },
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "experienceYears",
      key: "experienceYears",
      render: (years) => `${years} năm`,
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "approvalStatus",
      key: "approvalStatus",
      render: (status) => getApprovalStatusTag(status),
      width: 130,
    },
    {
      title: "Ngày tạo",
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
      width: 120,
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          {record.approvalStatus === TechnicianApprovalStatus.Pending && (
            <>
              <Tooltip title="Duyệt">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  style={{ color: "#52c41a" }}
                  onClick={() => {
                    confirm({
                      title: "Xác nhận duyệt",
                      content: `Bạn có chắc chắn muốn duyệt kỹ thuật viên "${record.fullName}"?`,
                      onOk() {
                        handleApprove(record.id);
                      },
                    });
                  }}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  style={{ color: "#ff4d4f" }}
                  onClick={() => {
                    confirm({
                      title: "Xác nhận từ chối",
                      content: `Bạn có chắc chắn muốn từ chối kỹ thuật viên "${record.fullName}"?`,
                      onOk() {
                        handleReject(record.id);
                      },
                    });
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.approvalStatus !== TechnicianApprovalStatus.Pending, // Only pending technicians can be selected
    }),
  };

  // Batch actions menu
  const batchActionsMenu = {
    items: [
      {
        key: "approve",
        label: "Duyệt đã chọn",
        icon: <CheckOutlined />,
        onClick: handleBatchApprove,
      },
      {
        key: "reject",
        label: "Từ chối đã chọn",
        icon: <CloseOutlined />,
        onClick: handleBatchReject,
      },
    ],
  };

  useEffect(() => {
    console.log("Filters changed:", filters);
    fetchTechnicians();
  }, [pagination.current, pagination.pageSize, filters]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}>
          🔧 Quản lý Kỹ thuật viên
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý và duyệt hồ sơ kỹ thuật viên
        </p>
      </div>

      <Card style={{ borderRadius: 12 }}>
        {/* Filters */}
        <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên, email, kỹ năng..."
            style={{ width: 300 }}
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          
          <Select
            placeholder="Trạng thái duyệt"
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

          {selectedRowKeys.length > 0 && (
            <Dropdown menu={batchActionsMenu} placement="bottomLeft">
              <Button>
                Thao tác hàng loạt ({selectedRowKeys.length}) <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </div>

        {/* Statistics */}
        <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ 
            padding: "12px 20px", 
            background: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)", 
            borderRadius: 8,
            border: "1px solid #ffd591",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 120
          }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: "50%", 
              backgroundColor: "#fa8c16",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: "bold"
            }}>
              {technicians.filter(t => t.approvalStatus === TechnicianApprovalStatus.Pending).length}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#d4680a" }}>Chờ duyệt</span>
          </div>

          <div style={{ 
            padding: "12px 20px", 
            background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)", 
            borderRadius: 8,
            border: "1px solid #b7eb8f",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 120
          }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: "50%", 
              backgroundColor: "#52c41a",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: "bold"
            }}>
              {technicians.filter(t => t.approvalStatus === TechnicianApprovalStatus.Approved).length}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#389e0d" }}>Đã duyệt</span>
          </div>

          <div style={{ 
            padding: "12px 20px", 
            background: "linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%)", 
            borderRadius: 8,
            border: "1px solid #ffa39e",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 120
          }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: "50%", 
              backgroundColor: "#ff4d4f",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: "bold"
            }}>
              {technicians.filter(t => t.approvalStatus === TechnicianApprovalStatus.Rejected).length}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#cf1322" }}>Bị từ chối</span>
          </div>

          <div style={{ 
            padding: "12px 20px", 
            background: "linear-gradient(135deg, #f0f0f0 0%, #d9d9d9 100%)", 
            borderRadius: 8,
            border: "1px solid #bfbfbf",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 120
          }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: "50%", 
              backgroundColor: "#595959",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: "bold"
            }}>
              {technicians.length}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#434343" }}>Tổng cộng</span>
          </div>
        </div>

        {/* Table */}
        <Table
          rowSelection={rowSelection}
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
              `${range[0]}-${range[1]} của ${total} kỹ thuật viên`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
                <div style={{ fontSize: 16, color: "#666", marginBottom: 8 }}>
                  Chưa có kỹ thuật viên nào
                </div>
                <div style={{ fontSize: 14, color: "#999" }}>
                  {filters.searchTerm || filters.approvalStatus !== undefined 
                    ? "Không tìm thấy kết quả phù hợp với bộ lọc" 
                    : "Chưa có kỹ thuật viên nào đăng ký"}
                </div>
              </div>
            )
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
            Đóng
          </Button>,
          ...(technicianDetail?.approvalStatus === TechnicianApprovalStatus.Pending ? [
            <Button 
              key="reject" 
              danger 
              icon={<CloseOutlined />}
              onClick={() => {
                handleReject(technicianDetail.id);
                setDetailModalVisible(false);
              }}
            >
              Từ chối
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
              Duyệt
            </Button>,
          ] : []),
        ]}
        width={700}
      >
        {technicianDetail && (
          <div>
            {/* Header */}
            <div style={{ 
              marginBottom: 24, 
              textAlign: "center", 
              borderBottom: "1px solid #f0f0f0",
              paddingBottom: 16 
            }}>
              <div style={{ 
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
                margin: "0 auto 12px auto"
              }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Basic Info */}
              <Card size="small" title="🔍 Thông tin cơ bản" style={{ height: "fit-content" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>Username:</span>
                    <span style={{ fontWeight: 500 }}>{technicianDetail.userName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>Email:</span>
                    <span style={{ fontWeight: 500, color: "#1890ff" }}>{technicianDetail.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>SĐT:</span>
                    <span style={{ fontWeight: 500 }}>{technicianDetail.phoneNumber || "Chưa cập nhật"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ minWidth: 80, color: "#666", fontSize: 13 }}>Kinh nghiệm:</span>
                    <Tag color="blue">{technicianDetail.experienceYears} năm</Tag>
                  </div>
                </div>
              </Card>

              {/* Skills */}
              <Card size="small" title="🛠️ Kỹ năng & Chuyên môn" style={{ height: "fit-content" }}>
                <div>
                  {(() => {
                    try {
                      const skillData = JSON.parse(technicianDetail.skillSet);
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Specializations */}
                          {skillData.specializations && skillData.specializations.length > 0 && (
                            <div>
                              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Chuyên môn:</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {skillData.specializations.map((spec, index) => (
                                  <Tag key={index} color="green">{spec}</Tag>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Certifications */}
                          {skillData.certifications && (
                            <div>
                              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Chứng chỉ:</div>
                              <Tag color="orange">{skillData.certifications}</Tag>
                            </div>
                          )}

                          {/* Bio */}
                          {skillData.bio && (
                            <div>
                              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Giới thiệu:</div>
                              <div style={{ 
                                background: "#f9f9f9", 
                                padding: 12, 
                                borderRadius: 6, 
                                fontSize: 14,
                                lineHeight: 1.5
                              }}>
                                {skillData.bio}
                              </div>
                            </div>
                          )}

                          {/* Availability */}
                          {skillData.availability && skillData.availability.length > 0 && (
                            <div>
                              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Thời gian làm việc:</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {skillData.availability.map((day, index) => (
                                  <Tag key={index} color="purple">{day}</Tag>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      // Fallback for non-JSON skillset
                      return (
                        <div>
                          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>Mô tả kỹ năng:</div>
                          <div style={{ 
                            background: "#f9f9f9", 
                            padding: 12, 
                            borderRadius: 6, 
                            fontSize: 14,
                            lineHeight: 1.5
                          }}>
                            {technicianDetail.skillSet}
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </Card>
            </div>

            {/* Timeline */}
            <Card 
              size="small" 
              title="📅 Thời gian" 
              style={{ marginTop: 16 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#666" }}>Ngày đăng ký</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>
                    {new Date(technicianDetail.dateCreated).toLocaleDateString("vi-VN")}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {new Date(technicianDetail.dateCreated).toLocaleTimeString("vi-VN")}
                  </div>
                </div>

                {technicianDetail.approvedAt && (
                  <>
                    <div style={{ 
                      width: 60, 
                      height: 2, 
                      backgroundColor: technicianDetail.approvalStatus === TechnicianApprovalStatus.Approved ? "#52c41a" : "#ff4d4f",
                      margin: "0 16px"
                    }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        {technicianDetail.approvalStatus === TechnicianApprovalStatus.Approved ? "Ngày duyệt" : "Ngày từ chối"}
                      </div>
                      <div style={{ fontWeight: 500, marginTop: 4 }}>
                        {new Date(technicianDetail.approvedAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {new Date(technicianDetail.approvedAt).toLocaleTimeString("vi-VN")}
                      </div>
                      {technicianDetail.approvedBy && (
                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                          Bởi: {technicianDetail.approvedBy}
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
