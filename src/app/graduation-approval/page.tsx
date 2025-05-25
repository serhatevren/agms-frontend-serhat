"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { axiosInstance } from "@/lib/axios";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import Image from "next/image";

const BACKEND_URL = "/graduationprocesses";
const ROLE_ENDPOINT_MAP: Record<string, string> = {
  advisor: `${BACKEND_URL}/approve-by-advisor`,
  departmentSecretary: `${BACKEND_URL}/approve-by-department-secretary`,
  facultyDeansOffice: `${BACKEND_URL}/approve-by-faculty-deans-office`,
  studentAffairs: `${BACKEND_URL}/approve-by-student-affairs`,
};

function getApprovalStep(user: any) {
  if (!user) return null;
  if (user.userType === 2 || user.role === "advisor") return "advisor";
  if (user.userType === 1) {
    switch (user.staffRole) {
      case 3:
        return "departmentSecretary";
      case 2:
        return "facultyDeansOffice";
      case 1:
        return "studentAffairs";
      default:
        return null;
    }
  }
  return null;
}

function canApprove(process: any, step: string) {
  if (step === "advisor") return !process.advisorApproved;
  if (step === "departmentSecretary")
    return process.advisorApproved && !process.departmentSecretaryApproved;
  if (step === "facultyDeansOffice")
    return (
      process.departmentSecretaryApproved && !process.facultyDeansOfficeApproved
    );
  if (step === "studentAffairs")
    return (
      process.facultyDeansOfficeApproved && !process.studentAffairsApproved
    );
  return false;
}

function getDepartmentIdForUser(user: any) {
  // Sadece department secretary için departmentId döndür
  if (user && user.userType === 1 && user.staffRole === 3) {
    return user.departmentId;
  }
  return null;
}

