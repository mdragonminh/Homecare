import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import { homeApi } from "../../services/homeServiceApi";
import { systemSettingApi } from "../../services/systemSettingApi";

export default function HomeServicePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [sorter, setSorter] = useState({ field: null, order: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [basePrice, setBasePrice] = useState(100000); 
  const [form] = Form.useForm();

  const [modal, contextHolder] = Modal.useModal();

  const fetchData = async (
    page = 1,
    pageSize = 10,
    sort = sorter,
    keyword = search
  ) => {
    try {
      setLoading(true);
      let orderBy = null;
      if (sort?.field && sort?.order) {
        const direction = sort.order === "ascend" ? "asc" : "desc";
        orderBy = `${sort.field} ${direction}`;
      }

      const params = {
        pageNumber: page,
        pageSize,
        orderBy,
        search: keyword || undefined,
      };

      const res = await homeApi.listHomeService(params);
      
      setData(res.items || []);
      setPagination({
        current: res.currentPage || page,
        pageSize: res.pageSize || pageSize,
        total: res.totalCount || 0,
      });
    } catch (err) {
      toast.error("Không tải được danh sách dịch vụ", {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
    fetchBasePrice();
  }, []);

  const fetchBasePrice = async () => {
    try {
      const res = await systemSettingApi.getSettingByKey("DefaultServiceBasePrice");
      if (res.success && res.data?.value) {
        setBasePrice(parseFloat(res.data.value));
      }
    } catch (err) {
      console.error("Failed to fetch base price:", err);
      // Keep default value if fetch fails
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingRecord) {
        await homeApi.updateHomeService(editingRecord.id, values);
        toast.success("Cập nhật dịch vụ thành công!");
      } else {
        await homeApi.createHomeService(values);
        toast.success("Thêm dịch vụ mới thành công!");
      }
      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      fetchData(pagination.current, pagination.pageSize);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Lưu dịch vụ thất bại!";
      toast.error("Lưu dịch vụ thất bại!", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (record) => {
    const isDisabling = !record.isDeleted;
    modal.confirm({
      title: (
        <span className={`text-lg font-semibold ${isDisabling ? 'text-orange-600' : 'text-green-600'}`}>
          {isDisabling ? 'Vô hiệu hóa dịch vụ' : 'Kích hoạt dịch vụ'}
        </span>
      ),
      icon: <ExclamationCircleOutlined style={{ color: "#faad14" }} />,
      content: (
        <p className="text-gray-700">
          Bạn có chắc chắn muốn {isDisabling ? 'vô hiệu hóa' : 'kích hoạt'} dịch vụ{" "}
          <b className={isDisabling ? 'text-orange-600' : 'text-green-600'}>"{record.name}"</b>?
        </p>
      ),
      okText: "Đồng ý",
      cancelText: "Hủy",
      okType: isDisabling ? "danger" : "primary",
      centered: true,
      onOk: async () => {
        try {
          await homeApi.updateHomeService(record.id, {
            ...record,
            isDeleted: isDisabling,
          });
          toast.success(`Đã ${isDisabling ? 'vô hiệu hóa' : 'kích hoạt'} thành công!`);
          fetchData(pagination.current, pagination.pageSize);
        } catch (err) {
          const message =
            err?.response?.data?.message ||
            err?.response?.data ||
            err?.message ||
            `${isDisabling ? 'Vô hiệu hóa' : 'Kích hoạt'} thất bại!`;

          toast.error(`Không thể ${isDisabling ? 'vô hiệu hóa' : 'kích hoạt'} dịch vụ!`, {
            description: message,
          });
        }
      },
    });
  };


  const columns = [
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "Giá (₫)",
      dataIndex: "price",
      sorter: true,
      render: (price) => price?.toLocaleString(),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "isDeleted",
      key: "isDeleted",
      width: 120,
      render: (isDeleted) => (
        <Tag color={isDeleted ? "error" : "success"}>
          {isDeleted ? "Vô hiệu hóa" : "Hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingRecord(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Button
            icon={record.isDeleted ? <CheckCircleOutlined /> : <StopOutlined />}
            type={record.isDeleted ? "primary" : "default"}
            danger={!record.isDeleted}
            size="small"
            onClick={() => handleToggleStatus(record)}
          />
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination, filters, sorter) => {
    setSorter(sorter);
    fetchData(pagination.current, pagination.pageSize, sorter);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-1">
            Danh sách dịch vụ
          </h2>
          <p className="text-gray-500 text-sm">
            Quản lý, thêm mới và cập nhật dịch vụ trong hệ thống
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Tìm theo tên..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() =>
              fetchData(1, pagination.pageSize, sorter, search)
            }
            allowClear
            className="rounded-lg"
            style={{ width: 240 }}
          />
          <Button
            type="primary"
            onClick={() => fetchData(1, pagination.pageSize, sorter, search)}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md"
          >
            Tìm kiếm
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="bg-green-600 hover:bg-green-700 rounded-lg shadow-md"
            onClick={() => {
              form.resetFields();
              setEditingRecord(null);
              setModalVisible(true);
            }}
          >
            Thêm dịch vụ
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered={false}
          pagination={{
            ...pagination,
            showTotal: (total) => `Tổng ${total} dịch vụ`,
          }}
          onChange={handleTableChange}
          className="[&_th]:!bg-gray-100 [&_th]:!text-gray-700 [&_th]:!font-semibold [&_td]:!text-gray-700"
        />
      </div>

      <Modal
        open={modalVisible}
        title={editingRecord ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        okText={editingRecord ? "Cập nhật" : "Tạo mới"}
        cancelText="Hủy"
        okButtonProps={{ className: "bg-blue-600 hover:bg-blue-700" }}
        onOk={() => form.submit()}
        centered
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            label="Tên dịch vụ"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ!" }]}
          >
            <Input placeholder="Nhập tên dịch vụ" />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Giá (₫)
                {!editingRecord && (
                  <span className="text-gray-400 font-normal text-xs ml-2">
                    (Để trống sẽ dùng giá mặc định: {basePrice.toLocaleString()} ₫)
                  </span>
                )}
              </span>
            }
            name="price"
            rules={[
              { required: !!editingRecord, message: "Vui lòng nhập giá dịch vụ!" },
              {
                validator: async (_, value) => {
                  if (value !== undefined && value !== null && value < basePrice) {
                    throw new Error(`Giá không được thấp hơn giá cơ bản ${basePrice.toLocaleString()} ₫`);
                  }
                },
              },
            ]}
          >
            <InputNumber
              min={basePrice}
              placeholder={`Giá tối thiểu: ${basePrice.toLocaleString()} ₫`}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Nhập mô tả dịch vụ (tùy chọn)"
            />
          </Form.Item>
        </Form>
      </Modal>

      {contextHolder}
    </div>
  );
}
