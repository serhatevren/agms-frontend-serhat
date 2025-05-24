"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { axiosInstance } from "@/lib/axios";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

interface TranscriptData {
  id: string;
  studentIdentityNumber: string;
  transcriptFileName: string;
  transcriptGpa: number;
  transcriptDate: string;
  transcriptDescription: string;
  departmentGraduationRank: string;
  facultyGraduationRank: string;
  universityGraduationRank: string;
  graduationYear: string;
  totalTakenCredit: number;
  totalRequiredCredit: number;
  completedCredit: number;
  remainingCredit: number;
  requiredCourseCount: number;
  completedCourseCount: number;
  fileAttachment?: {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
}

export default function GraduationStatusPage() {
  const { user } = useAuthStore();
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchTranscriptData();
  }, []);

  const fetchTranscriptData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Current user:", user);
      console.log("User ID:", user?.id);

      const response = await axiosInstance.get(
        `/transcripts?PageIndex=0&PageSize=100`
      );

      console.log("Transcripts API response:", response.data);

      const transcripts = response.data.items || [];
      console.log("All transcripts:", transcripts);

      const myTranscript = transcripts.find((t: any) => {
        console.log(
          `Comparing transcript studentId: ${t.studentId} with user id: ${user?.id}`
        );
        return t.studentId === user?.id;
      });

      console.log("Found my transcript:", myTranscript);

      if (myTranscript) {
        setTranscriptData(myTranscript);
      } else {
        console.log("No transcript found for current user");
        setError("Henüz bir transcript bulunamadı.");
      }
    } catch (error: any) {
      console.error("Error fetching transcript data:", error);
      console.error("Error response:", error.response?.data);
      setError(
        "Transcript bilgileri yüklenirken bir hata oluştu: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Lütfen sadece PDF dosyası seçin.");
    }
  };

  const handleUpload = () => {
    alert("Yükleme özelliği henüz aktif değil.");
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
          <h1 className="text-2xl font-bold text-gray-900">Mezuniyet Durumu</h1>
          <p className="text-gray-600 mt-2">
            Akademik bilgileriniz ve transcript durumunuz
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!loading && !transcriptData && !error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-yellow-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-medium">
                  Transcript Henüz Oluşturulmamış
                </h3>
                <p className="text-yellow-700 mt-1">
                  Akademik transcript'iniz henüz sistem tarafından
                  oluşturulmamıştır. Lütfen akademik danışmanınız veya öğrenci
                  işleri ile iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Academic Overview */}
        {transcriptData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">GPA</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {transcriptData?.transcriptGpa?.toFixed(2) || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tamamlanan Kredi
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {transcriptData?.completedCredit || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Kalan Kredi
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {transcriptData?.remainingCredit || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tamamlanan Ders
                  </h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {transcriptData?.completedCourseCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {transcriptData && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Mezuniyet İlerlemesi
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Kredi İlerlemesi</span>
                  <span>
                    {transcriptData?.completedCredit || 0} /{" "}
                    {transcriptData?.totalRequiredCredit || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        transcriptData?.totalRequiredCredit
                          ? (transcriptData.completedCredit /
                              transcriptData.totalRequiredCredit) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Ders İlerlemesi</span>
                  <span>
                    {transcriptData?.completedCourseCount || 0} /{" "}
                    {transcriptData?.requiredCourseCount || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        transcriptData?.requiredCourseCount
                          ? (transcriptData.completedCourseCount /
                              transcriptData.requiredCourseCount) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transcript Information */}
        {transcriptData && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Transcript Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mezuniyet Yılı
                </label>
                <p className="text-gray-900">
                  {transcriptData.graduationYear || "Henüz mezun olmadı"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bölüm Sıralaması
                </label>
                <p className="text-gray-900">
                  {transcriptData.departmentGraduationRank || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fakülte Sıralaması
                </label>
                <p className="text-gray-900">
                  {transcriptData.facultyGraduationRank || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Üniversite Sıralaması
                </label>
                <p className="text-gray-900">
                  {transcriptData.universityGraduationRank || "N/A"}
                </p>
              </div>

              {transcriptData.transcriptDescription && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <p className="text-gray-900">
                    {transcriptData.transcriptDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcript Upload */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Transcript Yükleme
          </h2>

          {transcriptData?.fileAttachment && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-green-800 font-medium">
                  Mevcut Dosya: {transcriptData.fileAttachment.fileName}
                </span>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {selectedFile
                      ? selectedFile.name
                      : "Transcript PDF dosyasını seçin"}
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Sadece PDF dosyaları kabul edilir (Maksimum 10MB)
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#7c0a02] hover:bg-[#a50d0d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c0a02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Yükle (Henüz Aktif Değil)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
