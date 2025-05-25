"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

interface Student {
  studentId: string;
  studentNumber: string;
  studentName: string;
  studentSurname: string;
  departmentName: string;
  facultyName: string;
  transcriptGpa: number;
}

interface TopStudentList {
  id: string;
  topStudentListType: number;
  studentAffairsApproval: boolean;
  rectorateApproval: boolean;
  sendRectorate: boolean;
  students: Student[];
}

export default function RectoratePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [selectedFaculty, setSelectedFaculty] =
    useState<string>("All Students");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [lists, setLists] = useState<TopStudentList[]>([]);

  // Confirmation modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const faculties = ["All Students", "Engineering", "Architecture", "Science"];

  // Seçili listeyi bulmak için yardımcı fonksiyon
  const getCurrentList = () => {
    if (selectedFaculty === "All Students") {
      return lists.find(
        (list) => list.topStudentListType === 2 && list.sendRectorate
      );
    }

    if (!selectedDepartment) {
      return lists.find(
        (list) => list.topStudentListType === 2 && list.sendRectorate
      );
    }

    const departmentLists = lists.filter(
      (list) => list.topStudentListType === 0 && list.sendRectorate
    );
    if (!departmentLists.length) return null;

    return departmentLists.find((list) =>
      list.students.some((s) => s.departmentName === selectedDepartment)
    );
  };

  // Mevcut listenin rektörlük onayını kontrol et
  const isCurrentListApprovedByRectorate = () => {
    const currentList = getCurrentList();
    return currentList?.rectorateApproval || false;
  };

  const handleApproveRectorate = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const currentList = getCurrentList();
      if (!currentList) {
        setFeedback({
          type: "error",
          message: "Onaylanacak liste bulunamadı!",
        });
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await axios.post(
        "http://localhost:5278/api/TopStudentLists/approve-rectorate",
        {
          topStudentListId: currentList.id,
          isApproved: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFeedback({
        type: "success",
        message: "Liste başarıyla rektörlük tarafından onaylandı!",
      });
      fetchStudents();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message || "Rektörlük onayı başarısız oldu!",
        });
      } else {
        setFeedback({
          type: "error",
          message: "Rektörlük onayı başarısız oldu!",
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeRectorateApproval = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const currentList = getCurrentList();
      if (!currentList) {
        setFeedback({
          type: "error",
          message: "Onayı geri alınacak liste bulunamadı!",
        });
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await axios.post(
        "http://localhost:5278/api/TopStudentLists/approve-rectorate",
        {
          topStudentListId: currentList.id,
          isApproved: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFeedback({
        type: "success",
        message: "Rektörlük onayı başarıyla geri alındı!",
      });
      fetchStudents();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message ||
            "Rektörlük onay geri alma işlemi başarısız oldu!",
        });
      } else {
        setFeedback({
          type: "error",
          message: "Rektörlük onay geri alma işlemi başarısız oldu!",
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      const res = await axios.get("http://localhost:5278/api/TopStudentLists", {
        params: {
          PageIndex: 0,
          PageSize: 50,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (Array.isArray(res.data.items) && res.data.items.length > 0) {
        // Sadece rektörlüğe gönderilmiş listeleri filtrele
        const sentToRectorateLists = res.data.items.filter(
          (list: TopStudentList) => list.sendRectorate
        );
        setLists(sentToRectorateLists);
      } else {
        setFeedback({
          type: "error",
          message: "Rektörlüğe gönderilmiş liste bulunamadı.",
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          router.replace("/auth/login");
        }

        setFeedback({
          type: "error",
          message: err.response?.data?.message || "Bir hata oluştu.",
        });
      }
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Check authentication first
      const token = localStorage.getItem("accessToken");
      if (!user || !token) {
        window.location.href = "/auth/login";
        return;
      }

      // Sadece rektörlük personeli erişebilir (userType: 1, staffRole: 0)
      if (user.userType !== 1 || user.staffRole !== 0) {
        router.replace("/dashboard");
        return;
      }

      await fetchStudents();
    };

    init();
  }, [user, router]);

  const getDisplayedStudents = () => {
    if (selectedFaculty === "All Students") {
      const allList = lists.find((list) => list.topStudentListType === 2);
      if (!allList) return [];
      return [...allList.students].sort(
        (a, b) => b.transcriptGpa - a.transcriptGpa
      );
    }

    if (!selectedDepartment) {
      const facultyList = lists.find((list) => list.topStudentListType === 2);
      if (!facultyList) return [];

      let facultyName = "";
      switch (selectedFaculty) {
        case "Engineering":
          facultyName = "Mühendislik Fakültesi";
          break;
        case "Science":
          facultyName = "Fen Fakültesi";
          break;
        case "Architecture":
          facultyName = "Mimarlık Fakültesi";
          break;
      }

      const facultyStudents = facultyList.students.filter(
        (s) => s.facultyName === facultyName
      );
      return [...facultyStudents].sort(
        (a, b) => b.transcriptGpa - a.transcriptGpa
      );
    }

    const departmentLists = lists.filter(
      (list) => list.topStudentListType === 0
    );
    if (!departmentLists.length) return [];

    const departmentStudents = departmentLists.flatMap((list) =>
      list.students.filter((s) => s.departmentName === selectedDepartment)
    );

    const sortedStudents = [...departmentStudents].sort(
      (a, b) => b.transcriptGpa - a.transcriptGpa
    );

    return sortedStudents.filter(
      (student, index, self) =>
        index === self.findIndex((s) => s.studentId === student.studentId)
    );
  };

  const getDepartments = () => {
    let facultyName = "";
    switch (selectedFaculty) {
      case "Engineering":
        facultyName = "Mühendislik Fakültesi";
        break;
      case "Science":
        facultyName = "Fen Fakültesi";
        break;
      case "Architecture":
        facultyName = "Mimarlık Fakültesi";
        break;
      default:
        return [];
    }

    const departmentLists = lists.filter(
      (list) => list.topStudentListType === 0
    );
    const facultyStudents = departmentLists.flatMap((list) =>
      list.students.filter((s) => s.facultyName === facultyName)
    );

    return [...new Set(facultyStudents.map((s) => s.departmentName))];
  };

  const handleFacultyChange = (faculty: string) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment("");
  };

  if (loading)
    return (
      <AuthenticatedLayout>
        <div className="p-8">Yükleniyor...</div>
      </AuthenticatedLayout>
    );

  const displayedStudents = getDisplayedStudents();

  return (
    <AuthenticatedLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Rektörlük - En Başarılı Öğrenciler
          </h1>
          <div className="flex items-center space-x-4">
            {/* Approval Status Indicator */}
            {isCurrentListApprovedByRectorate() && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Rektörlük Onayı Verildi
              </span>
            )}

            {/* Action Buttons */}
            <div className="space-x-4">
              {!isCurrentListApprovedByRectorate() && getCurrentList() && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rektörlük Onayı Ver
                </button>
              )}
              {isCurrentListApprovedByRectorate() && getCurrentList() && (
                <button
                  onClick={() => setShowRevokeModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Onayı Geri Al
                </button>
              )}
            </div>
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

        {lists.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Henüz Liste Gönderilmemiş
            </h3>
            <p className="text-gray-500">
              Öğrenci İşleri tarafından onaylanmış ve rektörlüğe gönderilmiş
              liste bulunmamaktadır.
            </p>
          </div>
        ) : (
          <>
            {/* Faculty Filter Buttons */}
            <div className="flex gap-2 mb-4">
              {faculties.map((faculty) => (
                <button
                  key={faculty}
                  onClick={() => handleFacultyChange(faculty)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      selectedFaculty === faculty
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  {faculty}
                </button>
              ))}
            </div>

            {/* Department Filter Buttons */}
            {selectedFaculty !== "All Students" && (
              <div className="flex gap-2 mb-6">
                {getDepartments().map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        selectedDepartment === dept
                          ? "bg-gray-900 text-white"
                          : "bg-white text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Numara
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    İsim
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Soyisim
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Bölüm
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Fakülte
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    GNO
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-600">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, i) => (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.studentNumber}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.studentName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.studentSurname}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.departmentName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.facultyName}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {student.transcriptGpa.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {/* Confirmation Modals */}
        <ConfirmationModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          onConfirm={() => {
            setShowApproveModal(false);
            handleApproveRectorate();
          }}
          title="Rektörlük Onayı"
          message="Bu listeyi rektörlük adına onaylamak istediğinizden emin misiniz? Bu işlem geri alınabilir."
          confirmText="Onayla"
          cancelText="İptal"
          confirmButtonColor="green"
          isLoading={actionLoading}
        />

        <ConfirmationModal
          isOpen={showRevokeModal}
          onClose={() => setShowRevokeModal(false)}
          onConfirm={() => {
            setShowRevokeModal(false);
            handleRevokeRectorateApproval();
          }}
          title="Rektörlük Onayını Geri Al"
          message="Bu listenin rektörlük onayını geri almak istediğinizden emin misiniz?"
          confirmText="Geri Al"
          cancelText="İptal"
          confirmButtonColor="red"
          isLoading={actionLoading}
        />
      </div>
    </AuthenticatedLayout>
  );
}
