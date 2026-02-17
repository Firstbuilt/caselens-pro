
import { CaseAnalysis, SlideData, StyledPoint } from "../types";

// The PptxGenJS library is loaded via script tag in index.html and exposes a global constructor.
declare const PptxGenJS: any;

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || !url.startsWith('http')) return false;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.svg')) return false;
  return true;
}

function getAdjustedSizes(slide: SlideData) {
  const MAX_TITLE = 32;
  const MAX_BODY = 20;
  
  let titleSize = Math.min(slide.style.titleFontSize, MAX_TITLE);
  let bodySize = Math.min(slide.style.bodyFontSize, MAX_BODY);
  
  const totalChars = slide.points.reduce((acc, p) => acc + p.text.length, 0);
  const pointCount = slide.points.length;

  if (slide.type === 'strategic_summary') {
    titleSize = Math.min(titleSize, 28);
    bodySize = Math.min(bodySize, 18);
    return { titleSize, bodySize };
  }

  if (totalChars > 600 || pointCount > 7) {
    bodySize = Math.max(14, bodySize * 0.85);
    titleSize = Math.max(24, titleSize * 0.9);
  } else if (totalChars > 400 || pointCount > 5) {
    bodySize = Math.max(16, bodySize * 0.9);
  }

  return { titleSize, bodySize };
}

