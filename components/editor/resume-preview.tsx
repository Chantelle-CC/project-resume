import { forwardRef } from "react"
import { Mail, Phone, MapPin, Link2 } from "lucide-react"

import type { ResumeData } from "@/lib/resume"

// Use only hex colors — html2canvas crashes on oklch() from Tailwind v4
const C = {
  n500: "#737373",
  n600: "#525252",
  n700: "#404040",
  n800: "#262626",
  n900: "#171717",
}

interface Props {
  data: ResumeData
  accent: string
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2
      className="mb-2.5 border-b pb-1 text-[11pt] font-bold uppercase tracking-wide"
      style={{ color: accent, borderColor: accent }}
    >
      {children}
    </h2>
  )
}

export const ResumePreview = forwardRef<HTMLDivElement, Props>(function ResumePreview({ data, accent }, ref) {
  return (
    <div ref={ref} className="resume-sheet mx-auto px-[16mm] py-[14mm] shadow-lg">
      {/* Header */}
      <header className="mb-4 flex items-start gap-4">
        {data.photo && (
          <div className="h-[30mm] w-[30mm] shrink-0 overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.photo}
              alt="照片"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-[22pt] font-bold leading-tight" style={{ color: accent }}>
            {data.name || "你的姓名"}
          </h1>
          {data.title && (
            <p className="mt-0.5 text-[12pt] font-medium" style={{ color: C.n700 }}>
              {data.title}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[9pt]" style={{ color: C.n600 }}>
            {data.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3 w-3" style={{ color: accent }} />
                {data.email}
              </span>
            )}
            {data.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" style={{ color: accent }} />
                {data.phone}
              </span>
            )}
            {data.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" style={{ color: accent }} />
                {data.location}
              </span>
            )}
            {data.links.map((l) => (
              <span key={l.url} className="inline-flex items-center gap-1">
                <Link2 className="h-3 w-3" style={{ color: accent }} />
                {l.label || l.url}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Summary */}
      {data.summary && (
        <section className="mb-4">
          <SectionTitle accent={accent}>个人简介 · Summary</SectionTitle>
          <p className="text-[10pt] leading-relaxed" style={{ color: C.n800 }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-4">
          <SectionTitle accent={accent}>专业技能 · Skills</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <span
                key={s}
                className="rounded px-2 py-0.5 text-[9pt]"
                style={{ backgroundColor: `${accent}14`, color: accent }}
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-4">
          <SectionTitle accent={accent}>工作经历 · Experience</SectionTitle>
          <div className="space-y-3">
            {data.experience.map((e, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <p className="text-[10.5pt] font-semibold" style={{ color: C.n900 }}>
                    {e.role}
                    {e.company && (
                      <span className="font-normal" style={{ color: C.n600 }}>
                        {" "}· {e.company}
                      </span>
                    )}
                  </p>
                  <span className="shrink-0 text-[9pt]" style={{ color: C.n500 }}>
                    {[e.start, e.end].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {e.location && (
                  <p className="text-[9pt]" style={{ color: C.n500 }}>
                    {e.location}
                  </p>
                )}
                <ul className="mt-1 space-y-0.5">
                  {e.highlights.map((h, j) => (
                    <li key={j} className="flex gap-1.5 text-[10pt] leading-relaxed" style={{ color: C.n800 }}>
                      <span style={{ color: accent }}>▪</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <section className="mb-4">
          <SectionTitle accent={accent}>项目经历 · Projects</SectionTitle>
          <div className="space-y-3">
            {data.projects.map((p, i) => (
              <div key={i}>
                <p className="text-[10.5pt] font-semibold" style={{ color: C.n900 }}>
                  {p.name}
                  {p.role && (
                    <span className="font-normal" style={{ color: C.n600 }}>
                      {" "}· {p.role}
                    </span>
                  )}
                </p>
                {p.description && (
                  <p className="text-[10pt] leading-relaxed" style={{ color: C.n700 }}>
                    {p.description}
                  </p>
                )}
                <ul className="mt-1 space-y-0.5">
                  {p.highlights.map((h, j) => (
                    <li key={j} className="flex gap-1.5 text-[10pt] leading-relaxed" style={{ color: C.n800 }}>
                      <span style={{ color: accent }}>▪</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section>
          <SectionTitle accent={accent}>教育背景 · Education</SectionTitle>
          <div className="space-y-1.5">
            {data.education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between">
                <p className="text-[10pt]" style={{ color: C.n800 }}>
                  <span className="font-semibold" style={{ color: C.n900 }}>
                    {ed.school}
                  </span>
                  {ed.degree && <span> · {ed.degree}</span>}
                </p>
                <span className="shrink-0 text-[9pt]" style={{ color: C.n500 }}>
                  {[ed.start, ed.end].filter(Boolean).join(" – ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
})
