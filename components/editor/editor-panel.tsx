"use client"

import { Plus, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { ResumeData, ExperienceItem, ProjectItem, EducationItem } from "@/lib/resume"

interface Props {
  data: ResumeData
  onChange: (data: ResumeData) => void
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
    </div>
  )
}

function Block({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onAdd && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 gap-1 text-xs text-primary">
            <Plus className="h-3.5 w-3.5" />
            添加
          </Button>
        )}
      </div>
      {children}
    </section>
  )
}

export function EditorPanel({ data, onChange }: Props) {
  function set<K extends keyof ResumeData>(key: K, value: ResumeData[K]) {
    onChange({ ...data, [key]: value })
  }

  // ----- experience helpers -----
  function updateExp(i: number, patch: Partial<ExperienceItem>) {
    const next = [...data.experience]
    next[i] = { ...next[i], ...patch }
    set("experience", next)
  }
  function addExp() {
    set("experience", [...data.experience, { company: "", role: "", location: "", start: "", end: "", highlights: [""] }])
  }
  function removeExp(i: number) {
    set("experience", data.experience.filter((_, idx) => idx !== i))
  }

  // ----- project helpers -----
  function updateProj(i: number, patch: Partial<ProjectItem>) {
    const next = [...data.projects]
    next[i] = { ...next[i], ...patch }
    set("projects", next)
  }
  function addProj() {
    set("projects", [...data.projects, { name: "", role: "", description: "", highlights: [""] }])
  }
  function removeProj(i: number) {
    set("projects", data.projects.filter((_, idx) => idx !== i))
  }

  // ----- education helpers -----
  function updateEdu(i: number, patch: Partial<EducationItem>) {
    const next = [...data.education]
    next[i] = { ...next[i], ...patch }
    set("education", next)
  }
  function addEdu() {
    set("education", [...data.education, { school: "", degree: "", start: "", end: "" }])
  }
  function removeEdu(i: number) {
    set("education", data.education.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-7">
      {/* Basic info */}
      <Block title="基本信息">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="姓名" value={data.name} onChange={(v) => set("name", v)} />
          <Field label="求职意向 / 头衔" value={data.title} onChange={(v) => set("title", v)} />
          <Field label="邮箱" value={data.email} onChange={(v) => set("email", v)} />
          <Field label="电话" value={data.phone} onChange={(v) => set("phone", v)} />
          <Field label="所在地" value={data.location} onChange={(v) => set("location", v)} />
        </div>
      </Block>

      <Separator />

      <Block title="个人简介">
        <Textarea
          value={data.summary}
          onChange={(e) => set("summary", e.target.value)}
          className="min-h-24 resize-none leading-relaxed"
        />
      </Block>

      <Separator />

      <Block title="专业技能">
        <Textarea
          value={data.skills.join(", ")}
          onChange={(e) => set("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="用逗号分隔，如：React, TypeScript, 项目管理"
          className="min-h-20 resize-none leading-relaxed"
        />
      </Block>

      <Separator />

      <Block title="工作经历" onAdd={addExp}>
        {data.experience.map((e, i) => (
          <div key={i} className="rounded-lg border border-border p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">经历 {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeExp(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="职位" value={e.role} onChange={(v) => updateExp(i, { role: v })} />
              <Field label="公司" value={e.company} onChange={(v) => updateExp(i, { company: v })} />
              <Field label="开始时间" value={e.start} onChange={(v) => updateExp(i, { start: v })} placeholder="2022.03" />
              <Field label="结束时间" value={e.end} onChange={(v) => updateExp(i, { end: v })} placeholder="至今" />
            </div>
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">工作要点（每行一条）</Label>
              <Textarea
                value={e.highlights.join("\n")}
                onChange={(ev) => updateExp(i, { highlights: ev.target.value.split("\n").filter((l) => l !== "") })}
                className="mt-1 min-h-24 resize-none leading-relaxed"
              />
            </div>
          </div>
        ))}
      </Block>

      <Separator />

      <Block title="项目经历" onAdd={addProj}>
        {data.projects.map((p, i) => (
          <div key={i} className="rounded-lg border border-border p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">项目 {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeProj(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="项目名称" value={p.name} onChange={(v) => updateProj(i, { name: v })} />
              <Field label="角色" value={p.role} onChange={(v) => updateProj(i, { role: v })} />
            </div>
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">项目描述</Label>
              <Textarea
                value={p.description}
                onChange={(ev) => updateProj(i, { description: ev.target.value })}
                className="mt-1 min-h-16 resize-none leading-relaxed"
              />
            </div>
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">项目要点（每行一条）</Label>
              <Textarea
                value={p.highlights.join("\n")}
                onChange={(ev) => updateProj(i, { highlights: ev.target.value.split("\n").filter((l) => l !== "") })}
                className="mt-1 min-h-20 resize-none leading-relaxed"
              />
            </div>
          </div>
        ))}
      </Block>

      <Separator />

      <Block title="教育背景" onAdd={addEdu}>
        {data.education.map((ed, i) => (
          <div key={i} className="rounded-lg border border-border p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">教育 {i + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeEdu(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="学校" value={ed.school} onChange={(v) => updateEdu(i, { school: v })} />
              <Field label="学历 / 专业" value={ed.degree} onChange={(v) => updateEdu(i, { degree: v })} />
              <Field label="开始时间" value={ed.start} onChange={(v) => updateEdu(i, { start: v })} />
              <Field label="结束时间" value={ed.end} onChange={(v) => updateEdu(i, { end: v })} />
            </div>
          </div>
        ))}
      </Block>
    </div>
  )
}
