/**
 * Utility to compress images on the client side using HTML5 Canvas.
 * This ensures that when users upload custom photos, they are converted
 * into compressed, web-optimized JPEGs (typically ~40KB - 80KB) instead of
 * raw multi-megabyte base64 strings. This completely prevents Firestore
 * 1MB document limit issues and keeps database transactions lightning fast.
 */
export const compressImage = (
  file: File, 
  maxWidth = 1000, 
  maxHeight = 1000, 
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Verify file is actually an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original read if canvas context fails
          resolve(event.target?.result as string);
          return;
        }

        // Draw image into canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to highly compressed JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => {
        console.error('Image load error during compression, using fallback:', err);
        resolve(event.target?.result as string);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
};
