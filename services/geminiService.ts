
import { GoogleGenAI, Type } from "@google/genai";
import { CaseAnalysis, SlideData, SlideStyle, Source, WordSection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const WORD_SYSTEM_INSTRUCTION = `You are a world-class European Privacy Compliance Expert and GDPR specialist. 
Analyze legal cases/documents with extreme precision. Produce a comprehensive Word-ready analysis.

STRICT CONTENT STRUCTURE:
1. Summary (H1): Exactly 3 paragraphs. 
   - Para 1: The Incident (Who, what, when, fine amount).
   - Para 2: The Violations (Specific practices that breached regulations).
   - Para 3: Mitigation (Strategic advice to avoid recurrence).
2. Timeline (H1): Use bullets in format: [Date] - [Who] - [Action/What happened]. Be exhaustive with key dates (investigation, replies, preliminary findings, final decision).
3. Process (H1): Dialogue format. Contrast "Company's Argument/Defense" vs "Regulator's Counter-argument/Finding". Show the legal struggle.
4. Takeaway (H1): Strategic design constraints and advice specifically for Product Managers. Focus on Privacy by Design.
5. For DPO (H1): Highly technical legal analysis. Use professional terminology (Art. 32, Art. 5, etc.). Focus on legal facts and defense strategies.

FORMATTING:
- Language: English.
- Tone: Professional, authoritative, and expert.
- No length limit: Be as detailed as necessary to capture all critical legal nuances.`;

const PPT_SYSTEM_INSTRUCTION = `You are a strategic presentation designer. 
Convert the provided expert Word analysis into a polished, high-impact PPT outline.
Focus on visual synthesis for executives. 
The presentation should include:
1. Title Slide (Impactful)
2. Executive Summary (Strategic overview)
3. The Legal Timeline (Key milestones)
4. The Conflict: Company vs Regulator (Side-by-side comparison)
5. Product Strategy (PM Takeaways)
6. DPO Technical Deep Dive (Legal facts)`;

const DEFAULT_STYLE: SlideStyle = {
  backgroundColor: '#FFFFFF',
  textColor: '#1E293B',
  accentColor: '#4F46E5',
  titleFontSize: 32,
  bodyFontSize: 18,
  titleYPos: 10,
  titleXPos: 5,
  bodyYPos: 25,
  bodyXPos: 5,
  imageXPos: 65,
  imageYPos: 25,
  imageScale: 1.0,
  lineSpacing: 1.5
};

export async function validateSources(sources: Source[]): Promise<boolean> {
  const combinedContext = sources.map(s => `Type: ${s.type}, Content/Name: ${s.name}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Examine the following input sources and determine if they are related to a legal case decision, regulatory finding, or official fine (e.g., GDPR fines, court judgments). 
    Respond ONLY with "true" if it is a case decision, and "false" if it is just random news, generic text, or unrelated content.\n\n${combinedContext}`,
    config: {
      temperature: 0.1,
    }
  });

  const result = response.text.toLowerCase().trim();
  return result.includes('true');
}

export async function generateWordAnalysis(sources: Source[]): Promise<WordSection[]> {
  const combinedContent = sources.map(s => `${s.type === 'url' ? 'URL' : 'Document'}: ${s.value}`).join('\n\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze these sources and create the 5-part expert Word analysis. Do not miss important details.\n\n${combinedContent.substring(0, 40000)}`,
    config: {
      systemInstruction: WORD_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    }
  });
  
  return JSON.parse(response.text || '[]');
}

export async function generatePPTFromWord(wordContent: WordSection[]): Promise<CaseAnalysis> {
  const textContext = wordContent.map(s => `${s.title}\n${s.content}`).join('\n\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Transform this analysis into a strategic deck:\n\n${textContext}`,
    config: {
      systemInstruction: PPT_SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          presentationTitle: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          slides: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                points: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      bold: { type: Type.BOOLEAN },
                      color: { type: Type.STRING },
                      isHeading: { type: Type.BOOLEAN }
                    },
                    required: ["text"]
                  }
                },
                type: { type: Type.STRING, enum: ['title', 'toc', 'strategic_summary', 'content', 'dpo_technical', 'pm_takeaway'] },
                companyName: { type: Type.STRING },
                authorityName: { type: Type.STRING },
                companyLogoUrl: { type: Type.STRING },
                authorityLogoUrl: { type: Type.STRING },
                authorityOpinions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "points", "type"]
            }
          }
        },
        required: ["presentationTitle", "subtitle", "slides"]
      }
    }
  });

  const data = JSON.parse(response.text || '{}');
  data.slides = data.slides.map((s: any, i: number) => ({
    ...s,
    id: `slide-${i}-${Date.now()}`,
    style: { ...DEFAULT_STYLE }
  }));
  return data as CaseAnalysis;
}

export async function generateComplexScenarioVisual(slide: SlideData): Promise<string> {
  const prompt = `A professional, corporate strategic visualization representing: ${slide.title}. High-end legal design, minimal, aesthetic, NO TEXT.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Visual generation failed.");
}
