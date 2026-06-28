import type { Lang, OptimizeResult, ResumeData } from "./resume"

export interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export const DEFAULT_BASE_URL = "https://api.openai.com/v1"
export const DEFAULT_MODEL = "gpt-4o-mini"

interface OptimizeArgs {
  config: AIConfig
  jd: string
  resume: string
  lang: Lang
}

const RESUME_SHAPE = `{
  "resume": {
    "name": string,
    "title": string,
    "email": string,
    "phone": string,
    "location": string,
    "links": [{ "label": string, "url": string }],
    "summary": string,
    "skills": string[],
    "experience": [{ "company": string, "role": string, "location": string, "start": string, "end": string, "highlights": string[] }],
    "projects": [{ "name": string, "role": string, "description": string, "highlights": string[] }],
    "education": [{ "school": string, "degree": string, "start": string, "end": string }]
  },
  "matchScore": number,
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "suggestions": string[]
}`

function buildPrompt(jd: string, resume: string, lang: Lang) {
  const langLabel = lang === "zh" ? "Simplified Chinese" : "English"
  return `You are a senior technical recruiter and professional resume writer.
Rewrite and optimize the candidate's resume so it best matches the target job description (JD).

Rules:
- Keep all real facts truthful. Do NOT invent fake jobs, degrees, or numbers.
- Rephrase bullet points to highlight impact, use strong action verbs and quantified results where the original provides them.
- Align wording with keywords and skills from the JD where the candidate genuinely qualifies.
- Each experience/project highlight must be a single concise sentence.
- Write ALL resume content in ${langLabel}.
- "matchScore" is an integer 0-100 estimating fit AFTER optimization.
- "matchedKeywords" are JD keywords already covered. "missingKeywords" are important JD keywords the candidate lacks.
- "suggestions" are 3-5 short actionable tips (in ${langLabel}) to further improve the match.

Return ONLY valid JSON in exactly this shape, no markdown, no commentary:
${RESUME_SHAPE}

=== TARGET JOB DESCRIPTION ===
${jd}

=== CANDIDATE RESUME ===
${resume}`
}

function normalize(raw: any): OptimizeResult {
  const r = raw?.resume ?? {}
  const resume: ResumeData = {
    name: r.name ?? "",
    title: r.title ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    location: r.location ?? "",
    links: Array.isArray(r.links) ? r.links : [],
    summary: r.summary ?? "",
    skills: Array.isArray(r.skills) ? r.skills : [],
    experience: Array.isArray(r.experience)
      ? r.experience.map((e: any) => ({
          company: e.company ?? "",
          role: e.role ?? "",
          location: e.location ?? "",
          start: e.start ?? "",
          end: e.end ?? "",
          highlights: Array.isArray(e.highlights) ? e.highlights : [],
        }))
      : [],
    projects: Array.isArray(r.projects)
      ? r.projects.map((p: any) => ({
          name: p.name ?? "",
          role: p.role ?? "",
          description: p.description ?? "",
          highlights: Array.isArray(p.highlights) ? p.highlights : [],
        }))
      : [],
    education: Array.isArray(r.education)
      ? r.education.map((ed: any) => ({
          school: ed.school ?? "",
          degree: ed.degree ?? "",
          start: ed.start ?? "",
          end: ed.end ?? "",
        }))
      : [],
  }
  return {
    resume,
    matchScore: typeof raw?.matchScore === "number" ? Math.max(0, Math.min(100, Math.round(raw.matchScore))) : 0,
    matchedKeywords: Array.isArray(raw?.matchedKeywords) ? raw.matchedKeywords : [],
    missingKeywords: Array.isArray(raw?.missingKeywords) ? raw.missingKeywords : [],
    suggestions: Array.isArray(raw?.suggestions) ? raw.suggestions : [],
  }
}

export async function optimizeResume({ config, jd, resume, lang }: OptimizeArgs): Promise<OptimizeResult> {
  const baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "")
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || DEFAULT_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You output only valid JSON." },
        { role: "user", content: buildPrompt(jd, resume, lang) },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`请求失败 (${res.status}): ${text.slice(0, 200) || res.statusText}`)
  }

  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ""
  if (!content) throw new Error("模型未返回内容，请检查模型名称或额度。")

  let parsed: any
  try {
    parsed = JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("无法解析模型返回的 JSON 内容。")
    parsed = JSON.parse(match[0])
  }
  return normalize(parsed)
}
