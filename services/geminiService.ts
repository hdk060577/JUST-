import { GoogleGenAI } from "@google/genai";
import { Goal } from "../types";

let ai: GoogleGenAI | null = null;
const STORAGE_KEY = 'just_app_api_key_enc';
const XOR_KEY = 'just_start_secret_salt_2024';

// --- Encryption Helpers ---
const encryptApiKey = (text: string): string => {
  try {
    return btoa(text.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length))
    ).join(''));
  } catch (e) {
    console.error("Encryption failed", e);
    return "";
  }
};

const decryptApiKey = (encrypted: string): string => {
  try {
    return atob(encrypted).split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length))
    ).join('');
  } catch (e) {
    console.error("Decryption failed", e);
    return "";
  }
};

// --- Service Methods ---

export const initializeAI = (apiKey: string) => {
  if (!apiKey) return;
  ai = new GoogleGenAI({ apiKey });
};

export const hasApiKey = (): boolean => {
  return !!localStorage.getItem(STORAGE_KEY);
};

export const loadSavedKey = (): string | null => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  return decryptApiKey(encrypted);
};

export const saveApiKey = (apiKey: string) => {
  const encrypted = encryptApiKey(apiKey);
  localStorage.setItem(STORAGE_KEY, encrypted);
  initializeAI(apiKey);
};

export const clearApiKey = () => {
  localStorage.removeItem(STORAGE_KEY);
  ai = null;
};

export const testConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const testAi = new GoogleGenAI({ apiKey });
    await testAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Test",
    });
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const getDailyQuote = async (): Promise<string> => {
  if (!ai) return "오늘 하루도 작은 한 걸음부터 시작해봐요. (API 키를 설정해주세요)";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Give me a short, warm, and encouraging quote in Korean for someone who is trying to start studying or getting out of a slump. Just the quote, no explanations.",
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching quote:", error);
    return "오늘 하루도 작은 한 걸음부터 시작해봐요. 당신을 응원합니다.";
  }
};

export const getRecommendedGoals = async (): Promise<Goal[]> => {
  if (!ai) {
    return [
      { id: 'def-1', text: '물 한 잔 마시기 (API 설정 필요)', completed: false, type: 'health' },
      { id: 'def-2', text: '창문 열고 환기하기', completed: false, type: 'health' },
    ];
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate 3 small, easy-to-achieve daily goals for someone who might be a social recluse or 'just resting'. Mix of simple health tasks (drinking water), small social tasks, or tiny study tasks. Return ONLY valid JSON array format: [{\"text\": \"string\", \"type\": \"study\" | \"health\" | \"social\"}]",
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    const goals = JSON.parse(text);
    return goals.map((g: any, index: number) => ({
      id: `ai-goal-${Date.now()}-${index}`,
      text: g.text,
      completed: false,
      type: g.type
    }));
  } catch (error) {
    console.error("Error fetching goals:", error);
    return [
      { id: 'def-1', text: '물 한 잔 마시기', completed: false, type: 'health' },
      { id: 'def-2', text: '책상 정리하기', completed: false, type: 'study' },
      { id: 'def-3', text: '창문 열고 환기하기', completed: false, type: 'health' },
    ];
  }
};