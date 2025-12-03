import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Button, Space, Select, InputNumber } from "antd";
import { systemSettingApi } from "../../../services/systemSettingApi";
import { toast } from "sonner";

export default function ModalCreateSetting({ open, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [registry, setRegistry] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (open) {
      loadRegistry();
      form.resetFields();
      setSelectedKey(null);
    }
  }, [open]);

  const loadRegistry = async () => {
    const res = await systemSettingApi.getRegistry();
    if (res.success) setRegistry(res.data);
  };

  const handleKeyChange = (value) => {
    setSelectedKey(value);

    const def = registry.find((x) => x.key === value);

    if (def) {
      form.setFieldsValue({
        group: def.group,
        description: def.description,
        value: def.defaultValue,
        isSensitive: false
      });
    }
  };

  // 🔥 ALWAYS STRINGIFY VALUE BEFORE SUBMIT
  const normalizeValue = (val) => {
    if (typeof val === "boolean") return val ? "true" : "false";
    if (val == null) return "";
    return String(val);
  };

  const handleSubmit = async (values) => {
    const payload = {
      key: values.key,
      value: normalizeValue(values.value), // <-- FIX: always string
      group: values.group,
      description: values.description,
      isSensitive: values.isSensitive || false
    };

    const res = await systemSettingApi.createSetting(payload);

    if (res.success) {
      toast.success("Tạo setting thành công");
      onSuccess();
      onClose();
    } else {
      form.setFields([
        {
          name: "key",
          errors: [res.message],
        },
      ]);
    }
  };

  // ---- RENDER VALUE INPUT ----
  const renderValueInput = () => {
    if (!selectedKey) return <Input placeholder="Hãy chọn key" disabled />;

    const def = registry.find((x) => x.key === selectedKey);
    if (!def) return <Input />;

    const defaultVal = def.defaultValue;

    // Boolean
    if (defaultVal === "true" || defaultVal === "false") {
      return (
        <Form.Item name="value" valuePropName="checked">
          <Switch />
        </Form.Item>
      );
    }

    // Number
    if (!isNaN(defaultVal)) {
      return (
        <Form.Item name="value">
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      );
    }

    // Text
    return (
      <Form.Item name="value">
        <Input />
      </Form.Item>
    );
  };

  return (
    <Modal title="Tạo System Setting" open={open} footer={null} onCancel={onClose}>
      <Form layout="vertical" form={form} onFinish={handleSubmit}>

        {/* KEY SELECT */}
        <Form.Item label="Key" name="key" rules={[{ required: true }]}>
          <Select
            placeholder="Chọn key"
            onChange={handleKeyChange}
            options={registry.map((x) => ({
              label: x.key,
              value: x.key,
            }))}
          />
        </Form.Item>

        {/* GROUP (auto fill, disabled) */}
        <Form.Item label="Group" name="group" rules={[{ required: true }]}>
          <Input disabled />
        </Form.Item>

        {/* VALUE */}
        <Form.Item label="Giá trị" required>
          {renderValueInput()}
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Sensitive" name="isSensitive" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit">Tạo mới</Button>
          <Button onClick={onClose}>Hủy</Button>
        </Space>
      </Form>
    </Modal>
  );
}
