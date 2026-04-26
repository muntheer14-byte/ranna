import { auth } from "./firebase";

export const rannaAI = {
  chat: async (prompt: string, history: any[] = []) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, history, idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach AI server");
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "عذراً، واجهت مشكلة في الاتصال بمحرك الذكاء الاصطناعي. / Sorry, I encountered an issue connecting to the AI engine.";
    }
  },
  
  // Note: For complex apps, translation and summarize would also go through the backend
  translateMessage: async (text: string, targetLanguage: string) => {
    return rannaAI.chat(`Translate the following message to ${targetLanguage}: "${text}". Return only the translation.`);
  },
  
  summarizeChat: async (messages: string[]) => {
    return rannaAI.chat(`Summarize the following chat conversation in a few bullet points: \n${messages.join('\n')}`);
  }
};
