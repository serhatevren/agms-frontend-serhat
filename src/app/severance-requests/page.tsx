"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

interface SeveranceRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  department: string;
  requestDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  staffNotes?: string;
  documents: {
    id: string;
    name: string;
    type: string;
  }[];
}

// Dummy data
const dummySeveranceRequests: SeveranceRequest[] = [
  {
    id: "1",
    studentId: "user123",
    studentName: "Ataberk Kızılırmak",
    studentNumber: "301",
    department: "Computer Engineering",
    requestDate: "2024-01-15",
    reason: "Transfer to another university due to family relocation.",
    status: "pending",
    documents: [
      { id: "1", name: "transfer_letter.pdf", type: "Transfer Letter" },
      { id: "2", name: "family_situation.pdf", type: "Family Situation" },
    ],
  },
  {
    id: "2",
    studentId: "user456",
    studentName: "Merve Yıldız",
    studentNumber: "302",
    department: "Computer Engineering",
    requestDate: "2024-01-10",
    reason: "Health issues requiring long-term treatment.",
    status: "approved",
    staffNotes: "Medical documentation verified. Approved for health reasons.",
    documents: [
      { id: "3", name: "medical_report.pdf", type: "Medical Report" },
      {
        id: "4",
        name: "doctor_recommendation.pdf",
        type: "Doctor Recommendation",
      },
    ],
  },
  {
    id: "3",
    studentId: "user789",
    studentName: "Berkay Erdem",
    studentNumber: "303",
    department: "Mechanical Engineering",
    requestDate: "2024-01-08",
    reason: "Financial difficulties preventing continuation of studies.",
    status: "rejected",
    staffNotes:
      "Financial aid options not explored. Please contact financial aid office first.",
    documents: [
      { id: "5", name: "financial_statement.pdf", type: "Financial Statement" },
    ],
  },
];

export default function SeveranceRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<SeveranceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRequestMessage, setShowNewRequestMessage] = useState(false);
  const [newRequest, setNewRequest] = useState({
    reason: "",
    documents: [] as File[],
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      if (user?.userType === 0) {
        // Student - only show their own requests
        const studentRequests = dummySeveranceRequests.filter(
          (req) => req.studentId === user.id
        );
        setRequests(studentRequests);
      } else if (user?.userType === 1 && user?.staffRole === 1) {
        // Student Affairs - show all requests
        setRequests(dummySeveranceRequests);
      }
      setLoading(false);
    }, 1000);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "approved":
        return "Onaylandı";
      case "rejected":
        return "Reddedildi";
      default:
        return status;
    }
  };

  const handleNewRequest = () => {
    const request: SeveranceRequest = {
      id: Date.now().toString(),
      studentId: user?.id || "",
      studentName: `${user?.name} ${user?.surname}`,
      studentNumber: "301", // This would come from student profile
      department: "Computer Engineering", // This would come from student profile
      requestDate: new Date().toISOString().split("T")[0],
      reason: newRequest.reason,
      status: "pending",
      documents: newRequest.documents.map((file, index) => ({
        id: Date.now() + index.toString(),
        name: file.name,
        type: "Document",
      })),
    };

    setRequests([request, ...requests]);
    setShowNewRequestMessage(false);
    setNewRequest({ reason: "", documents: [] });
  };

  const handleStatusUpdate = (
    requestId: string,
    newStatus: "approved" | "rejected",
    notes?: string
  ) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId
          ? { ...req, status: newStatus, staffNotes: notes }
          : req
      )
    );
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.userType === 0
                  ? "My Severance Requests"
                  : "Severance Requests"}
              </h1>
              <p className="text-gray-600 mt-2">
                {user?.userType === 0
                  ? "View your university severance requests and create a new request."
                  : "Review and approve student severance requests."}
              </p>
            </div>
            {user?.userType === 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowNewRequestMessage(true)}
                  className="bg-[#7c0a02] text-white px-4 py-2 rounded-md hover:bg-[#a50d0d] transition-colors"
                >
                  Create New Request
                </button>
                {showNewRequestMessage && (
                  <span className="text-[#7c0a02] font-medium">Not responsible for this use case</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">
                {user?.userType === 0
                  ? "You do not have any severance requests yet."
                  : "There are no severance requests yet."}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {user?.userType !== 0 && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      {user?.userType !== 0 && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.studentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                #{request.studentNumber}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.department}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(request.requestDate).toLocaleDateString(
                          "tr-TR"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-[#7c0a02] hover:text-[#a50d0d] mr-3">
                          Details
                        </button>
                        {user?.userType !== 0 &&
                          request.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    request.id,
                                    "approved",
                                    "Approved"
                                  )
                                }
                                className="text-green-600 hover:text-green-800 mr-3"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    request.id,
                                    "rejected",
                                    "Rejected"
                                  )
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                Reject
                              </button>
                            </>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
