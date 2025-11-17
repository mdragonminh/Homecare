import { Avatar, Button, Descriptions, Modal, Tag, Space, Typography } from "antd";
import { UserOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

export default function AccountDetailModal({ visible, account, onClose }) {
  const renderApprovalStatus = (status) => {
    const statusMap = {
      0: { color: "warning", text: "Chờ phê duyệt" },
      1: { color: "success", text: "Đã phê duyệt" },
      2: { color: "error", text: "Từ chối" },
      Pending: { color: "warning", text: "Chờ phê duyệt" },
      Approved: { color: "success", text: "Đã phê duyệt" },
      Rejected: { color: "error", text: "Từ chối" },
    };
    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  return (
    <Modal
      title="Chi tiết tài khoản"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      width={700}
    >
      {account && (
        <>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Avatar">
              <Avatar
                src={account.user?.avatar || account.avatar}
                icon={<UserOutlined />}
                size={64}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Họ và tên">
              {account.user?.fullName || account.fullName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Tên tài khoản">
              {account.user?.userName || account.userName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {account.user?.email || account.email || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {account.user?.phoneNumber || account.phoneNumber || "N/A"}
            </Descriptions.Item>
            {account.experienceYears !== undefined && (
              <Descriptions.Item label="Kinh nghiệm">
                {account.experienceYears} năm
              </Descriptions.Item>
            )}
            {account.approvalStatus !== undefined &&
              account.approvalStatus !== null && (
                <Descriptions.Item label="Trạng thái phê duyệt">
                  {renderApprovalStatus(account.approvalStatus)}
                </Descriptions.Item>
              )}
            <Descriptions.Item label="Trạng thái tài khoản">
              <Tag
                color={
                  account.user?.isActive ?? account.isActive
                    ? "success"
                    : "error"
                }
              >
                {account.user?.isActive ?? account.isActive
                  ? "Hoạt động"
                  : "Vô hiệu hóa"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(account.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>

            {/* Services Section */}
            {account.services && account.services.length > 0 && (
              <Descriptions.Item label="Dịch vụ">
                <Space wrap>
                  {account.services.map((service) => (
                    <Tag color="blue" key={service.id || service}>
                      {typeof service === "object" ? service.name : service}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}

            {/* Certificates Section */}
            {account.certificates && account.certificates.length > 0 && (
              <Descriptions.Item label="Chứng chỉ">
                <Space direction="vertical" style={{ width: "100%" }}>
                  {account.certificates.map((cert, index) => (
                    <div key={cert.id || index}>
                      <Space>
                        <FileTextOutlined />
                        <Text strong>{cert.name || `Chứng chỉ ${index + 1}`}</Text>
                      </Space>
                      {cert.issueDate && (
                        <div style={{ marginLeft: 24, color: "#888" }}>
                          Ngày cấp: {dayjs(cert.issueDate).format("DD/MM/YYYY")}
                        </div>
                      )}
                      {cert.expiryDate && (
                        <div style={{ marginLeft: 24, color: "#888" }}>
                          Hết hạn: {dayjs(cert.expiryDate).format("DD/MM/YYYY")}
                        </div>
                      )}
                      {cert.fileUrl && (
                        <div style={{ marginLeft: 24 }}>
                          <Button
                            type="link"
                            size="small"
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Xem chứng chỉ
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      )}
    </Modal>
  );
}
