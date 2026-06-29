// ============================================================
// Production Resume-JD Matching Engine
//
// Five dimensions, weighted scoring, fully deterministic:
//   1. Hard Requirements  (20%) — education, years, location
//   2. Skill Match        (35%) — normalized keywords + hierarchy
//   3. Experience Match   (25%) — industry, level, project relevance
//   4. Semantic Similarity(15%) — keyword Jaccard (can upgrade to embedding)
//   5. Bonus              ( 5%) — big company, GitHub, certs, completeness
// ============================================================

import type { ResumeData } from "./resume"
import {
  normalizeSkill,
  extractSkills,
  extractIndustries,
  extractEducationLevel,
  educationLevelScore,
  extractYearsRequirement,
  estimateTotalYears,
  experienceYearsScore,
  extractLocation,
  locationScore,
  hasBigCompanyExperience,
  hasCertificates,
  hasGitHub,
  hasPortfolio,
  getSkillWeight,
  SKILL_HIERARCHY,
} from "./skill-graph"

// ---- Result Types ----
export interface DimensionBreakdown {
  label: string        // e.g. "硬性条件"
  score: number        // 0-100
  weight: number       // e.g. 0.20
  detail: string       // e.g. "学历达标 · 年限匹配 · 同城"
}

export interface MatchResult {
  score: number                       // 0-100
  breakdown: DimensionBreakdown[]
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
}

// ---- 1. HARD REQUIREMENTS (20%) ----
function matchHardRequirements(jd: string, resume: ResumeData): { score: number; detail: string } {
  const parts: string[] = []

  // Education
  const jdEdu = extractEducationLevel(jd)
  const resumeEdu = extractEducationLevel(
    resume.education.map((e) => e.degree).join(" ") || resume.summary,
  )
  const eduScore = educationLevelScore(jdEdu, resumeEdu)
  const eduLabel =
    jdEdu === "unknown"
      ? "JD未指定学历"
      : resumeEdu === "unknown"
        ? "简历未识别学历"
        : eduScore >= 1
          ? "学历达标"
          : eduScore >= 0.5
            ? "学历略低一级"
            : "学历不匹配"
  parts.push(eduLabel)

  // Years
  const jdYears = extractYearsRequirement(jd)
  const actualYears = estimateTotalYears(resume.experience)
  const yearsScore = experienceYearsScore(jdYears, actualYears)
  const yearsLabel =
    jdYears.min === 0 && jdYears.max === 99
      ? "JD未指定年限"
      : yearsScore >= 1
        ? `年限匹配 (${actualYears}年)`
        : yearsScore >= 0.5
          ? `年限接近 (需${jdYears.min}年, 有${actualYears}年)`
          : `年限不足 (需${jdYears.min}年, 有${actualYears}年)`
  parts.push(yearsLabel)

  // Location
  const jdLoc = extractLocation(jd)
  const resumeLoc = extractLocation(resume.location)
  const locScore = locationScore(jdLoc, resumeLoc)
  const locLabel =
    !jdLoc
      ? "JD未指定地点"
      : locScore >= 1
        ? "同城"
        : locScore >= 0.5
          ? "地点未知(假设可迁)"
          : `异地 (JD:${jdLoc}, 简历:${resumeLoc})`
  parts.push(locLabel)

  const score = (eduScore * 0.4 + yearsScore * 0.4 + locScore * 0.2) * 100
  return { score: Math.round(score), detail: parts.join(" · ") }
}

