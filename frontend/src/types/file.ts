// frontend/src/types/file.ts

export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;

  // New fields for deduplication
  is_duplicate: boolean;
  file_hash: string;
  reference_file_id?: string;
}