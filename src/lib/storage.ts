import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';

/**
 * Compresses an image file/blob on the client side using HTML5 Canvas.
 * Resizes the image to fit within 800x600 (maintaining aspect ratio)
 * and compresses it with a JPEG quality of 0.7.
 */
export async function compressImage(file: Blob | File): Promise<Blob | File> {
  // If not an image, return original file
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to original
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // If compressed blob is actually larger than the original, use original
              if (blob.size >= file.size) {
                resolve(file);
              } else {
                resolve(blob);
              }
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          0.7 // JPEG Quality 0.7
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Utility to convert base64 data URL to a Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[arr.length - 1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * High-level helper that takes either a Base64 dataURL or an existing HTTPS URL.
 * If it is already an HTTP(S) URL, it passes it through.
 * If it is Base64, it converts it to a Blob, compresses it to 800x600 (quality 0.7),
 * uploads it to Firebase Storage, and returns the public download URL.
 */
export async function prepareAndUploadImage(imageUrlOrBase64: string, folderName = 'reports'): Promise<string> {
  if (!imageUrlOrBase64) return '';
  
  // If already an HTTP(S) url, return as-is
  if (imageUrlOrBase64.startsWith('http://') || imageUrlOrBase64.startsWith('https://')) {
    return imageUrlOrBase64;
  }

  // If it's a data URL, convert and upload
  if (imageUrlOrBase64.startsWith('data:')) {
    try {
      const blob = dataURLtoBlob(imageUrlOrBase64);
      const compressed = await compressImage(blob);
      return await uploadImage(compressed, folderName);
    } catch (err) {
      console.error('Failed to convert and upload Base64 image:', err);
      throw err;
    }
  }

  // Fallback
  return imageUrlOrBase64;
}


/**
 * Uploads a file or compressed blob to Firebase Storage and returns its public HTTPS download URL.
 */
export async function uploadImage(fileOrBlob: Blob | File, folderName = 'reports'): Promise<string> {
  // Ensure user is authenticated before uploading to Firebase Storage
  if (!auth.currentUser) {
    throw new Error('Authentication is required to upload files to storage. Please sign in via Google first.');
  }

  try {
    // Generate a secure unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 11);
    const fileExtension = fileOrBlob instanceof File ? fileOrBlob.name.split('.').pop() || 'jpg' : 'jpg';
    const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
    const storageRef = ref(storage, `${folderName}/${fileName}`);

    // Set standard metadata
    const metadata = {
      contentType: 'image/jpeg',
    };

    // Perform upload
    const snapshot = await uploadBytes(storageRef, fileOrBlob, metadata);
    
    // Get and return the public download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload image to Firebase Storage.');
  }
}
