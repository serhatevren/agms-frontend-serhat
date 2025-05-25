"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { ceremonyService } from "@/services/ceremony";
import {
  Ceremony,
  CeremonyStatus,
  CreateCeremonyRequest,
  UpdateCeremonyRequest,
} from "@/types/ceremony";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
} from "lucide-react";

// Constants
const STUDENT_AFFAIRS_ID = "11111111-1111-1111-1111-111111111111"; // ID from backend seed data

export default function CeremonyPlanningPage() {
  const { user } = useAuthStore();
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formData, setFormData] = useState<CreateCeremonyRequest>({
    ceremonyDate: "",
    ceremonyLocation: "",
    ceremonyDescription: "",
    ceremonyStatus: CeremonyStatus.Pending,
    academicYear: "",
    studentAffairsId: STUDENT_AFFAIRS_ID, // Use the correct ID from backend seed data
  });

  useEffect(() => {
    fetchCeremonies();
  }, [currentPage]);

  const fetchCeremonies = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching ceremonies from API...");

      const response = await ceremonyService.getCeremonies(currentPage, 10);
      console.log("✅ Ceremonies fetched successfully:", response);

      setCeremonies(response.items);
      setTotalPages(response.pages);
    } catch (error) {
      console.error("❌ Error fetching ceremonies:", error);
      console.log("🔄 Using mock data as fallback");

      // For now, use mock data if API fails
      setCeremonies(mockCeremonies);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCeremony = async () => {
    try {
      // Use the correct StudentAffair ID that exists in the database seed data
      const studentAffairsId = STUDENT_AFFAIRS_ID;

      const ceremonyData = {
        ...formData,
        studentAffairsId: studentAffairsId,
      };

      console.log("🚀 Creating ceremony with data:", ceremonyData);

      const newCeremony = await ceremonyService.createCeremony(ceremonyData);

      console.log("✅ Ceremony created successfully:", newCeremony);
      setCeremonies([newCeremony, ...ceremonies]);
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("❌ Error creating ceremony:", error);
      console.log("🔄 Falling back to mock data");

      // Mock creation for demonstration
      const mockNewCeremony: Ceremony = {
        id: Date.now().toString(),
        ...formData,
        studentAffairsId: STUDENT_AFFAIRS_ID,
        studentUsers: [],
      };
      setCeremonies([mockNewCeremony, ...ceremonies]);
      resetForm();
      setShowModal(false);
    }
  };

  const handleUpdateCeremony = async () => {
    if (!selectedCeremony) return;

    try {
      const updatedCeremony = await ceremonyService.updateCeremony({
        id: selectedCeremony.id,
        ...formData,
      });
      setCeremonies(
        ceremonies.map((c) =>
          c.id === selectedCeremony.id ? updatedCeremony : c
        )
      );
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("Error updating ceremony:", error);
      // Mock update
      setCeremonies(
        ceremonies.map((c) =>
          c.id === selectedCeremony.id
            ? { ...selectedCeremony, ...formData }
            : c
        )
      );
      resetForm();
      setShowModal(false);
    }
  };

  const handleDeleteCeremony = async (id: string) => {
    if (!confirm("Bu mezuniyet törenini silmek istediğinizden emin misiniz?"))
      return;

    try {
      await ceremonyService.deleteCeremony(id);
      setCeremonies(ceremonies.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting ceremony:", error);
      // Mock delete
      setCeremonies(ceremonies.filter((c) => c.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      ceremonyDate: "",
      ceremonyLocation: "",
      ceremonyDescription: "",
      ceremonyStatus: CeremonyStatus.Pending,
      academicYear: "",
      studentAffairsId: STUDENT_AFFAIRS_ID,
    });
    setSelectedCeremony(null);
  };

  const openModal = (mode: "create" | "edit" | "view", ceremony?: Ceremony) => {
    setModalMode(mode);
    if (ceremony) {
      setSelectedCeremony(ceremony);
      // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
      const dateForInput = ceremony.ceremonyDate.includes("T")
        ? ceremony.ceremonyDate.slice(0, 16) // Remove seconds and timezone
        : ceremony.ceremonyDate;

      setFormData({
        ceremonyDate: dateForInput,
        ceremonyLocation: ceremony.ceremonyLocation,
        ceremonyDescription: ceremony.ceremonyDescription,
        ceremonyStatus: ceremony.ceremonyStatus,
        academicYear: ceremony.academicYear,
        studentAffairsId: ceremony.studentAffairsId,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const getStatusColor = (status: CeremonyStatus) => {
    switch (status) {
      case CeremonyStatus.Pending:
        return "bg-yellow-100 text-yellow-800";
      case CeremonyStatus.Approved:
        return "bg-green-100 text-green-800";
      case CeremonyStatus.Rejected:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: CeremonyStatus) => {
    switch (status) {
      case CeremonyStatus.Pending:
        return "Beklemede";
      case CeremonyStatus.Approved:
        return "Onaylandı";
      case CeremonyStatus.Rejected:
        return "Reddedildi";
      default:
        return "Bilinmiyor";
    }
  };

  const filteredCeremonies = ceremonies.filter((ceremony) => {
    const matchesSearch =
      ceremony.ceremonyDescription
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ceremony.ceremonyLocation
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ceremony.academicYear.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      ceremony.ceremonyStatus.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mezuniyet Töreni Planlama
              </h1>
              <p className="text-gray-600 mt-2">
                Mezuniyet törenlerini planlayın ve yönetin
              </p>
            </div>
            <button
              onClick={() => openModal("create")}
              className="bg-[#7c0a02] text-white px-4 py-2 rounded-md hover:bg-[#a50d0d] transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Yeni Tören Oluştur
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Tören ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] appearance-none text-gray-900"
              >
                <option value="all" className="text-gray-900">
                  Tüm Durumlar
                </option>
                <option value="0" className="text-gray-900">
                  Beklemede
                </option>
                <option value="1" className="text-gray-900">
                  Onaylandı
                </option>
                <option value="2" className="text-gray-900">
                  Reddedildi
                </option>
              </select>
            </div>

            <div className="text-sm text-gray-800 flex items-center font-medium">
              Toplam {filteredCeremonies.length} tören bulundu
            </div>
          </div>
        </div>

        {/* Ceremonies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCeremonies.map((ceremony) => (
            <div
              key={ceremony.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ceremony.academicYear} Mezuniyet Töreni
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        ceremony.ceremonyStatus
                      )}`}
                    >
                      {getStatusText(ceremony.ceremonyStatus)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    {new Date(ceremony.ceremonyDate).toLocaleDateString(
                      "tr-TR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    {ceremony.ceremonyLocation}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users size={16} className="mr-2" />
                    {ceremony.studentUsers.length} Mezun Öğrenci
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {ceremony.ceremonyDescription}
                </p>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => openModal("view", ceremony)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Detayları Görüntüle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => openModal("edit", ceremony)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Düzenle"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCeremony(ceremony.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCeremonies.length === 0 && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tören Bulunamadı
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Arama kriterlerinize uygun tören bulunamadı."
                : "Henüz hiç mezuniyet töreni oluşturulmamış."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={() => openModal("create")}
                className="bg-[#7c0a02] text-white px-4 py-2 rounded-md hover:bg-[#a50d0d] transition-colors"
              >
                İlk Töreninizi Oluşturun
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Önceki
              </button>
              <span className="px-3 py-1">
                Sayfa {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                }
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl mx-auto bg-white shadow-lg rounded-md">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  {modalMode === "create"
                    ? "Yeni Mezuniyet Töreni Oluştur"
                    : modalMode === "edit"
                    ? "Mezuniyet Törenini Düzenle"
                    : "Mezuniyet Töreni Detayları"}
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Akademik Yıl
                      </label>
                      <input
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            academicYear: e.target.value,
                          })
                        }
                        disabled={modalMode === "view"}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                        placeholder="2023-2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Tören Tarihi
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.ceremonyDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ceremonyDate: e.target.value,
                          })
                        }
                        disabled={modalMode === "view"}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] disabled:bg-gray-100 text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Tören Yeri
                    </label>
                    <input
                      type="text"
                      value={formData.ceremonyLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ceremonyLocation: e.target.value,
                        })
                      }
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                      placeholder="Konferans Salonu, Ana Kampüs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Tören Açıklaması
                    </label>
                    <textarea
                      value={formData.ceremonyDescription}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ceremonyDescription: e.target.value,
                        })
                      }
                      disabled={modalMode === "view"}
                      rows={4}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                      placeholder="Tören detayları ve özel notlar..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Durum
                    </label>
                    <select
                      value={formData.ceremonyStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ceremonyStatus: parseInt(
                            e.target.value
                          ) as CeremonyStatus,
                        })
                      }
                      disabled={modalMode === "view"}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7c0a02] focus:border-[#7c0a02] disabled:bg-gray-100 text-gray-900"
                    >
                      <option value={CeremonyStatus.Pending}>Beklemede</option>
                      <option value={CeremonyStatus.Approved}>Onaylandı</option>
                      <option value={CeremonyStatus.Rejected}>
                        Reddedildi
                      </option>
                    </select>
                  </div>

                  {modalMode === "view" && selectedCeremony && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Mezun Öğrenciler ({selectedCeremony.studentUsers.length}
                        )
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50">
                        {selectedCeremony.studentUsers.length > 0 ? (
                          selectedCeremony.studentUsers.map((student) => (
                            <div
                              key={student.id}
                              className="text-sm text-gray-800 py-1 font-medium"
                            >
                              {student.name} {student.surname} ({student.email})
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600">
                            Bu törene henüz öğrenci atanmamış
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    {modalMode === "view" ? "Kapat" : "İptal"}
                  </button>
                  {modalMode !== "view" && (
                    <button
                      onClick={
                        modalMode === "create"
                          ? handleCreateCeremony
                          : handleUpdateCeremony
                      }
                      disabled={
                        !formData.ceremonyDate ||
                        !formData.ceremonyLocation ||
                        !formData.ceremonyDescription ||
                        !formData.academicYear
                      }
                      className="px-4 py-2 text-sm font-semibold text-white bg-[#7c0a02] rounded-md hover:bg-[#a50d0d] disabled:opacity-50 transition-colors"
                    >
                      {modalMode === "create" ? "Oluştur" : "Güncelle"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

// Mock data for development/fallback
const mockCeremonies: Ceremony[] = [
  {
    id: "1",
    ceremonyDate: "2024-06-15T14:00:00",
    ceremonyLocation: "Ana Kampüs Konferans Salonu",
    ceremonyDescription:
      "2023-2024 akademik yılı mezuniyet töreni. Bilgisayar Mühendisliği, Makine Mühendisliği ve İnşaat Mühendisliği bölümlerinin mezuniyet töreni.",
    ceremonyStatus: CeremonyStatus.Approved,
    academicYear: "2023-2024",
    studentAffairsId: STUDENT_AFFAIRS_ID,
    studentUsers: [
      {
        id: "s1",
        name: "Ahmet",
        surname: "Yılmaz",
        email: "ahmet@example.com",
      },
      { id: "s2", name: "Ayşe", surname: "Kaya", email: "ayse@example.com" },
      {
        id: "s3",
        name: "Mehmet",
        surname: "Özkan",
        email: "mehmet@example.com",
      },
    ],
  },
  {
    id: "2",
    ceremonyDate: "2024-07-20T16:00:00",
    ceremonyLocation: "Açık Hava Amfitiyatrosu",
    ceremonyDescription:
      "Yaz okulu mezuniyet töreni. Az sayıda öğrenci için düzenlenen özel tören.",
    ceremonyStatus: CeremonyStatus.Pending,
    academicYear: "2023-2024",
    studentAffairsId: STUDENT_AFFAIRS_ID,
    studentUsers: [
      { id: "s4", name: "Fatma", surname: "Demir", email: "fatma@example.com" },
    ],
  },
  {
    id: "3",
    ceremonyDate: "2024-12-15T10:00:00",
    ceremonyLocation: "Merkez Kampüs Aula",
    ceremonyDescription: "2024-2025 akademik yılı güz dönemi mezuniyet töreni.",
    ceremonyStatus: CeremonyStatus.Pending,
    academicYear: "2024-2025",
    studentAffairsId: STUDENT_AFFAIRS_ID,
    studentUsers: [],
  },
];
