# backend/files/models.py
from django.db import models
import uuid
import os
import hashlib

def calculate_file_hash(file_content):
    """Calculate SHA-256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest()

def file_upload_path(instance, filename):
    """Generate file path for new file upload with hash-based naming"""
    ext = filename.split('.')[-1]
    filename = f"{instance.file_hash}.{ext}"
    return os.path.join('uploads', filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Fields for deduplication
    file_hash = models.CharField(max_length=64, db_index=True, null=True)  # Added null=True
    is_duplicate = models.BooleanField(default=False)
    reference_file = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='duplicates')
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.original_filename

class StorageSaving(models.Model):
    """Model to track storage savings from deduplication"""
    date = models.DateField(auto_now_add=True)
    bytes_saved = models.BigIntegerField(default=0)
    duplicate_count = models.IntegerField(default=0)
    
    @classmethod
    def add_saving(cls, file_size):
        """Add a new storage saving record"""
        # Get or create today's record
        from django.utils import timezone
        today = timezone.now().date()
        saving, created = cls.objects.get_or_create(date=today)
        
        # Update savings
        saving.bytes_saved += file_size
        saving.duplicate_count += 1
        saving.save()
        
        return saving
    
    @classmethod
    def get_total_savings(cls):
        """Get total storage savings"""
        # Sum all savings
        from django.db.models import Sum
        total_bytes = cls.objects.aggregate(total=Sum('bytes_saved'))['total'] or 0
        total_count = cls.objects.aggregate(total=Sum('duplicate_count'))['total'] or 0
        
        return {
            'total_bytes_saved': total_bytes,
            'total_duplicate_count': total_count
        }