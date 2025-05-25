"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { axiosInstance } from "@/lib/axios";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

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

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type: 'approve' | 'reject';
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className={`w-6 h-6 ${type === 'approve' ? 'text-green-600' : 'text-red-600'}`} />
          <h3 className={`text-xl font-bold ${type === 'approve' ? 'text-green-700' : 'text-red-700'}`}>
            {title}
          </h3>
        </div>
        <p className="text-gray-900 text-base font-medium mb-8">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
              type === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } shadow-sm hover:shadow-md transition-all`}
          >
            {type === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GraduationApprovalPage() {
  const { user } = useAuthStore();
  const [processes, setProcesses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const step = getApprovalStep(user);
  const router = useRouter();
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'approve' | 'reject';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'approve',
    onConfirm: () => {},
  });

  // Toast bildirimi göster
  const showToast = (message: string, type: "success" | "error" = "error") => {
    const toastConfig = {
      duration: type === 'error' ? 1500 : 1500,
      position: 'top-right' as const,
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

  // Onaylama işlemi için wrapper fonksiyon
  const handleApproveConfirmation = (studentId: string, studentName: string, handler: (id: string, isApproved: boolean) => void) => {
    setModalConfig({
      isOpen: true,
      title: 'Approval Process',
      message: `Are you sure you want to approve the graduation application of ${studentName}?`,
      type: 'approve',
      onConfirm: () => handler(studentId, true),
    });
  };

  // Reddetme işlemi için wrapper fonksiyon
  const handleRejectConfirmation = (studentId: string, studentName: string, handler: (id: string, isApproved: boolean) => void) => {
    setModalConfig({
      isOpen: true,
      title: 'Rejection Process',
      message: `Are you sure you want to reject the graduation application of ${studentName}?`,
      type: 'reject',
      onConfirm: () => handler(studentId, false),
    });
  };

  if (!step)
    return (
      <AuthenticatedLayout>
        <div className="p-8">This page is not accessible.</div>
      </AuthenticatedLayout>
    );
  if (loading)
    return (
      <AuthenticatedLayout>
        <div className="p-8">Loading...</div>
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
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
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
                      Department: <span className="text-gray-800">{s.departmentName || "-"}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Student No: <span className="text-gray-800">{s.studentNumber || "-"}</span>
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
                          ? "Approved"
                          : s.graduationProcess?.advisorApproved === false
                          ? "Rejected"
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex gap-3">
                    <button
                      onClick={() => handleApproveConfirmation(s.id, `${s.name} ${s.surname}`, handleApproval)}
                      disabled={s.graduationProcess?.advisorApproved === true}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                        s.graduationProcess?.advisorApproved === true
                          ? "bg-green-100 text-green-800 cursor-not-allowed opacity-60"
                          : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      title={
                        s.graduationProcess?.advisorApproved === true
                          ? "This student is already approved"
                          : "Approve student's graduation application"
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectConfirmation(s.id, `${s.name} ${s.surname}`, handleApproval)}
                      disabled={s.graduationProcess?.advisorApproved === false}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                        s.graduationProcess?.advisorApproved === false
                          ? "bg-red-100 text-red-800 cursor-not-allowed opacity-60"
                          : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      title={
                        s.graduationProcess?.advisorApproved === false
                          ? "This student is already rejected"
                          : "Reject student's graduation application"
                      }
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
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
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
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
                        Department: <span className="text-gray-800">{s.departmentName || "-"}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Student No: <span className="text-gray-800">{s.studentNumber || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Approval Status
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
                            Advisor Approval
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: s.graduationProcess?.advisorApproved
                                ? "#059669"
                                : s.graduationProcess?.advisorApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {s.graduationProcess?.advisorApproved
                              ? "Approved"
                              : s.graduationProcess?.advisorApproved === false
                              ? "Rejected"
                              : "Pending"}
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
                            Department Secretary
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: !s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                                ? "#6B7280"
                                : s.graduationProcess?.departmentSecretaryApproved
                                ? "#059669"
                                : s.graduationProcess?.departmentSecretaryApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                              ? "Advisor Approval Required"
                              : s.graduationProcess?.departmentSecretaryApproved
                              ? "Approved"
                              : s.graduationProcess?.departmentSecretaryApproved === false
                              ? "Rejected"
                              : "Pending"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Approval Buttons */}
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => handleApproveConfirmation(s.id, `${s.name} ${s.surname}`, handleDepartmentSecretaryApproval)}
                        disabled={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false ||
                          s.graduationProcess?.departmentSecretaryApproved ===
                            true
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === true
                            ? "bg-green-100 text-green-800 cursor-not-allowed opacity-60"
                            : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5"
                        }`}
                        title={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "Advisor Approval Required"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === true
                            ? "This student is already approved"
                            : "Approve student's graduation application"
                        }
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectConfirmation(s.id, `${s.name} ${s.surname}`, handleDepartmentSecretaryApproval)}
                        disabled={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false ||
                          s.graduationProcess?.departmentSecretaryApproved ===
                            false
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === false
                            ? "bg-red-100 text-red-800 cursor-not-allowed opacity-60"
                            : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5"
                        }`}
                        title={
                          !s.graduationProcess?.advisorApproved ||
                          s.graduationProcess?.advisorApproved === false
                            ? "Advisor Approval Required"
                            : s.graduationProcess
                                ?.departmentSecretaryApproved === false
                            ? "This student is already rejected"
                            : "Reject student's graduation application"
                        }
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
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
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
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
                        Department: <span className="text-gray-800">{s.departmentName || "-"}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Student No: <span className="text-gray-800">{s.studentNumber || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Approval Status
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
                            Advisor Approval
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: s.graduationProcess?.advisorApproved
                                ? "#059669"
                                : s.graduationProcess?.advisorApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {s.graduationProcess?.advisorApproved
                              ? "Approved"
                              : s.graduationProcess?.advisorApproved === false
                              ? "Rejected"
                              : "Pending"}
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
                            Department Secretary
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: !s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                                ? "#6B7280"
                                : s.graduationProcess?.departmentSecretaryApproved
                                ? "#059669"
                                : s.graduationProcess?.departmentSecretaryApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                              ? "Advisor Approval Required"
                              : s.graduationProcess?.departmentSecretaryApproved
                              ? "Approved"
                              : s.graduationProcess?.departmentSecretaryApproved === false
                              ? "Rejected"
                              : "Pending"}
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
                            Faculty Dean's Office
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: !s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false ||
                                    !s.graduationProcess?.departmentSecretaryApproved || s.graduationProcess?.departmentSecretaryApproved === false
                                ? "#6B7280"
                                : s.graduationProcess?.facultyDeansOfficeApproved
                                ? "#059669"
                                : s.graduationProcess?.facultyDeansOfficeApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                              ? "Advisor Approval Required"
                              : !s.graduationProcess?.departmentSecretaryApproved || s.graduationProcess?.departmentSecretaryApproved === false
                              ? "Department Secretary Approval Required"
                              : s.graduationProcess?.facultyDeansOfficeApproved
                              ? "Approved"
                              : s.graduationProcess?.facultyDeansOfficeApproved === false
                              ? "Rejected"
                              : "Pending"}
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
                            Student Affairs
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: !s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false ||
                                    !s.graduationProcess?.departmentSecretaryApproved || s.graduationProcess?.departmentSecretaryApproved === false ||
                                    !s.graduationProcess?.facultyDeansOfficeApproved || s.graduationProcess?.facultyDeansOfficeApproved === false
                                ? "#6B7280"
                                : s.graduationProcess?.studentAffairsApproved
                                ? "#059669"
                                : s.graduationProcess?.studentAffairsApproved ===
                                  false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                              ? "Advisor Approval Required"
                              : !s.graduationProcess?.departmentSecretaryApproved || s.graduationProcess?.departmentSecretaryApproved === false
                              ? "Department Secretary Approval Required"
                              : !s.graduationProcess?.facultyDeansOfficeApproved || s.graduationProcess?.facultyDeansOfficeApproved === false
                              ? "Faculty Dean's Office Approval Required"
                              : s.graduationProcess?.studentAffairsApproved
                              ? "Approved"
                              : s.graduationProcess?.studentAffairsApproved ===
                                false
                              ? "Rejected"
                              : "Pending"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Buttons */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleApproveConfirmation(s.id, `${s.name} ${s.surname}`, handleStudentAffairsApproval)}
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        !s.graduationProcess?.facultyDeansOfficeApproved ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                          : s.graduationProcess?.studentAffairsApproved === true
                          ? "bg-green-100 text-green-800 cursor-not-allowed opacity-60"
                          : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Advisor Approval Required"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Department Secretary Approval Required"
                          : !s.graduationProcess?.facultyDeansOfficeApproved ||
                            s.graduationProcess?.facultyDeansOfficeApproved ===
                              false
                          ? "Faculty Dean's Office Approval Required"
                          : s.graduationProcess?.studentAffairsApproved === true
                          ? "This student is already approved"
                          : "Approve student's graduation application"
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectConfirmation(s.id, `${s.name} ${s.surname}`, handleStudentAffairsApproval)}
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        !s.graduationProcess?.facultyDeansOfficeApproved ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                          : s.graduationProcess?.studentAffairsApproved ===
                            false
                          ? "bg-red-100 text-red-800 cursor-not-allowed opacity-60"
                          : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Advisor Approval Required"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Department Secretary Approval Required"
                          : !s.graduationProcess?.facultyDeansOfficeApproved ||
                            s.graduationProcess?.facultyDeansOfficeApproved ===
                              false
                          ? "Faculty Dean's Office Approval Required"
                          : s.graduationProcess?.studentAffairsApproved ===
                            false
                          ? "This student is already rejected"
                          : "Reject student's graduation application"
                      }
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
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
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
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
                        Department: <span className="text-gray-800">{s.departmentName || "-"}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Student No: <span className="text-gray-800">{s.studentNumber || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Approval Status Section */}
                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Approval Status
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
                            Advisor Approval
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: s.graduationProcess?.advisorApproved
                                ? "#059669"
                                : s.graduationProcess?.advisorApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {s.graduationProcess?.advisorApproved
                              ? "Approved"
                              : s.graduationProcess?.advisorApproved === false
                              ? "Rejected"
                              : "Pending"}
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
                            Department Secretary
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
                                : "#000000"
                            }}
                          >
                            {s.graduationProcess?.departmentSecretaryApproved
                              ? "Approved"
                              : s.graduationProcess
                                  ?.departmentSecretaryApproved === false
                              ? "Rejected"
                              : "Pending"}
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
                            Faculty Dean's Office
                          </div>
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: !s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false ||
                                    !s.graduationProcess?.departmentSecretaryApproved || s.graduationProcess?.departmentSecretaryApproved === false
                                ? "#6B7280"
                                : s.graduationProcess?.facultyDeansOfficeApproved
                                ? "#059669"
                                : s.graduationProcess?.facultyDeansOfficeApproved === false
                                ? "#DC2626"
                                : "#000000"
                            }}
                          >
                            {!s.graduationProcess?.advisorApproved || s.graduationProcess?.advisorApproved === false
                              ? "Advisor Approval Required"
                              : !s.graduationProcess?.departmentSecretaryApproved || s.graduationProcess?.departmentSecretaryApproved === false
                              ? "Department Secretary Approval Required"
                              : s.graduationProcess?.facultyDeansOfficeApproved
                              ? "Approved"
                              : s.graduationProcess?.facultyDeansOfficeApproved === false
                              ? "Rejected"
                              : "Pending"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Buttons */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => handleApproveConfirmation(s.id, `${s.name} ${s.surname}`, handleFacultyDeansApproval)}
                      disabled={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        s.graduationProcess?.facultyDeansOfficeApproved === true
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            true
                          ? "bg-green-100 text-green-800 cursor-not-allowed opacity-60"
                          : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Advisor Approval Required"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Department Secretary Approval Required"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            true
                          ? "This student is already approved"
                          : "Approve student's graduation application"
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectConfirmation(s.id, `${s.name} ${s.surname}`, handleFacultyDeansApproval)}
                      disabled={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false ||
                        s.graduationProcess?.facultyDeansOfficeApproved ===
                          false
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false ||
                        !s.graduationProcess?.departmentSecretaryApproved ||
                        s.graduationProcess?.departmentSecretaryApproved ===
                          false
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            false
                          ? "bg-red-100 text-red-800 cursor-not-allowed opacity-60"
                          : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      title={
                        !s.graduationProcess?.advisorApproved ||
                        s.graduationProcess?.advisorApproved === false
                          ? "Advisor Approval Required"
                          : !s.graduationProcess?.departmentSecretaryApproved ||
                            s.graduationProcess?.departmentSecretaryApproved ===
                              false
                          ? "Department Secretary Approval Required"
                          : s.graduationProcess?.facultyDeansOfficeApproved ===
                            false
                          ? "This student is already rejected"
                          : "Reject student's graduation application"
                      }
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
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
