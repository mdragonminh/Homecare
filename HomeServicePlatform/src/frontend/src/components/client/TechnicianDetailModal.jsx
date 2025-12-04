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
  IdcardOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { technicianApi } from "../../services/technicianApi";
import { bookingApi } from "../../services/bookingApi";
import { adminApi } from "../../services/adminApi";
import { FeedbackSource } from "../../constants/enums"; 

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          .map((booking) => {
            const cFeedback = booking.feedbacks?.find(
              (f) => f.source === FeedbackSource.Customer
            );

            if (!cFeedback) return null;

            return {
              id: cFeedback.id || booking.id,
              rating: cFeedback.rating,
              comment: cFeedback.comment,
              bookingId: booking.id,
              customerName: booking.customer?.fullName || "Khách hàng",
              createdAt: booking.dateCompleted || booking.dateCreated,
            };
          })
          .filter((item) => item !== null);

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

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((feedback) => {
      if (feedback.rating >= 1 && feedback.rating <= 5) {
        distribution[feedback.rating] =
          (distribution[feedback.rating] || 0) + 1;
      }
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
      width={isMobile ? "95%" : 800}
      centered
      style={{ top: isMobile ? 10 : undefined }}
      bodyStyle={{
        padding: isMobile ? "16px" : "24px",
        maxHeight: isMobile ? "calc(100vh - 120px)" : "70vh",
        overflowY: "auto",
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : technicianDetail ? (
        <div>
          {/* Profile Section - Mobile Optimized */}
          <Card 
            style={{ 
              marginBottom: 16,
              borderRadius: isMobile ? 12 : 8,
            }}
            bodyStyle={{ padding: isMobile ? "16px" : "24px" }}
          >
            <div 
              style={{ 
                display: "flex", 
                alignItems: isMobile ? "flex-start" : "center", 
                gap: 16,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: isMobile ? "100%" : "auto" }}>
                <Avatar
                  size={isMobile ? 64 : 80}
                  src={
                    technicianDetail.avatar?.[0]
                      ? adminApi.previewFile(
                          technicianDetail.avatar?.[0].filePath
                        )
                      : null
                  }
                  icon={!technicianDetail.avatar?.length && <ToolOutlined />}
                  style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
                >
                  {!technicianDetail.avatar?.length &&
                    technicianDetail.fullName?.charAt(0)}
                </Avatar>
                {isMobile && (
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div
                      style={{ fontSize: 20, fontWeight: "bold", color: "#faad14" }}
                    >
                      <StarOutlined /> {technicianDetail.rating?.toFixed(1) || "0.0"}
                    </div>
                    <div style={{ color: "#8c8c8c", fontSize: 11 }}>
                      {technicianDetail.ratingCount || 0}{" "}
                      {t("ui.reviews", { defaultValue: "đánh giá" })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, width: isMobile ? "100%" : "auto" }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: "bold",
                  marginBottom: isMobile ? 8 : 0,
                }}>
                  {technicianDetail.fullName}
                </h3>
                <div style={{ 
                  color: "#8c8c8c", 
                  marginTop: isMobile ? 8 : 4,
                  fontSize: isMobile ? 13 : 14,
                }}>
                  <MailOutlined style={{ marginRight: 6 }} /> 
                  <span style={{ wordBreak: "break-word" }}>{technicianDetail.email}</span>
                </div>
                {technicianDetail.phoneNumber && (
                  <div style={{ 
                    color: "#8c8c8c", 
                    marginTop: 6,
                    fontSize: isMobile ? 13 : 14,
                  }}>
                    <PhoneOutlined style={{ marginRight: 6 }} /> {technicianDetail.phoneNumber}
                  </div>
                )}
                {technicianDetail.address && (
                  <div style={{ 
                    color: "#8c8c8c", 
                    marginTop: 6,
                    fontSize: isMobile ? 13 : 14,
                  }}>
                    <EnvironmentOutlined style={{ marginRight: 6 }} /> 
                    <span style={{ wordBreak: "break-word" }}>{technicianDetail.address}</span>
                  </div>
                )}
              </div>
              {!isMobile && (
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div
                    style={{ fontSize: 24, fontWeight: "bold", color: "#faad14" }}
                  >
                    <StarOutlined /> {technicianDetail.rating?.toFixed(1) || "0.0"}
                  </div>
                  <div style={{ color: "#8c8c8c", fontSize: 12 }}>
                    {technicianDetail.ratingCount || 0}{" "}
                    {t("ui.reviews", { defaultValue: "đánh giá" })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Experience & Services - Mobile Optimized */}
          <Card 
            style={{ 
              marginBottom: 16,
              borderRadius: isMobile ? 12 : 8,
            }}
            bodyStyle={{ padding: isMobile ? "16px" : "24px" }}
          >
            <div style={{ marginBottom: technicianDetail.services?.length > 0 ? 16 : 0 }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                marginBottom: 8,
              }}>
                <TrophyOutlined style={{ color: "#1890ff" }} />
                <strong style={{ fontSize: isMobile ? 14 : 16 }}>
                  {t("ui.experience", { defaultValue: "Kinh nghiệm" })}:
                </strong>
              </div>
              <div style={{ 
                fontSize: isMobile ? 18 : 16,
                marginLeft: isMobile ? 0 : 24,
              }}>
                <span style={{ fontSize: isMobile ? 24 : 20, fontWeight: "bold", color: "#1890ff" }}>
                  {technicianDetail.experienceYears || 0}
                </span>{" "}
                <span style={{ color: "#666" }}>
                  {t("ui.years", { defaultValue: "năm" })}
                </span>
              </div>
            </div>

            {technicianDetail.services &&
              technicianDetail.services.length > 0 && (
                <div style={{ 
                  paddingTop: 16, 
                  borderTop: "1px solid #f0f0f0",
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8,
                    marginBottom: 12,
                  }}>
                    <ToolOutlined style={{ color: "#1890ff" }} />
                    <strong style={{ fontSize: isMobile ? 14 : 16 }}>
                      {t("ui.skills", { defaultValue: "Kỹ năng" })}:
                    </strong>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    flexWrap: "wrap", 
                    gap: isMobile ? 6 : 8,
                  }}>
                    {technicianDetail.services.map((service) => (
                      <Tag 
                        key={service.id} 
                        color="blue"
                        style={{
                          fontSize: isMobile ? 12 : 14,
                          padding: isMobile ? "2px 8px" : "4px 12px",
                          borderRadius: 6,
                        }}
                      >
                        {service.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
          </Card>

          {/* Ratings Section - Mobile Optimized */}
          <Card
            title={
              <span style={{ fontSize: isMobile ? 15 : 16 }}>
                <StarOutlined />{" "}
                {t("ui.ratings_reviews", {
                  defaultValue: "Đánh giá & Nhận xét",
                })}
              </span>
            }
            style={{ 
              marginBottom: 16,
              borderRadius: isMobile ? 12 : 8,
            }}
            bodyStyle={{ padding: isMobile ? "16px" : "24px" }}
          >
            {loadingFeedbacks ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Spin />
              </div>
            ) : (
              <div>
                {/* Rating Summary */}
                <div
                  style={{
                    marginBottom: 16,
                    padding: isMobile ? 12 : 16,
                    background: "#fafafa",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile ? 28 : 32,
                      fontWeight: "bold",
                      color: "#faad14",
                      marginBottom: 8,
                    }}
                  >
                    {technicianDetail.rating?.toFixed(1) || "0.0"}
                  </div>
                  <Rate
                    disabled
                    value={technicianDetail.rating || 0}
                    allowHalf
                    style={{ fontSize: isMobile ? 16 : 20 }}
                  />
                  <div
                    style={{ 
                      color: "#8c8c8c", 
                      fontSize: isMobile ? 11 : 12, 
                      marginTop: 4 
                    }}
                  >
                    {technicianDetail.ratingCount || 0}{" "}
                    {t("ui.reviews", { defaultValue: "đánh giá" })}
                  </div>
                </div>

                {/* Rating Distribution - Always below summary */}
                {feedbacks.length > 0 && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: isMobile ? 12 : 16,
                      background: "#fafafa",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ 
                      width: "100%",
                    }}>
                      {Object.entries(getRatingDistribution())
                        .reverse()
                        .map(([star, count]) => (
                          <div
                            key={star}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: isMobile ? 6 : 8,
                              marginBottom: isMobile ? 6 : 4,
                            }}
                          >
                            <span style={{ 
                              width: isMobile ? 16 : 20,
                              fontSize: isMobile ? 12 : 14,
                            }}>
                              {star}
                            </span>
                            <StarOutlined
                              style={{ 
                                color: "#faad14", 
                                fontSize: isMobile ? 10 : 12 
                              }}
                            />
                            <div
                              style={{
                                flex: 1,
                                height: isMobile ? 6 : 8,
                                background: "#f0f0f0",
                                borderRadius: 4,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${
                                    feedbacks.length > 0
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
                                width: isMobile ? 24 : 30,
                                fontSize: isMobile ? 11 : 12,
                                color: "#8c8c8c",
                                textAlign: "right",
                              }}
                            >
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Individual Feedbacks List - Mobile Optimized */}
                {feedbacks.length > 0 ? (
                  <div style={{ 
                    maxHeight: isMobile ? 250 : 300, 
                    overflowY: "auto" 
                  }}>
                    {feedbacks.map((feedback) => (
                      <div
                        key={feedback.id}
                        style={{
                          padding: isMobile ? 10 : 12,
                          borderBottom: "1px solid #f0f0f0",
                          marginBottom: isMobile ? 10 : 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <Avatar
                            size={isMobile ? 28 : 32}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: "#87d068", flexShrink: 0 }}
                          >
                            {feedback.customerName?.charAt(0)}
                          </Avatar>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              gap: 8,
                            }}>
                              <strong style={{ 
                                fontSize: isMobile ? 13 : 14,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1,
                                minWidth: 0,
                              }}>
                                {feedback.customerName}
                              </strong>
                              <Rate
                                disabled
                                value={feedback.rating}
                                style={{ 
                                  fontSize: isMobile ? 12 : 14,
                                  flexShrink: 0,
                                }}
                              />
                            </div>
                            <div style={{ 
                              fontSize: isMobile ? 11 : 12, 
                              color: "#8c8c8c",
                              marginTop: 4,
                            }}>
                              {feedback.createdAt
                                ? dayjs(feedback.createdAt).format(
                                    "DD/MM/YYYY HH:mm"
                                  )
                                : ""}
                            </div>
                            {feedback.comment && (
                              <div style={{ 
                                marginTop: 8,
                                color: "#595959",
                                fontSize: isMobile ? 13 : 14,
                                lineHeight: 1.5,
                                wordBreak: "break-word",
                              }}>
                                {feedback.comment}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    description={t("ui.no_ratings_yet", {
                      defaultValue: "Chưa có nhận xét chi tiết",
                    })}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ padding: isMobile ? "20px 0" : "40px 0" }}
                  />
                )}
              </div>
            )}
          </Card>

          {/* Certificates Section - Mobile Optimized */}
          {technicianDetail.certificateFiles &&
            technicianDetail.certificateFiles.length > 0 && (
              <Card
                title={
                  <span style={{ fontSize: isMobile ? 15 : 16 }}>
                    <FileTextOutlined />{" "}
                    {t("ui.certificates", { defaultValue: "Chứng chỉ" })}
                  </span>
                }
                style={{ 
                  marginBottom: 16,
                  borderRadius: isMobile ? 12 : 8,
                }}
                bodyStyle={{ padding: isMobile ? "16px" : "24px" }}
              >
                <div
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: isMobile ? 10 : 12 
                  }}
                >
                  {technicianDetail.certificateFiles.map((file, index) => (
                    <div
                      key={file.id}
                      style={{
                        padding: isMobile ? 10 : 12,
                        border: "1px solid #d9d9d9",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: isMobile ? 10 : 12,
                      }}
                    >
                      <div
                        style={{
                          width: isMobile ? 36 : 40,
                          height: isMobile ? 36 : 40,
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: isMobile ? 18 : 20,
                          flexShrink: 0,
                        }}
                      >
                        📜
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 500,
                          fontSize: isMobile ? 13 : 14,
                          wordBreak: "break-word",
                        }}>
                          {file.fileName}
                        </div>
                        <div style={{ 
                          fontSize: isMobile ? 11 : 12, 
                          color: "#8c8c8c",
                          marginTop: 2,
                        }}>
                          {t("ui.certificate", { defaultValue: "Chứng chỉ" })} #
                          {index + 1}
                        </div>
                      </div>
                      <Button
                        size="small"
                        type="text"
                        onClick={() => handlePreviewFile(file.filePath)}
                        style={{
                          padding: isMobile ? "4px 10px" : "4px 12px",
                          height: "auto",
                          color: "#722ed1",
                          fontWeight: 500,
                          borderRadius: 6,
                          border: "1px solid #d9d9d9",
                          backgroundColor: "#fff",
                          fontSize: isMobile ? 12 : 14,
                          flexShrink: 0,
                        }}
                      >
                        {t("ui.view", { defaultValue: "Xem" })}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          {/* Legal Documents Section - Mobile Optimized */}
          {technicianDetail.legalDocument &&
            technicianDetail.legalDocument.length > 0 && (
              <Card
                title={
                  <span style={{ fontSize: isMobile ? 15 : 16 }}>
                    <IdcardOutlined />{" "}
                    {t("ui.legal_documents", {
                      defaultValue: "Giấy tờ pháp lý",
                    })}
                  </span>
                }
                style={{ 
                  marginBottom: 16,
                  borderRadius: isMobile ? 12 : 8,
                }}
                bodyStyle={{ padding: isMobile ? "16px" : "24px" }}
              >
                <div
                  style={{
                    padding: isMobile ? 10 : 12,
                    border: "1px solid #e9d8fd",
                    borderRadius: 8,
                    backgroundColor: "#f9f0ff",
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 10 : 12,
                    transition: "all 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 36 : 40,
                      height: isMobile ? 36 : 40,
                      borderRadius: 8,
                      background:
                        "linear-gradient(135deg, #b37feb 0%, #722ed1 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isMobile ? 18 : 20,
                      boxShadow: "0 2px 4px rgba(114, 46, 209, 0.3)",
                      flexShrink: 0,
                    }}
                  >
                    🆔
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 500, 
                      color: "#262626",
                      fontSize: isMobile ? 13 : 14,
                      wordBreak: "break-word",
                    }}>
                      {technicianDetail.legalDocument[0].fileName}
                    </div>
                    <div style={{ 
                      fontSize: isMobile ? 11 : 12, 
                      color: "#8c8c8c",
                      marginTop: 2,
                    }}>
                      {t("ui.identity_document", {
                        defaultValue: "Giấy tờ tùy thân (CCCD/CMND)",
                      })}
                    </div>
                  </div>

                  <Button
                    size="small"
                    type="text"
                    onClick={() =>
                      handlePreviewFile(
                        technicianDetail.legalDocument[0].filePath
                      )
                    }
                    style={{
                      padding: isMobile ? "4px 10px" : "4px 12px",
                      height: "auto",
                      color: "#722ed1",
                      fontWeight: 500,
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                      backgroundColor: "#fff",
                      fontSize: isMobile ? 12 : 14,
                      flexShrink: 0,
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