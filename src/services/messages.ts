import { axiosInstance } from "@/lib/axios";

export interface Message {
  id: string;
  content: string;
  sentAt: string;
  advisorId: string;
  studentNumber: string;
  isRead: boolean;
  advisor?: {
    id: string;
    name: string;
    surname: string;
    email: string;
  };
}

export interface CreateMessageRequest {
  content: string;
  studentNumber: string;
}

export interface UpdateMessageRequest {
  id: string;
  content: string;
  isRead: boolean;
}

export interface MessageListResponse {
  items: Message[];
  hasNext: boolean;
  hasPrevious: boolean;
  index: number;
  size: number;
  count: number;
  pages: number;
}

export const messageService = {
  // Create a new message (for advisors)
  async createMessage(data: CreateMessageRequest): Promise<Message> {
    const response = await axiosInstance.post("/messages", data);
    return response.data;
  },

  // Update a message (mark as read, etc.)
  async updateMessage(data: UpdateMessageRequest): Promise<Message> {
    const response = await axiosInstance.put("/messages", data);
    return response.data;
  },

  // Mark message as read
  async markAsRead(messageId: string, content: string): Promise<Message> {
    return this.updateMessage({
      id: messageId,
      content: content,
      isRead: true,
    });
  },

  // Get messages list (for advisors - their sent messages)
  async getMessages(
    pageIndex: number = 0,
    pageSize: number = 10,
    studentNumber?: string
  ): Promise<MessageListResponse> {
    const params: any = {
      "PageRequest.PageIndex": pageIndex,
      "PageRequest.PageSize": pageSize,
    };

    if (studentNumber) {
      params.studentNumber = studentNumber;
    }

    const response = await axiosInstance.get("/messages", { params });
    return response.data;
  },

  // Get student messages (for students - messages sent to them)
  async getStudentMessages(
    studentNumber: string,
    pageIndex: number = 0,
    pageSize: number = 10
  ): Promise<MessageListResponse> {
    const params = {
      "PageRequest.PageIndex": pageIndex,
      "PageRequest.PageSize": pageSize,
    };

    const response = await axiosInstance.get(
      `/messages/student/${studentNumber}`,
      { params }
    );
    return response.data;
  },

  // Get message by ID
  async getMessageById(id: string): Promise<Message> {
    const response = await axiosInstance.get(`/messages/${id}`);
    return response.data;
  },

  // Delete message
  async deleteMessage(id: string): Promise<void> {
    await axiosInstance.delete(`/messages/${id}`);
  },
};
