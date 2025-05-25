"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
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
  students: Student[];
}

export default function TopStudentsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("All Students");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [lists, setLists] = useState<TopStudentList[]>([]);

  const faculties = ["All Students", "Engineering", "Architecture", "Science"];
  
  const departments: { [key: string]: string[] } = {
    Engineering: ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği"],
    Science: ["Fizik Bölümü", "Kimya Bölümü", "Matematik Bölümü"],
    Architecture: ["Mimarlık"]
  };

  // Fakülte ve bölüm eşleştirmeleri
  const facultyDepartmentMap = {
    Engineering: {
      facultyName: "Mühendislik",
      departments: ["Bilgisayar Mühendisliği", "Elektrik-Elektronik Mühendisliği", "Makine Mühendisliği"]
    },
    Science: {
      facultyName: "Fen",
      departments: ["Fizik Bölümü", "Kimya Bölümü", "Matematik Bölümü"]
    },
    Architecture: {
      facultyName: "Mimarlık",
      departments: ["Mimarlık"]
    }
  };

  // Seçili listeyi bulmak için yardımcı fonksiyon
  const getCurrentList = () => {
    if (selectedFaculty === "All Students") {
      return lists.find(list => list.topStudentListType === 2);
    }

    if (!selectedDepartment) {
      return lists.find(list => list.topStudentListType === 2);
    }

    const departmentLists = lists.filter(list => list.topStudentListType === 0);
    if (!departmentLists.length) return null;

    return departmentLists.find(list => 
      list.students.some(s => s.departmentName === selectedDepartment)
    );
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const currentList = getCurrentList();
      if (!currentList) {
        setFeedback({ type: "error", message: "Onaylanacak liste bulunamadı!" });
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      await axios.post(
        "http://localhost:5278/api/TopStudentLists/approve-student-affairs",
        { 
          topStudentListId: currentList.id,
          isApproved: true
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setFeedback({ type: "success", message: "Liste başarıyla onaylandı!" });
      fetchStudents();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback({ 
          type: "error", 
          message: error.response?.data?.message || "Onaylama işlemi başarısız oldu!" 
        });
      } else {
        setFeedback({ type: "error", message: "Onaylama işlemi başarısız oldu!" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToRectorate = async () => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const currentList = getCurrentList();
      if (!currentList) {
        setFeedback({ type: "error", message: "Gönderilecek liste bulunamadı!" });
        return;
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      await axios.post(
        "http://localhost:5278/api/TopStudentLists/send-to-rectorate",
        { 
          topStudentListId: currentList.id
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      setFeedback({ type: "success", message: "Liste başarıyla rektörlüğe gönderildi!" });
      fetchStudents();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback({ 
          type: "error", 
          message: error.response?.data?.message || "Rektörlüğe gönderme işlemi başarısız oldu!" 
        });
      } else {
        setFeedback({ type: "error", message: "Rektörlüğe gönderme işlemi başarısız oldu!" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await axios.get("http://localhost:5278/api/TopStudentLists", {
        params: {
          PageIndex: 0,
          PageSize: 50,
        },
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (Array.isArray(res.data.items) && res.data.items.length > 0) {
        setLists(res.data.items);
      } else {
        setFeedback({
          type: "error",
          message: "Öğrenci listesi alınamadı veya boş."
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          router.replace("/login");
        }
        
        setFeedback({
          type: "error",
          message: err.response?.data?.message || "Bir hata oluştu."
        });
      }
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!user) {
        router.replace("/dashboard");
        return;
      }

      if (user.userType !== 1 || user.staffRole !== 1) {
        router.replace("/dashboard");
        return;
      }

      await fetchStudents();
    };

    init();
  }, [user, router]);

  const getDisplayedStudents = () => {
    if (selectedFaculty === "All Students") {
      const allList = lists.find(list => list.topStudentListType === 2);
      if (!allList) return [];
      return [...allList.students].sort((a, b) => b.transcriptGpa - a.transcriptGpa);
    }

    if (!selectedDepartment) {
      const facultyList = lists.find(list => list.topStudentListType === 2);
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

      const facultyStudents = facultyList.students.filter(s => s.facultyName === facultyName);
      return [...facultyStudents].sort((a, b) => b.transcriptGpa - a.transcriptGpa);
    }

    const departmentLists = lists.filter(list => list.topStudentListType === 0);
    if (!departmentLists.length) return [];

    const departmentStudents = departmentLists.flatMap(list => 
      list.students.filter(s => s.departmentName === selectedDepartment)
    );

    const sortedStudents = [...departmentStudents].sort((a, b) => b.transcriptGpa - a.transcriptGpa);
    
    return sortedStudents.filter((student, index, self) =>
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

    const departmentLists = lists.filter(list => list.topStudentListType === 0);
    const facultyStudents = departmentLists.flatMap(list => 
      list.students.filter(s => s.facultyName === facultyName)
    );

    return [...new Set(facultyStudents.map(s => s.departmentName))];
  };

  const handleFacultyChange = (faculty: string) => {
    setSelectedFaculty(faculty);
    setSelectedDepartment("");
  };

  if (loading) return (
    <AuthenticatedLayout>
      <div className="p-8">Yükleniyor...</div>
    </AuthenticatedLayout>
  );

  const displayedStudents = getDisplayedStudents();

  return (
    <AuthenticatedLayout>
      <div className="p-8 max-w-6xl mx-auto">
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

        {/* Faculty Filter Buttons */}
        <div className="flex gap-2 mb-4">
          {faculties.map(faculty => (
            <button
              key={faculty}
              onClick={() => handleFacultyChange(faculty)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedFaculty === faculty 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-900 hover:bg-gray-100'}`}
            >
              {faculty}
            </button>
          ))}
        </div>

        {/* Department Filter Buttons */}
        {selectedFaculty !== "All Students" && (
          <div className="flex gap-2 mb-6">
            {getDepartments().map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectedDepartment === dept 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white text-gray-900 hover:bg-gray-100'}`}
              >
                {dept}
              </button>
            ))}
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
            {displayedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-600">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              displayedStudents.map((student, i) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-900">{student.studentNumber}</td>
                  <td className="px-4 py-3 text-gray-900">{student.studentName}</td>
                  <td className="px-4 py-3 text-gray-900">{student.studentSurname}</td>
                  <td className="px-4 py-3 text-gray-900">{student.departmentName}</td>
                  <td className="px-4 py-3 text-gray-900">{student.facultyName}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{student.transcriptGpa.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AuthenticatedLayout>
  );
}