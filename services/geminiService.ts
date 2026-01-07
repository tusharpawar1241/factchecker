import { GoogleGenAI, Part } from '@google/genai';
import { FactCheckResponse, InputType, Verdict } from '../types';
import { VERITAS_AI_SYSTEM_INSTRUCTION, GEMINI_MODEL_TEXT, GEMINI_MODEL_IMAGE } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to convert Blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // Remove data URL prefix
      } else {
        reject(new Error('Failed to convert blob to base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to decode raw PCM audio data (if needed, though not directly used for text/image fact-checking)
// function decode(base64: string) {
//   const binaryString = atob(base64);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes;
// }

// async function decodeAudioData(
//   data: Uint8Array,
//   ctx: AudioContext,
//   sampleRate: number,
//   numChannels: number,
// ): Promise<AudioBuffer> {
//   const dataInt16 = new Int16Array(data.buffer);
//   const frameCount = dataInt16.length / numChannels;
//   const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

//   for (let channel = 0; channel < numChannels; channel++) {
//     const channelData = buffer.getChannelData(channel);
//     for (let i = 0; i < frameCount; i++) {
//       channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
//     }
//   }
//   return buffer;
// }


// Parses the structured text response from Gemini into FactCheckResponse object
function parseFactCheckResponse(rawText: string): FactCheckResponse {
  const verdictMatch = rawText.match(/Verdict:\s*(TRUE|FALSE|MISLEADING|UNVERIFIED)/i);
  const confidenceMatch = rawText.match(/Confidence Score:\s*(\d{1,3})%/i);
  const coreFindingMatch = rawText.match(/Core Finding:\s*\n(.+?)\nEvidence:/s);
  const evidenceMatch = rawText.match(/Evidence:\s*\n((?:•\s*.+\n)+)/s);
  const sourcesMatch = rawText.match(/Sources:\s*\n((?:•\s*.+\n)+)/s);

  const verdict = (verdictMatch?.[1]?.toUpperCase() || 'UNVERIFIED') as Verdict;
  const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 0;
  const coreFinding = coreFindingMatch?.[1]?.trim() || 'No core finding available.';
  const evidence = evidenceMatch?.[1]?.split('\n').filter(line => line.startsWith('•')).map(line => line.substring(1).trim()) || ['No evidence provided.'];
  const sources = sourcesMatch?.[1]?.split('\n').filter(line => line.startsWith('•')).map(line => line.substring(1).trim()) || ['No sources provided.'];

  return {
    verdict,
    confidenceScore,
    coreFinding,
    evidence: evidence.length > 0 ? evidence : ['No specific evidence points found.'],
    sources: sources.length > 0 ? sources : ['No specific sources found.'],
  };
}

export async function getFactCheckResponse(
  inputType: InputType,
  userInput: string,
  imageFile?: File,
): Promise<FactCheckResponse> {
  let model = GEMINI_MODEL_TEXT;
  // Fix: Declare parts as Part[] and wrap the system instruction in a text part
  const parts: Part[] = [];
  parts.push({ text: VERITAS_AI_SYSTEM_INSTRUCTION }); // System instruction as the first part.

  let userPrompt = '';

  switch (inputType) {
    case InputType.TEXT:
      userPrompt = `Please verify the following text: ${userInput}`;
      // Fix: Ensure all string parts are wrapped in a text object
      parts.push({text: userPrompt});
      model = GEMINI_MODEL_TEXT;
      break;
    case InputType.LINK:
      userPrompt = `Please verify the claims made in this link: ${userInput}`;
      // Fix: Ensure all string parts are wrapped in a text object
      parts.push({text: userPrompt});
      model = GEMINI_MODEL_TEXT;
      break;
    case InputType.IMAGE_DESCRIPTION:
      userPrompt = `Please verify the content described in this image/video description: ${userInput}`;
      // Fix: Ensure all string parts are wrapped in a text object
      parts.push({text: userPrompt});
      model = GEMINI_MODEL_TEXT;
      break;
    case InputType.IMAGE_UPLOAD:
      if (!imageFile) {
        throw new Error('Image file is required for IMAGE_UPLOAD input type.');
      }
      userPrompt = `Please verify the content of this image. Look for visual inconsistencies, signs of AI generation or digital alteration, or if it's used out of context.`;
      const base64Image = await blobToBase64(imageFile);
      // Fix: Ensure all string parts are wrapped in a text object
      parts.push({ text: userPrompt });
      parts.push({
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image,
        },
      });
      model = GEMINI_MODEL_IMAGE; // Use an image-capable model
      break;
    case InputType.VIDEO_DESCRIPTION:
        userPrompt = `Please verify the content described in this video description: ${userInput}`;
        // Fix: Ensure all string parts are wrapped in a text object
        parts.push({text: userPrompt});
        model = GEMINI_MODEL_TEXT; // Use the text model for descriptions
        break;
    default:
      throw new Error('Unsupported input type.');
  }

  try {
    // Fix: `contents` object is now correctly formed with `Part[]`
    const contents = {parts: parts};

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      // Use googleSearch tool for more up-to-date and external information verification
      // This is crucial for a fact-checking assistant
      config: {
        tools: [{googleSearch: {}}],
        temperature: 0.2, // Keep temperature low for factual tasks
        topP: 0.9,
        topK: 40,
      }
    });

    const rawTextResponse = response.text;
    if (!rawTextResponse) {
      throw new Error("Gemini API returned an empty response.");
    }

    const factCheckResult = parseFactCheckResponse(rawTextResponse);

    // Extract and add Google Search sources if available
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const searchSources = response.candidates[0].groundingMetadata.groundingChunks
        .map(chunk => chunk.web?.uri)
        .filter((uri): uri is string => !!uri && uri.trim() !== '')
        .map(uri => {
          try {
            const url = new URL(uri);
            // Return hostname or a shortened version of the URL
            return url.hostname;
          } catch (e) {
            return uri; // Fallback to raw URI if invalid URL
          }
        });

      // Filter out duplicate sources
      factCheckResult.sources = [...new Set([...factCheckResult.sources, ...searchSources])];
    }


    return factCheckResult;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Provide a generic unverified response on API error
    return {
      verdict: Verdict.UNVERIFIED,
      confidenceScore: 0,
      coreFinding: `Could not complete verification due to an internal error: ${error instanceof Error ? error.message : String(error)}.`,
      evidence: ['Failed to reach verification service.'],
      sources: [],
    };
  }
}