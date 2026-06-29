// ============================================================
// Skill Graph — production-maintainable skill knowledge base.
// To update: edit the maps below, no code changes needed.
// ============================================================

// ---- Skill Synonym Map: canonical → [aliases] ----
// Keys are canonical names; values are recognized aliases.
// Matching normalizes all inputs to canonical form.
const SKILL_SYNONYMS: Record<string, string[]> = {
  // Languages
  TypeScript: ["ts", "typescript"],
  JavaScript: ["js", "javascript", "es6", "es2015", "ecmascript", "esnext"],
  Python: ["python", "py", "python3"],
  Go: ["go", "golang"],
  Rust: ["rust", "rustlang"],
  Java: ["java", "jvm", "spring"],
  Kotlin: ["kotlin", "kt"],
  Swift: ["swift", "swiftui"],
  Dart: ["dart", "flutter", "dartlang"],
  "C++": ["c++", "cpp", "cplusplus"],
  "C#": ["c#", "csharp", "dotnet", ".net"],
  Ruby: ["ruby", "ror", "rails"],
  PHP: ["php", "laravel", "symfony"],
  SQL: ["sql", "tsql", "plsql", "mysql", "postgresql"],
  Scala: ["scala", "spark"],
  R: ["r", "rlang", "rstats"],
  MATLAB: ["matlab", "octave"],
  Shell: ["shell", "bash", "zsh", "sh", "powershell"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3", "scss", "sass", "less", "tailwind", "tailwindcss"],
  GraphQL: ["graphql", "gql"],

  // Frontend
  React: ["react", "reactjs", "react.js", "react native", "reactnative", "rn"],
  Vue: ["vue", "vuejs", "vue.js", "vue3", "vue2", "nuxt"],
  Angular: ["angular", "angularjs", "ng", "angular2", "angular material"],
  Svelte: ["svelte", "sveltekit"],
  NextJS: ["nextjs", "next.js", "next"],
  Nuxt: ["nuxt", "nuxtjs", "nuxt.js"],
  Redux: ["redux", "redux toolkit", "rtk", "zustand", "pinia"],
  Webpack: ["webpack", "vite", "rollup", "esbuild", "parcel", "turbopack"],
  jQuery: ["jquery", "$"],

  // Backend
  NodeJS: ["node", "nodejs", "node.js", "express", "koa", "fastify", "nestjs", "nest"],
  Deno: ["deno", "fresh"],
  Django: ["django", "drf", "django rest framework"],
  Flask: ["flask", "fastapi"],
  SpringBoot: ["spring boot", "springboot", "spring mvc", "spring cloud"],
  Gin: ["gin", "echo", "fiber"],
  Rails: ["rails", "ruby on rails"],
  Laravel: ["laravel", "lumen"],

  // Database
  MySQL: ["mysql", "mariadb"],
  PostgreSQL: ["postgresql", "postgres", "pg"],
  MongoDB: ["mongodb", "mongo", "nosql"],
  Redis: ["redis", "memcached"],
  Elasticsearch: ["elasticsearch", "es", "elk", "elastic"],
  ClickHouse: ["clickhouse", "olap"],
  Neo4j: ["neo4j", "cypher", "graph database"],
  SQLite: ["sqlite", "sqlite3"],
  Oracle: ["oracle", "oracledb", "plsql"],
  BigQuery: ["bigquery", "bq"],
  Snowflake: ["snowflake", "snowsql"],
  DynamoDB: ["dynamodb", "dynamo"],
  Cassandra: ["cassandra", "scylladb"],

  // Cloud & DevOps
  AWS: [
    "aws", "amazon web services", "s3", "ec2", "lambda", "ecs", "eks",
    "rds", "cloudfront", "route53", "sqs", "sns", "cloudformation",
  ],
  Azure: ["azure", "aks", "azure functions", "azure devops", "az"],
  GCP: ["gcp", "google cloud", "google cloud platform", "gke", "cloud run"],
  Docker: ["docker", "docker compose", "dockerfile", "container"],
  Kubernetes: ["kubernetes", "k8s", "k3s", "helm", "eks", "aks", "gke"],
  Terraform: ["terraform", "tf", "iac", "infrastructure as code", "opentofu"],
  Ansible: ["ansible", "playbook"],
  Jenkins: ["jenkins", "ci/cd", "cicd", "pipeline"],
  GitHubActions: [
    "github actions", "github ci", "github workflow",
  ],
  GitLabCI: ["gitlab ci", "gitlab pipeline"],
  ArgoCD: ["argocd", "argo cd", "gitops"],
  Prometheus: ["prometheus", "grafana", "metrics"],
  Nginx: ["nginx", "haproxy", "traefik", "caddy"],
  Linux: ["linux", "ubuntu", "centos", "debian", "rhel", "wsl"],

  // AI / ML / Data
  MachineLearning: [
    "machine learning", "ml", "deep learning", "dl", "ai",
    "neural network", "cnn", "rnn", "lstm", "transformer",
  ],
  PyTorch: ["pytorch", "torch"],
  TensorFlow: ["tensorflow", "tf", "keras"],
  ScikitLearn: ["scikit-learn", "sklearn"],
  Pandas: ["pandas", "numpy", "scipy", "matplotlib"],
  NLP: ["nlp", "natural language processing", "spacy", "nltk"],
  LLM: ["llm", "large language model", "gpt", "chatgpt", "claude",
    "langchain", "llamaindex", "rag", "prompt engineering"],
  ComputerVision: [
    "computer vision", "cv", "image processing", "opencv", "yolo",
  ],
  MLOps: ["mlops", "mlflow", "kubeflow", "wandb", "model serving"],
  Spark: ["spark", "apache spark", "pyspark", "databricks"],
  Hadoop: ["hadoop", "hdfs", "hive", "mapreduce"],
  Kafka: ["kafka", "event streaming", "message queue"],
  Flink: ["flink", "stream processing"],
  Airflow: ["airflow", "dag", "data pipeline"],

  // Mobile
  ReactNative: ["react native", "reactnative", "rn", "expo"],
  Flutter: ["flutter", "dart"],
  iOS: ["ios", "swift", "swiftui", "uikit", "xcode"],
  Android: ["android", "kotlin", "jetpack", "compose"],

  // Testing
  Jest: ["jest", "vitest", "mocha", "chai", "jasmine"],
  Cypress: ["cypress", "playwright", "selenium", "puppeteer"],
  TestingLibrary: ["testing library", "rtl", "react testing library"],

  // Soft / Other
  Agile: ["agile", "scrum", "kanban", "sprint"],
  Git: ["git", "github", "gitlab", "bitbucket", "version control"],
  Figma: ["figma", "sketch", "adobe xd", "design system"],
  Jira: ["jira", "confluence", "linear", "notion"],
  Communication: ["communication", "collaboration", "teamwork", "english"],
}

// ---- Skill Reverse Index (built at load time) ----
// Maps every alias → canonical name
let SKILL_INDEX: Map<string, string> | null = null

function getSkillIndex(): Map<string, string> {
  if (SKILL_INDEX) return SKILL_INDEX
  SKILL_INDEX = new Map()
  for (const [canon, aliases] of Object.entries(SKILL_SYNONYMS)) {
    SKILL_INDEX.set(canon.toLowerCase(), canon)
    for (const alias of aliases) {
      SKILL_INDEX.set(alias.toLowerCase(), canon)
    }
  }
  return SKILL_INDEX
}

// ---- Skill Hierarchy: parent → [child skills] ----
// If JD asks for parent skill and candidate has child → partial match (0.6x)
// If JD asks for child and candidate has parent → partial match (0.4x)
export const SKILL_HIERARCHY: Record<string, string[]> = {
  AWS: ["s3", "ec2", "lambda", "ecs", "eks", "rds", "dynamodb", "sqs", "sns",
    "cloudfront", "route53", "cloudformation", "iam", "elb", "api gateway"],
  "C++": ["c++11", "c++14", "c++17", "c++20", "c++23", "stl", "boost", "cmake"],
  Python: ["django", "flask", "fastapi", "pytorch", "tensorflow", "pandas",
    "numpy", "scipy", "scikit-learn", "celery", "pydantic"],
  TypeScript: ["react", "angular", "vue", "nextjs", "nodejs", "nestjs", "deno"],
  Java: ["springboot", "spring cloud", "hibernate", "maven", "gradle", "junit",
    "kotlin", "scala", "android"],
  JavaScript: ["react", "vue", "angular", "nodejs", "jquery", "typescript",
    "webpack", "jest", "cypress", "nextjs"],
  "C#": ["dotnet", "asp.net", "entity framework", "blazor", "xamarin", "unity"],
  MachineLearning: [
    "pytorch", "tensorflow", "scikit-learn", "nlp", "llm", "computervision",
    "mlops", "pandas", "xgboost", "lightgbm",
  ],
  DevOps: [
    "docker", "kubernetes", "terraform", "jenkins", "githubactions", "gitlabci",
    "ansible", "prometheus", "argocd", "nginx",
  ],
  Cloud: ["aws", "azure", "gcp", "terraform", "kubernetes", "serverless"],
}

// ---- Skill Weights: how important is each skill in a typical JD ----
// 2.0 = "must-have" core requirement
// 1.0 = standard requirement (default)
// 0.5 = "nice-to-have" bonus
export function getSkillWeight(skill: string): number {
  const canon = normalizeSkill(skill)
  const MUST_HAVE = new Set([
    "react", "typescript", "python", "java", "nodejs", "aws",
    "docker", "kubernetes", "sql", "machinelearning", "golang",
    "postgresql", "mongodb", "redis", "kafka", "spark",
  ])
  const NICE_TO_HAVE = new Set([
    "figma", "jira", "agile", "cypress", "jest", "testinglibrary",
    "nginx", "githubactions", "jenkins", "ansible", "terraform",
    "elasticsearch", "dynamodb", "graphql", "svelte", "deno",
  ])
  const lower = canon.toLowerCase()
  if (MUST_HAVE.has(lower)) return 2.0
  if (NICE_TO_HAVE.has(lower)) return 0.5
  return 1.0
}

// ---- Normalization ----
export function normalizeSkill(raw: string): string {
  const lower = raw.trim().toLowerCase()
  return getSkillIndex().get(lower) ?? raw.trim()
}

// ---- Extract skills from free text ----
export function extractSkills(text: string): string[] {
  const found = new Set<string>()
  const lower = text.toLowerCase()

  for (const [canon, aliases] of Object.entries(SKILL_SYNONYMS)) {
    // Check canonical name
    if (lower.includes(canon.toLowerCase())) {
      found.add(canon)
      continue
    }
    // Check aliases (longer first to avoid partial matches)
    const sorted = [...aliases].sort((a, b) => b.length - a.length)
    for (const alias of sorted) {
      if (alias.length >= 2 && lower.includes(alias.toLowerCase())) {
        found.add(canon)
        break
      }
    }
  }

  return [...found].sort()
}

// ---- Industries (Chinese + English) ----
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  fintech: ["金融", "支付", "银行", "保险", "证券", "fintech", "finance", "payment", "banking",
    "trading", "crypto", "blockchain", "风控", "信贷", "理财"],
  ecommerce: ["电商", "零售", "商城", "团购", "ecommerce", "e-commerce", "retail",
    "marketplace", "购物", "外卖", "供应链"],
  gaming: ["游戏", "game", "gaming", "手游", "主机游戏", "网游"],
  healthcare: ["医疗", "医院", "健康", "医药", "healthcare", "health", "med", "clinical"],
  education: ["教育", "培训", "在线教育", "学习", "education", "edtech", "learning"],
  enterprise: ["企业服务", "saas", "b2b", "erp", "crm", "enterprise", "办公", "协同"],
  social: ["社交", "社区", "直播", "短视频", "social", "community", "live", "streaming"],
  ai_ml: ["人工智能", "机器学习", "深度学习", "自然语言处理", "计算机视觉",
    "ai", "machine learning", "llm", "大模型", "推荐系统", "search"],
  iot: ["物联网", "iot", "智能硬件", "智能家居", "车联网", "embedded"],
  cloud: ["云计算", "云服务", "cloud", "infrastructure", "paas", "iaas"],
  cybersecurity: ["安全", "网络安全", "信息安全", "security", "cyber", "渗透", "合规"],
  logistics: ["物流", "配送", "仓储", "logistics", "supply chain", "运输"],
  automotive: ["汽车", "自动驾驶", "新能源", "automotive", "autonomous", "ev"],
}

