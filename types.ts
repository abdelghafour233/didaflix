
export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp'
}

export interface ImageState {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
}

export interface ConversionResult {
  url: string;
  format: ImageFormat;
  size: number;
}
