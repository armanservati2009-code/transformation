export interface StyleOption {
  id: string;
  name: string;
  prompt: string;
  icon: string;
  color: string;
}

export interface AnalysisResult {
  text: string;
  loading: boolean;
  error?: string;
}

export interface GenerationResult {
  imageUrl: string | null;
  loading: boolean;
  error?: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  EDIT = 'EDIT',
}