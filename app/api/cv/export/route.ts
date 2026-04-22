import { NextRequest, NextResponse } from 'next/server';
import {
  CV_TEMPLATE_META,
  CV_TEMPLATE_THEMES,
  parseResumeMarkdown,
  type CVTemplateId,
  type ResumeDocument,
  type ResumeSection,
} from '@/lib/cv-document';

type ExportPayload = {
  content: string;
  templateId: CVTemplateId;
  format: 'pdf' | 'docx';
  fileBaseName?: string;
};

function sanitizeFilename(value: string) {
  return value.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'CV';
}

function splitSectionsForSidebar(resume: ResumeDocument) {
  const sidebarTitles = new Set(['Skills', 'Certifications', 'Languages']);
  return {
    sidebarSections: resume.sections.filter((section) => sidebarTitles.has(section.title)),
    mainSections: resume.sections.filter((section) => !sidebarTitles.has(section.title)),
  };
}

async function exportDocx(payload: ExportPayload, resume: ResumeDocument) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const theme = CV_TEMPLATE_THEMES[payload.templateId];
  const templateMeta = CV_TEMPLATE_META[payload.templateId];

  const makeSectionParagraphs = (sections: ResumeSection[]) =>
    sections.flatMap((section) => {
      const blocks = [
        new Paragraph({
          spacing: { before: 220, after: 80 },
          border: {
            bottom: {
              color: theme.borderColor.replace('#', ''),
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          children: [
            new TextRun({
              text: section.title.toUpperCase(),
              bold: true,
              size: 20,
              color: theme.subheadingColor.replace('#', ''),
            }),
          ],
        }),
      ];

      section.paragraphs.forEach((paragraph) => {
        blocks.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: paragraph,
                size: 22,
                color: theme.bodyColor.replace('#', ''),
              }),
            ],
          })
        );
      });

      section.bullets.forEach((bullet) => {
        blocks.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: bullet,
                size: 22,
                color: theme.bodyColor.replace('#', ''),
              }),
            ],
          })
        );
      });

      section.entries.forEach((entry) => {
        blocks.push(
          new Paragraph({
            spacing: { before: 90, after: 20 },
            children: [
              new TextRun({
                text: entry.heading,
                bold: true,
                size: 24,
                color: theme.accentColor.replace('#', ''),
              }),
              ...(entry.meta
                ? [
                    new TextRun({
                      text: `  ${entry.meta}`,
                      size: 20,
                      color: theme.mutedColor.replace('#', ''),
                    }),
                  ]
                : []),
            ],
          })
        );

        entry.bullets.forEach((bullet) => {
          blocks.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 22,
                  color: theme.bodyColor.replace('#', ''),
                }),
              ],
            })
          );
        });
      });

      return blocks;
    });

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: {
              fill: payload.templateId === 'contrast'
                ? theme.panelBackground.replace('#', '')
                : theme.pageBackground.replace('#', ''),
              type: ShadingType.CLEAR,
              color: 'auto',
            },
            margins: { top: 220, right: 260, bottom: 220, left: 260 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: resume.header.name || templateMeta.label,
                    bold: true,
                    size: 34,
                    color: theme.headingColor.replace('#', ''),
                  }),
                ],
              }),
              ...(resume.header.tagline
                ? [
                    new Paragraph({
                      spacing: { after: 70 },
                      children: [
                        new TextRun({
                          text: resume.header.tagline,
                          size: 22,
                          color: theme.bodyColor.replace('#', ''),
                        }),
                      ],
                    }),
                  ]
                : []),
              ...(resume.header.contacts.length > 0
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: resume.header.contacts.join('  |  '),
                          size: 18,
                          color: theme.mutedColor.replace('#', ''),
                        }),
                      ],
                    }),
                  ]
                : []),
            ],
          }),
        ],
      }),
    ],
  });

  const children = [headerTable];

  if (payload.templateId === 'sidebar') {
    const { sidebarSections, mainSections } = splitSectionsForSidebar(resume);
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 28, type: WidthType.PERCENTAGE },
                shading: {
                  fill: (theme.sidebarBackground ?? theme.accentColor).replace('#', ''),
                  type: ShadingType.CLEAR,
                  color: 'auto',
                },
                margins: { top: 180, right: 180, bottom: 180, left: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                },
                children: makeSectionParagraphs(sidebarSections.length > 0 ? sidebarSections : resume.sections.slice(0, 2)),
              }),
              new TableCell({
                width: { size: 72, type: WidthType.PERCENTAGE },
                margins: { top: 180, right: 220, bottom: 180, left: 220 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                },
                children: makeSectionParagraphs(mainSections),
              }),
            ],
          }),
        ],
      })
    );
  } else {
    children.push(...makeSectionParagraphs(resume.sections));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

async function exportPdf(payload: ExportPayload, resume: ResumeDocument) {
  const PDFDocument = (await import('pdfkit')).default;
  const theme = CV_TEMPLATE_THEMES[payload.templateId];
  const doc = new PDFDocument({ size: 'A4', margin: 42 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  const ensureSpace = (neededHeight = 80) => {
    if (doc.y + neededHeight > pageHeight - margin) {
      doc.addPage();
      if (payload.templateId === 'contrast') {
        doc.save();
        doc.rect(0, 0, pageWidth, pageHeight).fill(theme.pageBackground);
        doc.restore();
      }
    }
  };

  const writeSection = (section: ResumeSection, x = margin, width = contentWidth) => {
    ensureSpace(90);
    doc
      .strokeColor(theme.borderColor)
      .lineWidth(1)
      .moveTo(x, doc.y)
      .lineTo(x + width, doc.y)
      .stroke();
    doc.moveDown(0.55);

    doc
      .fillColor(theme.subheadingColor)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(section.title.toUpperCase(), x, doc.y, {
        width,
        characterSpacing: 1.1,
      });
    doc.moveDown(0.4);

    section.paragraphs.forEach((paragraph) => {
      ensureSpace(60);
      doc
        .fillColor(theme.bodyColor)
        .font('Helvetica')
        .fontSize(10.5)
        .text(paragraph, x, doc.y, { width, lineGap: 3 });
      doc.moveDown(0.5);
    });

    section.bullets.forEach((bullet) => {
      ensureSpace(44);
      doc
        .fillColor(theme.bodyColor)
        .font('Helvetica')
        .fontSize(10.5)
        .text(`• ${bullet}`, x + 6, doc.y, { width: width - 6, lineGap: 3 });
      doc.moveDown(0.3);
    });

    section.entries.forEach((entry) => {
      ensureSpace(70);
      const topY = doc.y;
      doc
        .fillColor(theme.accentColor)
        .font('Helvetica-Bold')
        .fontSize(11.5)
        .text(entry.heading, x, topY, { width: width * 0.58 });
      if (entry.meta) {
        doc
          .fillColor(theme.mutedColor)
          .font('Helvetica')
          .fontSize(9.5)
          .text(entry.meta, x + width * 0.6, topY + 1, { width: width * 0.4, align: 'right' });
      }
      doc.y = Math.max(doc.y, topY + 18);
      entry.bullets.forEach((bullet) => {
        ensureSpace(40);
        doc
          .fillColor(theme.bodyColor)
          .font('Helvetica')
          .fontSize(10)
          .text(`• ${bullet}`, x + 6, doc.y, { width: width - 6, lineGap: 3 });
        doc.moveDown(0.25);
      });
      doc.moveDown(0.25);
    });

    doc.moveDown(0.6);
  };

  if (payload.templateId === 'contrast') {
    doc.save();
    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.pageBackground);
    doc.restore();
  } else {
    doc.save();
    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.pageBackground);
    doc.restore();
  }

  if (payload.templateId === 'sidebar') {
    const sidebarWidth = 160;
    const mainX = margin + sidebarWidth + 18;
    const mainWidth = contentWidth - sidebarWidth - 18;
    const { sidebarSections, mainSections } = splitSectionsForSidebar(resume);

    doc.save();
    doc.roundedRect(margin, margin, sidebarWidth, pageHeight - margin * 2, 18).fill(theme.sidebarBackground ?? theme.accentColor);
    doc.restore();

    doc
      .fillColor(theme.sidebarText ?? '#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(resume.header.name || CV_TEMPLATE_META[payload.templateId].label, margin + 18, margin + 18, {
        width: sidebarWidth - 36,
      });
    if (resume.header.tagline) {
      doc
        .fillColor(theme.sidebarText ?? '#FFFFFF')
        .font('Helvetica')
        .fontSize(10)
        .text(resume.header.tagline, margin + 18, doc.y + 6, { width: sidebarWidth - 36, lineGap: 3 });
    }
    if (resume.header.contacts.length > 0) {
      doc.moveDown(0.6);
      resume.header.contacts.forEach((contact) => {
        doc
          .fillColor('#DBEAFE')
          .font('Helvetica')
          .fontSize(9)
          .text(contact, margin + 18, doc.y + 4, { width: sidebarWidth - 36, lineGap: 2 });
      });
    }

    const savedY = doc.y;
    doc.y = margin + 190;
    sidebarSections.forEach((section) => {
      doc
        .fillColor('#DBEAFE')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(section.title.toUpperCase(), margin + 18, doc.y, { width: sidebarWidth - 36 });
      doc.moveDown(0.3);
      [...section.paragraphs, ...section.bullets, ...section.entries.flatMap((entry) => [entry.heading, ...(entry.meta ? [entry.meta] : []), ...entry.bullets])]
        .forEach((line) => {
          doc
            .fillColor(theme.sidebarText ?? '#FFFFFF')
            .font('Helvetica')
            .fontSize(8.6)
            .text(line, margin + 18, doc.y + 2, { width: sidebarWidth - 36, lineGap: 2 });
        });
      doc.moveDown(0.7);
    });

    doc.y = margin + 26;
    doc
      .fillColor(theme.headingColor)
      .font('Helvetica-Bold')
      .fontSize(26)
      .text(resume.header.name || CV_TEMPLATE_META[payload.templateId].label, mainX, doc.y, { width: mainWidth });
    if (resume.header.tagline) {
      doc
        .fillColor(theme.bodyColor)
        .font('Helvetica')
        .fontSize(11)
        .text(resume.header.tagline, mainX, doc.y + 6, { width: mainWidth, lineGap: 3 });
    }
    doc.moveDown(0.8);
    mainSections.forEach((section) => writeSection(section, mainX, mainWidth));
    doc.y = Math.max(doc.y, savedY);
  } else {
    const headerHeight = payload.templateId === 'spotlight' ? 116 : 96;
    const headerFill = payload.templateId === 'spotlight'
      ? theme.accentColor
      : payload.templateId === 'contrast'
        ? theme.panelBackground
        : theme.panelBackground;

    doc.save();
    doc.roundedRect(margin, margin, contentWidth, headerHeight, 20).fill(headerFill);
    doc.restore();

    const headerTextColor = payload.templateId === 'contrast' || payload.templateId === 'spotlight'
      ? '#F8FAFC'
      : theme.headingColor;

    doc
      .fillColor(headerTextColor)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text(resume.header.name || CV_TEMPLATE_META[payload.templateId].label, margin + 22, margin + 20, {
        width: contentWidth - 44,
      });

    if (resume.header.tagline) {
      doc
        .fillColor(payload.templateId === 'spotlight' ? '#FFF7ED' : theme.bodyColor)
        .font('Helvetica')
        .fontSize(11)
        .text(resume.header.tagline, margin + 22, doc.y + 6, {
          width: contentWidth - 44,
          lineGap: 3,
        });
    }

    if (resume.header.contacts.length > 0) {
      doc
        .fillColor(payload.templateId === 'spotlight' ? '#FFEDD5' : theme.mutedColor)
        .font('Helvetica')
        .fontSize(9.5)
        .text(resume.header.contacts.join('  |  '), margin + 22, margin + headerHeight - 26, {
          width: contentWidth - 44,
        });
    }

    doc.y = margin + headerHeight + 18;

    if (payload.templateId === 'minimal-grid') {
      const columnWidth = (contentWidth - 16) / 2;
      let leftY = doc.y;
      let rightY = doc.y;

      resume.sections.forEach((section, index) => {
        const targetX = index % 2 === 0 ? margin : margin + columnWidth + 16;
        doc.y = index % 2 === 0 ? leftY : rightY;
        doc.save();
        doc.roundedRect(targetX, doc.y, columnWidth, 10, 16).fillOpacity(0).strokeOpacity(0);
        doc.restore();
        writeSection(section, targetX, columnWidth);
        if (index % 2 === 0) {
          leftY = doc.y;
        } else {
          rightY = doc.y;
        }
      });
      doc.y = Math.max(leftY, rightY);
    } else {
      resume.sections.forEach((section) => writeSection(section));
    }
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    doc.on('end', () => resolve());
    doc.on('error', reject);
  });

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ExportPayload;

    if (!payload.content || !payload.templateId || !payload.format) {
      return NextResponse.json({ error: 'Missing content, templateId, or format.' }, { status: 400 });
    }

    const resume = parseResumeMarkdown(payload.content);
    const fileBaseName = sanitizeFilename(payload.fileBaseName ?? resume.header.name ?? 'CV');

    if (payload.format === 'docx') {
      const buffer = await exportDocx(payload, resume);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileBaseName}.docx"`,
        },
      });
    }

    if (payload.format === 'pdf') {
      const buffer = await exportPdf(payload, resume);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileBaseName}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported export format.' }, { status: 400 });
  } catch (error) {
    console.error('CV export error:', error);
    return NextResponse.json(
      { error: 'Export failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
