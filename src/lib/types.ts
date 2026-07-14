export type Locale = "en" | "ar";

export type TemplateId = "classic" | "modern" | "minimal" | "executive" | "creative";

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Experience {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  outcomes: string[];
  url?: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  projects?: Project[];
  education: Education[];
  skills: string[];
  certifications?: string[];
  courses?: string[];
  languages?: string[];
}

export interface UserInfoInput {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  targetRole?: string;
  summary?: string;
  experience: string;
  education: string;
  skills: string;
  certifications?: string;
  languages?: string;
  additionalInfo?: string;
}

export interface ResumeBasics {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  targetRole: string;
  careerBackground: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  placeholder?: string;
  category:
    | "experience"
    | "skills"
    | "education"
    | "achievements"
    | "projects"
    | "technologies"
    | "certifications"
    | "general";
}

export interface InterviewAnswer {
  questionId: string;
  answer: string;
}

export interface ATSBreakdown {
  formatting: number;
  keywords: number;
  structure: number;
  content: number;
  readability: number;
}

export interface ATSAnalysis {
  score: number;
  breakdown: ATSBreakdown;
  suggestions: string[];
  strengths: string[];
  extractedText: string;
}

export interface CoverLetterResult {
  coverLetter: string;
  enhancements: string[];
  keywordMatches?: string[];
  missingKeywords?: string[];
}
