# AI Resume Builder — Project Memory

> **Purpose:** Living document for Cursor sessions. Read this first when continuing work. Update after every meaningful change.

## Project Overview

Bilingual (English / Arabic) AI-powered resume builder with ATS optimization — **Bahath Jobz** feature module.

| Feature | Route | Status |
|---------|-------|--------|
| Resume Builder | `/builder` | ✅ Implemented (Guided + Detailed modes) |
| ATS Resume Analyzer | `/analyzer` | ✅ Implemented |
| Cover Letter Generator | `/cover-letter` | ✅ Implemented |

**Production:** https://ai-resume-builder-taupe-xi.vercel.app/ (Vercel from `main`)

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** OpenAI API (`gpt-4o-mini` via `OPENAI_MODEL` env)
- **File parsing:** `unpdf` (PDF, serverless-safe on Vercel), `mammoth` (Word .docx)
- **Icons:** lucide-react
- **i18n:** Custom context (`LocaleProvider`) — EN + AR with RTL
- **Drafts:** localStorage multi-resume store (`src/lib/resume-drafts.ts`)

## Environment Variables

Copy `.env.example` → `.env.local` (also set the same vars in Vercel):

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── builder/page.tsx
│   ├── analyzer/page.tsx
│   ├── cover-letter/page.tsx
│   └── api/
│       ├── generate-resume/route.ts
│       ├── resume-questions/route.ts      # Detailed free-text interview
│       ├── guided-questions/route.ts     # Guided one-at-a-time MCQ
│       ├── suggest-skills/route.ts
│       ├── analyze-resume/route.ts       # FormData file OR JSON { text }
│       └── generate-cover-letter/route.ts
├── components/
│   ├── layout/                 # Header (?select=1 → mode picker), Footer, LocaleSwitcher
│   ├── ui/                     # Button, Card, Input, ConfirmDeleteModal
│   ├── resume/
│   │   ├── ResumeBuilder.tsx           # Mode picker + My Resumes
│   │   ├── GuidedResumeBuilder.tsx
│   │   ├── DetailedResumeBuilder.tsx
│   │   ├── ResumeEditor.tsx            # In-preview edit (Done / Cancel)
│   │   ├── PhotoUpload.tsx
│   │   ├── ResumePreview.tsx
│   │   └── templates/index.tsx
│   ├── analyzer/               # ResumeAnalyzer + AtsAnalysisResults
│   └── cover-letter/
├── lib/
│   ├── openai.ts, types.ts, utils.ts
│   ├── resume-drafts.ts        # Drafts + language proficiency helpers
│   ├── guided-answers.ts
│   ├── resume-to-text.ts       # ResumeData → plain text for ATS score
│   ├── template-preview.ts
│   ├── parsers/resume-parser.ts  # unpdf + mammoth
│   └── i18n/translations.ts
└── contexts/LocaleContext.tsx
```

## Resume Templates (5)

All templates are **single-column ATS-friendly** (no sidebars / 2-column layouts / fill headers).

| ID | Name | Style |
|----|------|-------|
| `classic` | Classic | Closest to HR Qatar ATS: uppercase name, `Title — Company \| dates`, Core Competencies as `•` text |
| `modern` | Modern | Same ATS structure; navy section underlines; two-line experience |
| `minimal` | Minimal | Extra whitespace; same ATS rules |
| `executive` | Executive | Closest to Executive ATS PDF: Executive Summary, bullet Core Competencies, `Title` + `Company \| Location \| Dates` |
| `creative` | Creative | ATS structure with cyan section underlines only |

### Fixed CV section order (all templates)

1. Professional / Executive Summary  
2. Core Competencies (skills)  
3. Professional Experience  
4. Projects  
5. Education  
6. Certifications  
7. Languages  

**Header:** name, headline (target role), `Location • Phone • Email • LinkedIn`, optional personal photo.

## API Endpoints

### POST `/api/generate-resume`
- **Body:** `{ basics, answers, selectedSkills, language }`
- **Returns:** Structured `ResumeData` (skills `{ technical, soft }`)
- Contact overwrite: `headline`, optional `photoDataUrl`
- Languages on CV use localized proficiency labels when `language === "ar"`

### POST `/api/resume-questions` (Detailed)
- **Body:** `{ basics, language }` — experience + education required
- **Returns:** `{ questions: InterviewQuestion[] }`
- Arabic: natural MSA prompts (not literal English translations)

### POST `/api/guided-questions` (Guided)
- **Body:** `{ basics, language, askedQuestions, answers }`
- **Returns:** next `{ question }` or `{ done: true }`
- One question at a time from prior answers; role-specific; max ~12
- Arabic: natural MSA + quality examples in system prompt

### POST `/api/suggest-skills`
- **Body:** `{ basics, answers, language }`
- **Returns:** `{ skills: string[] }`

### POST `/api/analyze-resume`
- **Body (file):** `FormData` with `file` + optional `language`
- **Body (text):** JSON `{ text, language }` — builder “Generate ATS Score”
- **Returns:** `{ score, breakdown, suggestions, strengths, extractedText }`

### POST `/api/generate-cover-letter`
- **Body:** multipart or JSON with position, job description, CV file/text, language

## ATS Guidelines (built into AI prompts)

- Standard section headings; no graphics/tables/columns that break parsing
- Keyword-rich bullets with metrics; reverse-chronological experience
- Contact at top; simple parseable formatting

## Design System (Bahath Jobz Brand)

- **Navy:** `#002b49` · **Cyan:** `#1db4ce` · **Foreground:** `#141f2e`
- **Muted:** `#6b7c93` · **Border:** `#e2e8f0` · **Accent bg:** `#f4f7fa`
- **Font:** Inter · **RTL:** `dir="rtl"` when locale is `ar`
- **Logo:** `/public/logo-white.png` (header), `/public/logo.png`

