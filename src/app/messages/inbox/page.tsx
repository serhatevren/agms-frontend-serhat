"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import SendMessageModal from "@/components/modals/SendMessageModal";
import { Mail, Search, Filter, Download, Calendar, User } from "lucide-react";

// Mock data for student messages (from single advisor)
const mockStudentMessages = [
  {
    id: 1,
    from: "Prof. Dr. Ahmet Yılmaz",
    fromRole: "Thesis Advisor",
    subject: "Mezuniyet Şartları Eksiklikleri",
    content:
      "Merhaba, mezuniyet başvurunuzu inceledim. Eksik dersleriniz bulunmaktadır: BİL 301 - Veri Yapıları ve BİL 425 - Yazılım Mühendisliği. Bu dersleri bir sonraki dönem tamamlamanız gerekmektedir. Ayrıca minimum CGPA şartını (2.50) sağladığınızı teyit etmek için transkriptinizi kontrol ediniz.",
    date: "2024-01-15T10:30:00",
    isRead: false,
    hasAttachment: true,
  },
  {
    id: 2,
    from: "Prof. Dr. Ahmet Yılmaz",
    fromRole: "Thesis Advisor",
    subject: "Tez Savunma Tarihi ve Gereklilikler",
    content:
      "Tez çalışmanızın durumu hakkında bilgilendirme: Tez taslağınızı inceledim ve genel olarak yeterli düzeyde. Ancak 3. bölümde bazı düzeltmeler yapmanız gerekiyor. Tez savunma tarihi için Mart ayı sonunu planlıyoruz. Savunma öncesi tez jürisine tezinizi teslim etmeniz için son tarih 15 Mart'tır.",
    date: "2024-01-12T14:15:00",
    isRead: true,
    hasAttachment: false,
  },
];

export default function InboxPage() {
  const { user } = useAuthStore();
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getUserTypeText = () => {
    if (user?.userType === 2) return "Advisor";
    if (user?.userType === 0) return "Student";
    return "User";
  };

  const isStudent = user?.userType === 0;
  const messages = isStudent ? mockStudentMessages : [];

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
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const totalMessages = messages.length;
  const todayMessages = messages.filter((m) => {
    const msgDate = new Date(m.date).toDateString();
    const today = new Date().toDateString();
    return msgDate === today;
  }).length;

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
                    ? "Student Message Center"
                    : "Advisor Message Center"}
                </p>
              </div>
            </div>

            {/* Search and Filter */}
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
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                <span className="text-sm">Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
                Inbox
              </button>
              {!isStudent && (
                <>
                  <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Sent
                  </button>
                  <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Drafts
                  </button>
                </>
              )}
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Archive
              </button>
            </nav>
          </div>

          {/* Messages List */}
          <div className="p-6">
            {filteredMessages.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm ? "No messages found" : "No messages found"}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search criteria."
                    : isStudent
                    ? "You don't have any messages from your advisors yet."
                    : "You don't have any messages in your inbox yet. Send a message to get started."}
                </p>

                {/* Quick Actions for Advisor */}
                {!isStudent && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowSendMessageModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send New Message
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
                      !message.isRead
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
                          <p className="text-sm font-medium text-gray-900">
                            {message.from}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            {message.fromRole}
                          </span>
                          {!message.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-900 truncate">
                          {message.subject}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {message.hasAttachment && (
                          <div className="flex items-center text-gray-400">
                            <Download className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex items-center text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-xs">
                            {formatDate(message.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Message Content */}
                    {selectedMessage?.id === message.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="prose max-w-none">
                          <p className="text-gray-700">{message.content}</p>
                        </div>
                        {message.hasAttachment && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Download className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-700">
                                  Attachment Available
                                </span>
                              </div>
                              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Download
                              </button>
                            </div>
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
                      Received Today
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
      {!isStudent && (
        <SendMessageModal
          isOpen={showSendMessageModal}
          onClose={() => setShowSendMessageModal(false)}
        />
      )}
    </AuthenticatedLayout>
  );
}
