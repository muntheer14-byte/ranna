import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });

export async function summarizeChat(messages: { role: string; text: string }[]) {
  const prompt = `أنت مساعد ذكي لتطبيق "رنة" للمراسلة. قم بتلخيص المحادثة التالية بأسلوب شيق ومختصر جداً (الزبدة). ركز على النقاط الرئيسية والقرارات المتخذة.
  
المحادثة:
${messages.map(m => `${m.role}: ${m.text}`).join('\n')}

الملخص (باللغة العربية):`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Summarization Error:", error);
    return "عذراً، لم أتمكن من تلخيص المحادثة في هذه اللحظة.";
  }
}

export async function transcribeAudio(audioUrl: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          fileData: {
            mimeType: "audio/webm",
            fileUri: audioUrl,
          },
        },
        "حول هذا المقطع الصوتي إلى نص مكتوب بدقة. إذا كان الكلام بالعربية، اكتبه بالعربية."
      ],
    });
    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    return "عذراً، لم أتمكن من تحويل الصوت إلى نص.";
  }
}

export async function translateText(text: string, targetLang: string = 'Arabic') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLang}. Preserve the tone and any emojis: "${text}"`,
    });
    return response.text ?? text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

export async function generateSmartReply(contextOrMessages: string | { role: string, content: string }[]) {
  try {
    let promptText = "";
    if (typeof contextOrMessages === 'string') {
      promptText = `Based on this message: "${contextOrMessages}", suggest 3 short, natural replies in Arabic. Return as JSON array.`;
    } else {
      const context = contextOrMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      promptText = `Based on this chat history, suggest 3 short, natural, and helpful replies in Arabic: \n${context}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptText,
    });
    const text = response.text || "";
    
    // Simple parsing to extract replies
    if (text.includes('[') && text.includes(']')) {
      try {
        const match = text.match(/\[.*\]/s);
        if (match) return JSON.parse(match[0]);
      } catch(e) {}
    }
    return text.split('\n').filter(t => t.trim() && t.length < 50).slice(0, 3);
  } catch (error) {
    return [];
  }
}
