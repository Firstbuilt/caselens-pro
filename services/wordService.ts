
import { WordSection } from "../types";

export function exportToWord(sections: WordSection[], fileName: string = "Case_Analysis"): void {
  const htmlHeader = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export</title>
    <style>
      body { font-family: 'Arial', sans-serif; line-height: 1.5; padding: 1in; }
      h1 { font-size: 16pt; font-weight: bold; margin-top: 20pt; color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 5pt; }
      p { font-size: 11pt; margin-bottom: 12pt; text-align: justify; line-height: 1.5; }
      ul { margin-bottom: 12pt; }
      li { margin-bottom: 6pt; list-style-type: disc; margin-left: 20pt; }
    </style>
    </head><body>
  `;
  const htmlFooter = "</body></html>";
  
  let content = "";
  sections.forEach(section => {
    content += `<h1>${section.title}</h1>`;
    const lines = section.content.split('\n').filter(l => l.trim() !== '');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        content += `<ul><li>${trimmed.replace(/^[-*]|\d+\.\s+/, '').trim()}</li></ul>`;
      } else {
        content += `<p>${trimmed}</p>`;
      }
    });
  });

  const fullHtml = htmlHeader + content + htmlFooter;
  const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
