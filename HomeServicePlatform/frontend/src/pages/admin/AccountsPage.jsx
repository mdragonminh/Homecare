import { useState } from "react";
import { Card, Tabs, Table, Tag, Space, Button, Avatar } from "antd";
import { 
  UserOutlined, 
  ToolOutlined, 
  CrownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined 
} from "@ant-design/icons";

const { TabPane } = Tabs;

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState("customer");

  // Mock data - sẽ thay bằng API call thực tế
  const mockCustomers = [
    {
      key: '1',
      id: 'C001',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0901234567',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      key: '2',
      id: 'C002', 
      name: 'Trần Thị B',
      email: 'tranthib@gmail.com',
      phone: '0907654321',
      status: 'inactive',
      createdAt: '2024-02-20'
    }
  ];

  const mockTechnicians = [
    {
      key: '1',
      id: 'T001',
      name: 'Lê Văn C',
      email: 'levanc@gmail.com',
      phone: '0912345678',
      skills: ['Điện', 'Nước'],
      experience: '5 năm',
      status: 'active',
      createdAt: '2024-01-10'
    }
  ];

  const mockOperators = [
    {
      key: '1',
      id: 'O001',
      name: 'operator001',
      email: 'operator@company.com',
      status: 'active',
      createdAt: '2024-03-01'
    }
  ];

  const customerColumns = [
    {
      title: 'Avatar',
      dataIndex: 'name',
      key: 'avatar',
      width: 60,
      render: (name) => <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068' }} />
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Tên khách hàng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: () => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      )
    }
  ];

  const technicianColumns = [
    {
      title: 'Avatar',
      dataIndex: 'name',
      key: 'avatar', 
      width: 60,
      render: (name) => <Avatar icon={<ToolOutlined />} style={{ backgroundColor: '#1890ff' }} />
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Tên kỹ thuật viên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email', 
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Kỹ năng',
      dataIndex: 'skills',
      key: 'skills',
      render: (skills) => (
        <>
          {skills.map(skill => (
            <Tag key={skill} color="blue">{skill}</Tag>
          ))}
        </>
      )
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: () => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      )
    }
  ];

  const operatorColumns = [
    {
      title: 'Avatar',
      dataIndex: 'name',
      key: 'avatar',
      width: 60,
      render: (name) => <Avatar icon={<CrownOutlined />} style={{ backgroundColor: '#722ed1' }} />
    },
    {
      title: 'ID',
      dataIndex: 'id', 
      key: 'id',
      width: 80
    },
    {
      title: 'Username',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: () => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'customer',
      label: (
        <span>
          <UserOutlined />
          Khách hàng ({mockCustomers.length})
        </span>
      ),
      children: (
        <Table 
          columns={customerColumns} 
          dataSource={mockCustomers}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      )
    },
    {
      key: 'technician', 
      label: (
        <span>
          <ToolOutlined />
          Kỹ thuật viên ({mockTechnicians.length})
        </span>
      ),
      children: (
        <Table 
          columns={technicianColumns} 
          dataSource={mockTechnicians}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      )
    },
    {
      key: 'operator',
      label: (
        <span>
          <CrownOutlined />
          Operator ({mockOperators.length})
        </span>
      ),
      children: (
        <Table 
          columns={operatorColumns} 
          dataSource={mockOperators}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: "#262626" }}>
          👥 Quản lý tài khoản
        </h1>
        <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
          Quản lý tất cả tài khoản người dùng trong hệ thống
        </p>
      </div>

      <Card 
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ margin: 0 }}
          tabBarStyle={{ 
            margin: 0, 
            paddingLeft: 24, 
            paddingRight: 24,
            borderBottom: "1px solid #f0f0f0"
          }}
        />
      </Card>
    </div>
  );
}
