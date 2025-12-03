import React, { useState, useEffect } from "react";
import {
  Input,
  Tabs,
  Card,
  Form,
  Button,
  Switch,
  InputNumber,
  Table,
  Space,
  Row,
  Col
} from "antd";
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  EditOutlined
} from "@ant-design/icons";
import { toast } from "sonner";
import { systemSettingApi } from "../../services/systemSettingApi";

// IMPORT 2 MODAL RIÊNG
import ModalCreateSetting from "../../components/admin/systemSetting/ModalCreateSetting";
import ModalEditSetting from "../../components/admin/systemSetting/ModalEditSetting";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("General");
  const [form] = Form.useForm();
  const [settingsByGroup, setSettingsByGroup] = useState({});

  // Modal CREATE
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal EDIT
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingApi.getSettingsByGroup();

      if (response.success) {
        setSettingsByGroup(response.data);

        const groups = Object.keys(response.data);
        if (groups.length > 0 && !groups.includes(activeTab)) {
          setActiveTab(groups[0]);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  };

  // Inline update từng hàng
  const handleSaveSetting = async (setting) => {
    try {
      setLoading(true);
      const value = form.getFieldValue(setting.key);

      const response = await systemSettingApi.updateSettingById(setting.id, {
        value: String(value),
        description: setting.description
      });

      if (response.success) {
        toast.success("Cập nhật cài đặt thành công");
        fetchSettings();
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Không thể lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  // Mở modal EDIT
  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    setShowEditModal(true);
  };

  // Render input value theo type
  const renderSettingInput = (setting) => {
    const value = setting.value;

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
        <Form.Item name={setting.key} initialValue={Number(value)}>
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    } else {
      return (
        <Form.Item name={setting.key} initialValue={value}>
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
      width: 200
    },
    {
      title: "Giá trị",
      key: "value",
      render: (_, record) => (
        <Form form={form}>{renderSettingInput(record)}</Form>
      )
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={() => handleSaveSetting(record)}
          >
            Lưu
          </Button>

          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSetting(record)}
          >
            Sửa
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h1 style={{ fontSize: 24, fontWeight: 600 }}>⚙️ Cài đặt hệ thống</h1>
            <p style={{ color: "#8c8c8c", marginTop: 6 }}>
              Quản lý cài đặt và cấu hình toàn hệ thống
            </p>
          </Col>

          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchSettings}>
                Làm mới
              </Button>

              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => setShowCreateModal(true)}
              >
                Tạo mới cấu hình
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* SETTINGS LIST */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={Object.keys(settingsByGroup).map((group) => ({
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
            )
          }))}
        />
      </Card>

      {/* MODAL TẠO MỚI */}
      <ModalCreateSetting
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchSettings}
      />

      <ModalEditSetting
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        setting={editingSetting}
        onSuccess={fetchSettings}
      />
    </div>
  );
}
