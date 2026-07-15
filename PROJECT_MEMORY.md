# AI Resume Builder — Project Memory

> **Purpose:** Living document for Cursor sessions. Read this first when continuing work. Update after every meaningful change.

## Project Overview

Bilingual (English / Arabic) AI-powered resume builder with ATS optimization — **Bahath Jobz** feature module.

| Feature | Route | Status |
|---------|-------|--------|
| Resume Builder | `/builder` | ✅ Implemented |
| ATS Resume Analyzer | `/analyzer` | ✅ Implemented |
| Cover Letter Generator | `/cover-letter` | ✅ Implemented |

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** OpenAI API (`gpt-4o-mini` via `OPENAI_MODEL` env)
- **File parsing:** `pdf-parse` (PDF), `mammoth` (Word .docx)
- **Icons:** lucide-react
- **i18n:** Custom context (`LocaleProvider`) — EN + AR with RTL

## Environment Variables

Copy `.env.example` → `.env.local`:

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + fonts
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Design tokens + utilities
│   ├── builder/page.tsx        # Resume builder
│   ├── analyzer/page.tsx       # ATS analyzer
│   ├── cover-letter/page.tsx   # Cover letter generator
│   └── api/
│       ├── generate-resume/route.ts
│       ├── resume-questions/route.ts
│       ├── suggest-skills/route.ts
│       ├── analyze-resume/route.ts
│       └── generate-cover-letter/route.ts
├── components/
│   ├── layout/                 # Header, Footer, LocaleSwitcher
│   ├── ui/                     # Button, Card, Input, etc.
│   ├── resume/                 # Form, Preview, Templates
│   ├── analyzer/               # Uploader, Score display
│   └── cover-letter/           # Cover letter form
├── lib/
│   ├── openai.ts               # OpenAI client
│   ├── types.ts                # Shared TypeScript types
│   ├── utils.ts                # cn() helper
│   ├── parsers/resume-parser.ts
│   └── i18n/                   # translations + LocaleProvider
└── contexts/LocaleContext.tsx
```

## Resume Templates (5)

All templates are **single-column ATS-friendly** (no sidebars / 2-column layouts). Differentiation is via heading styles, divider colors, and fonts.

| ID | Name | Style |
|----|------|-------|
| `classic` | Classic | Traditional single-column, serif headings |
| `modern` | Modern | Sans typography, navy/cyan section lines (no fill backgrounds) |
| `minimal` | Minimal | Lots of whitespace, light tracking headings |
| `executive` | Executive | Bold navy accent bar + heavy section rules |
| `creative` | Creative | Cyan accent headings + gradient top bar |

### Fixed CV section order (all templates)

1. Professional Summary  
2. Professional Skills (Technical + Soft)  
3. Professional Experience  
4. Projects  
5. Education  
6. Certifications & Courses  
7. Languages  

## API Endpoints

### POST `/api/generate-resume`
- **Body:** `{ basics, answers, selectedSkills, language }`
- **Returns:** Structured `ResumeData` optimized for ATS (skills as `{ technical, soft }`)

### POST `/api/resume-questions`
- **Body:** `{ basics, language }` — `basics.experience` required (position, company, dates)
- **Returns:** `{ questions: InterviewQuestion[] }`

### POST `/api/suggest-skills`
- **Body:** `{ basics, answers, language }`
- **Returns:** `{ skills: string[] }` — AI suggestions for multi-select

### POST `/api/analyze-resume`
- **Body:** `FormData` with `file` (PDF or .docx)
- **Returns:** `{ score, breakdown, suggestions, extractedText }`

### POST `/api/generate-cover-letter`
- **Body:** `{ position, jobDescription, cvText, language }`
- **Returns:** `{ coverLetter, enhancements }`

## ATS Guidelines (built into AI prompts)

- Standard section headings (Experience, Education, Skills)
- No graphics/tables/columns that break parsing
- Keyword-rich bullet points with metrics
- Reverse-chronological experience
- Contact info at top
- Simple, parseable formatting

## Design System (Bahath Jobz Brand)

- **Navy (primary):** `#002b49` — header, buttons, headings
- **Cyan (secondary):** `#1db4ce` — CTAs, accents, links
- **Foreground:** `#141f2e`
- **Muted text:** `#6b7c93`
- **Border:** `#e2e8f0`
- **Accent bg:** `#f4f7fa`
- **Font:** Inter (matches bahathjobz.com)
- **Logo:** `/public/logo-white.png` (header), `/public/logo.png`
- **RTL:** `dir="rtl"` on `<html>` when locale is `ar`

## Resume Builder Flow (5 steps)

