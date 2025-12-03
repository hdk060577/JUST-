import { GoogleGenAI } from "@google/genai";
import { Goal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailyQuote = async (): Promise<string> => {
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
