import * as FileSystem from "expo-file-system/legacy";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

/**
 * Transcribe Malayalam or English voice recording with Gemini Multimodal AI.
 * Takes audio file URI from expo-audio, converts to base64, and transcribes directly into text.
 */
export async function transcribeAudioWithGemini(
  audioUri: string,
  preferredLanguage: "ml" | "en" = "ml"
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Read audio file as base64 string
  let base64Audio = "";
  try {
    base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (fsErr) {
    console.warn("FileSystem read error, attempting File API:", fsErr);
    throw new Error("Could not read recorded audio file.");
  }

  if (!base64Audio || base64Audio.length < 50) {
    throw new Error("Recorded audio is too short or empty.");
  }

  // Determine mime type from file extension
  let mimeType = "audio/m4a";
  const lowerUri = audioUri.toLowerCase();
  if (lowerUri.endsWith(".wav")) {
    mimeType = "audio/wav";
  } else if (lowerUri.endsWith(".mp4")) {
    mimeType = "audio/mp4";
  } else if (lowerUri.endsWith(".aac")) {
    mimeType = "audio/aac";
  } else if (lowerUri.endsWith(".mp3")) {
    mimeType = "audio/mp3";
  }

  const prompt = `
Listen to this audio recording carefully. The user is asking a Kerala State Lottery question.
Accurately transcribe the spoken words into text.
Rules:
1. If the user spoke in Malayalam or Manglish, transcribe it into natural Malayalam script (മലയാളം).
   For example:
   - "ഇന്നത്തെ കാരുണ്യ ലോട്ടറി ഫലം എന്താണ്?"
   - "ഭാഗ്യതാരാ ലോട്ടറി ഫലം പറയാമോ?"
   - "123456 എന്ന ടിക്കറ്റിന് സമ്മാനം ഉണ്ടോ?"
   - "ഒന്നാം സമ്മാനം എത്രയാണ്?"
   - "അടുത്ത നറുക്കെടുപ്പ് എപ്പോഴാണ്?"
2. If the user spoke in English, transcribe it in English.
3. Return ONLY the transcribed text. Do NOT wrap in quotes, do NOT add explanations, timestamps, or preamble.
`;

  const models = [
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-flash-lite-latest",
  ];

  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          // Clean quotes or markdown wrappers if any
          const cleanedText = text
            .replace(/^["']|["']$/g, "")
            .replace(/^```[a-z]*\s*/i, "")
            .replace(/```$/i, "")
            .trim();
          return cleanedText;
        }
      } else {
        const errText = await response.text();
        console.warn(`Gemini audio model ${model} error:`, errText);
        lastError = new Error(`Gemini audio error (${response.status})`);
      }
    } catch (e) {
      console.warn(`Error trying Gemini audio model ${model}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error("Failed to transcribe audio with Gemini.");
}