// ---- 2. SKILL MATCH (35%) ----
function matchSkills(
  jd: string,
  resume: ResumeData,
): { score: number; detail: string; matched: string[]; missing: string[] } {
  const jdSkills = extractSkills(jd)
  const resumeSkillsRaw = resume.skills.map(normalizeSkill)
  const resumeSkills = new Set(resumeSkillsRaw)

  // Also extract skills from experience descriptions for deeper matching
  const expText = resume.experience
    .flatMap((e) => [e.role, e.company, ...e.highlights])
    .join(" ")
  const projectText = resume.projects
    .flatMap((p) => [p.name, p.description, ...p.highlights])
    .join(" ")
  const extraSkills = extractSkills(expText + " " + projectText)
  for (const s of extraSkills) resumeSkills.add(normalizeSkill(s))

  let totalWeight = 0
  let matchedWeight = 0
  const matched: string[] = []
  const missing: string[] = []

  for (const jdSkill of jdSkills) {
    const canon = normalizeSkill(jdSkill)
    const weight = getSkillWeight(canon)
    totalWeight += weight

    // Exact match
    if (resumeSkills.has(canon)) {
      matchedWeight += weight
      matched.push(jdSkill)
      continue
    }

    // Hierarchy: JD asks for parent → resume has child? (0.6x)
    const children = SKILL_HIERARCHY[canon] ?? []
    const childMatch = children.some((child) => resumeSkills.has(normalizeSkill(child)))
    if (childMatch) {
      matchedWeight += weight * 0.6
      matched.push(jdSkill)
      continue
    }

    // Hierarchy: JD asks for child → resume has parent? (0.4x)
    let parentMatch = false
    for (const [parent, kids] of Object.entries(SKILL_HIERARCHY)) {
      if (kids.map((k) => k.toLowerCase()).includes(canon.toLowerCase())) {
        if (resumeSkills.has(normalizeSkill(parent))) {
          matchedWeight += weight * 0.4
          matched.push(jdSkill)
          parentMatch = true
          break
        }
      }
    }
    if (parentMatch) continue

    missing.push(jdSkill)
  }

  // If no skills detected in JD, give full marks (avoid penalizing)
  if (totalWeight === 0) {
    return { score: 100, detail: "JD中未检测到技能关键词", matched: [], missing: [] }
  }

  const score = (matchedWeight / totalWeight) * 100
  return {
    score: Math.round(score),
    detail: `${matched.length}/${jdSkills.length} 项技能匹配`,
    matched,
    missing,
  }
}

// ---- 3. EXPERIENCE MATCH (25%) ----
function matchExperience(
  jd: string,
  resume: ResumeData,
): { score: number; detail: string } {
  const parts: string[] = []
  let total = 0
  let count = 0

  // Industry overlap
  const jdIndustries = extractIndustries(jd)
  const resumeText = [
    resume.summary,
    ...resume.experience.flatMap((e) => [e.company, e.role, ...e.highlights]),
    ...resume.projects.flatMap((p) => [p.name, p.description, ...p.highlights]),
  ].join(" ")
  const resumeIndustries = extractIndustries(resumeText)

  if (jdIndustries.length > 0) {
    const overlap = jdIndustries.filter((i) => resumeIndustries.includes(i))
    const industryScore = overlap.length / jdIndustries.length
    total += industryScore
    count++
    parts.push(`行业匹配 ${overlap.length}/${jdIndustries.length}`)
  } else {
    total += 0.7 // No industry specified → moderate default
    count++
    parts.push("JD未明确行业")
  }
  if (jdIndustries.length > 0 && resumeIndustries.length === 0) {
    parts.push("简历未识别行业")
  }

  // Level / seniority match (compare titles)
  const SENIOR_TITLES = /senior|sr\.|staff|principal|高级|资深|专家|负责人|lead|head|director|vp|经理|主管|架构师/i
  const MID_TITLES = /mid|intermediate|中级|工程师|developer|engineer/i
  const JUNIOR_TITLES = /junior|jr\.|associate|初级|助理|实习|intern|trainee/i

  const jdSeniority = SENIOR_TITLES.test(jd) ? "senior"
    : JUNIOR_TITLES.test(jd) ? "junior"
    : "mid"
  const resumeTitles = resume.experience.map((e) => e.role).join(" ")
  const resumeSeniority = SENIOR_TITLES.test(resumeTitles) ? "senior"
    : JUNIOR_TITLES.test(resumeTitles) ? "junior"
    : "mid"

  const levelMap = { junior: 1, mid: 2, senior: 3 }
  const jdLevel = levelMap[jdSeniority]
  const resumeLevel = levelMap[resumeSeniority]
  const levelScore = resumeLevel >= jdLevel ? 1 : resumeLevel === jdLevel - 1 ? 0.6 : 0.3
  total += levelScore
  count++
  if (jdSeniority !== "mid" || resumeSeniority !== "mid") {
    parts.push(`级别: JD${jdSeniority}/简历${resumeSeniority}`)
  }

  // Project relevance — simple keyword overlap between JD responsibilities and project descriptions
  const projectsText = resume.projects
    .flatMap((p) => [p.description, ...p.highlights])
    .join(" ")
    .toLowerCase()
  const jdLower = jd.toLowerCase()
  const jdWords = new Set(jdLower.split(/\W+/).filter((w) => w.length > 3))
  const projWords = new Set(projectsText.split(/\W+/).filter((w) => w.length > 3))
  if (jdWords.size > 0) {
    const overlap = [...jdWords].filter((w) => projWords.has(w)).length
    const projScore = Math.min(1, overlap / Math.min(jdWords.size, 30))
    total += projScore
    count++
    parts.push(`项目相关性 ${Math.round(projScore * 100)}%`)
  }

  const score = count > 0 ? (total / count) * 100 : 70
  return { score: Math.round(score), detail: parts.join(" · ") || "经验匹配" }
}

