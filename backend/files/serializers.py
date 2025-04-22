from rest_framework import serializers
from .models import File, StorageSaving

class FileSerializer(serializers.ModelSerializer):
    is_duplicate = serializers.BooleanField(read_only=True)
    file_hash = serializers.CharField(read_only=True)
    reference_file_id = serializers.UUIDField(source='reference_file.id', read_only=True, allow_null=True)
    
    class Meta:
        model = File
        fields = [
            'id', 'file', 'original_filename', 'file_type', 'size', 
            'uploaded_at', 'is_duplicate', 'file_hash', 'reference_file_id'
        ]
        read_only_fields = ['id', 'uploaded_at', 'is_duplicate', 'file_hash', 'reference_file_id']

class StorageSavingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageSaving
        fields = ['date', 'bytes_saved', 'duplicate_count']

class StorageSavingSummarySerializer(serializers.Serializer):
    total_bytes_saved = serializers.IntegerField()
    total_duplicate_count = serializers.IntegerField()
    total_files = serializers.IntegerField()
    efficiency_percentage = serializers.FloatField()
    
    # Add a formatted version of bytes saved
    formatted_bytes_saved = serializers.SerializerMethodField()
    
    def get_formatted_bytes_saved(self, obj):
        """Convert bytes to human-readable format"""
        bytes_saved = obj['total_bytes_saved']
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_saved < 1024.0:
                return f"{bytes_saved:.2f} {unit}"
            bytes_saved /= 1024.0
        return f"{bytes_saved:.2f} PB"