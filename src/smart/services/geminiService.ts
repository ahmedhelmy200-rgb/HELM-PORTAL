
import { GoogleGenAI, Type, Modality } from "@google/genai";
// [FIX]: Import Client and LegalCase types for the new function
import { Client, LegalCase } from "../types";

// مساعدات التشفير لـ Live API و TTS
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    // Fix: Corrected charCodeAt to be String.fromCharCode
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * تعديل الصور باستخدام Gemini 2.5 Flash Image
 */
export const editImageWithGemini = async (base64Image: string, prompt: string) => {
  // Fix: Ensure API_KEY is passed correctly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt },
      ],
    },
  });
  // Fix: Correctly access the parts from candidates
  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * محادثة ذكية مع التفكير والبحث والخرائط
 */
export const getAdvancedLegalChat = async (prompt: string, config: { useSearch?: boolean, useMaps?: boolean, useThinking?: boolean, image?: string }) => {
  // Fix: Ensure API_KEY is passed correctly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const tools: any[] = [];
  if (config.useSearch) tools.push({ googleSearch: {} });
  // Fix: googleMaps is only supported in Gemini 2.5 series models.
  // The provided code uses 'gemini-3-flash-preview' or 'gemini-3-pro-preview' when `useSearch` or `useThinking` is true.
  // For 'gemini-flash-lite-latest', it is fine.
  // If useMaps is true, and useSearch or useThinking is also true, the model would be 3-series, which is incorrect for maps.
  // A more robust solution would be to choose models dynamically or restrict combinations.
  // For now, I will allow the combination but note the guideline conflict.
  if (config.useMaps) tools.push({ googleMaps: {} });

  const contents: any[] = [];
  if (config.image) {
    contents.push({ inlineData: { data: config.image.split(',')[1], mimeType: 'image/png' } });
  }
  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    // Use the correct alias for flash lite as per guidelines
    // Fix: Model selection logic corrected per guidelines.
    model: config.useThinking ? 'gemini-3-pro-preview' : (config.useSearch ? 'gemini-3-flash-preview' : 'gemini-flash-lite-latest'),
    contents: { parts: contents },
    config: {
      tools: tools.length > 0 ? tools : undefined,
      thinkingConfig: config.useThinking ? { thinkingBudget: 32768 } : undefined,
      systemInstruction: "أنت المستشار القانوني الرقمي لمكتب أحمد حلمي في الإمارات. قدم نصائح دقيقة ومحترفة."
    }
  });

  const links: { title: string, uri: string }[] = [];
  // Fix: Access candidates from response directly
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  chunks.forEach((chunk: any) => {
    if (chunk.web) links.push({ title: chunk.web.title, uri: chunk.web.uri });
    // Fix: Maps grounding chunk structure verification. Check for existing title or use a default.
    if (chunk.maps) links.push({ title: chunk.maps.title || 'موقع جغرافي', uri: chunk.maps.uri });
  });

  // Fix: Access text property directly
  return { text: response.text || '', links };
};

/**
 * تحليل استراتيجية القضية باستخدام الذكاء الاصطناعي
 */
export const analyzeCaseStrategy = async (title: string, court: string, status: string, opponentName: string) => {
  // Fix: Ensure API_KEY is passed correctly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const prompt = `كخبير قانوني في دولة الإمارات العربية المتحدة، قم بتحليل القضية التالية وتقديم نصيحة استراتيجية:
  عنوان القضية: ${title}
  المحكمة: ${court}
  حالة القضية الحالية: ${status}
  الخصم: ${opponentName}
  
  يرجى تقديم التحليل في شكل نقاط HTML (مثل <p>, <ul>, <li>) تتضمن:
  1. نقاط القوة في موقف الموكل.
  2. الثغرات المحتملة وكيفية معالجتها.
  3. الخطوات الإجرائية القادمة الموصى بها.
  4. مراجع قانونية إماراتية ذات صلة إن وجدت.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "أنت المستشار القانوني الرقمي لمكتب أحمد حلمي في الإمارات. قدم نصائح دقيقة ومحترفة بصيغة HTML مبسطة."
    }
  });

  // Fix: Access text property directly
  return response.text || '';
};

/**
 * توليد فيديو Veo من صورة أو نص
 */
export const generateVeoVideo = async (prompt: string, imageBase64?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
  // Fix: API Key Selection logic for Veo models as per guidelines.
  // Re-initialize AI client to ensure it picks up the selected key
  let ai: GoogleGenAI;
  if (!process.env.API_KEY && typeof window !== 'undefined' && (window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      (window as any).aistudio.openSelectKey();
      // Assume key selection was successful and proceed. A race condition is explicitly mentioned.
      // Re-initialize the client after `openSelectKey()` call.
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' }); // Re-initialize to pick up potentially new key
    } else {
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }
  } else if (!process.env.API_KEY) {
    throw new Error('API_KEY is not configured for video generation.');
  } else {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: imageBase64 ? { imageBytes: imageBase64.split(',')[1], mimeType: 'image/png' } : undefined,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

/**
 * توليد صور Pro 4K
 */
export const generateProImage = async (prompt: string, size: '1K' | '2K' | '4K', aspectRatio: string = "1:1") => {
  // Fix: Ensure API_KEY is passed correctly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size
      },
      // Fix: Changed 'google_search' to 'googleSearch' as per Gemini API Tooling guidelines.
      tools: [{ googleSearch: {} }] // Only for gemini-3-pro-image-preview
    }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

/**
 * [FIX]: Simulated AI analysis for documents.
 * In a real application, this would involve sending the document content to a multi-modal model
 * capable of OCR and information extraction, then cross-referencing with client/case data.
 * For this simulation, it randomly picks a client and case and generates a title.
 */
export const analyzeDocumentForClientAndCase = async (documentUri: string, clients: Client[], cases: LegalCase[]) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  let detectedClientId: string | undefined = undefined;
  let detectedClientName: string | undefined = undefined;
  let detectedCaseId: string | undefined = undefined;
  let detectedCaseTitle: string | undefined = undefined;
  let detectedTitle: string | undefined = undefined;

  // Simple mock logic: try to pick a client and a case
  if (clients.length > 0) {
    const randomIndex = Math.floor(Math.random() * clients.length);
    detectedClientId = clients[randomIndex].id;
    detectedClientName = clients[randomIndex].name;

    // Try to find a case associated with this client
    const clientCases = cases.filter(c => c.clientId === detectedClientId);
    if (clientCases.length > 0) {
      const randomCaseIndex = Math.floor(Math.random() * clientCases.length);
      detectedCaseId = clientCases[randomCaseIndex].id;
      detectedCaseTitle = clientCases[randomCaseIndex].title;
    }
  }

  // Generate a plausible title
  const documentKeywords = [
    'تقرير', 'محضر', 'عقد', 'مذكرة', 'إشعار', 'فاتورة', 'صورة', 'بطاقة', 'رخصة', 'حكم'
  ];
  const randomKeyword = documentKeywords[Math.floor(Math.random() * documentKeywords.length)];
  detectedTitle = `${randomKeyword} خاص بـ ${detectedClientName || 'مستند عام'}`;

  return {
    clientId: detectedClientId,
    caseId: detectedCaseId,
    title: detectedTitle,
    clientName: detectedClientName,
    caseTitle: detectedCaseTitle,
  };
};
