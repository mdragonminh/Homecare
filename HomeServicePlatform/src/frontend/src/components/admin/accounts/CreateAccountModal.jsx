import { Button, Form, Input, Modal, Select, Space } from "antd";

export default function CreateAccountModal({ visible, form, loading, role, onCancel, onSubmit }) {
  return (
    <Modal
      title="Tạo tài khoản mới"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Vai trò"
          name="role"
          rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
        >
          <Select disabled>
            <Select.Option value="operator">Operator</Select.Option>
            <Select.Option value="equipmentmanager">
              Equipment Manager
            </Select.Option>
            <Select.Option value="supporter">Supporter</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Tên tài khoản"
          name="userName"
          rules={[{ required: true, message: "Vui lòng nhập tên tài khoản" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Họ và tên" name="fullName">
          <Input />
        </Form.Item>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Số điện thoại" name="phoneNumber">
          <Input />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Vui lòng xác nhận mật khẩu" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Mật khẩu xác nhận không khớp")
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Tạo
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
