
import { GoogleGenAI, Type } from "@google/genai";
import { CaseAnalysis, SlideData, SlideStyle, Source, WordSection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const WORD_SYSTEM_INSTRUCTION = `You are a world-class European Privacy Compliance Expert and GDPR specialist. 
Analyze legal cases/documents with extreme precision. Produce a comprehensive Word-ready analysis in RICH MARKDOWN FORMAT.

STRICT CONTENT STRUCTURE (Use Markdown headers # and ##):
1. Summary (H1): Exactly 3 paragraphs using bold text for impact.
   - Para 1: The Incident (Who, what, when, fine amount).
   - Para 2: The Violations (Specific practices that breached regulations).
   - Para 3: Mitigation (Strategic advice to avoid recurrence).
2. Timeline (H1): Use a Markdown TABLE with columns: [Date], [Stakeholder], [Action]. Be exhaustive.
3. Process (H1): Dialogue format using bold titles. Contrast "Company's Argument/Defense" vs "Regulator's Counter-argument/Finding".
4. Takeaway (H1): Strategic design constraints and advice specifically for Product Managers. Use Markdown lists and Blockquotes.
5. For DPO (H1): Highly technical legal analysis. Use professional terminology (Art. 32, Art. 5, etc.). Focus on legal facts and defense strategies.

FORMATTING:
- Language: English.
- Formatting: Use # for section titles, ## for subheaders, **bold** for key terms, and > for expert notes.
- No length limit: Be as detailed as necessary to capture all critical legal nuances.`;

const PPT_SYSTEM_INSTRUCTION = `You are a strategic presentation designer for C-suite executives. 
Convert the provided expert Word analysis into a polished, high-impact PPT outline.
You MUST generate between 8 to 12 slides to ensure full coverage of the legal complexity.

CRITICAL INSTRUCTION FOR CONTENT DEPTH:
- DO NOT use short bullet points, fragments, or single keywords (e.g., NEVER use just "Fine: €405m").
- EVERY bullet point MUST be a FULL DESCRIPTIVE EXPLANATION (at least 2-3 sentences).
- Each point should clearly describe the "Context" (What happened), the "Rationale" (Why it is legally or strategically significant), and the "Impact" (How this affects future operations).
- Users need to understand the "Why" and "How" of each finding without needing to refer back to the full report.

The presentation should include:
1. Title Slide (Impactful executive title)
2. Strategic Executive Summary (Deep overview of the crisis and organizational impact)
3. Technical Analysis of Violations (Detailed breakdown of the specific regulatory breaches)
4. Legal Milestone Narrative (A comprehensive timeline explaining the procedural history)
5. Defense vs Ruling Analysis (A side-by-side comparison of the company's legal logic versus the regulator's final findings)
6. Fine Calculation Rationale (In-depth analysis of why the penalty was scaled based on global turnover and severity)
7. DPO Technical Deep Dive (Advanced review of Article 5, 25, 32, etc.)
8. Product Strategy & Design Hardening (Specific roadmap changes and UX constraints for PM teams)
9. Remediation & Future-Proofing (Detailed strategic next steps for the organization)

Each slide must have at least 3-4 highly detailed, explanatory points. Use "isHeading: true" for major sub-topics within slides.`;

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

  const result = (response.text || '').toLowerCase().trim();
  return result.includes('true');
}

export async function extractTextFromSources(sources: Source[]): Promise<string> {
  const parts: any[] = [];
  const urls: string[] = [];

  sources.forEach(s => {
    if (s.type === 'url') {
      urls.push(s.value);
      parts.push({ text: `TASK: Extract verbatim text from this URL: ${s.value}. 
      If you encounter a 403, 404, or bot-block, IMMEDIATELY use Google Search to find the content of this specific document/page. 
      Look for official mirrors, PDF versions, or cached content.` });
    } else {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: s.value
        }
      });
      parts.push({ text: `Please extract all text content from this document: ${s.name}` });
    }
  });

  parts.push({ text: "CRITICAL: Return ONLY the raw text content. No summaries. No analysis. If you absolutely cannot find the content after trying both direct access and search, explain exactly why (e.g., 'Site blocked AI access')." });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: {
      tools: urls.length > 0 ? [{ urlContext: {} }, { googleSearch: {} }] : undefined,
      temperature: 0.1,
    }
  });
  
  return response.text || '';
}

export async function generateWordAnalysis(rawText: string): Promise<WordSection[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this extracted text and create the 5-part expert Word analysis in Markdown.\n\n${rawText.substring(0, 40000)}`,
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
  
  const jsonStr = response.text || '[]';
  return JSON.parse(jsonStr);
}

export async function generatePPTFromWord(wordContent: WordSection[]): Promise<CaseAnalysis> {
  const textContext = wordContent.map(s => `${s.title}\n${s.content}`).join('\n\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Transform this analysis into a comprehensive strategic deck (at least 8 slides with ELABORATE, DESCRIPTIVE, MULTI-SENTENCE bullets for every point):\n\n${textContext}`,
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

  const jsonStr = response.text || '{}';
  const data = JSON.parse(jsonStr);
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