export function extractIndustries(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      found.push(industry)
    }
  }
  return found
}

// ---- Big company names (for experience bonus) ----
const BIG_COMPANIES = new Set([
  "google", "microsoft", "apple", "amazon", "meta", "facebook", "netflix",
  "uber", "airbnb", "stripe", "shopify", "twitter", "linkedin", "spotify",
  "阿里巴巴", "alibaba", "腾讯", "tencent", "字节跳动", "bytedance", "百度", "baidu",
  "华为", "huawei", "美团", "meituan", "拼多多", "pinduoduo", "京东", "jd.com",
  "滴滴", "didiu", "小米", "xiaomi", "网易", "netease", "快手", "kuaishou",
  "蚂蚁", "ant group", "微软", "google", "amazon", "aws", "azure",
  "intel", "nvidia", "amd", "oracle", "salesforce", "adobe", "ibm",
  "sap", "vmware", "cisco", "paypal", "bloomberg", "goldman sachs",
  "jpmorgan", "morgan stanley", "citadel", "jane street", "hudson river",
])

export function hasBigCompanyExperience(experiences: { company: string }[]): boolean {
  return experiences.some((e) => {
    const lower = e.company.toLowerCase()
    return [...BIG_COMPANIES].some((c) => lower.includes(c))
  })
}

