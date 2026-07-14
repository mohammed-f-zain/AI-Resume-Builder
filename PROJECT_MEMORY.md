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

| ID | Name | Style |
|----|------|-------|
| `classic` | Classic | Traditional single-column, serif headings |
| `modern` | Modern | Two-tone header, clean sans-serif |
| `minimal` | Minimal | Lots of whitespace, subtle dividers |
| `executive` | Executive | Bold sidebar accent, professional |
| `creative` | Creative | Color accent bar, contemporary layout |

## API Endpoints

### POST `/api/generate-resume`
- **Body:** `{ basics, answers, language }`
- **Returns:** Structured `ResumeData` optimized for ATS

### POST `/api/resume-questions`
- **Body:** `{ basics, language }`
- **Returns:** `{ questions: InterviewQuestion[] }`

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

## Resume Builder Flow (4 steps)

1. **Your Info** — contact + target role + rough career background
2. **AI Interview** — AI generates 5–7 personalized questions; user answers
3. **Template** — pick from 5 ATS templates
4. **Preview** — AI writes full resume content → preview + print

### API: POST `/api/resume-questions`
- **Body:** `{ basics, language }`
- **Returns:** `{ questions: InterviewQuestion[] }`

### API: POST `/api/generate-resume`
- **Body:** `{ basics, answers, language }`
- **Returns:** `{ resume: ResumeData }`

## Changelog

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