export async function generatePPT(data: CaseAnalysis): Promise<void> {
  try {
    const PptxConstructor = (window as any).PptxGenJS || PptxGenJS;
    if (!PptxConstructor) {
      throw new Error("PowerPoint library not found.");
    }

    const pptx = new PptxConstructor();
    pptx.layout = 'LAYOUT_WIDE';
    
    data.slides.forEach((slideData: SlideData) => {
      const slide = pptx.addSlide();
      const { titleSize, bodySize } = getAdjustedSizes(slideData);
      
      const { 
        backgroundColor, textColor, accentColor, 
        titleYPos, titleXPos, 
        bodyYPos, bodyXPos, 
        imageXPos, imageYPos, 
        imageScale, lineSpacing 
      } = slideData.style;
      
      slide.background = { color: backgroundColor.replace('#', '') };
      
      const canvasWidth = 13.33;
      const canvasHeight = 7.5;
      const safeTextColor = textColor.replace('#', '');
      const safeAccentColor = accentColor.replace('#', '');

      if (slideData.type === 'title') {
        const companyText = slideData.companyName || "Organization";
        const authorityText = slideData.authorityName || "Regulator";

        if (isValidImageUrl(slideData.companyLogoUrl)) {
          try {
            slide.addImage({ 
              path: slideData.companyLogoUrl, 
              x: (titleXPos / 100) * canvasWidth, 
              y: ((titleYPos - 12) / 100) * canvasHeight, 
              w: 1, h: 1,
              sizing: { type: 'contain', w: 1, h: 1 }
            });
          } catch (e) { console.warn("Logo error", e); }
        }
        
        if (isValidImageUrl(slideData.authorityLogoUrl)) {
          try {
            slide.addImage({ 
              path: slideData.authorityLogoUrl, 
              x: ((titleXPos + 22) / 100) * canvasWidth, 
              y: ((titleYPos - 12) / 100) * canvasHeight, 
              w: 1, h: 1,
              sizing: { type: 'contain', w: 1, h: 1 }
            });
          } catch (e) { console.warn("Logo error", e); }
        }

        slide.addText([
          { text: companyText, options: { bold: true, color: safeTextColor } },
          { text: " vs ", options: { italic: true, color: safeAccentColor } },
          { text: authorityText, options: { bold: true, color: safeTextColor } }
        ], {
          x: (titleXPos / 100) * canvasWidth, 
          y: (titleYPos / 100) * canvasHeight, 
          w: 12, fontSize: titleSize + 10, align: 'left'
        });

        slide.addText(data.subtitle, {
          x: (titleXPos / 100) * canvasWidth, 
          y: ((titleYPos + 18) / 100) * canvasHeight, 
          w: 10, fontSize: 24, color: safeAccentColor, align: 'left'
        });

      } else if (slideData.type === 'strategic_summary') {
        slide.addText(slideData.title, {
          x: (titleXPos / 100) * canvasWidth, y: (titleYPos / 100) * canvasHeight, 
          w: 12, fontSize: titleSize, bold: true, color: safeTextColor
        });

        const leftItems: any[] = [];
        slideData.points.forEach((p, idx) => {
          const keywords = ["What happened?", "Why did it happen?", "How do we avoid this?"];
          const keyword = keywords.find(k => p.text.startsWith(k));
          const isLast = idx === slideData.points.length - 1;
          const suffix = isLast ? "" : "\n";

          if (keyword) {
            leftItems.push({ text: keyword, options: { bold: true, color: '2563EB', fontSize: bodySize + 4 } });
            leftItems.push({ text: "\n" + p.text.substring(keyword.length).trim() + suffix, options: { color: safeTextColor, fontSize: bodySize } });
          } else {
            leftItems.push({ text: p.text.trim() + suffix, options: { color: safeTextColor, fontSize: bodySize } });
          }
        });

        slide.addText(leftItems, { 
          x: 0.5, y: 1.8, w: 7, h: 5.2, 
          valign: 'top', 
          lineSpacingMultiple: lineSpacing 
        });

        slide.addShape(pptx.ShapeType.rect, { 
          x: 7.8, y: 1.4, w: 5.2, h: 5.7, 
          fill: { color: 'EFF6FF' },
          line: { color: 'DBEafe', width: 1 }
        });
        
        slide.addText("AUTHORITY OPINIONS", { 
          x: 8.0, y: 1.6, w: 4.8, 
          fontSize: 16, bold: true, color: '1E40AF', 
          align: 'left' 
        });
        
        const opinions = (slideData.authorityOpinions || []).map(o => ({ 
          text: o.trim(), options: { bullet: true, color: '1E3A8A', fontSize: bodySize - 4, margin: 5 } 
        }));
        
        slide.addText(opinions, { 
          x: 8.0, y: 2.1, w: 4.8, h: 4.7, 
          valign: 'top', 
          lineSpacingMultiple: 1.2 
        });
        
      } else {
        slide.addText(slideData.title, {
          x: (titleXPos / 100) * canvasWidth, y: (titleYPos / 100) * canvasHeight, 
          w: 12, fontSize: titleSize, bold: true, color: safeTextColor
        });
        
        const hasImage = !!slideData.imageUrl;
        const textWidth = hasImage ? (imageXPos / 100) * canvasWidth - (bodyXPos / 100) * canvasWidth - 0.5 : 12;

        const styledPoints = slideData.points.map(p => ({
          text: p.text.trim(),
          options: {
            bullet: !p.isHeading,
            bold: p.bold || p.isHeading,
            color: (p.color || safeTextColor).replace('#', ''),
            fontSize: p.fontSize || (p.isHeading ? bodySize + 4 : bodySize),
            margin: 8,
            lineSpacingMultiple: lineSpacing
          }
        }));

        slide.addText(styledPoints, {
          x: (bodyXPos / 100) * canvasWidth, 
          y: (bodyYPos / 100) * canvasHeight, 
          w: textWidth, 
          h: 5.5, 
          valign: 'top'
        });

        if (hasImage && slideData.imageUrl) {
          try {
            slide.addImage({ 
              data: slideData.imageUrl, 
              x: (imageXPos / 100) * canvasWidth, 
              y: (imageYPos / 100) * canvasHeight, 
              w: 5 * imageScale, h: 4 * imageScale,
              sizing: { type: 'contain', w: 5 * imageScale, h: 4 * imageScale }
            });
          } catch (e) { console.warn("Scenario image error", e); }
        }
      }

      slide.addText("CaseLens Pro | AI Strategic Synthesis", { 
        x: 0.5, y: 7.1, 
        w: 4, fontSize: 9, color: '94A3B8' 
      });
    });

    const safeTitle = data.presentationTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    await pptx.writeFile({ fileName: `${safeTitle}_deck.pptx` });
  } catch (err) {
    console.error("PPT Error:", err);
    alert("Export failed: " + (err instanceof Error ? err.message : String(err)));
    throw err;
  }
}
