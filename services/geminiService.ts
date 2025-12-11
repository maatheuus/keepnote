import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client using environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes audio using Gemini 2.5 Flash model.
 * @param base64Audio Base64 encoded audio string (without data URI prefix)
 * @param mimeType Mime type of the audio (e.g., 'audio/webm')
 * @returns The transcribed text
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Audio.split(',')[1] || base64Audio;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Transcribe the spoken content in this audio file accurately. Return only the transcription text, no preamble."
          }
        ]
      }
    });

    return response.text || "Transcription failed or empty.";
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    return "Error transcribing audio. Please try again.";
  }
};

/**
 * Autocompletes or generates text based on the current context.
 * @param currentText The text currently in the editor
 * @returns Suggested completion
 */
export const autocompleteText = async (currentText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          text: `You are a helpful writing assistant. Complete the following text or provide the next logical sentence/paragraph. Keep it concise.
          
          Context: "${currentText}"
          
          Completion:`
        }]
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Autocomplete Error:", error);
    return "";
  }
};
