export type AvatarStyleId = '3d' | 'anime' | 'clay' | 'flat' | 'sketch' | 'pixel' | 'watercolor';

export interface GeneratedImage {
  id: string;
  url: string;
  timestamp: number;
  style?: AvatarStyleId;
  mediaType?: 'image' | 'video' | 'gif'; // Default is 'image'
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface AppState {
  view: 'home' | 'camera' | 'editor';
  capturedImage: string | null; // Base64 of raw photo
  gallery: GeneratedImage[];
  selectedImagesForGif: string[]; // IDs of images selected for GIF
  isProcessing: boolean;
  error: string | null;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  GENERATING_AVATAR = 'GENERATING_AVATAR',
  GENERATING_GIF = 'GENERATING_GIF',
  EDITING_IMAGE = 'EDITING_IMAGE',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}