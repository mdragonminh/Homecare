import { Avatar, Button, Popconfirm, Space, Tag, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  StopOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

export const getCustomerColumns = (handleViewDetails, handleToggleStatus) => [
  {
    title: "Avatar",
    dataIndex: ["user", "avatar"],
    key: "avatar",
    width: 80,
    render: (avatar, record) => (
      <Avatar
        src={avatar || record.avatar}
        icon={<UserOutlined />}
        size={40}
      />
    ),
  },
  {
    title: "Họ và tên",
    dataIndex: ["user", "fullName"],
    key: "fullName",
    render: (fullName, record) => fullName || record.fullName || "N/A",
  },
  {
    title: "Email",
    dataIndex: ["user", "email"],
    key: "email",
    render: (email, record) => email || record.email || "N/A",
  },
  {
    title: "Số điện thoại",
    dataIndex: ["user", "phoneNumber"],
    key: "phoneNumber",
    render: (phone, record) => phone || record.phoneNumber || "N/A",
  },
  {
    title: "Đăng nhập lần cuối",
    dataIndex: ["user", "lastLoginAt"],
    key: "lastLoginAt",
    render: (date) =>
      date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "Chưa đăng nhập",
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date) => dayjs(date).format("DD/MM/YYYY"),
  },
  {
    title: "Trạng thái",
    dataIndex: ["user", "isActive"],
    key: "status",
    render: (isActive, record) => {
      const active = isActive ?? record.isActive;
      return (
        <Tag color={active ? "success" : "error"}>
          {active ? "Hoạt động" : "Vô hiệu hóa"}
        </Tag>
      );
    },
  },
  {
    title: "Hành động",
    key: "actions",
    width: 200,
    render: (_, record) => (
      <Space>
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
        <Popconfirm
          title={`${
            record.user?.isActive ?? record.isActive
              ? "Vô hiệu hóa"
              : "Kích hoạt"
          } tài khoản này?`}
          onConfirm={() => handleToggleStatus(record)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <Tooltip
            title={
              record.user?.isActive ?? record.isActive
                ? "Vô hiệu hóa"
                : "Kích hoạt"
            }
          >
            <Button
              type="text"
              icon={
                record.user?.isActive ?? record.isActive ? (
                  <StopOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              danger={record.user?.isActive ?? record.isActive}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
];

export const getTechnicianColumns = (
  handleViewDetails,
  handleApproveTechnician,
  handleRejectTechnician,
  handleToggleStatus
) => [
  {
    title: "Avatar",
    dataIndex: "avatar",
    key: "avatar",
    width: 80,
    render: (avatar, record) => (
      <Avatar
        src={avatar || record.user?.avatar}
        icon={<ToolOutlined />}
        size={40}
      />
    ),
  },
  {
    title: "Họ và tên",
    dataIndex: "fullName",
    key: "fullName",
    render: (name, record) => name || record.user?.fullName || "N/A",
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (email, record) => email || record.user?.email || "N/A",
  },
  {
    title: "Số điện thoại",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
    render: (phone, record) => phone || record.user?.phoneNumber || "N/A",
  },
  {
    title: "Kinh nghiệm",
    dataIndex: "experienceYears",
    key: "experienceYears",
    render: (years) => (years ? `${years} năm` : "N/A"),
  },
  {
    title: "Trạng thái phê duyệt",
    dataIndex: "approvalStatus",
    key: "approvalStatus",
    render: (status) => {
      const statusMap = {
        0: { color: "warning", text: "Chờ phê duyệt" },
        1: { color: "success", text: "Đã phê duyệt" },
        2: { color: "error", text: "Từ chối" },
        Pending: { color: "warning", text: "Chờ phê duyệt" },
        Approved: { color: "success", text: "Đã phê duyệt" },
        Rejected: { color: "error", text: "Từ chối" },
      };
      const statusInfo = statusMap[status] || {
        color: "default",
        text: status,
      };
      return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
    },
  },
  {
    title: "Trạng thái tài khoản",
    dataIndex: "isActive",
    key: "isActive",
    render: (isActive, record) => {
      // Trạng thái tài khoản chỉ phụ thuộc vào khóa/mở (admin), không phụ thuộc KTV tự tắt nhận việc
      const suspended = record.user?.isSuspended ?? record.isSuspended;
      const active = suspended !== undefined ? !suspended : true;
      return (
        <Tag color={active ? "success" : "error"}>
          {active ? "Hoạt động" : "Vô hiệu hóa"}
        </Tag>
      );
    },
  },
  {
    title: "Trạng thái nhận việc",
    dataIndex: "isWorking",
    key: "isWorking",
    render: (isWorking, record) => {
      // Nếu bị khóa bởi admin -> ngừng nhận việc; ngược lại dùng trạng thái KTV tự bật/tắt
      const suspended = record.user?.isSuspended ?? record.isSuspended ?? false;
      const working = suspended
        ? false
        : record.isActive ??
          record.user?.isActive ??
          record.isWorking ??
          isWorking ??
          false;
      return (
        <Tag color={working ? "processing" : "default"}>
          {working ? "Đang nhận việc" : "Ngừng nhận việc"}
        </Tag>
      );
    },
  },
  {
    title: "Hành động",
    key: "actions",
    width: 250,
    render: (_, record) => (
      <Space>
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
        {(record.approvalStatus === "Pending" || record.approvalStatus === 0) && (
          <>
            <Popconfirm
              title="Phê duyệt kỹ thuật viên này?"
              onConfirm={() => handleApproveTechnician(record.id)}
              okText="Phê duyệt"
              cancelText="Hủy"
            >
              <Tooltip title="Phê duyệt">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
            </Popconfirm>
            <Popconfirm
              title="Từ chối kỹ thuật viên này?"
              onConfirm={() => handleRejectTechnician(record.id)}
              okText="Từ chối"
              cancelText="Hủy"
            >
              <Tooltip title="Từ chối">
                <Button type="text" icon={<StopOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          </>
        )}
        {(record.approvalStatus === "Approved" || record.approvalStatus === 1) && (
          <Popconfirm
            title={`${
              (record.user?.isSuspended ?? record.isSuspended ?? false)
                ? "Kích hoạt"
                : "Vô hiệu hóa"
            } tài khoản này?`}
            onConfirm={() => handleToggleStatus(record)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Tooltip
              title={
                (record.user?.isSuspended ?? record.isSuspended ?? false)
                  ? "Kích hoạt"
                  : "Vô hiệu hóa"
              }
            >
              <Button
                type="text"
                icon={
                  (record.user?.isSuspended ?? record.isSuspended ?? false) ? (
                    <CheckCircleOutlined />
                  ) : (
                    <StopOutlined />
                  )
                }
                danger={
                  !(record.user?.isSuspended ?? record.isSuspended ?? false)
                }
              />
            </Tooltip>
          </Popconfirm>
        )}
      </Space>
    ),
  },
];

export const getStaffColumns = (
  handleToggleStatus,
  setSelectedAccount,
  form,
  setEditModalVisible
) => [
  {
    title: "Avatar",
    dataIndex: "avatar",
    key: "avatar",
    width: 80,
    render: (avatar) => (
      <Avatar src={avatar} icon={<UserOutlined />} size={40} />
    ),
  },
  {
    title: "Họ và tên",
    dataIndex: "fullName",
    key: "fullName",
    render: (name) => name || "N/A",
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
    render: (phone) => phone || "N/A",
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date) => dayjs(date).format("DD/MM/YYYY"),
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    render: (isActive) => (
      <Tag color={isActive ? "success" : "error"}>
        {isActive ? "Hoạt động" : "Vô hiệu hóa"}
      </Tag>
    ),
  },
  {
    title: "Hành động",
    key: "actions",
    width: 150,
    render: (_, record) => (
      <Space>
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedAccount(record);
              form.setFieldsValue(record);
              setEditModalVisible(true);
            }}
          />
        </Tooltip>
        <Popconfirm
          title={`${
            record.isActive ? "Vô hiệu hóa" : "Kích hoạt"
          } tài khoản này?`}
          onConfirm={() => handleToggleStatus(record)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <Tooltip title={record.isActive ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button
              type="text"
              icon={
                record.isActive ? <StopOutlined /> : <CheckCircleOutlined />
              }
              danger={record.isActive}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
];
