export type Lang = "zh" | "en"

export interface ResumeLink {
  label: string
  url: string
}

export interface ExperienceItem {
  company: string
  role: string
  location: string
  start: string
  end: string
  highlights: string[]
}

export interface ProjectItem {
  name: string
  role: string
  description: string
  highlights: string[]
}

export interface EducationItem {
  school: string
  degree: string
  start: string
  end: string
}

export interface ResumeData {
  name: string
  title: string
  email: string
  phone: string
  location: string
  photo: string
  links: ResumeLink[]
  summary: string
  skills: string[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  education: EducationItem[]
}

export interface OptimizeResult {
  resume: ResumeData
  jd: string // Original JD text — used by matching engine
  matchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
}

// Re-export MatchResult from matching engine for UI components
export type { MatchResult, DimensionBreakdown } from "./matching"

export const emptyResume: ResumeData = {
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  photo: "",
  links: [],
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
}

const STORAGE_KEY = "jobfit:result"

export function saveResult(result: OptimizeResult) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result))
}

export function loadResult(): OptimizeResult | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OptimizeResult
  } catch {
    return null
  }
}

export function clearResult() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STORAGE_KEY)
}
