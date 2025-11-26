import { useState, useEffect } from "react";
import {
  Modal,
  Tag,
  Rate,
  Spin,
  Empty,
  Avatar,
  Card,
  Divider,
  Button,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  StarOutlined,
  FileTextOutlined,
  ToolOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { technicianApi } from "../../services/technicianApi";
import { bookingApi } from "../../services/bookingApi";
import { adminApi } from "../../services/adminApi";

export default function TechnicianDetailModal({
  visible,
  onClose,
  technicianId,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [technicianDetail, setTechnicianDetail] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  useEffect(() => {
    if (visible && technicianId) {
      loadTechnicianDetails();
      loadTechnicianFeedbacks();
    }
  }, [visible, technicianId]);

  const loadTechnicianDetails = async () => {
    setLoading(true);
    try {
      const response = await technicianApi.getTechnicianProfile(technicianId);
      if (response.success) {
        setTechnicianDetail(response.data);
      } else {
        console.error("Failed to load technician details:", response.message);
      }
    } catch (error) {
      console.error("Error loading technician details:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicianFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const response = await bookingApi.getAllBookingsForTechnician(
        technicianId
      );
      if (response.success && response.data?.items) {
        const feedbackList = response.data.items
          .filter((booking) => booking.feedback && booking.feedback.rating)
          .map((booking) => ({
            id: booking.feedback.id,
            rating: booking.feedback.rating,
            comment: booking.feedback.comment,
            bookingId: booking.id,
            customerName:
              booking.customer?.fullName ||
              booking.customer?.email ||
              "Anonymous",
            createdAt: booking.feedback.createdAt || booking.completedAt,
          }));
        setFeedbacks(feedbackList);
      }
    } catch (error) {
      console.warn(
        "Error loading technician feedbacks (might be restricted):",
        error
      );
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0);
    return (sum / feedbacks.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((feedback) => {
      distribution[feedback.rating] = (distribution[feedback.rating] || 0) + 1;
    });
    return distribution;
  };

  const handlePreviewFile = (filePath) => {
    if (!filePath) return;
    const previewUrl = adminApi.previewFile(filePath);
    window.open(previewUrl, "_blank");
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined style={{ color: "#1890ff" }} />
          <span>
            {t("ui.technician_details", {
              defaultValue: "Chi tiết kỹ thuật viên",
            })}
          </span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : technicianDetail ? (
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {/* Profile Section */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar
                size={80}
                src={
                  technicianDetail.avatar?.[0]
                    ? adminApi.previewFile(technicianDetail.avatar?.[0].filePath)
                    : null
                }
                icon={!technicianDetail.avatar?.length && <ToolOutlined />}
                style={{ backgroundColor: "#1890ff" }}
              >
                {!technicianDetail.avatar?.length &&
                  technicianDetail.fullName?.charAt(0)}
              </Avatar>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>
                  {technicianDetail.fullName}
                </h3>
                <div style={{ color: "#8c8c8c", marginTop: 4 }}>
                  <MailOutlined /> {technicianDetail.email}
                </div>
                {technicianDetail.phoneNumber && (
                  <div style={{ color: "#8c8c8c", marginTop: 4 }}>
                    <PhoneOutlined /> {technicianDetail.phoneNumber}
                  </div>
                )}
                {technicianDetail.address && (
                  <div style={{ color: "#8c8c8c", marginTop: 4 }}>
                    <EnvironmentOutlined /> {technicianDetail.address}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}
                >
                  <StarOutlined /> {calculateAverageRating()}
                </div>
                <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                  {feedbacks.length}{" "}
                  {t("ui.reviews", { defaultValue: "đánh giá" })}
                </div>
              </div>
            </div>
          </Card>

          {/* Experience & Services */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>
                <TrophyOutlined />{" "}
                {t("ui.experience", { defaultValue: "Kinh nghiệm" })}:
              </strong>{" "}
              {technicianDetail.experienceYears}{" "}
              {t("ui.years", { defaultValue: "năm" })}
            </div>

            {technicianDetail.services &&
              technicianDetail.services.length > 0 && (
                <div>
                  <strong style={{ display: "block", marginBottom: 8 }}>
                    <ToolOutlined />{" "}
                    {t("ui.skills", { defaultValue: "Kỹ năng" })}:
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {technicianDetail.services.map((service) => (
                      <Tag key={service.id} color="blue">
                        {service.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
          </Card>

          {/* Ratings Section */}
          <Card
            title={
              <span>
                <StarOutlined />{" "}
                {t("ui.ratings_reviews", {
                  defaultValue: "Đánh giá & Nhận xét",
                })}
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            {loadingFeedbacks ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Spin />
              </div>
            ) : feedbacks.length > 0 ? (
              <div>
                {/* Rating Distribution */}
                <div
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    background: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 32,
                          fontWeight: "bold",
                          color: "#faad14",
                        }}
                      >
                        {calculateAverageRating()}
                      </div>
                      <Rate
                        disabled
                        value={parseFloat(calculateAverageRating())}
                        allowHalf
                      />
                      <div
                        style={{ color: "#8c8c8c", fontSize: 12, marginTop: 4 }}
                      >
                        {feedbacks.length}{" "}
                        {t("ui.reviews", { defaultValue: "đánh giá" })}
                      </div>
                    </div>
                    <Divider type="vertical" style={{ height: 80 }} />
                    <div style={{ flex: 1 }}>
                      {Object.entries(getRatingDistribution())
                        .reverse()
                        .map(([star, count]) => (
                          <div
                            key={star}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ width: 20 }}>{star}</span>
                            <StarOutlined
                              style={{ color: "#faad14", fontSize: 12 }}
                            />
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                background: "#f0f0f0",
                                borderRadius: 4,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${feedbacks.length > 0
                                      ? (count / feedbacks.length) * 100
                                      : 0
                                    }%`,
                                  height: "100%",
                                  background: "#faad14",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                width: 30,
                                fontSize: 12,
                                color: "#8c8c8c",
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Individual Feedbacks */}
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {feedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #f0f0f0",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Avatar
                          size={32}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#87d068" }}
                        >
                          {feedback.customerName?.charAt(0)}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <strong>{feedback.customerName}</strong>
                          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                            {feedback.createdAt
                              ? dayjs(feedback.createdAt).format(
                                "DD/MM/YYYY HH:mm"
                              )
                              : ""}
                          </div>
                        </div>
                        <Rate
                          disabled
                          value={feedback.rating}
                          style={{ fontSize: 14 }}
                        />
                      </div>
                      {feedback.comment && (
                        <div style={{ paddingLeft: 40, color: "#595959" }}>
                          {feedback.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty
                description={t("ui.no_ratings_yet", {
                  defaultValue: "Chưa có đánh giá",
                })}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>

          {/* Certificates Section */}
          {technicianDetail.certificateFiles &&
            technicianDetail.certificateFiles.length > 0 && (
              <Card
                title={
                  <span>
                    <FileTextOutlined />{" "}
                    {t("ui.certificates", { defaultValue: "Chứng chỉ" })}
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {technicianDetail.certificateFiles.map((file, index) => (
                    <div
                      key={file.id}
                      style={{
                        padding: 12,
                        border: "1px solid #d9d9d9",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        📜
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{file.fileName}</div>
                        <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                          {t("ui.certificate", { defaultValue: "Chứng chỉ" })} #
                          {index + 1}
                        </div>
                      </div>
                      <Button
                        size="small"
                        type="text"
                        onClick={() => handlePreviewFile(file.filePath)}
                        style={{
                          padding: "4px 12px",
                          height: "auto",
                          color: "#722ed1",
                          fontWeight: 500,
                          borderRadius: 6,
                          border: "1px solid #d9d9d9",
                          backgroundColor: "#fff",
                        }}
                      >
                        {t("ui.view", { defaultValue: "Xem" })}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Legal Documents Section */}
          {technicianDetail.legalDocument && (
            <Card
              title={
                <span>
                  <IdcardOutlined />{" "}
                  {t("ui.legal_documents", { defaultValue: "Giấy tờ pháp lý" })}
                </span>
              }
              style={{ marginBottom: 16 }}
            >
              <div
                style={{
                  padding: 12,
                  border: "1px solid #e9d8fd",
                  borderRadius: 8,
                  backgroundColor: "#f9f0ff",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, #b37feb 0%, #722ed1 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    boxShadow: "0 2px 4px rgba(114, 46, 209, 0.3)",
                  }}
                >
                  🆔
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: "#262626" }}>
                    {technicianDetail.legalDocument?.[0]?.fileName}
                  </div>
                  <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                    {t("ui.identity_document", {
                      defaultValue: "Giấy tờ tùy thân (CCCD/CMND)",
                    })}
                  </div>
                </div>

                <Button
                  size="small"
                  type="text"
                  onClick={() =>
                    handlePreviewFile(technicianDetail.legalDocument?.[0]?.filePath)
                  }
                  style={{
                    padding: "4px 12px",
                    height: "auto",
                    color: "#722ed1",
                    fontWeight: 500,
                    borderRadius: 6,
                    border: "1px solid #d9d9d9",
                    backgroundColor: "#fff",
                  }}
                >
                  {t("ui.view", { defaultValue: "Xem" })}
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Empty
          description={t("ui.no_data", { defaultValue: "Không có dữ liệu" })}
        />
      )}
    </Modal>
  );
}
