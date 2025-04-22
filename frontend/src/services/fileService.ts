// frontend/src/services/fileService.ts
import axios from 'axios';
import { File as FileType } from '../types/file';
import { SearchFilters } from '../components/FileSearch';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export interface FileTypeInfo {
  type: string;
  count: number;
}

export interface SearchResponse {
  results: FileType[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface StorageSavingsStats {
  total_bytes_saved: number;
  total_duplicate_count: number;
  total_files: number;
  efficiency_percentage: number;
  formatted_bytes_saved: string;
}

export const fileService = {
  async uploadFile(file: File): Promise<FileType> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getFiles(): Promise<FileType[]> {
    const response = await axios.get(`${API_URL}/files/`);
    return response.data;
  },

  async searchFiles(filters: SearchFilters, page: number = 1, pageSize: number = 10): Promise<SearchResponse> {
    // Construct query parameters
    const params = new URLSearchParams();

    if (filters.query) params.append('query', filters.query);
    if (filters.fileType !== 'all') params.append('file_type', filters.fileType);

    if (filters.sizeRange.min !== null) params.append('min_size', filters.sizeRange.min.toString());
    if (filters.sizeRange.max !== null) params.append('max_size', filters.sizeRange.max.toString());

    if (filters.dateRange.start) params.append('start_date', filters.dateRange.start);
    if (filters.dateRange.end) params.append('end_date', filters.dateRange.end);

    params.append('sort_by', filters.sortBy);
    params.append('sort_order', filters.sortOrder);
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    const response = await axios.get(`${API_URL}/files/search/?${params.toString()}`);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  },

  async getFileTypes(): Promise<FileTypeInfo[]> {
    const response = await axios.get(`${API_URL}/files/file_types/`);
    return response.data;
  },

  async getStorageSavings(): Promise<StorageSavingsStats> {
    const response = await axios.get(`${API_URL}/files/storage_savings/`);
    return response.data;
  },

  async getFileStats(): Promise<any> {
    const response = await axios.get(`${API_URL}/files/stats/`);
    return response.data;
  }
};