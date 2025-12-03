export interface User {
  nickname: string;
  isPublic: boolean;
  points: number;
  streak: number;
  stamps: boolean[]; // Array of 7 days
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  type: 'study' | 'health' | 'social';
}

export interface Post {
  id: string;
  author: string;
  content: string;
  likes: number;
  timestamp: Date;
  isAuthorPublic: boolean;
}

export interface Friend {
  id: string;
  nickname: string;
  isOnline: boolean;
  studyTime: number; // in minutes
  goalRate: number; // percentage
  statusMessage: string;
}
