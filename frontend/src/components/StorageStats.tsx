// frontend/src/components/StorageStats.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileService, StorageSavingsStats } from '../services/fileService';
import { ChartBarIcon, ArrowTrendingUpIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export const StorageStats: React.FC = () => {
    // Query for storage savings stats
    const { data: savingsStats, isLoading: savingsLoading } = useQuery<StorageSavingsStats>({
        queryKey: ['storageSavings'],
        queryFn: fileService.getStorageSavings,
    });

    // Query for file statistics
    const { data: fileStats, isLoading: statsLoading } = useQuery({
        queryKey: ['fileStats'],
        queryFn: fileService.getFileStats,
    });

    // Format bytes to readable size
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    if (savingsLoading || statsLoading) {
        return (
            <div className="p-6 bg-white shadow rounded-lg">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Storage Statistics</h2>

            {/* Main stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <ChartBarIcon className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Total Files</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary-700">{savingsStats?.total_files || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Total storage used: {formatBytes(fileStats?.total_size || 0)}
                    </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Storage Saved</h3>
                    </div>
                    <p className="text-3xl font-bold text-green-700">{savingsStats?.formatted_bytes_saved || '0 B'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Efficiency: {savingsStats?.efficiency_percentage.toFixed(2) || 0}%
                    </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                        <DocumentDuplicateIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Duplicates Found</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{savingsStats?.total_duplicate_count || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {savingsStats?.total_duplicate_count
                            ? `${((savingsStats?.total_duplicate_count / savingsStats?.total_files) * 100).toFixed(1)}% of all files`
                            : 'No duplicates found'}
                    </p>
                </div>
            </div>

            {/* File type distribution */}
            {fileStats?.file_types && Object.keys(fileStats.file_types).length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">File Type Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(fileStats.file_types).map(([type, count]) => (
                            <div key={type} className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900">{type}</h4>
                                <p className="text-xl font-semibold text-gray-700">{count as number}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Size distribution */}
            {fileStats?.size_distribution && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">File Size Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Small Files (&lt; 1MB)</h4>
                            <p className="text-xl font-semibold text-gray-700">{fileStats.size_distribution.small.count}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Medium Files (1-10MB)</h4>
                            <p className="text-xl font-semibold text-gray-700">{fileStats.size_distribution.medium.count}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">Large Files (&gt; 10MB)</h4>
                            <p className="text-xl font-semibold text-gray-700">{fileStats.size_distribution.large.count}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};