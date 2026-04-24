import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload.summary && (!payload.experience || payload.experience.length === 0)) {
      return NextResponse.json(
        { error: 'Please add some work experience or a basic summary to improve.' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert resume writer. Improve the following professional summary to be more impactful, ATS-friendly, and concise.

Current Summary: ${payload.summary || ''}
Name: ${payload.name || ''}
Experience: ${payload.experience?.map((e: { role: string; company: string }) => `${e.role} at ${e.company}`).join(', ') || ''}
Skills: ${payload.skills || ''}

Requirements:
- Keep it professional and first-person free
- Use strong action verbs and quantifiable achievements if possible
- Keep it under 4 sentences
- Make it ATS-optimized
- Output ONLY the improved summary text, no preamble.

Output the improved summary now:`;

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const summary = result.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Improvement failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
