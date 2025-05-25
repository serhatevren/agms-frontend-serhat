"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import SendMessageModal from "@/components/modals/SendMessageModal";
import { messageService, Message } from "@/services/messages";
import { axiosInstance } from "@/lib/axios";
import {
  Mail,
  Search,
  Filter,
  Calendar,
  User,
  RefreshCw,
  Check,
} from "lucide-react";

export default function InboxPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  const isStudent = user?.userType === 0;
  const isAdvisor = user?.userType === 2;

  // Fetch student data if user is a student
  useEffect(() => {
    const fetchStudentData = async () => {
      if (isStudent && user) {
        try {
          const response = await axiosInstance.get(`/students/${user.id}`);
          setStudentData(response.data);
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      }
    };

    fetchStudentData();
  }, [isStudent, user]);

  // Fetch messages
  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      if (isStudent && studentData?.studentNumber) {
        // Student: fetch messages sent to them
        const response = await messageService.getStudentMessages(
          studentData.studentNumber
        );
        setMessages(response.items);
      } else if (isAdvisor) {
        // Advisor: fetch messages they sent
        const response = await messageService.getMessages();
        setMessages(response.items);
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (!isStudent || studentData)) {
      fetchMessages();
    }
  }, [user, studentData, isStudent, isAdvisor]);

  const handleMessageSent = () => {
    // Refresh messages after sending
    fetchMessages();
  };

  const handleMarkAsRead = async (message: Message) => {
    if (markingAsRead === message.id) return;

    try {
      setMarkingAsRead(message.id);
      await messageService.markAsRead(message.id, message.content);

      // Update the message in the local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message.id ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      setError("Failed to mark message as read. Please try again.");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadMessages = messages.filter((msg) => !msg.isRead);
    if (unreadMessages.length === 0) return;

    try {
      setMarkingAsRead("all");

      // Mark all unread messages as read
      await Promise.all(
        unreadMessages.map((msg) =>
          messageService.markAsRead(msg.id, msg.content)
        )
      );

      // Update all messages in the local state
      setMessages((prevMessages) =>
        prevMessages.map((msg) => ({ ...msg, isRead: true }))
      );
    } catch (error: any) {
      console.error("Error marking all messages as read:", error);
      setError("Failed to mark all messages as read. Please try again.");
    } finally {
      setMarkingAsRead(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays === 1) {
      return "Dün";
    } else if (diffInDays < 7) {
      return `${diffInDays} gün önce`;
    } else {
      return date.toLocaleDateString("tr-TR");
    }
  };

  const filteredMessages = messages.filter(
    (message) =>
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.advisor &&
        `${message.advisor.name} ${message.advisor.surname}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      message.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const totalMessages = messages.length;
  const todayMessages = messages.filter((m) => {
    const msgDate = new Date(m.sentAt).toDateString();
    const today = new Date().toDateString();
    return msgDate === today;
  }).length;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-600">Loading messages...</span>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600 mt-1">
                  {isStudent
                    ? "Messages from your advisors"
                    : isAdvisor
                    ? "Messages you sent to students"
                    : "Message Center"}
                </p>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchMessages}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Refresh</span>
              </button>
              {isStudent && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAsRead === "all"}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {markingAsRead === "all" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {markingAsRead === "all"
                      ? "Marking..."
                      : "Mark All as Read"}
                  </span>
                </button>
              )}
              {isAdvisor && (
                <button
                  onClick={() => setShowSendMessageModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Send Message</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Messages List */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {filteredMessages.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm ? "No messages found" : "No messages"}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search criteria."
                    : isStudent
                    ? "You don't have any messages from your advisors yet."
                    : isAdvisor
                    ? "You haven't sent any messages yet. Send a message to get started."
                    : "No messages available."}
                </p>

                {/* Quick Actions for Advisor */}
                {isAdvisor && !searchTerm && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowSendMessageModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Your First Message
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Messages List */
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !message.isRead && isStudent
                        ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    } ${
                      selectedMessage?.id === message.id
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedMessage(
                        selectedMessage?.id === message.id ? null : message
                      )
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {isStudent ? (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                {message.advisor &&
                                message.advisor.name &&
                                message.advisor.surname
                                  ? `${message.advisor.name} ${message.advisor.surname}`
                                  : "Advisor"}
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Advisor
                              </span>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                To: Student {message.studentNumber}
                              </p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Sent
                              </span>
                            </>
                          )}
                          {!message.isRead && isStudent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="flex items-center text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-xs">
                            {formatDate(message.sentAt)}
                          </span>
                        </div>
                        {/* Mark as Read Button - Only for students with unread messages */}
                        {isStudent && !message.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(message);
                            }}
                            disabled={markingAsRead === message.id}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Mark as read"
                          >
                            {markingAsRead === message.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span>
                              {markingAsRead === message.id
                                ? "Marking..."
                                : "Mark as read"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Message Content */}
                    {selectedMessage?.id === message.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="prose max-w-none">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>

                        {/* Mark as Read Button in expanded view */}
                        {isStudent && !message.isRead && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => handleMarkAsRead(message)}
                              disabled={markingAsRead === message.id}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {markingAsRead === message.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              <span>
                                {markingAsRead === message.id
                                  ? "Marking as read..."
                                  : "Mark as read"}
                              </span>
                            </button>
                          </div>
                        )}

                        {isStudent && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> To respond to this message,
                              please contact your advisor directly via email or
                              during office hours.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Messages
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {totalMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {isStudent && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Unread
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {unreadCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {isStudent ? "Received Today" : "Sent Today"}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {todayMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Message Modal - Only for Advisors */}
      {isAdvisor && (
        <SendMessageModal
          isOpen={showSendMessageModal}
          onClose={() => setShowSendMessageModal(false)}
          onMessageSent={handleMessageSent}
        />
      )}
    </AuthenticatedLayout>
  );
}
