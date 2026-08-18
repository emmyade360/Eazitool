import { NextRequest } from 'next/server';
import mammoth from 'mammoth';
import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/cv/export/route';

describe('CV export', () => {
  it('exports the candidate name and never leaks a template name into DOCX content', async () => {
    const request = new NextRequest('http://localhost/api/cv/export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: `## Contact
Name: Ada Lovelace
Email: ada@example.com

## Professional Summary
Analytical engineer with a clear technical writing record.

## Skills
- TypeScript
`,
        templateId: 'executive',
        format: 'docx',
        passportPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9J9nAAAAAASUVORK5CYII=',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const { value } = await mammoth.extractRawText({
      buffer: Buffer.from(await response.arrayBuffer()),
    });

    expect(value).toContain('Ada Lovelace');
    expect(value).not.toContain('Executive Slate');
  });
});
