/**
 * Image processing utilities for validation, compression, and base64 conversion
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface ProcessedImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_WIDTH = 2048;
const MIN_DIMENSION = 100;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

/**
 * Validate image file
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a PNG, JPEG, or WebP image.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
    };
  }

  // Check dimensions
  const dimensions = await getImageDimensions(file);
  if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
    return {
      valid: false,
      error: `Image is too small. Minimum dimensions are ${MIN_DIMENSION}x${MIN_DIMENSION}px.`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Compress and resize image if needed
 */
export async function compressImage(file: File): Promise<File> {
  const dimensions = await getImageDimensions(file);
  
  // If image is small enough, return as-is
  if (dimensions.width <= MAX_WIDTH && file.size <= MAX_FILE_SIZE) {
    return file;
  }

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = dimensions.width;
  let newHeight = dimensions.height;
  
  if (newWidth > MAX_WIDTH) {
    newHeight = Math.round((MAX_WIDTH / newWidth) * newHeight);
    newWidth = MAX_WIDTH;
  }

  // Create canvas and resize
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob with quality compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create new File from blob
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        file.type,
        0.85 // Quality: 0.85 for good balance
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = url;
  });
}

/**
 * Convert file to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to extract base64 data'));
        return;
      }
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Process image: validate, compress, and convert to base64
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // Validate
  const validation = await validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Image validation failed');
  }

  // Compress if needed
  const processedFile = await compressImage(file);
  
  // Get dimensions of processed image
  const dimensions = await getImageDimensions(processedFile);
  
  // Convert to base64
  const base64 = await fileToBase64(processedFile);
  
  return {
    base64,
    mimeType: processedFile.type,
    width: dimensions.width,
    height: dimensions.height,
    originalSize: file.size,
    processedSize: processedFile.size,
  };
}