// ---- Certificates ----
const CERTIFICATES = new Set([
  "aws certified", "azure certified", "gcp certified", "cka", "ckad", "cks",
  "cissp", "ceh", "comptia", "pmp", "scrum master", "csm", "itil",
  "rhce", "rhcsa", "ccna", "ccnp", "ccie", "ocp", "ocm",
  "cpa", "cfa", "frm", "accac", "cma",
])

export function hasCertificates(text: string): boolean {
  const lower = text.toLowerCase()
  return [...CERTIFICATES].some((c) => lower.includes(c))
}

// ---- Education levels ----
export type EducationLevel = "highschool" | "associate" | "bachelor" | "master" | "phd" | "unknown"

export function extractEducationLevel(text: string): EducationLevel {
  const lower = text.toLowerCase()
  if (["博士", "phd", "ph.d", "doctorate", "博士后"].some((t) => lower.includes(t))) return "phd"
  if (["硕士", "master", "m.s.", "m.a.", "mba", "m.sc", "msc", "研究生"].some((t) => lower.includes(t)))
    return "master"
  if (["本科", "学士", "bachelor", "b.s.", "b.a.", "b.sc", "bsc", "大学"].some((t) => lower.includes(t)))
    return "bachelor"
  if (["大专", "专科", "associate", "a.s.", "a.a."].some((t) => lower.includes(t)))
    return "associate"
  if (["高中", "中专", "high school", "secondary"].some((t) => lower.includes(t)))
    return "highschool"
  return "unknown"
}

