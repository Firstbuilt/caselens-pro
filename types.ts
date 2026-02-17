
export interface StyledPoint {
  text: string;
  bold?: boolean;
  color?: string;
  fontSize?: number;
  isHeading?: boolean;
}

export interface SlideStyle {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  titleFontSize: number;
  bodyFontSize: number;
  titleYPos: number; // 0-100 percentage
  titleXPos: number; // 0-100 percentage
  bodyYPos: number;  // 0-100 percentage
  bodyXPos: number;  // 0-100 percentage
  imageXPos: number; // 0-100 percentage
  imageYPos: number; // 0-100 percentage
  imageScale: number; // 0.1 - 2.0
  lineSpacing: number;
}

export interface SlideData {
  id: string;
  title: string;
  points: StyledPoint[];
  type: 'title' | 'toc' | 'strategic_summary' | 'content' | 'dpo_technical' | 'pm_takeaway';
  imageUrl?: string;
  imageLoading?: boolean;
  style: SlideStyle;
  authorityOpinions?: string[]; 
  companyName?: string;
  authorityName?: string;
  companyLogoUrl?: string;
  authorityLogoUrl?: string;
}

export interface CaseAnalysis {
  presentationTitle: string;
  subtitle: string;
  slides: SlideData[];
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  OUTLINE_READY = 'OUTLINE_READY',
  GENERATING_CONTENT = 'GENERATING_CONTENT',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface Source {
  id: string;
  type: 'url' | 'file';
  value: string;
  name: string;
}