## Resume Builder Flow

### Mode picker (`/builder`, mode `null`)
1. **First:** Quick Guided + Detailed cards  
2. **Second:** My Resumes (max 2 visible; “Show more” expands; Continue / Delete)  
3. Nav “Resume Builder” → `/builder?select=1` clears mode back to picker  
4. “Change writing mode” sets `mode: null`, `step: "mode"` (normalizeDraft must **not** re-infer mode when on picker)

### Mode A — Quick Guided
1. Basics — contact, optional photo, target job, optional languages (proficiency dropdown localized)  
2. Choice interview — sequential MCQ/yes-no/checkboxes + follow-ups + Other; loader-only in question box while fetching  
3. Template → Preview (generate; Edit with Done/Cancel; Generate ATS Score; Download PDF)

### Mode B — Detailed
1. Your Info — contact, photo, experience, education, languages, certificates  
2. AI Interview — free-text  
3. Skills — AI multi-select  
4. Template → Preview (same edit / ATS / print as Guided)

### Preview editing
- **Edit Resume** snapshots CV; live edits persist to draft  
- **Done Editing** keeps changes · **Cancel** restores snapshot  
- Add works for empty sections (projects, certs, skills, languages, etc.) — empty placeholders are kept until filled; templates filter blanks on render

### Language proficiency
- Stored values (EN): `Native | Fluent | Advanced | Intermediate | Basic`
- UI labels via `languageProficiencyLabel(value, locale)` — AR: لغة أم، طلاقة، متقدم، متوسط، أساسي
- CV text via `formatLanguageEntry(..., locale)`

## Changelog

### 2026-07-21 — Arabic proficiency + natural Arabic questions
- Language proficiency dropdown shows Arabic labels when locale is `ar`
- CV language lines use localized proficiency when generating/previewing in Arabic
- Strengthened Arabic prompts for `/api/guided-questions` and `/api/resume-questions` (natural MSA for Qatar/GCC, not literal translation)

