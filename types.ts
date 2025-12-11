export type Priority = 'low' | 'medium' | 'high';
export type NoteFormat = 'text' | 'json';

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  priority: Priority;
  format: NoteFormat;
  tags: string[];
  color: string; // 'default' | 'red' | 'yellow' | 'dark'
  createdAt: number;
  updatedAt: number;
  audioBase64?: string;
  transcript?: string;
}

export interface User {
  username: string;
  passwordHash: string; // SHA256 hash for login verification
  salt: string;
}

export enum SortOption {
  DATE_DESC = 'Date (Newest)',
  DATE_ASC = 'Date (Oldest)',
  TITLE = 'Title',
  PRIORITY = 'Priority (High to Low)',
}

export type Theme = 'light' | 'dark';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  encryptionKey: string | null; // Kept in memory only
}
