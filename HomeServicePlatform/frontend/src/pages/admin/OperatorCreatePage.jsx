import { useState } from "react";
import { Mail, Lock, AtSign } from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { toast } from "react-toastify";

export default function OperatorCreatePage() {
  const [formData, setFormData] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password) {
      toast.error("Vui lòng nhập đủ thông tin");
      return;
    }
    setLoading(true);
    const res = await adminApi.createOperator(formData);
    setLoading(false);
    if (res.success) {
      toast.success("Tạo operator thành công");
      setFormData({ email: "", username: "", password: "" });
    } else {
      toast.error(res.message || "Tạo operator thất bại");
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Tạo tài khoản Operator</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              placeholder="operator@example.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              placeholder="operator001"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
      </form>
    </div>
  );
}