1. **Your Info** — contact + target role + **mandatory professional experience** + **mandatory education** + optional languages + optional certificates (PDF/Word/image → CV links) + optional notes
2. **AI Interview** — AI generates personalized questions using known experience/education (does not re-ask known facts)
3. **Skills** — AI suggests skills from profile + answers; user multi-selects and can add custom skills
4. **Template** — pick from 5 single-column ATS templates
5. **Preview** — AI writes full resume → preview + print

### API: POST `/api/resume-questions`
- **Body:** `{ basics, language }`
- **Returns:** `{ questions: InterviewQuestion[] }`

### API: POST `/api/suggest-skills`
- **Body:** `{ basics, answers, language }`
- **Returns:** `{ skills: string[] }`

### API: POST `/api/generate-resume`
- **Body:** `{ basics, answers, selectedSkills, language }`
- **Returns:** `{ resume: ResumeData }` — education/languages/certs from basics; cert `url` is uploaded file data URL when present

## Changelog

### 2026-07-15 — Multi-page PDF + Modern template readability
- Print/Download PDF now flows across multiple A4 pages (fixed positioning that clipped to page 1 removed)
- Modern template: removed navy fill header; uses navy/cyan lines + typography only

### 2026-07-15 — Template step live preview
- Template step now shows a live CV preview from entered basics/skills (before AI generation)
- Preview visible on all screen sizes; side-by-side layout on large screens

### 2026-07-15 — Basics: Education, Languages, Certificate Uploads
- Mandatory multi-entry Education (degree, institution, graduation month, optional GPA)
- Optional Languages (name + proficiency)
- Optional Certificates with PDF/Word/image upload; files stored as data URLs and rendered as clickable links on the CV
- Generate-resume + questions APIs treat education/languages/certs as known data

### 2026-07-15 — Builder: Experience + Skills + ATS Templates
- Basics step: mandatory multi-entry Professional Experience (position, company, from/to, current)
- New Skills step after interview: AI suggestions via `/api/suggest-skills`, multi-select + manual add
- Experience data sent to questions + generate-resume prompts
- All templates converted to single-column ATS layouts (executive sidebar removed)
- Fixed CV section order: Summary → Skills (tech/soft) → Experience → Projects → Education → Certs → Languages
- `ResumeData.skills` now `{ technical: string[]; soft: string[] }`

### 2026-07-13 — Multi-Resume Drafts
- Multiple saved resumes in localStorage with switch/delete
- "New Resume" button: save current & start new, or discard & start new
- "My Resumes" dropdown to switch between drafts
- Auto-migrates legacy single-draft storage

### 2026-07-13 — Enhanced AI Resume + Cover Letter Upload
- Resume AI: professional prompts with quantified achievements, projects section, role-specific keywords, consistent formatting
- Interview: 10–14 detailed role-specific questions covering experience, projects, tech, certs, metrics
- Templates: Projects, Certifications, Languages sections added
- Cover letter: CV field changed to PDF/DOCX file upload

### 2026-07-13 — Print Fix
- Print now outputs only the resume (hides header, steps, preview UI, buttons)

### 2026-07-13 — Bahath Jobz Branding + AI Interview Builder
- Rebranded to Bahath Jobz colors (#002b49 navy, #1db4ce cyan) and logo
- Replaced form-filler builder with 4-step wizard: Info → AI Interview → Template → Preview
- Added `/api/resume-questions` for personalized AI questions
- Updated `/api/generate-resume` to use interview answers for AI-written content
- Switched font to Inter to match bahathjobz.com

### 2026-07-15 — Local OpenAI env
- Created `.env.local` with `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-4o-mini` (gitignored)

### 2026-07-13 — Initial Build
- Scaffolded Next.js 16 + Tailwind v4 project
- Added bilingual EN/AR support with RTL
- Implemented 3 features: builder, analyzer, cover letter
- Created 5 ATS-friendly resume templates
- Added OpenAI integration for all AI features
- Created PROJECT_MEMORY.md and Cursor rule

## Known Limitations / Future Work

- [ ] PDF/DOCX export of generated resumes
- [ ] User accounts & saved resumes (database)
- [ ] More templates
- [ ] LinkedIn import
- [ ] Job description keyword matcher in builder
- [ ] Rate limiting on API routes
- [ ] `.doc` (legacy Word) not supported — only `.docx`

## How to Run

```bash
npm install
cp .env.example .env.local   # add your OpenAI key
npm run dev                  # http://localhost:3000
```

## Cursor Rule

See `.cursor/rules/project-memory.mdc` — agents must read and update this file.
