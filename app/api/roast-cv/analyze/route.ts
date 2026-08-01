import { NextRequest, NextResponse } from 'next/server';
import {
  cleanCVText,
  detectCVSections,
  extractExperienceBullets,
  getWordCount,
  parseCVFile,
} from '@/lib/cv-parser';
import { analyzeCV, createImprovedCV, matchRoleKeywords } from '@/lib/ats-scorer';
import {
  generateRoastSummary,
  improveBulletsWithAI,
  type ImprovedBullet,
} from '@/lib/bullet-rewriter';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {

  if (exceedsBodyLimit(req, BODY_LIMITS.roastCv)) {
    return payloadTooLarge('Upload is too large.');
  }

  const rateLimit = checkRateLimit(req, RATE_LIMITS.roastCv);
  if (!rateLimit.ok) {
    return tooManyRequests(rateLimit.retryAfterSec, 'Too many CV reviews. Try again in a few minutes.');
  }
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const targetRole = ((formData.get('targetRole') as string | null) ?? '').trim();

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 });
    }

    const allowedTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF or DOCX' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedCV = await parseCVFile(buffer, file.name);
    const cleanText = cleanCVText(parsedCV.text);
    const sections = detectCVSections(cleanText);
    const bullets = extractExperienceBullets(cleanText);
    const atsScore = analyzeCV(cleanText, parsedCV.pages, targetRole || undefined);
    const roleAnalysis = targetRole
      ? matchRoleKeywords(cleanText, targetRole)
      : { matched: [], missing: [], score: 0 };
    const roastSummary = await generateRoastSummary(cleanText, atsScore, targetRole || undefined);

    let improvedBullets: ImprovedBullet[] = [];
    if (bullets.length > 0) {
      try {
        improvedBullets = await improveBulletsWithAI(bullets.slice(0, 10), targetRole || 'general');
      } catch (error) {
        console.error('AI improvement failed:', error);
      }
    }

    const improvedText =
      improvedBullets.length > 0 ? createImprovedCV(cleanText, improvedBullets) : cleanText;

    return NextResponse.json({
      success: true,
      data: {
        text: cleanText,
        wordCount: getWordCount(cleanText),
        pages: parsedCV.pages,
        sections,
        atsScore,
        roleAnalysis,
        roastSummary,
        improvedBullets,
        improvedText,
      },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze CV: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
