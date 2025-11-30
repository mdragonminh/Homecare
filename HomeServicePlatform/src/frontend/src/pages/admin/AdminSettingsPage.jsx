import React, { useState, useEffect } from "react";
import {
  Input,
  Tabs,
  Typography,
  Card,
  Form,
  Button,
  Switch,
  InputNumber,
  Table,
  Modal,
  Space,
  Row,
  Col,
  Divider,
} from "antd";
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { systemSettingApi } from "../../services/systemSettingApi";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("General");
  const [form] = Form.useForm();
  const [settingsByGroup, setSettingsByGroup] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [modalForm] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await systemSettingApi.getSettingsByGroup();
      
      if (response.success) {
        setSettingsByGroup(response.data);
        // Set first group as active tab if exists
        const groups = Object.keys(response.data);
        if (groups.length > 0 && !groups.includes(activeTab)) {
          setActiveTab(groups[0]);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (setting) => {
    try {
      setLoading(true);
      const value = form.getFieldValue(setting.key);
      
      const response = await systemSettingApi.updateSettingById(setting.id, {
        value: String(value),
        description: setting.description,
      });

      if (response.success) {
        toast.success("Cập nhật cài đặt thành công");
        fetchSettings();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Không thể lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    modalForm.setFieldsValue({
      key: setting.key,
      value: setting.value,
      description: setting.description,
      group: setting.group,
      isSensitive: setting.isSensitive,
    });
    setShowModal(true);
  };

  const handleModalSubmit = async (values) => {
    try {
      setLoading(true);

      const response = await systemSettingApi.updateSettingById(editingSetting.id, {
        value: values.value,
        description: values.description,
      });

      if (response.success) {
        toast.success("Cập nhật thành công");
        setShowModal(false);
        fetchSettings();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Không thể lưu cài đặt");
    } finally {
      setLoading(false);
    }
  };

  const renderSettingInput = (setting) => {
    const value = setting.value;
    
    // Try to determine the type
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
        <Form.Item
          name={setting.key}
          initialValue={Number(value)}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    } else {
      return (
        <Form.Item
          name={setting.key}
          initialValue={value}
        >
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
      width: 200,
    },
    {
      title: "Giá trị",
      key: "value",
      render: (_, record) => (
        <Form form={form}>
          {renderSettingInput(record)}
        </Form>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={() => handleSaveSetting(record)}
            loading={loading}
          >
            Lưu
          </Button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSetting(record)}
          />
        </Space>
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
              ⚙️ Cài đặt hệ thống
            </h1>
            <p style={{ color: "#8c8c8c", margin: "8px 0 0 0" }}>
              Quản lý cài đặt và cấu hình toàn hệ thống
            </p>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSettings}
              loading={loading}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={Object.keys(settingsByGroup).map(group => ({
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
            ),
          }))}
        />
      </Card>

      {/* Edit Setting Modal */}
      <Modal
        title="Chỉnh sửa cài đặt"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            label="Giá trị"
            name="value"
            rules={[{ required: true, message: "Vui lòng nhập giá trị" }]}
          >
            <Input placeholder="e.g., true, false, 100" />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
          >
            <TextArea rows={3} placeholder="Mô tả về cài đặt này" />
          </Form.Item>

          <Form.Item
            label="Sensitive"
            name="isSensitive"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
