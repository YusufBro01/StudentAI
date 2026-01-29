export enum Step {
  Welcome = 1,
  University = 2,
  Major = 3,
  Subjects = 4,
  Test = 5,
  Results = 6,
}

export interface UserData {
  name: string;
  university: string;
  course: string;
  major: string;
}

export interface Question {
  q: string;
  o: string[];
  a: number;
}

export interface TestState {
  subject: string;
  questions: Question[];
  total: number;
}

export interface TestResult {
    score: number;
    total: number;
}

export interface Receipt {
    user: UserData;
    image: string;
}

export type Subject = 'Fizika' | 'Matematika' | 'English' | 'Tarix' | 'Akademik' | 'Dasturlash';

export interface QuestionBank {
    [key: string]: Question[];
}

// Telegram Web App types for TypeScript
interface WebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface WebApp {
  initData: string;
  initDataUnsafe: {
    query_id: string;
    user?: WebAppUser;
    // ... other properties
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(disable?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };

  expand(): void;
  sendData(data: string): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}