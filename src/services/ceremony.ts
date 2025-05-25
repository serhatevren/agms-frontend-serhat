import { axiosInstance } from "@/lib/axios";
import type {
  Ceremony,
  CreateCeremonyRequest,
  UpdateCeremonyRequest,
  CeremonyListResponse,
} from "@/types/ceremony";

class CeremonyService {
  async getCeremonies(
    pageIndex: number = 0,
    pageSize: number = 10
  ): Promise<CeremonyListResponse> {
    const response = await axiosInstance.get<CeremonyListResponse>(
      `/ceremonies?PageIndex=${pageIndex}&PageSize=${pageSize}`
    );
    return response.data;
  }

  async getCeremonyById(id: string): Promise<Ceremony> {
    const response = await axiosInstance.get<Ceremony>(`/ceremonies/${id}`);
    return response.data;
  }

  async createCeremony(ceremony: CreateCeremonyRequest): Promise<Ceremony> {
    console.log("🔄 Preparing ceremony data for backend:", ceremony);

    // Convert date string to proper ISO format for backend
    const ceremonyData = {
      ...ceremony,
      ceremonyDate: new Date(ceremony.ceremonyDate).toISOString(),
    };

    console.log("📤 Sending to backend:", ceremonyData);

    const response = await axiosInstance.post<Ceremony>(
      "/ceremonies",
      ceremonyData
    );
    return response.data;
  }

  async updateCeremony(ceremony: UpdateCeremonyRequest): Promise<Ceremony> {
    const response = await axiosInstance.put<Ceremony>("/ceremonies", ceremony);
    return response.data;
  }

  async deleteCeremony(id: string): Promise<void> {
    await axiosInstance.delete(`/ceremonies/${id}`);
  }
}

export const ceremonyService = new CeremonyService();
