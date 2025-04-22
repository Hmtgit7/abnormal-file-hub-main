// frontend/src/components/FileSearch.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileService } from '../services/fileService';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileSearchProps {
    onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
    query: string;
    fileType: string;
    sizeRange: {
        min: number | null;
        max: number | null;
    };
    dateRange: {
        start: string | null;
        end: string | null;
    };
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export const FileSearch: React.FC<FileSearchProps> = ({ onSearch }) => {
    // Get file types for filtering
    const { data: fileTypes } = useQuery({
        queryKey: ['fileTypes'],
        queryFn: fileService.getFileTypes,
    });

    // Default filters
    const defaultFilters: SearchFilters = {
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
    };

    // State for filters
    const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
    const [showFilters, setShowFilters] = useState(false);

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            query: e.target.value,
        });
    };

    // Handle filter changes
    const handleFilterChange = (filter: string, value: any) => {
        if (filter.includes('.')) {
            // Handle nested filters (e.g., sizeRange.min)
            const [parent, child] = filter.split('.');

            // Type-safe approach handling each nested field specifically
            if (parent === 'sizeRange') {
                setFilters({
                    ...filters,
                    sizeRange: {
                        ...filters.sizeRange,
                        [child]: value,
                    },
                });
            } else if (parent === 'dateRange') {
                setFilters({
                    ...filters,
                    dateRange: {
                        ...filters.dateRange,
                        [child]: value,
                    },
                });
            }
        } else {
            // Handle top-level filters
            setFilters({
                ...filters,
                [filter]: value,
            });
        }
    };

    // Reset filters to default
    const resetFilters = () => {
        setFilters(defaultFilters);
    };

    // Submit search with current filters
    const submitSearch = () => {
        onSearch(filters);
    };

    // Update search when filters change
    useEffect(() => {
        // Debounce search for better performance
        const timer = setTimeout(() => {
            submitSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [filters]);

    return (
        <div className="p-4 bg-white shadow rounded-lg">
            <div className="flex items-center space-x-2">
                {/* Search input */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={filters.query}
                        onChange={handleSearchChange}
                        placeholder="Search files by name..."
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {filters.query && (
                        <button
                            onClick={() => handleFilterChange('query', '')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Toggle filter button */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${showFilters
                        ? 'text-white bg-primary-600 hover:bg-primary-700'
                        : 'text-primary-700 bg-primary-100 hover:bg-primary-200'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    Filters
                </button>
            </div>

            {/* Advanced filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* File type filter */}
                        <div>
                            <label htmlFor="file-type" className="block text-sm font-medium text-gray-700">
                                File Type
                            </label>
                            <select
                                id="file-type"
                                value={filters.fileType}
                                onChange={(e) => handleFilterChange('fileType', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="all">All Types</option>
                                {fileTypes?.map((type) => (
                                    <option key={type.type} value={type.type}>
                                        {type.type.charAt(0).toUpperCase() + type.type.slice(1)} ({type.count})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Size range filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">File Size</label>
                            <div className="mt-1 flex space-x-2">
                                <input
                                    type="number"
                                    placeholder="Min (KB)"
                                    value={filters.sizeRange.min !== null ? filters.sizeRange.min / 1024 : ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'sizeRange.min',
                                            e.target.value ? parseFloat(e.target.value) * 1024 : null
                                        )
                                    }
                                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                />
                                <span className="text-gray-500 flex items-center">to</span>
                                <input
                                    type="number"
                                    placeholder="Max (KB)"
                                    value={filters.sizeRange.max !== null ? filters.sizeRange.max / 1024 : ''}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'sizeRange.max',
                                            e.target.value ? parseFloat(e.target.value) * 1024 : null
                                        )
                                    }
                                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                />
                            </div>
                        </div>

                        {/* Date range filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Upload Date</label>
                            <div className="mt-1 flex space-x-2">
                                <input
                                    type="date"
                                    value={filters.dateRange.start || ''}
                                    onChange={(e) => handleFilterChange('dateRange.start', e.target.value || null)}
                                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                />
                                <span className="text-gray-500 flex items-center">to</span>
                                <input
                                    type="date"
                                    value={filters.dateRange.end || ''}
                                    onChange={(e) => handleFilterChange('dateRange.end', e.target.value || null)}
                                    className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort options */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700">
                                Sort By
                            </label>
                            <select
                                id="sort-by"
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="uploaded_at">Upload Date</option>
                                <option value="original_filename">File Name</option>
                                <option value="size">File Size</option>
                                <option value="file_type">File Type</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700">
                                Sort Order
                            </label>
                            <select
                                id="sort-order"
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter actions */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={resetFilters}
                            className="mr-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Reset Filters
                        </button>
                        <button
                            onClick={submitSearch}
                            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Active filters display */}
            {(filters.query ||
                filters.fileType !== 'all' ||
                filters.sizeRange.min !== null ||
                filters.sizeRange.max !== null ||
                filters.dateRange.start !== null ||
                filters.dateRange.end !== null) && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">Active filters:</span>

                        {filters.query && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Search: {filters.query}
                                <button
                                    onClick={() => handleFilterChange('query', '')}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {filters.fileType !== 'all' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Type: {filters.fileType}
                                <button
                                    onClick={() => handleFilterChange('fileType', 'all')}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {filters.sizeRange.min !== null && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Min Size: {(filters.sizeRange.min / 1024).toFixed(0)} KB
                                <button
                                    onClick={() => handleFilterChange('sizeRange.min', null)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {filters.sizeRange.max !== null && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Max Size: {(filters.sizeRange.max / 1024).toFixed(0)} KB
                                <button
                                    onClick={() => handleFilterChange('sizeRange.max', null)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {filters.dateRange.start !== null && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                From: {filters.dateRange.start}
                                <button
                                    onClick={() => handleFilterChange('dateRange.start', null)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {filters.dateRange.end !== null && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                To: {filters.dateRange.end}
                                <button
                                    onClick={() => handleFilterChange('dateRange.end', null)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        <button
                            onClick={resetFilters}
                            className="text-xs text-primary-600 hover:text-primary-800"
                        >
                            Clear all
                        </button>
                    </div>
                )}
        </div>
    );
};