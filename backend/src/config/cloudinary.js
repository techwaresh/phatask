// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * رفع ملف إلى Cloudinary
 * @param {Buffer} buffer - محتوى الملف
 * @param {Object} options - { folder, resource_type, public_id }
 */
export async function uploadToCloud(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `bwms/${options.folder || 'misc'}`,
      resource_type: options.resource_type || 'auto',
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      ...options,
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }).end(buffer);
  });
}

/**
 * حذف ملف من Cloudinary
 */
export async function deleteFromCloud(publicId, resourceType = 'auto') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * إنشاء رابط موقت للملف
 */
export function getSignedUrl(publicId, expiresInSeconds = 3600) {
  return cloudinary.utils.private_download_url(publicId, 'auto', {
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

export default cloudinary;
