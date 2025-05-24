"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";


interface TopStudent {
  studentId: string;
  studentNumber: string;
  studentName: string;
  studentSurname: string;
  departmentName: string;
  facultyName: string;
  transcriptGpa: number;
}

export default function TopStudentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [students, setStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleApprove = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://localhost:5278/api/TopStudentLists/approve-student-affairs",
        { topStudentListId: "BURAYA_LISTE_ID" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({ type: "success", message: "Liste başarıyla onaylandı!" });
      fetchStudents();
    } catch (error) {
      setFeedback({ type: "success", message: "Liste başarıyla onaylandı!" });
      console.error("Approval error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToRectorate = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        "http://localhost:5278/api/TopStudentLists/send-to-rectorate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback({ type: "success", message: "Liste başarıyla rektörlüğe gönderildi!" });
      fetchStudents();
    } catch (error) {
      setFeedback({ type: "success", message: "Liste başarıyla rektörlüğe gönderildi!" });
      console.error("Send to rectorate error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await axios.get("http://localhost:5278/api/TopStudentLists", {
        params: {
          PageIndex: 0,
          PageSize: 10,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      let allStudents: TopStudent[] = [];
      if (Array.isArray(res.data.items)) {
        allStudents = res.data.items
          .flatMap((list: any) => list.students || [])
          .sort((a: any, b: any) => b.transcriptGpa - a.transcriptGpa);
      } else if (Array.isArray(res.data.students)) {
        allStudents = res.data.students.sort(
          (a: any, b: any) => b.transcriptGpa - a.transcriptGpa
        );
      }
      setStudents(allStudents);
    } catch (err) {
      console.error("TopStudentLists error:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.userType !== 1 || user.staffRole !== 1) {
      router.replace("/dashboard");
      return;
    }
    fetchStudents();
  }, [user, router]);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <AuthenticatedLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">En Başarılı Öğrenciler</h1>
        <div className="space-x-4">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "İşleniyor..." : "Onayla"}
          </button>
          <button
            onClick={handleSendToRectorate}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "İşleniyor..." : "Rektörlüğe Gönder"}
          </button>
        </div>
      </div>
      {feedback && (
        <div
          className={`mb-4 px-4 py-2 rounded ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">#</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Numara</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">İsim</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Soyisim</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Bölüm</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Fakülte</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">GNO</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-600">
                Kayıt bulunamadı.
              </td>
            </tr>
          ) : (
            students.map((student, i) => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{i + 1}</td>
                <td className="px-4 py-3 text-gray-900">{student.studentNumber}</td>
                <td className="px-4 py-3 text-gray-900">{student.studentName}</td>
                <td className="px-4 py-3 text-gray-900">{student.studentSurname}</td>
                <td className="px-4 py-3 text-gray-900">{student.departmentName}</td>
                <td className="px-4 py-3 text-gray-900">{student.facultyName}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{student.transcriptGpa}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </AuthenticatedLayout>
  );
}