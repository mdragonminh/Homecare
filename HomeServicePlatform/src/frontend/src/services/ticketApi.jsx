import axiosClient from "../config/axiosClient"; 

export const getMyTickets = async (paginationParams) => {
  try {
    const res = await axiosClient.get("/Ticket", { params: paginationParams });
    
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Get My Tickets Error:", error);
    return { success: false, message: error.response?.data?.message || "Lỗi khi tải tickets." };
  }
};

export const assignTechnician = async (assignDto) => {
  try {
    const res = await axiosClient.post("/Ticket/assign-technician", assignDto);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Assign Technician Error:", error);
    return { success: false, message: error.response?.data?.message || "Lỗi khi gán technician." };
  }
};

export const updateTicketStatus = async (updateDto) => {
  try {
    const res = await axiosClient.post("/Ticket/update-status", updateDto);
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, message: error.response?.data?.message || "Lỗi khi cập nhật trạng thái." };
  }
};
