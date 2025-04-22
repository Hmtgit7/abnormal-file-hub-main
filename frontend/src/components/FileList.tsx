// frontend/src/components/FileList.tsx
import React, { useState } from 'react';
import { fileService, SearchResponse } from '../services/fileService';
import { File as FileType } from '../types/file';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSearch, SearchFilters } from './FileSearch';

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    fileType: 'all',
    sizeRange: {
      min: null,
      max: null,
    },
    dateRange: {
      start: null,
      end: null,
    },
    sortBy: 'uploaded_at',
    sortOrder: 'desc',
  });

  // Query for fetching files with search and filters
  const {
    data: searchResponse,
    isLoading,
    error
  } = useQuery<SearchResponse>({
    queryKey: ['files', 'search', searchFilters, currentPage, pageSize],
    queryFn: () => fileService.searchFiles(searchFilters, currentPage, pageSize),
  });

  // Query for storage savings stats
  const { data: savingsStats } = useQuery({
    queryKey: ['storageSavings'],
    queryFn: fileService.getStorageSavings,
  });

  // Mutation for deleting files
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storageSavings'] });
    },
  });

  // Mutation for downloading files
  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // frontend/src/components/FileList.tsx (continued)
  // Format bytes to readable size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Failed to load files. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filter component */}
      <FileSearch onSearch={handleSearch} />

      {/* Storage savings stats */}
      {savingsStats && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Storage Efficiency</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Duplicates Found</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{savingsStats.total_duplicate_count}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Storage Saved</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{savingsStats.formatted_bytes_saved}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Efficiency</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{savingsStats.efficiency_percentage}%</p>
            </div>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Files</h2>

          {!searchResponse?.results || searchResponse.results.length === 0 ? (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchFilters.query || searchFilters.fileType !== 'all' ||
                  searchFilters.sizeRange.min !== null || searchFilters.sizeRange.max !== null ||
                  searchFilters.dateRange.start !== null || searchFilters.dateRange.end !== null
                  ? 'Try adjusting your search or filters'
                  : 'Get started by uploading a file'}
              </p>
            </div>
          ) : (
            <div className="mt-6 flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {searchResponse.results.map((file) => (
                  <li key={file.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {file.is_duplicate ? (
                          <DocumentDuplicateIcon className="h-8 w-8 text-primary-400" />
                        ) : (
                          <DocumentIcon className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.original_filename}
                          {file.is_duplicate && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Duplicate
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {file.file_type} • {formatBytes(file.size)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(file.uploaded_at).toLocaleString()}
                        </p>
                        {file.file_hash && (
                          <p className="text-xs text-gray-400 mt-1">
                            Hash: {file.file_hash.substring(0, 10)}...
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownload(file.file, file.original_filename)}
                          disabled={downloadMutation.isPending}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {searchResponse.pagination && searchResponse.pagination.total_pages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, searchResponse.pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{searchResponse.pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!searchResponse.pagination.has_previous}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${!searchResponse.pagination.has_previous ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: searchResponse.pagination.total_pages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${page === currentPage
                                ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                              }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!searchResponse.pagination.has_next}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${!searchResponse.pagination.has_next ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};