### 2026-07-21 — Edit Cancel + fix Add on empty sections
- Edit Resume: Cancel discards changes (restores snapshot); Done keeps them
- Fixed Add for empty skills/certs/projects/languages — normalize no longer strips empty editor placeholders
- Templates filter blank skills/certs/languages when rendering

### 2026-07-21 — Mode picker My Resumes UX
- My Resumes moved below mode cards (second section)
- Show max 2 resumes; “Show more / Show less” for the rest

### 2026-07-21 — Change writing mode fix
- `normalizeDraft` no longer re-infers `detailed`/`guided` when user explicitly opens mode picker (`step: "mode"`, `mode: null`)
- Fixes “Change writing mode” from Detailed (and Header `?select=1`) when draft has questions/resume

### 2026-07-21 — Guided question loading UX
- While next question loads: spinner only inside question card (loading text stays on the button)

### 2026-07-21 — Fix PDF upload on Vercel (DOMMatrix)
- Replaced `pdf-parse` with `unpdf` — works on Vercel serverless (no `DOMMatrix` / canvas)
- Affects ATS Analyzer and Cover Letter CV upload

### 2026-07-21 — Templates matched to ATS PDF samples
- All 5 templates aligned to HR Qatar + Executive ATS PDFs
- Removed decorative fill bars/gradients for ATS parse safety

### 2026-07-21 — Preview layout fix (ATS + Edit)
- Editor/ATS results were wrongly inside the action-button flex row (broken columns)
- Regenerate + Generate ATS Score stay side-by-side; compact ATS card below
- Resume editor single-column / overflow-safe for sidebar width

### 2026-07-15 — Photo, in-CV edit, ATS score from preview
- Optional personal photo on Guided + Detailed; data URL on contact
- Preview Edit Resume; saved drafts with resume open at Preview
- “Generate ATS Score” via `/api/analyze-resume` JSON `{ text }` + shared `AtsAnalysisResults`

### 2026-07-20 — Guided Q one-at-a-time + UX polish
- Sequential guided questions from prior answers; full-width options; Other always
- Nav Resume Builder → mode picker; ConfirmDeleteModal instead of `window.confirm`

### 2026-07-20 — Dual CV writing modes
- Mode picker: Quick Guided vs Detailed
- Guided: `/api/guided-questions`; Detailed: `DetailedResumeBuilder`

### 2026-07-15 — Multi-page PDF + Modern template readability
- Print flows across multiple A4 pages
- Modern: navy/cyan lines only (no fill header)

### 2026-07-15 — Template step live preview
- Live CV preview from basics/skills before AI generation

### 2026-07-15 — Basics: Education, Languages, Certificate Uploads
- Multi-entry education; optional languages + cert file uploads (data URLs as CV links)

### 2026-07-15 — Builder: Experience + Skills + ATS Templates
- Multi-entry experience; Skills step via `/api/suggest-skills`
- Single-column ATS templates; `ResumeData.skills` = `{ technical, soft }`

### 2026-07-13 — Multi-Resume Drafts
- localStorage multi-draft switch/delete; New Resume save/discard; legacy migration

### 2026-07-13 — Enhanced AI Resume + Cover Letter Upload
- Stronger resume prompts; cover letter accepts PDF/DOCX upload

### 2026-07-13 — Print Fix / Bahath Jobz branding / Initial build
- Print-only resume area; brand colors + AI interview wizard; EN/AR RTL scaffold

## Known Limitations / Future Work

- [ ] True PDF/DOCX file download (currently print → Save as PDF)
- [ ] User accounts & cloud-saved resumes (database)
- [ ] More templates
- [ ] LinkedIn import
- [ ] Job description keyword matcher in builder
- [ ] Rate limiting on API routes
- [ ] `.doc` (legacy Word) not supported — only `.docx`
- [ ] Vercel body size limit (~4.5MB) for large PDF uploads

## How to Run

```bash
npm install
cp .env.example .env.local   # add your OpenAI key
npm run dev                  # http://localhost:3000
```

## Cursor Rule

See `.cursor/rules/project-memory.mdc` — agents must read and update this file.