export function educationLevelScore(jdLevel: EducationLevel, resumeLevel: EducationLevel): number {
  const ranks: Record<EducationLevel, number> = {
    unknown: 0,
    highschool: 1,
    associate: 2,
    bachelor: 3,
    master: 4,
    phd: 5,
  }
  const jdRank = ranks[jdLevel]
  const resumeRank = ranks[resumeLevel]
  if (jdRank <= 1) return 1 // JD doesn't specify → full score
  if (resumeRank >= jdRank) return 1 // Meets or exceeds
  if (resumeRank === jdRank - 1) return 0.5 // One level below (e.g. bachelor vs master)
  return 0 // Two+ levels below
}

// ---- Years of experience ----
export function extractYearsRequirement(text: string): { min: number; max: number } {
  // Pattern: "N-N 年", "N年以上", "N+ years", "N-Y years"
  const patterns = [
    /(\d+)\s*[-–至到]\s*(\d+)\s*年/i,
    /(\d+)\s*[-–to]+\s*(\d+)\s*years?/i,
    /(\d+)\s*年以上/i,
    /(\d+)\+?\s*years?\s*(of\s*)?experience/i,
    /(\d+)\s*年\s*(以上|工作经验)/i,
  ]
  for (const pat of patterns) {
    const m = text.match(pat)
    if (m) {
      const min = parseInt(m[1], 10)
      const max = m[2] ? parseInt(m[2], 10) : 99
      return { min: Math.min(min, max), max: Math.max(min, max) }
    }
  }
  // Try to infer from seniority keywords
  if (/junior|初级|应届|entry.level/i.test(text)) return { min: 0, max: 2 }
  if (/senior|高级|资深|staff|principal/i.test(text)) return { min: 5, max: 99 }
  if (/lead|team lead|tech lead|组长|负责人|经理|manager|director/i.test(text))
    return { min: 5, max: 99 }
  return { min: 0, max: 99 } // Not specified
}

