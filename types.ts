
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
  titleYPos: number;
  titleXPos: number;
  bodyYPos: number;
  bodyXPos: number;
  imageXPos: number;
  imageYPos: number;
  imageScale: number;
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
  ANALYZING_WORD = 'ANALYZING_WORD',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  WORD_READY = 'WORD_READY',
  GENERATING_PPT = 'GENERATING_PPT',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface Source {
  id: string;
  type: 'url' | 'file';
  value: string;
  name: string;
}

export interface WordSection {
  title: string;
  content: string;
}
