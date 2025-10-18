import os
import uuid
import aiofiles
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile
from typing import Dict, Any
import logging
from PIL import Image
import io

logger = logging.getLogger(__name__)

class StorageService:
    """
    Service for handling file storage using MinIO or local filesystem
    """
    
    def __init__(self):
        self.use_minio = os.getenv("USE_MINIO", "false").lower() == "true"
        
        if self.use_minio:
            self.minio_endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
            self.minio_access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
            self.minio_secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
            self.bucket_name = os.getenv("MINIO_BUCKET", "tourism-media")
            self.tour_bucket_name = "tour-images"  # Separate bucket for tour images
            
            try:
                self.minio_client = Minio(
                    self.minio_endpoint,
                    access_key=self.minio_access_key,
                    secret_key=self.minio_secret_key,
                    secure=False  # Set to True for HTTPS
                )
                self._ensure_bucket_exists()
                self._ensure_bucket_exists(self.tour_bucket_name)
            except Exception as e:
                logger.warning(f"MinIO not available, falling back to local storage: {str(e)}")
                self.use_minio = False
        
        if not self.use_minio:
            self.upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
            self.tour_upload_dir = os.path.join(self.upload_dir, "tours")
            os.makedirs(self.upload_dir, exist_ok=True)
            os.makedirs(self.tour_upload_dir, exist_ok=True)
    
    def _ensure_bucket_exists(self, bucket_name: str = None):
        """Ensure the MinIO bucket exists"""
        try:
            bucket = bucket_name or self.bucket_name
            if not self.minio_client.bucket_exists(bucket):
                self.minio_client.make_bucket(bucket)
                logger.info(f"Created MinIO bucket: {bucket}")
        except S3Error as e:
            logger.error(f"Error creating MinIO bucket: {str(e)}")
            raise
    
    async def upload_file(self, file: UploadFile, file_content: bytes) -> Dict[str, Any]:
        """
        Upload file to storage
        
        Args:
            file: FastAPI UploadFile object
            file_content: File content as bytes
            
        Returns:
            Dictionary with file information
        """
        try:
            # Generate unique filename
            file_extension = self._get_file_extension(file.filename)
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Validate and process image
            processed_content = await self._process_image(file_content, file.content_type)
            
            if self.use_minio:
                return await self._upload_to_minio(unique_filename, processed_content, file.content_type)
            else:
                return await self._upload_to_local(unique_filename, processed_content, file.content_type)
                
        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            raise
    
    async def upload_tour_image(self, file: UploadFile, file_content: bytes) -> Dict[str, Any]:
        """
        Upload tour image to separate storage bucket
        
        Args:
            file: FastAPI UploadFile object
            file_content: File content as bytes
            
        Returns:
            Dictionary with file information
        """
        try:
            # Generate unique filename
            file_extension = self._get_file_extension(file.filename)
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Validate and process image
            processed_content = await self._process_image(file_content, file.content_type)
            
            if self.use_minio:
                return await self._upload_to_minio(unique_filename, processed_content, file.content_type, bucket=self.tour_bucket_name)
            else:
                return await self._upload_to_local(unique_filename, processed_content, file.content_type, subfolder="tours")
                
        except Exception as e:
            logger.error(f"Error uploading tour image: {str(e)}")
            raise
    
    async def _upload_to_minio(self, filename: str, content: bytes, content_type: str, bucket: str = None) -> Dict[str, Any]:
        """Upload file to MinIO"""
        try:
            bucket_name = bucket or self.bucket_name
            
            # Upload to MinIO
            self.minio_client.put_object(
                bucket_name,
                filename,
                io.BytesIO(content),
                length=len(content),
                content_type=content_type
            )
            
            # Generate URL
            url = f"http://{self.minio_endpoint}/{bucket_name}/{filename}"
            
            return {
                "url": url,
                "filename": filename,
                "file_size": len(content),
                "mime_type": content_type
            }
            
        except S3Error as e:
            logger.error(f"MinIO upload error: {str(e)}")
            raise
    
    async def _upload_to_local(self, filename: str, content: bytes, content_type: str, subfolder: str = None) -> Dict[str, Any]:
        """Upload file to local filesystem"""
        try:
            upload_dir = os.path.join(self.upload_dir, subfolder) if subfolder else self.upload_dir
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = os.path.join(upload_dir, filename)
            
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Generate URL (relative path for local storage)
            url = f"/media/{subfolder}/{filename}" if subfolder else f"/media/{filename}"
            
            return {
                "url": url,
                "filename": filename,
                "file_size": len(content),
                "mime_type": content_type
            }
            
        except Exception as e:
            logger.error(f"Local upload error: {str(e)}")
            raise
    
    async def delete_file(self, url: str) -> bool:
        """
        Delete file from storage
        
        Args:
            url: File URL
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            if self.use_minio:
                # Extract filename from MinIO URL
                filename = url.split('/')[-1]
                self.minio_client.remove_object(self.bucket_name, filename)
            else:
                # Extract filename from local URL
                filename = url.split('/')[-1]
                file_path = os.path.join(self.upload_dir, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting file {url}: {str(e)}")
            return False
    
    async def _process_image(self, content: bytes, content_type: str) -> bytes:
        """
        Process and optimize image
        
        Args:
            content: Image content as bytes
            content_type: MIME type
            
        Returns:
            Processed image content
        """
        try:
            # Open image with PIL
            image = Image.open(io.BytesIO(content))
            
            # Convert RGBA to RGB if necessary (for JPEG)
            if image.mode == 'RGBA' and content_type == 'image/jpeg':
                # Create white background
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
                image = background
            
            # Resize if too large (max 1920x1080)
            max_width, max_height = 1920, 1080
            if image.width > max_width or image.height > max_height:
                image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save processed image
            output = io.BytesIO()
            format_map = {
                'image/jpeg': 'JPEG',
                'image/jpg': 'JPEG',
                'image/png': 'PNG',
                'image/webp': 'WEBP'
            }
            
            image_format = format_map.get(content_type, 'JPEG')
            
            # Optimize quality for JPEG
            if image_format == 'JPEG':
                image.save(output, format=image_format, quality=85, optimize=True)
            else:
                image.save(output, format=image_format, optimize=True)
            
            return output.getvalue()
            
        except Exception as e:
            logger.warning(f"Image processing failed, using original: {str(e)}")
            return content
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension from filename"""
        if not filename:
            return '.jpg'
        
        parts = filename.split('.')
        if len(parts) > 1:
            return f".{parts[-1].lower()}"
        return '.jpg'
    
    async def health_check(self) -> bool:
        """Check if storage service is healthy"""
        try:
            if self.use_minio:
                # Try to list buckets
                self.minio_client.list_buckets()
                return True
            else:
                # Check if upload directory is writable
                return os.path.exists(self.upload_dir) and os.access(self.upload_dir, os.W_OK)
        except Exception as e:
            logger.error(f"Storage health check failed: {str(e)}")
            return False
    
    async def get_storage_stats(self) -> Dict[str, int]:
        """Get storage statistics"""
        try:
            if self.use_minio:
                # MinIO stats are complex to get, return placeholder
                return {"used": 0, "available": 1000000000}  # 1GB placeholder
            else:
                # Get local filesystem stats
                stat = os.statvfs(self.upload_dir)
                available = stat.f_bavail * stat.f_frsize
                total = stat.f_blocks * stat.f_frsize
                used = total - available
                return {"used": used, "available": available}
        except Exception as e:
            logger.error(f"Error getting storage stats: {str(e)}")
            return {"used": 0, "available": 0}