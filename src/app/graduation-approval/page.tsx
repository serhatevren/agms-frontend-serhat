"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { axiosInstance } from "@/lib/axios";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  // Toast bildirimi göster
  const showToast = (message: string, type: "success" | "error" = "error") => {
    const toastConfig = {
      duration: type === "error" ? 5000 : 4000,
      position: "top-right" as const,
      style: {
        background: type === "error" ? "#EF4444" : "#10B981",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
      },
    };

    if (type === "error") {
      toast.error(message, toastConfig);
    } else {
      toast.success(message, toastConfig);
    }
  };

  // Hata durumunu yönet
  const handleError = (error: any, defaultMessage: string) => {
    const errorMessage = error.response?.data?.message || defaultMessage;
    setError(errorMessage);
    showToast(errorMessage);
  };

  // Öğrenci listesini getir
  const fetchStudents = async (endpoint: string, params = {}) => {
    try {
      const res = await axiosInstance.get(endpoint, { params });
      return res.data.items || res.data;
    } catch (error: any) {
      throw error;
    }
  };

  // Advisor öğrencilerini getir
  const fetchAdvisorStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        throw new Error("Kullanıcı bilgisi bulunamadı.");
      }

      // Önce advisor'ın öğrencilerini al
      const studentsRes = await axiosInstance.get(
        `/advisors/${user.id}/students`
      );
      const studentsData = studentsRes.data.items || studentsRes.data;

      // Her öğrenci için graduation process bilgisini al
      const studentsWithGraduationProcess = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            const graduationProcessRes = await axiosInstance.get(
              `/graduationprocesses/by-student/${student.id}`
            );
            return {
              ...student,
              graduationProcess: graduationProcessRes.data,
            };
          } catch (error) {
            // Eğer graduation process bulunamazsa, varsayılan değerlerle devam et
            return {
              ...student,
              graduationProcess: {
                advisorApproved: false,
                departmentSecretaryApproved: false,
                facultyDeansOfficeApproved: false,
                studentAffairsApproved: false,
              },
            };
          }
        })
      );

      setStudents(studentsWithGraduationProcess);
    } catch (error: any) {
      console.error("fetchAdvisorStudents hata detayları:", {
        error: error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });
      handleError(error, "Öğrenci listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  // Department Secretary öğrencilerini getir
  const fetchDepartmentSecretaryStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        throw new Error("Kullanıcı bilgisi bulunamadı.");
      }

      const staffRes = await axiosInstance.get(`/staffs/${user.id}`);
      const departmentId = staffRes.data.departmentId;

      if (!departmentId) {
        throw new Error("Bölüm bilgisi bulunamadı.");
      }

      const studentsData = await fetchStudents(
        `/students/by-department/${departmentId}`,
        {
          pageIndex: 0,
          pageSize: 50,
        }
      );

      // Her öğrenci için graduation process bilgisini al
      const studentsWithGraduationProcess = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            const graduationProcessRes = await axiosInstance.get(
              `/graduationprocesses/by-student/${student.id}`
            );
            return {
              ...student,
              graduationProcess: graduationProcessRes.data,
            };
          } catch (error) {
            return {
              ...student,
              graduationProcess: {
                advisorApproved: false,
                departmentSecretaryApproved: false,
                facultyDeansOfficeApproved: false,
                studentAffairsApproved: false,
              },
            };
          }
        })
      );

      setStudents(studentsWithGraduationProcess);
    } catch (error: any) {
      handleError(error, "Bölüm öğrencileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  // Faculty Dean öğrencilerini getir
  const fetchFacultyDeansStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        throw new Error("Kullanıcı bilgisi bulunamadı.");
      }

      const staffRes = await axiosInstance.get(`/staffs/${user.id}`);
      const facultyId = staffRes.data.facultyId;

      if (!facultyId) {
        throw new Error("Fakülte bilgisi bulunamadı.");
      }

      const studentsData = await fetchStudents(
        `/students/by-faculty/${facultyId}`,
        {
          pageIndex: 0,
          pageSize: 50,
        }
      );

      // Her öğrenci için graduation process bilgisini al
      const studentsWithGraduationProcess = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            const graduationProcessRes = await axiosInstance.get(
              `/graduationprocesses/by-student/${student.id}`
            );
            return {
              ...student,
              graduationProcess: graduationProcessRes.data,
            };
          } catch (error) {
            return {
              ...student,
              graduationProcess: {
                advisorApproved: false,
                departmentSecretaryApproved: false,
                facultyDeansOfficeApproved: false,
                studentAffairsApproved: false,
              },
            };
          }
        })
      );

      setStudents(studentsWithGraduationProcess);
    } catch (error: any) {
      handleError(error, "Fakülte öğrencileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  // Student Affairs öğrencilerini getir
  const fetchStudentAffairsStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const studentsData = await fetchStudents("/Students/all");

      // Her öğrenci için graduation process bilgisini al
      const studentsWithGraduationProcess = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            const graduationProcessRes = await axiosInstance.get(
              `/graduationprocesses/by-student/${student.id}`
            );
            return {
              ...student,
              graduationProcess: graduationProcessRes.data,
            };
          } catch (error) {
            return {
              ...student,
              graduationProcess: {
                advisorApproved: false,
                departmentSecretaryApproved: false,
                facultyDeansOfficeApproved: false,
                studentAffairsApproved: false,
              },
            };
          }
        })
      );

      setStudents(studentsWithGraduationProcess);
    } catch (error: any) {
      handleError(error, "Öğrenci listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  // Onay işlemini gerçekleştir
  const handleApproval = async (studentId: string, isApproved: boolean) => {
    try {
      setLoading(true);
      console.log("handleApproval başladı:", { studentId, isApproved });

      if (!user?.id) {
        throw new Error("Kullanıcı bilgisi bulunamadı.");
      }

      // Önce öğrencinin graduation process'ini al
      console.log(
        "Graduation process isteği yapılıyor:",
        `/graduationprocesses/by-student/${studentId}`
      );
      const graduationProcessResponse = await axiosInstance.get(
        `/graduationprocesses/by-student/${studentId}`
      );
      console.log("Graduation process yanıtı:", graduationProcessResponse.data);

      const graduationProcessId = graduationProcessResponse.data.id;
      console.log("Alınan graduation process ID:", graduationProcessId);

      if (!graduationProcessId) {
        throw new Error("Öğrencinin mezuniyet süreci bulunamadı.");
      }

      // Graduation process'i onayla veya reddet
      const approvalUrl = `/graduationprocesses/approve-by-advisor?graduationProcessId=${graduationProcessId}&isApproved=${isApproved}`;
      console.log("Onay isteği yapılıyor:", approvalUrl);

      const approvalResponse = await axiosInstance.post(approvalUrl);
      console.log("Onay yanıtı:", approvalResponse.data);

      const message = isApproved
        ? "Öğrenci mezuniyeti başarıyla onaylandı"
        : "Öğrenci mezuniyeti reddedildi";

      showToast(message, "success");
      console.log("Liste yenileniyor...");
      await fetchAdvisorStudents(); // Listeyi yenile
      console.log("Liste yenilendi");
    } catch (error: any) {
      console.error("Approval error detayları:", {
        error: error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });

      if (error.response?.status === 404) {
        handleError(error, "Öğrencinin mezuniyet süreci bulunamadı.");
      } else if (error.response?.status === 403) {
        handleError(error, "Bu işlem için yetkiniz bulunmuyor.");
      } else {
        handleError(error, `İşlem başarısız oldu: ${error.message}`);
      }
    } finally {
      setLoading(false);
      console.log("handleApproval tamamlandı");
    }
  };

  // Öğrenci listesini filtrele
  const filteredStudents = students?.filter((s: any) => {
    const fullName = `${s.name ?? ""} ${s.surname ?? ""}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  useEffect(() => {
    if (!user) {
      handleError(
        new Error("Kullanıcı bilgisi bulunamadı."),
        "Kullanıcı bilgisi bulunamadı."
      );
      return;
    }

    const fetchHandlers = {
      advisor: fetchAdvisorStudents,
      departmentSecretary: fetchDepartmentSecretaryStudents,
      facultyDeansOffice: fetchFacultyDeansStudents,
      studentAffairs: fetchStudentAffairsStudents,
    };

    const handler = fetchHandlers[step as keyof typeof fetchHandlers];
    if (handler) {
      handler();
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

      // Önce graduation process'i al
      const graduationProcessRes = await axiosInstance.get(
        `/graduationprocesses/by-student/${studentId}`
      );
      const graduationProcessId = graduationProcessRes.data.id;

      if (!graduationProcessId) {
        throw new Error("Öğrencinin mezuniyet süreci bulunamadı.");
      }

      // Onay/red işlemini gerçekleştir
      await axiosInstance.post(
        `/graduationprocesses/approve-by-department-secretary?graduationProcessId=${graduationProcessId}&isApproved=${isApproved}`
      );

      showToast(
        isApproved
          ? "Öğrenci mezuniyeti başarıyla onaylandı"
          : "Öğrenci mezuniyeti reddedildi",
        "success"
      );

      // Listeyi güncelle
      await fetchDepartmentSecretaryStudents();
    } catch (error: any) {
      if (error.response?.status === 404) {
        handleError(error, "Öğrencinin mezuniyet süreci bulunamadı.");
      } else if (error.response?.status === 403) {
        handleError(error, "Bu işlem için yetkiniz bulunmuyor.");
      } else {
        handleError(error, "İşlem başarısız oldu.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Faculty Deans Office onay işlemi fonksiyonunu güncelle
  async function handleFacultyDeansApproval(
    studentId: string,
    isApproved: boolean
  ) {
    try {
      setLoading(true);

      // Önce graduation process'i al
      const graduationProcessRes = await axiosInstance.get(
        `/graduationprocesses/by-student/${studentId}`
      );
      const graduationProcessId = graduationProcessRes.data.id;

      if (!graduationProcessId) {
        throw new Error("Öğrencinin mezuniyet süreci bulunamadı.");
      }

      // Onay/red işlemini gerçekleştir
      await axiosInstance.post(
        `/graduationprocesses/approve-by-faculty-deans-office?graduationProcessId=${graduationProcessId}&isApproved=${isApproved}`
      );

      showToast(
        isApproved
          ? "Öğrenci mezuniyeti başarıyla onaylandı"
          : "Öğrenci mezuniyeti reddedildi",
        "success"
      );

      // Listeyi güncelle
      await fetchFacultyDeansStudents();
    } catch (error: any) {
      if (error.response?.status === 404) {
        handleError(error, "Öğrencinin mezuniyet süreci bulunamadı.");
      } else if (error.response?.status === 403) {
        handleError(error, "Bu işlem için yetkiniz bulunmuyor.");
      } else {
        handleError(error, "İşlem başarısız oldu.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Student Affairs onay işlemi fonksiyonunu güncelle
  async function handleStudentAffairsApproval(
    studentId: string,
    isApproved: boolean
  ) {
    try {
      setLoading(true);

      // Önce graduation process'i al
      const graduationProcessRes = await axiosInstance.get(
        `/graduationprocesses/by-student/${studentId}`
      );
      const graduationProcessId = graduationProcessRes.data.id;

      if (!graduationProcessId) {
        throw new Error("Öğrencinin mezuniyet süreci bulunamadı.");
      }

      // Onay/red işlemini gerçekleştir
      await axiosInstance.post(
        `/graduationprocesses/approve-by-student-affairs?graduationProcessId=${graduationProcessId}&isApproved=${isApproved}`
      );

      showToast(
        isApproved
          ? "Öğrenci mezuniyeti başarıyla onaylandı"
          : "Öğrenci mezuniyeti reddedildi",
        "success"
      );

      // Listeyi güncelle
      await fetchStudentAffairsStudents();
    } catch (error: any) {
      if (error.response?.status === 404) {
        handleError(error, "Öğrencinin mezuniyet süreci bulunamadı.");
      } else if (error.response?.status === 403) {
        handleError(error, "Bu işlem için yetkiniz bulunmuyor.");
      } else {
        handleError(error, "İşlem başarısız oldu.");
      }
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
        <Toaster />
        <div className="p-8 max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
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
                          s.graduationProcess?.advisorApproved
                            ? "bg-green-100 text-green-800"
                            : s.graduationProcess?.advisorApproved === false
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {s.graduationProcess?.advisorApproved
                          ? "Onaylandı"
                          : s.graduationProcess?.advisorApproved === false
                          ? "Reddedildi"
                          : "Beklemede"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button
                      onClick={() => handleApproval(s.id, true)}
                      disabled={s.graduationProcess?.advisorApproved === true}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationProcess?.advisorApproved === true
                          ? "bg-green-100 text-green-800 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      title={
                        s.graduationProcess?.advisorApproved === true
                          ? "Bu öğrenci zaten onaylanmış"
                          : "Öğrencinin mezuniyet başvurusunu onayla"
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleApproval(s.id, false)}
                      disabled={s.graduationProcess?.advisorApproved === false}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        s.graduationProcess?.advisorApproved === false
                          ? "bg-red-100 text-red-800 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      title={
                        s.graduationProcess?.advisorApproved === false
                          ? "Bu öğrenci zaten reddedilmiş"
                          : "Öğrencinin mezuniyet başvurusunu reddet"
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
        <Toaster />
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
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Onay Durumları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Advisor Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationProcess?.advisorApproved
                              ? "bg-green-500"
                              : s.graduationProcess?.advisorApproved === false
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Danışman Onayı
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: s.graduationProcess?.advisorApproved
                                ? "#059669"
                                : s.graduationProcess?.advisorApproved === false
                                ? "#DC2626"
                                : "#000000",
                            }}
                          >
                            {s.graduationProcess?.advisorApproved
                              ? "Onaylandı"
                              : s.graduationProcess?.advisorApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Department Secretary Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            !s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "bg-gray-300"
                              : s.graduationProcess?.departmentSecretaryApproved
                              ? "bg-green-500"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "bg-red-500"
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
                                !s.graduationProcess?.advisorApproved ||
                                s.graduationProcess?.advisorApproved === false
                                  ? "#6B7280"
                                  : s.graduationProcess
                                      ?.departmentSecretaryApproved
                                  ? "#059669"
                                  : s.graduationProcess
                                      ?.departmentSecretaryApproved === false
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "Danışman Onayı Gerekiyor"
                              : s.graduationProcess?.departmentSecretaryApproved
                              ? "Onaylandı"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
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
                        disabled={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false ||
                          s.graduationProcess?.departmentSecretaryApproved ===
                            true
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === true
                            ? "bg-green-100 text-green-800 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                        title={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "Danışman onayı gerekiyor"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === true
                            ? "Bu öğrenci zaten onaylanmış"
                            : "Öğrencinin mezuniyet başvurusunu onayla"
                        }
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() =>
                          handleDepartmentSecretaryApproval(s.id, false)
                        }
                        disabled={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false ||
                          s.graduationProcess?.departmentSecretaryApproved ===
                            false
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === false
                            ? "bg-red-100 text-red-800 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                        title={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "Danışman onayı gerekiyor"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === false
                            ? "Bu öğrenci zaten reddedilmiş"
                            : "Öğrencinin mezuniyet başvurusunu reddet"
                        }
                      >
                        Reddet
                      </button>
                    </div>
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
        <Toaster />
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
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Onay Durumları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      {/* Advisor Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationProcess?.advisorApproved
                              ? "bg-green-500"
                              : s.graduationProcess?.advisorApproved === false
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Danışman Onayı
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: s.graduationProcess?.advisorApproved
                                ? "#059669"
                                : s.graduationProcess?.advisorApproved === false
                                ? "#DC2626"
                                : "#000000",
                            }}
                          >
                            {s.graduationProcess?.advisorApproved
                              ? "Onaylandı"
                              : s.graduationProcess?.advisorApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Department Secretary Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            !s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "bg-gray-300"
                              : s.graduationProcess?.departmentSecretaryApproved
                              ? "bg-green-500"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "bg-red-500"
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
                                !s.graduationProcess?.advisorApproved ||
                                s.graduationProcess?.advisorApproved === false
                                  ? "#6B7280"
                                  : s.graduationProcess
                                      ?.departmentSecretaryApproved
                                  ? "#059669"
                                  : s.graduationProcess
                                      ?.departmentSecretaryApproved === false
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "Danışman Onayı Gerekiyor"
                              : s.graduationProcess?.departmentSecretaryApproved
                              ? "Onaylandı"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Faculty Dean's Office Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            !s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false ||
                            !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                              ? "bg-gray-300"
                              : s.graduationProcess?.facultyDeansOfficeApproved
                              ? "bg-green-500"
                              : s.graduationProcess
                                  ?.facultyDeansOfficeApproved === false
                              ? "bg-red-500"
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
                                !s.graduationProcess?.advisorApproved ||
                                s.graduationProcess?.advisorApproved ===
                                  false ||
                                !s.graduationProcess
                                  ?.departmentSecretaryApproved ||
                                s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                                  ? "#6B7280"
                                  : s.graduationProcess
                                      ?.facultyDeansOfficeApproved
                                  ? "#059669"
                                  : s.graduationProcess
                                      ?.facultyDeansOfficeApproved === false
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "Danışman Onayı Gerekiyor"
                              : !s.graduationProcess
                                  ?.departmentSecretaryApproved ||
                                s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Bölüm Sekreterliği Onayı Gerekiyor"
                              : s.graduationProcess?.facultyDeansOfficeApproved
                              ? "Onaylandı"
                              : s.graduationProcess
                                  ?.facultyDeansOfficeApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Student Affairs Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            !s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false ||
                            !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false ||
                            !s.graduationProcess?.facultyDeansOfficeApproved ||
                            s.graduationProcess?.facultyDeansOfficeApproved ===
                              false
                              ? "bg-gray-300"
                              : s.graduationProcess?.studentAffairsApproved
                              ? "bg-green-500"
                              : s.graduationProcess?.studentAffairsApproved ===
                                false
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Öğrenci İşleri
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color:
                                !s.graduationProcess?.advisorApproved ||
                                s.graduationProcess?.advisorApproved ===
                                  false ||
                                !s.graduationProcess
                                  ?.departmentSecretaryApproved ||
                                s.graduationProcess
                                  ?.departmentSecretaryApproved === false ||
                                !s.graduationProcess
                                  ?.facultyDeansOfficeApproved ||
                                s.graduationProcess
                                  ?.facultyDeansOfficeApproved === false
                                  ? "#6B7280"
                                  : s.graduationProcess?.studentAffairsApproved
                                  ? "#059669"
                                  : s.graduationProcess
                                      ?.studentAffairsApproved === false
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "Danışman Onayı Gerekiyor"
                              : !s.graduationProcess
                                  ?.departmentSecretaryApproved ||
                                s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Bölüm Sekreterliği Onayı Gerekiyor"
                              : !s.graduationProcess
                                  ?.facultyDeansOfficeApproved ||
                                s.graduationProcess
                                  ?.facultyDeansOfficeApproved === false
                              ? "Fakülte Dekanlığı Onayı Gerekiyor"
                              : s.graduationProcess?.studentAffairsApproved
                              ? "Onaylandı"
                              : s.graduationProcess?.studentAffairsApproved ===
                                false
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
                      onClick={() => handleStudentAffairsApproval(s.id, true)}
                      disabled={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        !s.graduationProcess?.facultyDeansOfficeApproved ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false ||
                        s.graduationProcess?.studentAffairsApproved === true
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        !s.graduationProcess?.facultyDeansOfficeApproved ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : s.graduationProcess?.studentAffairsApproved === true
                          ? "bg-green-100 text-green-800 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Danışman onayı gerekiyor"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Bölüm sekreterliği onayı gerekiyor"
                          : !s.graduationProcess?.facultyDeansOfficeApproved ||
                            s.graduationProcess?.facultyDeansOfficeApproved ===
                              false
                          ? "Fakülte dekanlığı onayı gerekiyor"
                          : s.graduationProcess?.studentAffairsApproved === true
                          ? "Bu öğrenci zaten onaylanmış"
                          : "Öğrencinin mezuniyet başvurusunu onayla"
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleStudentAffairsApproval(s.id, false)}
                      disabled={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        !s.graduationProcess?.facultyDeansOfficeApproved ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false ||
                        s.graduationProcess?.studentAffairsApproved === false
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        !s.graduationProcess?.facultyDeansOfficeApproved ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : s.graduationProcess?.studentAffairsApproved ===
                            false
                          ? "bg-red-100 text-red-800 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Danışman onayı gerekiyor"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Bölüm sekreterliği onayı gerekiyor"
                          : !s.graduationProcess?.facultyDeansOfficeApproved ||
                            s.graduationProcess?.facultyDeansOfficeApproved ===
                              false
                          ? "Fakülte dekanlığı onayı gerekiyor"
                          : s.graduationProcess?.studentAffairsApproved ===
                            false
                          ? "Bu öğrenci zaten reddedilmiş"
                          : "Öğrencinin mezuniyet başvurusunu reddet"
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
        <Toaster />
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
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Onay Durumları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Advisor Approval Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationProcess?.advisorApproved
                              ? "bg-green-500"
                              : s.graduationProcess?.advisorApproved === false
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Danışman Onayı
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: s.graduationProcess?.advisorApproved
                                ? "#059669"
                                : s.graduationProcess?.advisorApproved === false
                                ? "#DC2626"
                                : "#000000",
                            }}
                          >
                            {s.graduationProcess?.advisorApproved
                              ? "Onaylandı"
                              : s.graduationProcess?.advisorApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Department Secretary Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            s.graduationProcess?.departmentSecretaryApproved
                              ? "bg-green-500"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "bg-red-500"
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
                              color: s.graduationProcess
                                ?.departmentSecretaryApproved
                                ? "#059669"
                                : s.graduationProcess
                                    ?.departmentSecretaryApproved === false
                                ? "#DC2626"
                                : "#000000",
                            }}
                          >
                            {s.graduationProcess?.departmentSecretaryApproved
                              ? "Onaylandı"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Reddedildi"
                              : "Beklemede"}
                          </div>
                        </div>
                      </div>

                      {/* Faculty Dean's Office Status */}
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            !s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false ||
                            !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                              ? "bg-gray-300"
                              : s.graduationProcess?.facultyDeansOfficeApproved
                              ? "bg-green-500"
                              : s.graduationProcess
                                  ?.facultyDeansOfficeApproved === false
                              ? "bg-red-500"
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
                                !s.graduationProcess?.advisorApproved ||
                                s.graduationProcess?.advisorApproved ===
                                  false ||
                                !s.graduationProcess
                                  ?.departmentSecretaryApproved ||
                                s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                                  ? "#6B7280"
                                  : s.graduationProcess
                                      ?.facultyDeansOfficeApproved
                                  ? "#059669"
                                  : s.graduationProcess
                                      ?.facultyDeansOfficeApproved === false
                                  ? "#DC2626"
                                  : "#000000",
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved ||
                            s.graduationProcess?.advisorApproved === false
                              ? "Danışman Onayı Gerekiyor"
                              : !s.graduationProcess
                                  ?.departmentSecretaryApproved ||
                                s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Bölüm Sekreterliği Onayı Gerekiyor"
                              : s.graduationProcess?.facultyDeansOfficeApproved
                              ? "Onaylandı"
                              : s.graduationProcess
                                  ?.facultyDeansOfficeApproved === false
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
                      onClick={() => handleFacultyDeansApproval(s.id, true)}
                      disabled={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        s.graduationProcess?.facultyDeansOfficeApproved === true
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            true
                          ? "bg-green-100 text-green-800 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Danışman onayı gerekiyor"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Bölüm sekreterliği onayı gerekiyor"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            true
                          ? "Bu öğrenci zaten onaylanmış"
                          : "Öğrencinin mezuniyet başvurusunu onayla"
                      }
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleFacultyDeansApproval(s.id, false)}
                      disabled={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            false
                          ? "bg-red-100 text-red-800 cursor-not-allowed"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Danışman onayı gerekiyor"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Bölüm sekreterliği onayı gerekiyor"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            false
                          ? "Bu öğrenci zaten reddedilmiş"
                          : "Öğrencinin mezuniyet başvurusunu reddet"
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
