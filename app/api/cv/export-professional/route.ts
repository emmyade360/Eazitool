import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as {
      htmlTemplate: string;
      fileBaseName?: string;
    };

    if (!payload.htmlTemplate) {
      return NextResponse.json({ error: 'Missing HTML template.' }, { status: 400 });
    }

    // Add print-optimized styles to the HTML
    const printOptimizedHtml = payload.htmlTemplate.replace(
      '</style>',
      `
  @media print {
    @page { size: A4; margin: 0.5in; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  @media screen {
    body { background: #f1f5f9; padding: 20px; }
    .cv-wrapper { max-width: 210mm; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
  }
</style>`
    );

    const htmlWithWrapper = printOptimizedHtml.includes('cv-wrapper')
      ? printOptimizedHtml
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.fileBaseName || 'CV'}</title>
  <style>
    @media print {
      @page { size: A4; margin: 0.5in; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="cv-wrapper">
    ${payload.htmlTemplate}
  </div>
</body>
</html>`;

    return new NextResponse(htmlWithWrapper, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${payload.fileBaseName || 'CV'}.html"`,
      },
    });
  } catch (error) {
    console.error('Professional template export error:', error);
    return NextResponse.json(
      { error: 'Export failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
