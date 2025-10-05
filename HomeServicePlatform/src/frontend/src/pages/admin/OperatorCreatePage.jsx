import { LockOutlined, MailOutlined, UserAddOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi } from "../../services/adminApi";

const { Title, Text } = Typography;

export default function OperatorCreatePage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await adminApi.createOperator(values);
      if (res.success) {
        toast.success("Tạo operator thành công! 🎉");
        form.resetFields();
      } else {
        toast.error(res.message || "Tạo operator thất bại");
      }
    } catch (error) {
      console.error("Create operator error:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <UserAddOutlined style={{ color: "#1890ff" }} />
          Tạo tài khoản Operator
        </Title>
        <Text type="secondary">
          Tạo tài khoản mới cho nhân viên vận hành hệ thống
        </Text>
      </div>

      <Card 
        style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        bodyStyle={{ padding: 32 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
          initialValues={{ email: "", username: "", password: "" }}
        >
          <Form.Item
            label="📧 Email Address"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="operator@example.com"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="👤 Username" 
            name="username"
            rules={[
              { required: true, message: "Vui lòng nhập username" },
              { min: 3, message: "Username phải có ít nhất 3 ký tự" },
              { max: 50, message: "Username không được quá 50 ký tự" }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="operator001"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="🔒 Password"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••••••"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                style={{ 
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  minWidth: 140
                }}
              >
                {loading ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
              <Button 
                size="large" 
                onClick={() => form.resetFields()}
                style={{ borderRadius: 8 }}
              >
                Làm mới
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
