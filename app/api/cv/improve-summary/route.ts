import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { headers } from 'next/headers';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface SummaryImprovementPayload {
  summary?: string;
  name?: string;
  experience?: { company: string; role: string; duration: string; bullets: string }[];
  skills?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as SummaryImprovementPayload;

    const experienceText = payload.experience?.length
      ? payload.experience
          .filter((item) => item.company.trim() || item.role.trim() || item.bullets.trim())
          .map((item) => `${item.role} at ${item.company}\n${item.bullets}`)
          .join('\n\n')
      : '';

    const skillsText = payload.skills?.trim() || '';

    let prompt = `You are an expert resume writer. Write a compelling, ATS-optimised professional summary (2-4 sentences, max 150 words) for a CV.

CRITICAL RULES:
- Use third-person professional language (no "I" or "my")
- Highlight key strengths and career highlights
- Include relevant years of experience if inferable
- Focus on value proposition for hiring managers
- No first-person pronouns
- Output ONLY the summary text, nothing else

`;

    if (payload.name) {
      prompt += `Candidate Name: ${payload.name}\n`;
    }

    if (experienceText) {
      prompt += `\nWork Experience:\n${experienceText}\n`;
    }

    if (skillsText) {
      prompt += `\nSkills: ${skillsText}\n`;
    }

    if (payload.summary?.trim()) {
      prompt += `\nCurrent Summary (improve or rewrite if needed):\n${payload.summary.trim()}\n`;
    }

    prompt += `\nWrite the professional summary now:`;

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      max_tokens: 300,
    });

    const improvedSummary = result.choices[0]?.message?.content?.trim() ?? '';

    if (!improvedSummary) {
      throw new Error('Failed to generate summary');
    }

    return NextResponse.json({ summary: improvedSummary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to improve summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}