// ---- 4. SEMANTIC SIMILARITY (15%) ----
// Uses keyword Jaccard index as proxy. Upgrade path: text-embedding API.
function matchSemantic(jd: string, resume: ResumeData): { score: number; detail: string } {
  // Build full resume text
  const resumeText = [
    resume.title,
    resume.summary,
    resume.skills.join(" "),
    ...resume.experience.flatMap((e) => [e.role, e.company, ...e.highlights]),
    ...resume.projects.flatMap((p) => [p.name, p.description, ...p.highlights]),
    ...resume.education.map((ed) => `${ed.school} ${ed.degree}`),
  ].join(" ")

  // Tokenize: extract meaningful words (length > 1, filter stop words)
  const STOP = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
    "neither", "each", "every", "all", "any", "few", "more", "most",
    "other", "some", "such", "only", "own", "same", "than", "too",
    "very", "just", "because", "about", "over", "after", "before",
    "between", "under", "also", "then", "now", "here", "there",
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
    "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
    "没有", "看", "好", "自己", "这", "他", "她", "它", "们", "那", "些",
    "所", "为", "所以", "因为", "但是", "然而", "而且", "或者", "以及",
    "可以", "能够", "需要", "应该", "已经", "还", "将", "可能", "如果",
  ])

  function tokenize(text: string): Set<string> {
    const tokens = text
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 1 && !STOP.has(t))
    // Also add bigrams for better matching
    const bigrams: string[] = []
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push(`${tokens[i]}_${tokens[i + 1]}`)
    }
    return new Set([...tokens, ...bigrams])
  }

  const jdTokens = tokenize(jd)
  const resumeTokens = tokenize(resumeText)

  if (jdTokens.size === 0 || resumeTokens.size === 0) {
    return { score: 50, detail: "文本量不足" }
  }

  // Jaccard similarity
  const intersection = [...jdTokens].filter((t) => resumeTokens.has(t)).length
  const union = new Set([...jdTokens, ...resumeTokens]).size
  const jaccard = intersection / union

  const score = Math.round(jaccard * 100)
  const detail = `文本相似度 ${score}%`
  return { score, detail }
}

