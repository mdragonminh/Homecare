import { Modal, Form, Input, Switch, Button, Space } from "antd";
import { systemSettingApi } from "../../../services/systemSettingApi";
import { toast } from "sonner";

export default function ModalEditSetting({ open, onClose, onSuccess, setting }) {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    const res = await systemSettingApi.updateSettingById(setting.id, values);

    if (res.success) {
      toast.success("Cập nhật thành công");
      onSuccess();
      onClose();
      return;
    }

    const backendMsg = res.message;

    form.setFields([
      {
        name: "value",
        errors: [backendMsg],
      },
    ]);
  };

  return (
    <Modal title="Chỉnh sửa cài đặt" open={open} onCancel={onClose} footer={null}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          value: setting?.value,
          description: setting?.description,
          isSensitive: setting?.isSensitive,
        }}
      >
        <Form.Item label="Giá trị" name="value" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Sensitive" name="isSensitive" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Space>
          <Button type="primary" htmlType="submit">Lưu</Button>
          <Button onClick={onClose}>Hủy</Button>
        </Space>
      </Form>
    </Modal>
  );
}
