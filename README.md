# ResumeAI — ATS Resume Builder

AI-powered resume builder with ATS optimization, available in **English** and **Arabic**.

## Features

- **Resume Builder** — Fill in your details, pick a template, and AI generates an ATS-optimized resume
- **ATS Analyzer** — Upload PDF/DOCX and get a score with improvement suggestions
- **Cover Letter Generator** — Tailored cover letters from job description + your CV

## Quick Start

```bash
npm install
cp .env.example .env.local   # Add your OpenAI API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) |

## Project Memory

See [`PROJECT_MEMORY.md`](./PROJECT_MEMORY.md) for full architecture, changelog, and Cursor session context.

## Tech Stack

Next.js 16 · React 19 · Tailwind CSS · OpenAI · pdf-parse · mammoth
