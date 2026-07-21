import { NextResponse } from "next/server";
import { getModel, getOpenAIClient } from "@/lib/openai";
import type { GuidedAnswer, GuidedQuestion, ResumeBasics } from "@/lib/types";

const CV_TOPICS = [
  "work_experience",
  "education",
  "job_skills_tools",
  "soft_skills",
  "projects_or_portfolio",
  "certifications_training",
  "years_or_seniority",
] as const;

type CvTopic = (typeof CV_TOPICS)[number];

function summarizeAnswer(q: GuidedQuestion, a: GuidedAnswer | undefined): string {
  if (!a) return "(unanswered)";
  const parts: string[] = [];
  if (q.type === "multi_choice") {
    parts.push((a.choices || []).join(", ") || "(none)");
    if (a.otherText?.trim()) parts.push(`Other: ${a.otherText.trim()}`);
  } else {
    parts.push(a.choice || "(none)");
    if (a.otherText?.trim()) parts.push(`Other: ${a.otherText.trim()}`);
  }
  if (a.fieldGroups?.length) {
    a.fieldGroups.forEach((g, i) => {
      const fields = Object.entries(g.values)
        .filter(([, v]) => v?.trim())
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");
      if (fields) parts.push(`details[${i + 1}]: ${fields}`);
    });
  }
  return parts.join("; ");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basics, language, askedQuestions, answers } = body as {
      basics: ResumeBasics;
      language: "en" | "ar";
      askedQuestions?: GuidedQuestion[];
      answers?: Record<string, GuidedAnswer>;
    };

    if (!basics?.fullName || !basics?.targetRole) {
      return NextResponse.json(
        { error: "Name and target role are required" },
        { status: 400 }
      );
    }

    const asked = askedQuestions ?? [];
    const answerMap = answers ?? {};
    const history = asked.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      category: q.category,
      answer: summarizeAnswer(q, answerMap[q.id]),
    }));

    const openai = getOpenAIClient();
    const langInstruction =
      language === "ar"
        ? "Write the question, options, and field labels in Arabic."
        : "Write the question, options, and field labels in English.";

    const spokenLanguages = (basics.languages || [])
      .filter((l) => l.language?.trim())
      .map((l) =>
        l.proficiency ? `${l.language} (${l.proficiency})` : l.language
      )
      .join(", ");

    const completion = await openai.chat.completions.create({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior career coach at Bahath Jobz building a resume via ONE question at a time. ${langInstruction}

## Candidate
- Target job / profession: "${basics.targetRole}"
- Name: ${basics.fullName}
- Location: ${basics.location || "(not set)"}
- Spoken languages already collected: ${spokenLanguages || "(none)"}

## Goal
Ask the NEXT single multiple-choice / checkbox / yes-no question that best fills missing CV content for this exact profession.
Questions must be practical and specific to "${basics.targetRole}" — never generic nonsense.

## CV topics to cover (ask until these are reasonably covered)
${CV_TOPICS.map((t) => `- ${t}`).join("\n")}

After enough coverage (typically 7–12 questions total), set "done": true.

## Already asked (${asked.length} so far)
${history.length ? JSON.stringify(history, null, 2) : "(none yet — ask the first question)"}

## CRITICAL quality rules
1. Questions MUST fit "${basics.targetRole}". Bad example for a plumber: "Have you worked on plumbing projects?" (redundant/silly). Good: "Which types of plumbing work do you do most?" with options like residential / commercial / industrial.
2. Do NOT re-ask information already answered above.
3. Do NOT invent tech stacks for non-tech jobs (no React for plumbers; no pipe fittings for software engineers).
4. Prefer concrete options a person in that field would recognize.
5. For prior employment: yes_no with followUp fields company, position, startDate, endDate (allowMultiple true).
6. For education: yes_no or single_choice with followUp degree, institution, graduationDate when useful.
7. Skills/tools questions must use tools of THAT trade (e.g. plumber: soldering, drain cleaning; teacher: classroom management, curriculum design).
8. Skip spoken languages if already provided.
9. Every question will show an "Other" field in the UI — still provide solid options.

## Question types
- "yes_no"
- "single_choice" (4–7 options)
- "multi_choice" (4–8 options)

## Response JSON (exactly one of these shapes)

If more questions needed:
{
  "done": false,
  "coveredTopics": ["work_experience", "..."],
  "question": {
    "id": "q${asked.length + 1}",
    "question": "...",
    "type": "yes_no" | "single_choice" | "multi_choice",
    "options": ["..."],
    "allowOther": true,
    "followUp": {
      "showWhen": "yes",
      "allowMultiple": true,
      "fields": [
        { "id": "company", "label": "...", "inputType": "text", "required": true },
        { "id": "position", "label": "...", "inputType": "text", "required": true },
        { "id": "startDate", "label": "...", "inputType": "month", "required": true },
        { "id": "endDate", "label": "...", "inputType": "month", "required": false }
      ]
    },
    "category": "experience" | "skills" | "education" | "achievements" | "projects" | "technologies" | "certifications" | "general",
    "topic": "work_experience" | "education" | "job_skills_tools" | "soft_skills" | "projects_or_portfolio" | "certifications_training" | "years_or_seniority"
  }
}

If CV essentials are covered enough:
{
  "done": true,
  "coveredTopics": ["work_experience", "education", "job_skills_tools", "soft_skills", "projects_or_portfolio", "certifications_training", "years_or_seniority"]
}

Hard limits:
- Minimum ${Math.min(6, Math.max(1, 8 - asked.length))} more questions if under 6 asked so far (unless absurd).
- Maximum 12 questions total — if already at 12, return done: true.
- Never return an empty question when done is false.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            targetRole: basics.targetRole,
            askedCount: asked.length,
            history,
          }),
        },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as {
      done?: boolean;
      coveredTopics?: CvTopic[];
      question?: GuidedQuestion & { topic?: string };
    };

    if (asked.length >= 12 || parsed.done) {
      return NextResponse.json({
        done: true,
        coveredTopics: parsed.coveredTopics ?? [],
      });
    }

    const q = parsed.question;
    if (!q?.question || !q?.type) {
      // Fail soft: if model messed up after enough questions, finish
      if (asked.length >= 6) {
        return NextResponse.json({ done: true, coveredTopics: parsed.coveredTopics ?? [] });
      }
      return NextResponse.json(
        { error: "Failed to generate next question" },
        { status: 500 }
      );
    }

    const question: GuidedQuestion = {
      id: q.id || `q${asked.length + 1}`,
      question: q.question,
      type: q.type,
      options: q.type === "yes_no" ? undefined : q.options || [],
      allowOther: true,
      followUp: q.followUp,
      category: q.category || "general",
    };

    return NextResponse.json({
      done: false,
      question,
      coveredTopics: parsed.coveredTopics ?? [],
    });
  } catch (error) {
    console.error("Guided next question error:", error);
    return NextResponse.json(
      { error: "Failed to generate next question" },
      { status: 500 }
    );
  }
}
