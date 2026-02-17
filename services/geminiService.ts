
import { GoogleGenAI, Type } from "@google/genai";
import { CaseAnalysis, SlideData, SlideStyle, Source, StyledPoint } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are a world-class strategic presentation designer.
Your goal: Synthesize multi-source case information into a highly polished, narrative-driven deck for stakeholders.

STRICT CONTENT RULES:
1. NO BLANK LINES: Do not include empty strings, whitespace-only points, or \n characters that create vertical gaps between bullets.
2. SELECTIVE HIGHLIGHTING: Use 'bold' and 'color' (Hex) ONLY for critical keywords, dates, or figures.
3. LINE SPACING: The design must accommodate 1.5 line spacing. Keep text extremely concise (max 40-50 words per slide) to prevent overflow.
4. NARRATIVE: Focus on "What happened", "Why did it happen", and "Strategic Mitigation".

SPECIFIC SLIDE SEQUENCE:
1. Title Slide: [Company] vs [Authority]. Search for PNG/JPG logos.
2. Table of Contents.
3. Strategic Summary: Narrative questions + Authority Opinions panel.
4. Analysis Slides: Synthesized facts with selective keyword highlighting.
5. Technical compliance & PM takeaways.`;

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

export async function generateOutline(sources: Source[]): Promise<string[]> {
  const combinedContent = sources.map(s => `${s.type === 'url' ? 'URL' : 'Document'}: ${s.value}`).join('\n\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze these sources and create a comprehensive strategic outline.\n\n${combinedContent.substring(0, 30000)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function generateSlideContent(outline: string[], sources: Source[]): Promise<CaseAnalysis> {
  const combinedContent = sources.map(s => `${s.type === 'url' ? 'URL' : 'Document'}: ${s.value}`).join('\n\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Fulfill content for these slides. 
    IMPORTANT: No blank lines between bullets. 
    Use 'bold' and 'color' sparingly to HIGHLIGHT only key info within points.
    Outline: ${JSON.stringify(outline)}
    Sources: ${combinedContent.substring(0, 30000)}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
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
                      color: { type: Type.STRING, description: "Hex code for highlighting" },
                      fontSize: { type: Type.NUMBER },
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
  const prompt = `A professional strategic diagram or technical flowchart for the topic: ${slide.title}. 
  Content points context: ${slide.points.map(p => p.text).join('. ')}. 
  Style: Minimalist high-end corporate vector illustration, professional palette, clear logic flow, NO TEXT.`;

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