export default function GraduationApprovalPage() {
  const { user } = useAuthStore();
  const [processes, setProcesses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const step = getApprovalStep(user);

  async function fetchAdvisorStudents() {
    setLoading(true);
    setError(null);
    try {
      if (!user) return;
      const studentsRes = await axiosInstance.get(
        `/advisors/${user.id}/students`
      );
      console.log("studentsRes.data:", studentsRes.data);
      console.log("studentsRes.data.items:", studentsRes.data.items);
      setStudents(studentsRes.data.items || studentsRes.data);
    } catch (e: any) {
      setError("Öğrenciler alınamadı.");
    }
    setLoading(false);
  }

  async function fetchDepartmentSecretaryStudents() {
    setLoading(true);
    setError(null);
    try {
      if (!user) return;

      // First, get staff information using user.id
      console.log("Fetching staff info for user ID:", user.id);
      const staffRes = await axiosInstance.get(`/staffs/${user.id}`);
      console.log("Staff response:", staffRes.data);

      const departmentId = staffRes.data.departmentId;
      if (!departmentId) {
        setError("Department ID not found for this staff member");
        setLoading(false);
        return;
      }

      // Then fetch students using the department ID with pagination
      console.log("Fetching students for department ID:", departmentId);
      const studentsRes = await axiosInstance.get(
        `/students/by-department/${departmentId}`,
        {
          params: {
            pageIndex: 0,
            pageSize: 50,
          },
        }
      );
      console.log("Students response:", studentsRes.data);

      // Check if we have items in the response
      if (
        !studentsRes.data ||
        (!Array.isArray(studentsRes.data.items) &&
          !Array.isArray(studentsRes.data))
      ) {
        console.error("Unexpected response format:", studentsRes.data);
        setError("Invalid response format from server");
        setLoading(false);
        return;
      }

      const studentsData = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data.items || [];
      console.log("Setting students state with:", studentsData);
      setStudents(studentsData);
    } catch (e: any) {
      console.error("Error in fetchDepartmentSecretaryStudents:", e);
      setError(
        e.response?.data?.message || "Failed to fetch department students"
      );
    }
    setLoading(false);
  }

  async function fetchFacultyDeansStudents() {
    setLoading(true);
    setError(null);
    try {
      if (!user) return;

      // First, get staff information using user.id to get facultyId
      console.log("Fetching staff info for faculty dean, user ID:", user.id);
      const staffRes = await axiosInstance.get(`/staffs/${user.id}`);
      console.log("Faculty dean staff response:", staffRes.data);

      const facultyId = staffRes.data.facultyId;
      if (!facultyId) {
        setError("Faculty ID not found for this staff member");
        setLoading(false);
        return;
      }

      // Then fetch all students from this faculty's departments
      console.log("Fetching students for faculty ID:", facultyId);
      const studentsRes = await axiosInstance.get(
        `/students/by-faculty/${facultyId}`,
        {
          params: {
            pageIndex: 0,
            pageSize: 50,
          },
        }
      );
      console.log("Faculty students response:", studentsRes.data);

      // Check if we have items in the response
      if (
        !studentsRes.data ||
        (!Array.isArray(studentsRes.data.items) &&
          !Array.isArray(studentsRes.data))
      ) {
        console.error(
          "Unexpected faculty students response format:",
          studentsRes.data
        );
        setError("Invalid response format from server");
        setLoading(false);
        return;
      }

      const studentsData = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data.items || [];
      console.log("Setting faculty students state with:", studentsData);
      setStudents(studentsData);
    } catch (e: any) {
      console.error("Error in fetchFacultyDeansStudents:", e);
      setError(e.response?.data?.message || "Failed to fetch faculty students");
    }
    setLoading(false);
  }

  async function fetchStudentAffairsStudents() {
    setLoading(true);
    setError(null);
    try {
      console.log("fetchStudentAffairsStudents axiosInstance.get öncesi");
      const res = await axiosInstance.get("/Students/all");
      console.log("fetchStudentAffairsStudents axiosInstance.get sonrası", res);
      console.log("res.data:", res.data);
      console.log("res.data.items:", res.data.items);
      setStudents(res.data.items || res.data);
    } catch (e) {
      console.error("fetchStudentAffairsStudents axiosInstance.get HATASI:", e);
      setError("Tüm öğrenciler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApproval(studentId: string, isApproved: boolean) {
    try {
      setLoading(true);
      await axiosInstance.post(`${BACKEND_URL}/approve-by-advisor`, {
        studentId,
        isApproved,
      });
      // Refresh the student list after approval
      if (step === "advisor") {
        fetchAdvisorStudents();
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Onay işlemi başarısız oldu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchProcesses() {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get(BACKEND_URL);
        setProcesses(res.data.items || res.data);
      } catch (e: any) {
        setError("Başvurular alınamadı.");
      }
      setLoading(false);
    }
    if (step === "advisor") {
      fetchAdvisorStudents();
    } else if (step === "departmentSecretary") {
      fetchDepartmentSecretaryStudents();
    } else if (step === "facultyDeansOffice") {
      fetchFacultyDeansStudents();
    } else if (step === "studentAffairs") {
      fetchStudentAffairsStudents();
    } else {
      fetchProcesses();
    }
  }, [step, user]);

  useEffect(() => {
    console.log("students state:", students);
  }, [students]);

  async function handleApprove(processId: string, isApproved: boolean) {
    if (!step) return;
    try {
      await axiosInstance.post(ROLE_ENDPOINT_MAP[step], {
        graduationProcessId: processId,
        isApproved,
      });
      setProcesses((prev) =>
        prev.map((p) =>
          p.id === processId ? { ...p, [`${step}Approved`]: isApproved } : p
        )
      );
    } catch (e) {
      alert("Onay işlemi başarısız oldu.");
    }
  }

  // Arama filtreleme
  const filteredStudents = students?.filter((s: any) => {
    const fullName = `${s.name ?? ""} ${s.surname ?? ""}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });
  const filteredProcesses = processes.filter(
    (p) =>
      p.studentUser &&
      `${p.studentUser.name} ${p.studentUser.surname}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // Add these approval handler functions at component level
  async function handleDepartmentSecretaryApproval(
    studentId: string,
    isApproved: boolean
  ) {
    try {
      setLoading(true);
      await axiosInstance.post(
        `${BACKEND_URL}/approve-by-department-secretary`,
        {
          studentId,
          isApproved,
        }
      );
      if (step === "departmentSecretary") {
        fetchDepartmentSecretaryStudents();
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Onay işlemi başarısız oldu");
    } finally {
      setLoading(false);
    }
  }

  async function handleFacultyDeansApproval(
    studentId: string,
    isApproved: boolean
  ) {
    try {
      setLoading(true);
      await axiosInstance.post(
        `${BACKEND_URL}/approve-by-faculty-deans-office`,
        {
          studentId,
          isApproved,
        }
      );
      if (step === "facultyDeansOffice") {
        fetchFacultyDeansStudents();
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Onay işlemi başarısız oldu");
    } finally {
      setLoading(false);
    }
  }

  async function handleStudentAffairsApproval(
    studentId: string,
    isApproved: boolean
  ) {
    try {
      setLoading(true);
      await axiosInstance.post(`${BACKEND_URL}/approve-by-student-affairs`, {
        studentId,
        isApproved,
      });
      if (step === "studentAffairs") {
        fetchStudentAffairsStudents();
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Onay işlemi başarısız oldu");
    } finally {
      setLoading(false);
    }
  }

  if (!step)
    return (
      <AuthenticatedLayout>
        <div className="p-8">Bu sayfaya erişim yetkiniz yok.</div>
      </AuthenticatedLayout>
    );
  if (loading)
    return (
      <AuthenticatedLayout>
        <div className="p-8">Yükleniyor...</div>
      </AuthenticatedLayout>
    );
  if (error)
    return (
      <AuthenticatedLayout>
        <div className="p-8 text-red-600">{error}</div>
      </AuthenticatedLayout>
    );

  // ADVISOR LİSTESİ
  if (step === "advisor") {
    return (
      <AuthenticatedLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Advisor's Graduation List
            </h1>
          </div>
          <input
            type="text"
            placeholder="Search by student name..."
            className="mb-6 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredStudents.length === 0 ? (
            <div className="text-gray-500">Listede öğrenci yok.</div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 hover:shadow-lg transition"
                >
                  <div className="flex-grow">
                    <div className="font-semibold text-lg text-gray-900">
                      {s.name} {s.surname}
                    </div>
                    <div className="text-sm text-gray-600">
                      Bölüm:{" "}
                      <span className="text-gray-800">
                        {s.departmentName || "-"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Öğrenci No:{" "}
                      <span className="text-gray-800">
                        {s.studentNumber || "-"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.graduationStatus === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : s.graduationStatus === 1
                            ? "bg-blue-100 text-blue-800"
                            : s.graduationStatus === 2
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.graduationStatus === 0
                          ? "Beklemede"
                          : s.graduationStatus === 1
                          ? "İşlemde"
                          : s.graduationStatus === 2
                          ? "Onaylandı"
                          : "Reddedildi"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button
                      onClick={() => handleApproval(s.id, true)}
                      disabled={s.graduationStatus !== 0}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 0
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 0
                          ? "Bu öğrencinin mezuniyet durumu zaten işlemde veya sonuçlandı"
                          : ""
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleApproval(s.id, false)}
                      disabled={s.graduationStatus !== 0}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 0
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 0
                          ? "Bu öğrencinin mezuniyet durumu zaten işlemde veya sonuçlandı"
                          : ""
                      }
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    );
  }

  // DEPARTMENT SECRETARY LİSTESİ
  if (step === "departmentSecretary") {
    return (
      <AuthenticatedLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Department Secretary Student List
            </h1>
          </div>
          <input
            type="text"
            placeholder="Search by student name..."
            className="mb-6 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredStudents.length === 0 ? (
            <div className="text-gray-500">Listede öğrenci yok.</div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl shadow-md p-6 flex flex-col border border-gray-100 hover:shadow-lg transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex-grow">
                      <div className="font-semibold text-lg text-gray-900">
                        {s.name} {s.surname}
                      </div>
                      <div className="text-sm text-gray-600">
                        Bölüm:{" "}
                        <span className="text-gray-800">
                          {s.departmentName || "-"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Öğrenci No:{" "}
                        <span className="text-gray-800">
                          {s.studentNumber || "-"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            s.graduationStatus === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : s.graduationStatus === 1
                              ? "bg-blue-100 text-blue-800"
                              : s.graduationStatus === 2
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.graduationStatus === 0
                            ? "Beklemede"
                            : s.graduationStatus === 1
                            ? "İşlemde"
                            : s.graduationStatus === 2
                            ? "Onaylandı"
                            : "Reddedildi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Onay Durumları
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Advisor Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationStatus === 2
                              ? "bg-green-500"
                              : s.graduationStatus === 3
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Danışman
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                s.graduationStatus === 2
                                  ? "#059669"
                                  : s.graduationStatus === 3
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {s.graduationStatus === 2
                              ? "Onaylandı"
                              : s.graduationStatus === 3
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Buttons */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() =>
                        handleDepartmentSecretaryApproval(s.id, true)
                      }
                      disabled={s.graduationStatus !== 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 1
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 1
                          ? "Bu öğrencinin mezuniyet durumu henüz işleme hazır değil veya sonuçlandı"
                          : ""
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() =>
                        handleDepartmentSecretaryApproval(s.id, false)
                      }
                      disabled={s.graduationStatus !== 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 1
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 1
                          ? "Bu öğrencinin mezuniyet durumu henüz işleme hazır değil veya sonuçlandı"
                          : ""
                      }
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    );
  }

  // STUDENT AFFAIRS LİSTESİ
  if (step === "studentAffairs") {
    return (
      <AuthenticatedLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Student Affairs Student List
            </h1>
          </div>
          <input
            type="text"
            placeholder="Search by student name..."
            className="mb-6 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredStudents.length === 0 ? (
            <div className="text-gray-500">Listede öğrenci yok.</div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl shadow-md p-6 flex flex-col border border-gray-100 hover:shadow-lg transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex-grow">
                      <div className="font-semibold text-lg text-gray-900">
                        {s.name} {s.surname}
                      </div>
                      <div className="text-sm text-gray-600">
                        Bölüm:{" "}
                        <span className="text-gray-800">
                          {s.departmentName || "-"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Öğrenci No:{" "}
                        <span className="text-gray-800">
                          {s.studentNumber || "-"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            s.graduationStatus === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : s.graduationStatus === 1
                              ? "bg-blue-100 text-blue-800"
                              : s.graduationStatus === 2
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.graduationStatus === 0
                            ? "Beklemede"
                            : s.graduationStatus === 1
                            ? "İşlemde"
                            : s.graduationStatus === 2
                            ? "Onaylandı"
                            : "Reddedildi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Onay Durumları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Advisor Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationStatus === 2
                              ? "bg-green-500"
                              : s.graduationStatus === 3
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Danışman
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                s.graduationStatus === 2
                                  ? "#059669"
                                  : s.graduationStatus === 3
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {s.graduationStatus === 2
                              ? "Onaylandı"
                              : s.graduationStatus === 3
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Department Secretary Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationStatus === 2
                              ? "bg-green-500"
                              : s.graduationStatus === 3
                              ? "bg-red-500"
                              : s.graduationStatus < 1
                              ? "bg-gray-300"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Bölüm Sekreterliği
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                s.graduationStatus === 2
                                  ? "#059669"
                                  : s.graduationStatus === 3
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {s.graduationStatus === 2
                              ? "Onaylandı"
                              : s.graduationStatus === 3
                              ? "Reddedildi"
                              : s.graduationStatus < 1
                              ? "Danışman Onayı Bekleniyor"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Faculty Dean's Office Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationStatus === 2
                              ? "bg-green-500"
                              : s.graduationStatus === 3
                              ? "bg-red-500"
                              : s.graduationStatus < 1
                              ? "bg-gray-300"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Fakülte Dekanlığı
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                s.graduationStatus === 2
                                  ? "#059669"
                                  : s.graduationStatus === 3
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {s.graduationStatus === 2
                              ? "Onaylandı"
                              : s.graduationStatus === 3
                              ? "Reddedildi"
                              : s.graduationStatus < 1
                              ? "Önceki Onaylar Bekleniyor"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Buttons */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleStudentAffairsApproval(s.id, true)}
                      disabled={s.graduationStatus !== 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 1
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 1
                          ? "Bu öğrencinin tüm onayları tamamlanmadan işlem yapamazsınız"
                          : ""
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleStudentAffairsApproval(s.id, false)}
                      disabled={s.graduationStatus !== 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 1
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 1
                          ? "Bu öğrencinin tüm onayları tamamlanmadan işlem yapamazsınız"
                          : ""
                      }
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    );
  }

  // FACULTY DEANS OFFICE LİSTESİ
  if (step === "facultyDeansOffice") {
    return (
      <AuthenticatedLayout>
        <div className="p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Faculty Dean's Office Student List
            </h1>
          </div>
          <input
            type="text"
            placeholder="Search by student name..."
            className="mb-6 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredStudents.length === 0 ? (
            <div className="text-gray-500">Listede öğrenci yok.</div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white rounded-xl shadow-md p-6 flex flex-col border border-gray-100 hover:shadow-lg transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex-grow">
                      <div className="font-semibold text-lg text-gray-900">
                        {s.name} {s.surname}
                      </div>
                      <div className="text-sm text-gray-600">
                        Bölüm:{" "}
                        <span className="text-gray-800">
                          {s.departmentName || "-"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Öğrenci No:{" "}
                        <span className="text-gray-800">
                          {s.studentNumber || "-"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            s.graduationStatus === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : s.graduationStatus === 1
                              ? "bg-blue-100 text-blue-800"
                              : s.graduationStatus === 2
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {s.graduationStatus === 0
                            ? "Beklemede"
                            : s.graduationStatus === 1
                            ? "İşlemde"
                            : s.graduationStatus === 2
                            ? "Onaylandı"
                            : "Reddedildi"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Onay Durumları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Advisor Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationStatus === 2
                              ? "bg-green-500"
                              : s.graduationStatus === 3
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Danışman
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                s.graduationStatus === 2
                                  ? "#059669"
                                  : s.graduationStatus === 3
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {s.graduationStatus === 2
                              ? "Onaylandı"
                              : s.graduationStatus === 3
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Department Secretary Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationStatus === 2
                              ? "bg-green-500"
                              : s.graduationStatus === 3
                              ? "bg-red-500"
                              : s.graduationStatus < 1
                              ? "bg-gray-300"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Bölüm Sekreterliği
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                s.graduationStatus === 2
                                  ? "#059669"
                                  : s.graduationStatus === 3
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {s.graduationStatus === 2
                              ? "Onaylandı"
                              : s.graduationStatus === 3
                              ? "Reddedildi"
                              : s.graduationStatus < 1
                              ? "Danışman Onayı Bekleniyor"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Buttons */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleFacultyDeansApproval(s.id, true)}
                      disabled={s.graduationStatus !== 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 1
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 1
                          ? "Bu öğrencinin mezuniyet durumu henüz işleme hazır değil veya sonuçlandı"
                          : ""
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleFacultyDeansApproval(s.id, false)}
                      disabled={s.graduationStatus !== 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationStatus === 1
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={
                        s.graduationStatus !== 1
                          ? "Bu öğrencinin mezuniyet durumu henüz işleme hazır değil veya sonuçlandı"
                          : ""
                      }
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AuthenticatedLayout>
    );
  }

  // ONAY SÜRECİ LİSTESİ
  const displayProcesses = filteredProcesses.filter((p) => canApprove(p, step));
}