export function estimateTotalYears(experiences: { start: string; end: string }[]): number {
  let total = 0
  for (const e of experiences) {
    const s = parseInt(e.start, 10)
    const ed = e.end?.toLowerCase() === "至今" || e.end?.toLowerCase() === "present"
      ? new Date().getFullYear()
      : parseInt(e.end, 10)
    if (!isNaN(s) && !isNaN(ed) && ed >= s) {
      total += ed - s
    }
  }
  // If no parsable dates, estimate from number of positions (rough heuristic)
  if (total === 0 && experiences.length > 0) {
    return experiences.length * 1.5 // ~1.5 years per role as fallback
  }
  return Math.round(total * 10) / 10
}

export function experienceYearsScore(required: { min: number; max: number }, actual: number): number {
  if (required.min === 0 && required.max === 99) return 1 // Not specified
  if (actual >= required.min) return 1
  if (actual >= required.min * 0.7) return 0.5 // Close enough
  return 0
}

// ---- Location matching ----
const CHINESE_CITIES: Record<string, string[]> = {
  beijing: ["北京", "beijing", "bj"],
  shanghai: ["上海", "shanghai", "sh"],
  shenzhen: ["深圳", "shenzhen", "sz"],
  guangzhou: ["广州", "guangzhou", "gz"],
  hangzhou: ["杭州", "hangzhou", "hz"],
  chengdu: ["成都", "chengdu", "cd"],
  nanjing: ["南京", "nanjing", "nj"],
  wuhan: ["武汉", "wuhan", "wh"],
  suzhou: ["苏州", "suzhou"],
  xian: ["西安", "xian", "xi'an"],
  changsha: ["长沙", "changsha"],
  xiamen: ["厦门", "xiamen"],
  tianjin: ["天津", "tianjin"],
  chongqing: ["重庆", "chongqing"],
  hefei: ["合肥", "hefei"],
}

export function extractLocation(text: string): string | null {
  const lower = text.toLowerCase()
  for (const [city, aliases] of Object.entries(CHINESE_CITIES)) {
    if (aliases.some((a) => lower.includes(a.toLowerCase()))) return city
  }
  return null
}

export function locationScore(jdLocation: string | null, resumeLocation: string | null): number {
  if (!jdLocation) return 1 // JD doesn't specify
  if (!resumeLocation) return 0.5 // Can't determine (assume willing to relocate)
  return jdLocation === resumeLocation ? 1 : 0.3
}

// ---- GitHub / open-source detection ----
export function hasGitHub(links: { label: string; url: string }[]): boolean {
  return links.some(
    (l) =>
      l.url.includes("github.com") ||
      l.url.includes("gitlab.com") ||
      l.url.includes("gitee.com") ||
      l.label.toLowerCase().includes("github") ||
      l.label.toLowerCase().includes("gitlab"),
  )
}

export function hasPortfolio(links: { label: string; url: string }[], summary: string): boolean {
  const lower = summary.toLowerCase()
  return (
    links.some((l) => l.label.toLowerCase().includes("portfolio") || l.label === "作品集") ||
    /(portfolio|blog|个人网站|作品集)/i.test(lower)
  )
}
