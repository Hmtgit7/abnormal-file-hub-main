# backend/files/views.py
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import File, StorageSaving, calculate_file_hash
from .serializers import FileSerializer, StorageSavingSerializer, StorageSavingSummarySerializer
from django.utils import timezone
import os

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    
    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate file hash
        file_content = file_obj.read()
        file_hash = calculate_file_hash(file_content)
        file_obj.seek(0)  # Reset file pointer
        
        print(f"File hash calculated: {file_hash}")  # Debug print
        
        # Check if this file already exists (by hash)
        existing_file = File.objects.filter(file_hash=file_hash, is_duplicate=False).first()
        
        if existing_file:
            print(f"Found existing file with hash: {file_hash}")  # Debug print
            
            # Create new file record that points to the existing file
            duplicate_file = File(
                original_filename=file_obj.name,
                file_type=file_obj.content_type,
                size=file_obj.size,
                file_hash=file_hash,  # Ensure hash is set
                is_duplicate=True,
                reference_file=existing_file,
                file=existing_file.file  # Use the same file as the original
            )
            duplicate_file.save()
            
            # Record storage savings
            StorageSaving.add_saving(file_obj.size)
            
            # Serialize and return
            serializer = self.get_serializer(duplicate_file)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            print(f"No existing file found with hash: {file_hash}")  # Debug print
            
            # New unique file - directly create the model instance
            new_file = File(
                file=file_obj,
                original_filename=file_obj.name,
                file_type=file_obj.content_type,
                size=file_obj.size,
                file_hash=file_hash,  # Ensure hash is set
                is_duplicate=False
            )
            new_file.save()
            
            # Serialize and return
            serializer = self.get_serializer(new_file)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search and filter files based on query parameters
        
        Query parameters:
        - query: Search in filename
        - file_type: Filter by file type
        - min_size: Minimum file size in bytes
        - max_size: Maximum file size in bytes
        - start_date: Start date for upload date range (YYYY-MM-DD)
        - end_date: End date for upload date range (YYYY-MM-DD)
        - sort_by: Field to sort by (default: uploaded_at)
        - sort_order: asc or desc (default: desc)
        - page: Page number for pagination
        - page_size: Number of items per page
        """
        # Start with all files
        queryset = self.get_queryset()
        
        # Apply filename search
        query = request.query_params.get('query')
        if query:
            queryset = queryset.filter(original_filename__icontains=query)
        
        # Apply file type filter
        file_type = request.query_params.get('file_type')
        if file_type and file_type != 'all':
            queryset = queryset.filter(file_type__startswith=file_type)
        
        # Apply size filters
        min_size = request.query_params.get('min_size')
        if min_size and min_size.isdigit():
            queryset = queryset.filter(size__gte=int(min_size))
            
        max_size = request.query_params.get('max_size')
        if max_size and max_size.isdigit():
            queryset = queryset.filter(size__lte=int(max_size))
        
        # Apply date filters
        start_date = request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(uploaded_at__date__gte=start_date)
            
        end_date = request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(uploaded_at__date__lte=end_date)
        
        # Apply sorting
        sort_by = request.query_params.get('sort_by', 'uploaded_at')
        sort_order = request.query_params.get('sort_order', 'desc')
        
        if sort_order == 'asc':
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by(f'-{sort_by}')
        
        # Get pagination parameters
        page_size = int(request.query_params.get('page_size', 10))
        page = int(request.query_params.get('page', 1))
        
        # Calculate start and end indices
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        # Count total results for pagination info
        total_count = queryset.count()
        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
        
        # Get paginated results
        results = queryset[start_index:end_index]
        
        # Serialize results
        serializer = self.get_serializer(results, many=True)
        
        # Return response with pagination info
        return Response({
            'results': serializer.data,
            'pagination': {
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_previous': page > 1
            }
        })
    
    @action(detail=False, methods=['get'])
    def file_types(self, request):
        """Get unique file types for filtering options"""
        # Get all file types and count files of each type
        file_types = {}
        
        # Group files by main file type category (e.g., image/png -> image)
        for file in File.objects.all():
            main_type = file.file_type.split('/')[0] if '/' in file.file_type else file.file_type
            
            if main_type not in file_types:
                file_types[main_type] = {
                    'type': main_type,
                    'count': 0
                }
            
            file_types[main_type]['count'] += 1
        
        return Response(list(file_types.values()))
    
    @action(detail=False, methods=['get'])
    def storage_savings(self, request):
        """Get storage savings statistics from deduplication"""
        # Get total number of files
        total_files = File.objects.count()
        
        # Get deduplication statistics
        savings = StorageSaving.get_total_savings()
        total_bytes_saved = savings['total_bytes_saved']
        total_duplicate_count = savings['total_duplicate_count']
        
        # Calculate efficiency (percentage of storage saved) - safely
        total_size = File.objects.aggregate(total=Sum('size'))['total'] or 0
        
        if total_size > 0 or total_bytes_saved > 0:
            efficiency_percentage = (total_bytes_saved / (total_size + total_bytes_saved)) * 100
        else:
            efficiency_percentage = 0.0
        
        # Prepare response data
        summary_data = {
            'total_bytes_saved': total_bytes_saved,
            'total_duplicate_count': total_duplicate_count,
            'total_files': total_files,
            'efficiency_percentage': round(efficiency_percentage, 2)
        }
        
        serializer = StorageSavingSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get file statistics for dashboard"""
        # Total files
        total_files = File.objects.count()
        
        # Total size
        total_size = File.objects.aggregate(total=Sum('size'))['total'] or 0
        
        # Duplicates
        duplicate_count = File.objects.filter(is_duplicate=True).count()
        
        # File types distribution
        file_types = {}
        for file in File.objects.all():
            main_type = file.file_type.split('/')[0] if '/' in file.file_type else file.file_type
            
            if main_type not in file_types:
                file_types[main_type] = 0
            
            file_types[main_type] += 1
        
        # Size distribution (count files in different size ranges)
        size_ranges = {
            'small': {'min': 0, 'max': 1 * 1024 * 1024, 'count': 0},  # 0-1MB
            'medium': {'min': 1 * 1024 * 1024, 'max': 10 * 1024 * 1024, 'count': 0},  # 1-10MB
            'large': {'min': 10 * 1024 * 1024, 'max': 1000 * 1024 * 1024, 'count': 0}  # >10MB (but with a reasonable upper bound)
        }
        
        for file in File.objects.all():
            for range_name, range_data in size_ranges.items():
                if range_data['min'] <= file.size < range_data['max']:
                    size_ranges[range_name]['count'] += 1
                    break
        
        # Date distribution (by month) - safer implementation using Django's built-in functionality
        try:
            date_distribution = []
            if File.objects.exists():
                date_entries = (
                    File.objects
                    .annotate(month=TruncMonth('uploaded_at'))
                    .values('month')
                    .annotate(count=Count('id'))
                    .order_by('month')
                )
                
                for entry in date_entries:
                    if entry['month']:
                        date_distribution.append({
                            'month': entry['month'].strftime('%Y-%m'),
                            'count': entry['count']
                        })
        except Exception as e:
            # Fallback if there's any issue with the date processing
            date_distribution = []
        
        # Storage savings
        savings = StorageSaving.get_total_savings()
        total_bytes_saved = savings['total_bytes_saved']
        
        # Calculate efficiency - safely to prevent division by zero
        denominator = total_size + total_bytes_saved
        if denominator > 0:
            efficiency_percentage = (total_bytes_saved / denominator) * 100
        else:
            efficiency_percentage = 0.0
        
        # Prepare stats response
        stats_data = {
            'total_files': total_files,
            'total_size': total_size,
            'duplicate_count': duplicate_count,
            'bytes_saved': total_bytes_saved,
            'efficiency_percentage': round(efficiency_percentage, 2),
            'file_types': file_types,
            'size_distribution': size_ranges,
            'date_distribution': date_distribution
        }
        
        return Response(stats_data)