/**
 * Unit Tests for Image Processing
 * 
 * Tests image validation, compression, and base64 conversion
 */

import { describe, it, expect, vi } from 'vitest';
import { validateImage, compressImage, fileToBase64, processImage } from '../../app/lib/image-processing';

// Mock Image and FileReader APIs
global.Image = class {
  width = 0;
  height = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  
  constructor() {
    // Simulate async loading
    setTimeout(() => {
      if (this.onload) {
        this.width = 800;
        this.height = 600;
        this.onload();
      }
    }, 0);
  }
} as unknown as typeof Image;

global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
} as unknown as typeof URL;

global.FileReader = class {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        this.onload();
      }
    }, 0);
  }
} as unknown as typeof FileReader;

// Helper to create mock File
function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['mock content'], { type });
  const file = new File([blob], name, { type, lastModified: Date.now() });
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
}

describe('validateImage', () => {
  it('should accept valid PNG files', async () => {
    const file = createMockFile('test.png', 'image/png', 1024 * 1024); // 1MB
    const result = await validateImage(file);
    expect(result.valid).toBe(true);
  });

  it('should accept valid JPEG files', async () => {
    const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
    const result = await validateImage(file);
    expect(result.valid).toBe(true);
  });

  it('should accept valid WebP files', async () => {
    const file = createMockFile('test.webp', 'image/webp', 1024 * 1024);
    const result = await validateImage(file);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid file types', async () => {
    const file = createMockFile('test.pdf', 'application/pdf', 1024);
    const result = await validateImage(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PNG, JPEG, or WebP');
  });

  it('should reject files over 10MB', async () => {
    const file = createMockFile('test.png', 'image/png', 11 * 1024 * 1024); // 11MB
    const result = await validateImage(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('should accept files exactly at 10MB limit', async () => {
    const file = createMockFile('test.png', 'image/png', 10 * 1024 * 1024); // Exactly 10MB
    const result = await validateImage(file);
    expect(result.valid).toBe(true);
  });

  it('should reject images smaller than 100x100px', async () => {
    const file = createMockFile('test.png', 'image/png', 1024);
    // Mock small dimensions
    const OriginalImage = global.Image;
    global.Image = class {
      width = 50;
      height = 50;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    const result = await validateImage(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too small');
    
    global.Image = OriginalImage;
  });

  it('should accept images exactly at 100x100px minimum', async () => {
    const file = createMockFile('test.png', 'image/png', 1024);
    const OriginalImage = global.Image;
    global.Image = class {
      width = 100;
      height = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    const result = await validateImage(file);
    expect(result.valid).toBe(true);
    
    global.Image = OriginalImage;
  });
});

describe('compressImage', () => {
  it('should return original file if already small enough', async () => {
    const file = createMockFile('test.png', 'image/png', 1024 * 1024); // 1MB, small dimensions
    const OriginalImage = global.Image;
    global.Image = class {
      width = 1000;
      height = 1000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    const result = await compressImage(file);
    expect(result).toBe(file); // Should return same file
    
    global.Image = OriginalImage;
  });

  it('should compress large images to max 2048px width', async () => {
    const file = createMockFile('test.png', 'image/png', 5 * 1024 * 1024);
    const OriginalImage = global.Image;
    
    // Mock canvas
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        const blob = new Blob(['compressed'], { type: 'image/png' });
        callback(blob);
      }),
    };
    
    global.Image = class {
      width = 4000;
      height = 3000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    // Mock document.createElement
    const mockDocument = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return mockCanvas as unknown as HTMLCanvasElement;
        }
        return {} as HTMLElement;
      }),
    };
    global.document = mockDocument as unknown as Document;
    
    const result = await compressImage(file);
    expect(result).not.toBe(file); // Should return new compressed file
    expect(mockCanvas.width).toBe(2048);
    expect(mockCanvas.height).toBe(1536); // Maintains aspect ratio (3000 * 2048 / 4000)
    
    global.Image = OriginalImage;
    delete (global as { document?: unknown }).document;
  });
});

describe('fileToBase64', () => {
  it('should convert file to base64 string', async () => {
    const file = createMockFile('test.png', 'image/png', 1024);
    const result = await fileToBase64(file);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // Should not contain data URL prefix
    expect(result).not.toContain('data:image');
    expect(result).not.toContain('base64,');
  });

  it('should remove data URL prefix', async () => {
    const file = createMockFile('test.png', 'image/png', 1024);
    const result = await fileToBase64(file);
    // Base64 should not start with data URL prefix
    expect(result).not.toMatch(/^data:/);
  });
});

describe('processImage', () => {
  it('should validate, compress, and convert in sequence', async () => {
    const file = createMockFile('test.png', 'image/png', 1024 * 1024);
    const OriginalImage = global.Image;
    global.Image = class {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    const result = await processImage(file);
    
    expect(result.base64).toBeDefined();
    expect(result.mimeType).toBe('image/png');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.originalSize).toBe(1024 * 1024);
    expect(result.processedSize).toBeDefined();
    
    global.Image = OriginalImage;
  });

  it('should throw on validation failure', async () => {
    const file = createMockFile('test.pdf', 'application/pdf', 1024);
    
    await expect(processImage(file)).rejects.toThrow();
  });

  it('should return correct dimensions', async () => {
    const file = createMockFile('test.png', 'image/png', 1024 * 1024);
    const OriginalImage = global.Image;
    global.Image = class {
      width = 1920;
      height = 1080;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    const result = await processImage(file);
    
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
    
    global.Image = OriginalImage;
  });

  it('should return correct size information', async () => {
    const originalSize = 2 * 1024 * 1024; // 2MB
    const file = createMockFile('test.png', 'image/png', originalSize);
    const OriginalImage = global.Image;
    global.Image = class {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;
    
    const result = await processImage(file);
    
    expect(result.originalSize).toBe(originalSize);
    expect(result.processedSize).toBeDefined();
    expect(result.processedSize).toBeGreaterThan(0);
    
    global.Image = OriginalImage;
  });
});

