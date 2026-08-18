import { NextRequest, NextResponse } from 'next/server';
import {
  getCVTemplateDesign,
  getCVTemplateLayout,
  getCVTemplateTheme,
  parseResumeMarkdown,
  type CVTemplateId,
  type ResumeDocument,
  type ResumeSection,
} from '@/lib/cv-document';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';

type ExportPayload = {
  content: string;
  templateId: CVTemplateId;
  format: 'pdf' | 'docx';
  fileBaseName?: string;
  passportPhoto?: string;
};

function sanitizeFilename(value: string) {
  return value.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'CV';
}

type PassportPhoto = {
  data: Buffer;
  type: 'jpg' | 'png';
};

function readPassportPhoto(value: unknown): PassportPhoto | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return undefined;

  const data = Buffer.from(match[2]!, 'base64');
  if (data.length === 0 || data.length > 1024 * 1024) return undefined;
  return { data, type: match[1] === 'png' ? 'png' : 'jpg' };
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
    BorderStyle,
    Document,
    ImageRun,
    Packer,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');

  const theme = getCVTemplateTheme(payload.templateId);
  const layout = getCVTemplateLayout(payload.templateId);
  const design = getCVTemplateDesign(payload.templateId);
  const passportPhoto = readPassportPhoto(payload.passportPhoto);
  const usesSidebar = ['sidebar-left', 'sidebar-right'].includes(design.bodyStyle) || layout === 'sidebar';
  const photoInSidebar = Boolean(passportPhoto) && design.photoPlacement === 'sidebar-top' && usesSidebar;
  const darkHeader = ['banner', 'diagonal'].includes(design.headerStyle) || layout === 'contrast';
  const headerFill = darkHeader
    ? theme.accentColor
    : design.headerStyle === 'panel' || design.headerStyle === 'boxed'
      ? theme.pageBackground
      : theme.panelBackground;
  const documentFont = design.fontFamily === 'serif'
    ? 'Times New Roman'
    : design.fontFamily === 'mono'
      ? 'Courier New'
      : 'Arial';
  const sectionSpacing = design.density === 'airy' ? 280 : design.density === 'compact' ? 140 : 220;

  const makeSectionParagraphs = (sections: ResumeSection[]) =>
    sections.flatMap((section) => {
      const sectionStyle = design.sectionStyle;
      const sectionTitle = sectionStyle === 'numbered'
        ? `${String(resume.sections.indexOf(section) + 1).padStart(2, '0')}  ${section.title.toUpperCase()}`
        : section.title.toUpperCase();
      const boxedSection = sectionStyle === 'boxed' || sectionStyle === 'pill' || sectionStyle === 'capsule';
      const blocks = [
        new Paragraph({
          spacing: { before: sectionSpacing, after: 80 },
          shading: boxedSection
            ? {
                fill: sectionStyle === 'pill' || sectionStyle === 'capsule'
                  ? theme.accentColor.replace('#', '')
                  : theme.pageBackground.replace('#', ''),
                type: ShadingType.CLEAR,
                color: 'auto',
              }
            : undefined,
          border: sectionStyle === 'minimal' || boxedSection || sectionStyle === 'timeline' || sectionStyle === 'accent-bar'
            ? undefined
            : {
                bottom: {
                  color: theme.borderColor.replace('#', ''),
                  style: BorderStyle.SINGLE,
                  size: sectionStyle === 'underline' ? 10 : 6,
                },
              },
          children: [
            new TextRun({
              text: sectionTitle,
              bold: true,
              size: 20,
              font: documentFont,
              color: (sectionStyle === 'pill' || sectionStyle === 'capsule'
                ? theme.panelBackground
                : theme.subheadingColor).replace('#', ''),
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
              font: documentFont,
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
                font: documentFont,
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
              font: documentFont,
              color: theme.accentColor.replace('#', ''),
              }),
              ...(entry.meta
                ? [
                    new TextRun({
                      text: `  ${entry.meta}`,
                      size: 20,
                      font: documentFont,
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
                font: documentFont,
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
              fill: headerFill.replace('#', ''),
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
              ...(resume.header.name || (passportPhoto && !photoInSidebar)
                ? [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [
                        ...((passportPhoto && !photoInSidebar && !['top-right', 'header-right'].includes(design.photoPlacement))
                          ? [
                              new ImageRun({
                                data: passportPhoto.data,
                                type: passportPhoto.type,
                                transformation: { width: 58, height: 58 },
                              }),
                            ]
                          : []),
                        new TextRun({
                          text: `${passportPhoto && !photoInSidebar && !['top-right', 'header-right'].includes(design.photoPlacement) && resume.header.name ? '  ' : ''}${resume.header.name}`,
                          bold: true,
                          size: 34,
                          font: documentFont,
                          color: (darkHeader ? '#FFFFFF' : theme.headingColor).replace('#', ''),
                        }),
                        ...((passportPhoto && !photoInSidebar && ['top-right', 'header-right'].includes(design.photoPlacement))
                          ? [
                              new ImageRun({
                                data: passportPhoto.data,
                                type: passportPhoto.type,
                                transformation: { width: 58, height: 58 },
                              }),
                            ]
                          : []),
                      ],
                    }),
                  ]
                : []),
              ...(resume.header.tagline
                ? [
                    new Paragraph({
                      spacing: { after: 70 },
                      children: [
                        new TextRun({
                          text: resume.header.tagline,
                          size: 22,
                          font: documentFont,
                          color: (darkHeader ? '#F8FAFC' : theme.bodyColor).replace('#', ''),
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
                          font: documentFont,
                          color: (darkHeader ? '#F8FAFC' : theme.mutedColor).replace('#', ''),
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

  if (usesSidebar) {
    const { sidebarSections, mainSections } = splitSectionsForSidebar(resume);
    const sidebarCell = new TableCell({
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
      children: [
        ...(passportPhoto && photoInSidebar
          ? [
              new Paragraph({
                spacing: { after: 120 },
                children: [
                  new ImageRun({
                    data: passportPhoto.data,
                    type: passportPhoto.type,
                    transformation: { width: 58, height: 58 },
                  }),
                ],
              }),
            ]
          : []),
        ...makeSectionParagraphs(sidebarSections.length > 0 ? sidebarSections : resume.sections.slice(0, 2)),
      ],
    });
    const mainCell = new TableCell({
      width: { size: 72, type: WidthType.PERCENTAGE },
      margins: { top: 180, right: 220, bottom: 180, left: 220 },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      children: makeSectionParagraphs(mainSections),
    });
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: design.bodyStyle === 'sidebar-right' ? [mainCell, sidebarCell] : [sidebarCell, mainCell],
          }),
        ],
      })
    );
  } else if (design.bodyStyle === 'two-column' || design.bodyStyle === 'cards' || layout === 'minimal-grid') {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 100, right: 150, bottom: 100, left: 0 },
                children: makeSectionParagraphs(resume.sections.filter((_, index) => index % 2 === 0)),
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 100, right: 0, bottom: 100, left: 150 },
                children: makeSectionParagraphs(resume.sections.filter((_, index) => index % 2 !== 0)),
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
  const theme = getCVTemplateTheme(payload.templateId);
  const layout = getCVTemplateLayout(payload.templateId);
  const design = getCVTemplateDesign(payload.templateId);
  const passportPhoto = readPassportPhoto(payload.passportPhoto);
  const doc = new PDFDocument({ size: 'A4', margin: 42 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const photoPlacement = design.photoPlacement === 'none' ? 'top-left' : design.photoPlacement;
  const photoSize = 62;

  const drawPassportPhoto = (x: number, y: number, lightBorder = false) => {
    if (!passportPhoto) return;

    try {
      doc.save();
      if (design.photoShape === 'circle') {
        doc.circle(x + photoSize / 2, y + photoSize / 2, photoSize / 2).clip();
      } else if (design.photoShape === 'rounded') {
        doc.roundedRect(x, y, photoSize, photoSize, 10).clip();
      }
      doc.image(passportPhoto.data, x, y, { fit: [photoSize, photoSize] });
      doc.restore();
      doc.save();
      doc.lineWidth(2).strokeColor(lightBorder ? '#FFFFFF' : theme.panelBackground);
      if (design.photoShape === 'circle') {
        doc.circle(x + photoSize / 2, y + photoSize / 2, photoSize / 2 - 1).stroke();
      } else if (design.photoShape === 'rounded') {
        doc.roundedRect(x + 1, y + 1, photoSize - 2, photoSize - 2, 9).stroke();
      } else {
        doc.rect(x + 1, y + 1, photoSize - 2, photoSize - 2).stroke();
      }
      doc.restore();
    } catch {
      // An invalid image must not block the rest of the CV export.
    }
  };

  const ensureSpace = (neededHeight = 80) => {
    if (doc.y + neededHeight > pageHeight - margin) {
      doc.addPage();
      if (layout === 'contrast') {
        doc.save();
        doc.rect(0, 0, pageWidth, pageHeight).fill(theme.pageBackground);
        doc.restore();
      }
    }
  };

  const writeSection = (section: ResumeSection, x = margin, width = contentWidth) => {
    ensureSpace(90);
    const sectionStyle = design.sectionStyle;
    const title = sectionStyle === 'numbered'
      ? `${String(resume.sections.indexOf(section) + 1).padStart(2, '0')}  ${section.title.toUpperCase()}`
      : section.title.toUpperCase();
    const sectionY = doc.y;

    if (sectionStyle === 'accent-bar' || sectionStyle === 'timeline') {
      doc.rect(x, sectionY, sectionStyle === 'timeline' ? 7 : width, sectionStyle === 'timeline' ? 7 : 4).fill(theme.accentColor);
      doc.y = sectionY + 10;
    } else if (sectionStyle !== 'minimal' && sectionStyle !== 'boxed' && sectionStyle !== 'pill' && sectionStyle !== 'capsule') {
      doc.strokeColor(theme.borderColor).lineWidth(1).moveTo(x, sectionY).lineTo(x + width, sectionY).stroke();
      doc.moveDown(0.55);
    }

    doc.fillColor(theme.subheadingColor).font('Helvetica-Bold').fontSize(10);
    if (sectionStyle === 'pill' || sectionStyle === 'capsule') {
      const pillWidth = Math.min(width, doc.widthOfString(title) + 22);
      const titleY = doc.y;
      doc.roundedRect(x, titleY, pillWidth, 20, 10).fill(theme.accentColor);
      doc.fillColor(theme.panelBackground).text(title, x + 11, titleY + 5, { width: pillWidth - 16, characterSpacing: 0.8 });
    } else if (sectionStyle === 'boxed') {
      const titleY = doc.y;
      doc.roundedRect(x, titleY, width, 24, 6).fill(theme.pageBackground);
      doc.fillColor(theme.subheadingColor).text(title, x + 10, titleY + 6, { width: width - 20, characterSpacing: 1.1 });
    } else {
      doc.text(title, x, doc.y, { width, characterSpacing: 1.1 });
    }
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

  if (layout === 'contrast') {
    doc.save();
    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.pageBackground);
    doc.restore();
  } else {
    doc.save();
    doc.rect(0, 0, pageWidth, pageHeight).fill(theme.pageBackground);
    doc.restore();
  }

  const usesSidebar = ['sidebar-left', 'sidebar-right'].includes(design.bodyStyle) || layout === 'sidebar';

  if (usesSidebar) {
    const sidebarWidth = 160;
    const sidebarOnRight = design.bodyStyle === 'sidebar-right';
    const sidebarX = sidebarOnRight ? margin + contentWidth - sidebarWidth : margin;
    const mainX = sidebarOnRight ? margin : margin + sidebarWidth + 18;
    const mainWidth = contentWidth - sidebarWidth - 18;
    const { sidebarSections, mainSections } = splitSectionsForSidebar(resume);

    doc.save();
    doc.roundedRect(sidebarX, margin, sidebarWidth, pageHeight - margin * 2, 18).fill(theme.sidebarBackground ?? theme.accentColor);
    doc.restore();

    const photoInSidebar = passportPhoto && photoPlacement === 'sidebar-top';
    const photoAtStart = passportPhoto && ['top-left', 'header-left', 'inline'].includes(photoPlacement);
    const photoAtEnd = passportPhoto && ['top-right', 'header-right'].includes(photoPlacement);
    const sidebarHeaderY = photoInSidebar ? margin + photoSize + 30 : margin + 18;
    if (photoInSidebar) drawPassportPhoto(sidebarX + 18, margin + 18, true);

    if (resume.header.name) {
      doc
        .fillColor(theme.sidebarText ?? '#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(resume.header.name, sidebarX + 18, sidebarHeaderY, {
          width: sidebarWidth - 36,
        });
    }
    if (resume.header.tagline) {
      doc
        .fillColor(theme.sidebarText ?? '#FFFFFF')
        .font('Helvetica')
        .fontSize(10)
        .text(resume.header.tagline, sidebarX + 18, doc.y + 6, { width: sidebarWidth - 36, lineGap: 3 });
    }
    if (resume.header.contacts.length > 0) {
      doc.moveDown(0.6);
      resume.header.contacts.forEach((contact) => {
        doc
          .fillColor('#DBEAFE')
          .font('Helvetica')
          .fontSize(9)
          .text(contact, sidebarX + 18, doc.y + 4, { width: sidebarWidth - 36, lineGap: 2 });
      });
    }

    const savedY = doc.y;
    doc.y = margin + 190;
    sidebarSections.forEach((section) => {
      doc
        .fillColor('#DBEAFE')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(section.title.toUpperCase(), sidebarX + 18, doc.y, { width: sidebarWidth - 36 });
      doc.moveDown(0.3);
      [...section.paragraphs, ...section.bullets, ...section.entries.flatMap((entry) => [entry.heading, ...(entry.meta ? [entry.meta] : []), ...entry.bullets])]
        .forEach((line) => {
          doc
            .fillColor(theme.sidebarText ?? '#FFFFFF')
            .font('Helvetica')
            .fontSize(8.6)
            .text(line, sidebarX + 18, doc.y + 2, { width: sidebarWidth - 36, lineGap: 2 });
        });
      doc.moveDown(0.7);
    });

    doc.y = margin + 26;
    const mainNameX = photoAtStart ? mainX + photoSize + 14 : mainX;
    const mainNameWidth = mainWidth - (photoAtStart || photoAtEnd ? photoSize + 14 : 0);
    if (photoAtStart) drawPassportPhoto(mainX, margin + 18);
    if (photoAtEnd) drawPassportPhoto(mainX + mainWidth - photoSize, margin + 18);
    if (resume.header.name) {
      doc
        .fillColor(theme.headingColor)
        .font('Helvetica-Bold')
        .fontSize(26)
        .text(resume.header.name, mainNameX, doc.y, { width: mainNameWidth });
    }
    if (resume.header.tagline) {
      doc
        .fillColor(theme.bodyColor)
        .font('Helvetica')
        .fontSize(11)
        .text(resume.header.tagline, mainNameX, doc.y + 6, { width: mainNameWidth, lineGap: 3 });
    }
    doc.moveDown(0.8);
    mainSections.forEach((section) => writeSection(section, mainX, mainWidth));
    doc.y = Math.max(doc.y, savedY);
  } else {
    const visualHeaderStyle = design.headerStyle;
    const darkHeader = ['banner', 'diagonal'].includes(visualHeaderStyle) || layout === 'spotlight' || layout === 'contrast';
    const headerHeight = visualHeaderStyle === 'compact' ? 82 : darkHeader || visualHeaderStyle === 'centered' ? 126 : 102;
    const headerFill = darkHeader ? theme.accentColor : visualHeaderStyle === 'panel' || visualHeaderStyle === 'boxed' ? theme.pageBackground : theme.panelBackground;

    doc.save();
    doc.roundedRect(margin, margin, contentWidth, headerHeight, 20).fill(headerFill);
    doc.restore();

    const headerTextColor = darkHeader ? '#F8FAFC' : theme.headingColor;

    doc.y = margin + 20;
    const photoAtStart = passportPhoto && ['top-left', 'header-left', 'inline'].includes(photoPlacement);
    const photoAtEnd = passportPhoto && ['top-right', 'header-right'].includes(photoPlacement);
    const photoX = photoAtEnd ? margin + contentWidth - photoSize - 22 : margin + 22;
    const nameX = photoAtStart ? margin + photoSize + 34 : margin + 22;
    const nameWidth = contentWidth - 44 - (photoAtStart || photoAtEnd ? photoSize + 14 : 0);
    if (passportPhoto && (photoAtStart || photoAtEnd)) drawPassportPhoto(photoX, margin + 20, darkHeader);
    if (resume.header.name) {
      doc
        .fillColor(headerTextColor)
        .font('Helvetica-Bold')
        .fontSize(24)
        .text(resume.header.name, nameX, doc.y, {
          width: nameWidth,
        });
    }

    if (resume.header.tagline) {
      doc
        .fillColor(layout === 'spotlight' ? '#FFF7ED' : theme.bodyColor)
        .font('Helvetica')
        .fontSize(11)
        .text(resume.header.tagline, nameX, doc.y + 6, {
          width: nameWidth,
          lineGap: 3,
        });
    }

    if (resume.header.contacts.length > 0) {
      doc
        .fillColor(layout === 'spotlight' ? '#FFEDD5' : theme.mutedColor)
        .font('Helvetica')
        .fontSize(9.5)
        .text(resume.header.contacts.join('  |  '), nameX, margin + headerHeight - 26, {
          width: nameWidth,
        });
    }

    doc.y = margin + headerHeight + 18;

    if (design.bodyStyle === 'two-column' || layout === 'minimal-grid') {
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

  if (exceedsBodyLimit(req, BODY_LIMITS.cv)) {
    return payloadTooLarge('Upload is too large.');
  }

  const rateLimit = checkRateLimit(req, RATE_LIMITS.cv);
  if (!rateLimit.ok) {
    return tooManyRequests(rateLimit.retryAfterSec, 'Too many exports. Try again in a few minutes.');
  }
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