// ---- 5. BONUS (5%) ----
function computeBonus(jd: string, resume: ResumeData): { score: number; detail: string } {
  const bonuses: string[] = []
  let score = 0

  // Big company experience (+25)
  if (hasBigCompanyExperience(resume.experience)) {
    score += 25
    bonuses.push("大厂经历")
  }

  // GitHub / open-source (+25)
  if (hasGitHub(resume.links)) {
    score += 25
    bonuses.push("开源/GitHub")
  }

  // Portfolio (+15)
  if (hasPortfolio(resume.links, resume.summary)) {
    score += 15
    bonuses.push("作品集")
  }

  // Certificates (+15)
  const certText = [resume.summary, ...resume.education.map((e) => e.degree)].join(" ")
  if (hasCertificates(certText)) {
    score += 15
    bonuses.push("专业证书")
  }

  // Resume completeness (+20)
  let completeness = 0
  if (resume.name) completeness++
  if (resume.summary) completeness++
  if (resume.skills.length >= 3) completeness++
  if (resume.experience.length > 0) completeness++
  if (resume.education.length > 0) completeness++
  score += Math.round((completeness / 5) * 20)
  if (completeness >= 4) bonuses.push("简历完整")

  return {
    score: Math.min(100, score),
    detail: bonuses.length > 0 ? bonuses.join(" · ") : "无特别加分项",
  }
}

// ---- MAIN ENTRY POINT ----
export function computeMatchScore(
  jd: string,
  resume: ResumeData,
): MatchResult {
  const dimensions: Array<{
    key: string
    label: string
    weight: number
    fn: () => { score: number; detail: string } & Record<string, any>
  }> = [
    {
      key: "hard",
      label: "硬性条件",
      weight: 0.2,
      fn: () => matchHardRequirements(jd, resume),
    },
    {
      key: "skills",
      label: "技能匹配",
      weight: 0.35,
      fn: () => matchSkills(jd, resume),
    },
    {
      key: "experience",
      label: "经验匹配",
      weight: 0.25,
      fn: () => matchExperience(jd, resume),
    },
    {
      key: "semantic",
      label: "语义相似度",
      weight: 0.15,
      fn: () => matchSemantic(jd, resume),
    },
    {
      key: "bonus",
      label: "加分项",
      weight: 0.05,
      fn: () => computeBonus(jd, resume),
    },
  ]

  const breakdown: DimensionBreakdown[] = []
  let totalScore = 0
  let allMatched: string[] = []
  let allMissing: string[] = []
  const suggestions: string[] = []

  for (const dim of dimensions) {
    const result = dim.fn()
    const weightedScore = (result.score / 100) * dim.weight * 100
    totalScore += weightedScore

    breakdown.push({
      label: dim.label,
      score: result.score,
      weight: dim.weight,
      detail: result.detail,
    })

    // Collect keywords from skill dimension
    if (dim.key === "skills") {
      allMatched = (result as any).matched ?? []
      allMissing = (result as any).missing ?? []
    }
  }

  // Generate suggestions based on weak dimensions
  for (const dim of breakdown) {
    if (dim.score < 40 && dim.label === "硬性条件") {
      suggestions.push("建议补充学历/年限信息，或关注门槛较低的岗位")
    }
    if (dim.score < 40 && dim.label === "技能匹配") {
      const missingList = allMissing.slice(0, 5).join("、")
      suggestions.push(`关键技能缺失: ${missingList}。如有相关经验请补充在简历中`)
    }
    if (dim.score < 40 && dim.label === "经验匹配") {
      suggestions.push("建议在项目经历中补充与目标行业/岗位相关的内容")
    }
    if (dim.score < 30 && dim.label === "语义相似度") {
      suggestions.push("简历整体方向与JD差异较大，建议针对该岗位重新组织语言")
    }
    if (dim.score < 30 && dim.label === "加分项") {
      suggestions.push("建议补充GitHub链接、专业证书或作品集以获得额外加分")
    }
  }

  // Use AI-generated suggestions if available (passed through), limit to 5
  const finalSuggestions = suggestions.slice(0, 5)

  return {
    score: Math.round(totalScore),
    breakdown,
    matchedKeywords: allMatched,
    missingKeywords: allMissing,
    suggestions: finalSuggestions,
  }
}
