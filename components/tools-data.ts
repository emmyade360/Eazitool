import type { LanguageCode } from '@/lib/i18n';

const TOOL_COPY = {
  en: {
    ai: {
      category: 'AI Tools',
      items: {
        cvBuilder: ['ATS CV Builder', 'AI-powered, ATS-compliant resume builder via Groq'],
        roastCv: ['Roast My CV', 'Brutal ATS review with AI-powered fixes'],
      },
    },
    document: {
      category: 'Document Converter',
      items: {
        pdfDocx: ['PDF to DOCX', 'Convert PDF to editable Word document'],
        docxPdf: ['DOCX to PDF', 'Convert Word document to PDF'],
        pdfTxt: ['PDF to TXT', 'Extract plain text from PDF'],
        txtPdf: ['TXT to PDF', 'Convert plain text file to PDF'],
        docxTxt: ['DOCX to TXT', 'Extract plain text from Word document'],
      },
    },
    imageConversion: {
      category: 'Image Conversions',
      items: {
        pngJpeg: ['PNG to JPEG', 'Compress PNG to JPEG format'],
        jpegPng: ['JPEG to PNG', 'Convert JPEG to lossless PNG'],
        pngWebp: ['PNG to WebP', 'Convert PNG to modern WebP'],
        jpegWebp: ['JPEG to WebP', 'Convert JPEG to modern WebP'],
        webpPng: ['WebP to PNG', 'Convert WebP to PNG'],
        webpJpeg: ['WebP to JPEG', 'Convert WebP to JPEG'],
        anyWebp: ['Any to WebP', 'Convert any image to WebP'],
      },
    },
    imageTools: {
      category: 'Image Tools',
      items: {
        resizer: ['Image Resizer', 'Resize images to exact dimensions with fit controls'],
        upscaler: ['Image Upscaler', 'Enlarge images up to 4x with high-quality resampling'],
      },
    },
  },
  fr: {
    ai: {
      category: 'Outils IA',
      items: {
        cvBuilder: ['Createur de CV ATS', 'Createur de CV compatible ATS alimente par IA'],
        roastCv: ['Roast My CV', 'Avis brutal ATS avec corrections IA'],
      },
    },
    document: {
      category: 'Convertisseur de documents',
      items: {
        pdfDocx: ['PDF vers DOCX', "Convertir un PDF en document Word modifiable"],
        docxPdf: ['DOCX vers PDF', 'Convertir un document Word en PDF'],
        pdfTxt: ['PDF vers TXT', "Extraire le texte brut d'un PDF"],
        txtPdf: ['TXT vers PDF', 'Convertir un fichier texte en PDF'],
        docxTxt: ['DOCX vers TXT', "Extraire le texte brut d'un document Word"],
      },
    },
    imageConversion: {
      category: "Conversions d'images",
      items: {
        pngJpeg: ['PNG vers JPEG', 'Compresser un PNG en JPEG'],
        jpegPng: ['JPEG vers PNG', 'Convertir un JPEG en PNG sans perte'],
        pngWebp: ['PNG vers WebP', 'Convertir un PNG en WebP moderne'],
        jpegWebp: ['JPEG vers WebP', 'Convertir un JPEG en WebP moderne'],
        webpPng: ['WebP vers PNG', 'Convertir un WebP en PNG'],
        webpJpeg: ['WebP vers JPEG', 'Convertir un WebP en JPEG'],
        anyWebp: ['Tout vers WebP', "Convertir n'importe quelle image en WebP"],
      },
    },
    imageTools: {
      category: "Outils d'image",
      items: {
        resizer: ["Redimensionneur d'image", 'Redimensionner les images avec des dimensions precises'],
        upscaler: ["Ameliorateur d'image", "Agrandir les images jusqu'a 4x avec une haute qualite"],
      },
    },
  },
  es: {
    ai: {
      category: 'Herramientas con IA',
      items: {
        cvBuilder: ['Creador de CV ATS', 'Creador de curriculums con IA compatible con ATS'],
        roastCv: ['Roast My CV', 'Revisión brutal ATS con soluciones IA'],
      },
    },
    document: {
      category: 'Convertidor de documentos',
      items: {
        pdfDocx: ['PDF a DOCX', 'Convierte PDF en un documento Word editable'],
        docxPdf: ['DOCX a PDF', 'Convierte un documento Word en PDF'],
        pdfTxt: ['PDF a TXT', 'Extrae texto sin formato de un PDF'],
        txtPdf: ['TXT a PDF', 'Convierte un archivo de texto en PDF'],
        docxTxt: ['DOCX a TXT', 'Extrae texto sin formato de un documento Word'],
      },
    },
    imageConversion: {
      category: 'Conversiones de imagen',
      items: {
        pngJpeg: ['PNG a JPEG', 'Comprime PNG al formato JPEG'],
        jpegPng: ['JPEG a PNG', 'Convierte JPEG a PNG sin perdida'],
        pngWebp: ['PNG a WebP', 'Convierte PNG al moderno formato WebP'],
        jpegWebp: ['JPEG a WebP', 'Convierte JPEG al moderno formato WebP'],
        webpPng: ['WebP a PNG', 'Convierte WebP a PNG'],
        webpJpeg: ['WebP a JPEG', 'Convierte WebP a JPEG'],
        anyWebp: ['Cualquier imagen a WebP', 'Convierte cualquier imagen a WebP'],
      },
    },
    imageTools: {
      category: 'Herramientas de imagen',
      items: {
        resizer: ['Redimensionador de imagen', 'Redimensiona imagenes con dimensiones exactas'],
        upscaler: ['Escalador de imagen', 'Amplia imagenes hasta 4x con alta calidad'],
      },
    },
  },
  pt: {
    ai: {
      category: 'Ferramentas com IA',
      items: {
        cvBuilder: ['Criador de CV ATS', 'Criador de curriculums com IA compativel com ATS'],
        roastCv: ['Roast My CV', 'Análise brutal ATS com correções de IA'],
      },
    },
    document: {
      category: 'Conversor de documentos',
      items: {
        pdfDocx: ['PDF para DOCX', 'Converta PDF em documento Word editavel'],
        docxPdf: ['DOCX para PDF', 'Converta documento Word em PDF'],
        pdfTxt: ['PDF para TXT', 'Extraia texto simples de um PDF'],
        txtPdf: ['TXT para PDF', 'Converta arquivo de texto em PDF'],
        docxTxt: ['DOCX para TXT', 'Extraia texto simples de um documento Word'],
      },
    },
    imageConversion: {
      category: 'Conversoes de imagem',
      items: {
        pngJpeg: ['PNG para JPEG', 'Comprima PNG para JPEG'],
        jpegPng: ['JPEG para PNG', 'Converta JPEG para PNG sem perdas'],
        pngWebp: ['PNG para WebP', 'Converta PNG para WebP moderno'],
        jpegWebp: ['JPEG para WebP', 'Converta JPEG para WebP moderno'],
        webpPng: ['WebP para PNG', 'Converta WebP para PNG'],
        webpJpeg: ['WebP para JPEG', 'Converta WebP para JPEG'],
        anyWebp: ['Qualquer imagem para WebP', 'Converta qualquer imagem para WebP'],
      },
    },
    imageTools: {
      category: 'Ferramentas de imagem',
      items: {
        resizer: ['Redimensionador de imagem', 'Redimensione imagens com dimensoes exatas'],
        upscaler: ['Ampliador de imagem', 'Amplie imagens ate 4x com alta qualidade'],
      },
    },
  },
  ar: {
    ai: {
      category: 'AI Tools',
      items: {
        cvBuilder: ['ATS CV Builder', 'AI-powered, ATS-compliant resume builder via Groq'],
        roastCv: ['Roast My CV', 'Brutal ATS review with AI-powered fixes'],
      },
    },
    document: {
      category: 'Document Converter',
      items: {
        pdfDocx: ['PDF to DOCX', 'Convert PDF to editable Word document'],
        docxPdf: ['DOCX to PDF', 'Convert Word document to PDF'],
        pdfTxt: ['PDF to TXT', 'Extract plain text from PDF'],
        txtPdf: ['TXT to PDF', 'Convert plain text file to PDF'],
        docxTxt: ['DOCX to TXT', 'Extract plain text from Word document'],
      },
    },
    imageConversion: {
      category: 'Image Conversions',
      items: {
        pngJpeg: ['PNG to JPEG', 'Compress PNG to JPEG format'],
        jpegPng: ['JPEG to PNG', 'Convert JPEG to lossless PNG'],
        pngWebp: ['PNG to WebP', 'Convert PNG to modern WebP'],
        jpegWebp: ['JPEG to WebP', 'Convert JPEG to modern WebP'],
        webpPng: ['WebP to PNG', 'Convert WebP to PNG'],
        webpJpeg: ['WebP to JPEG', 'Convert WebP to JPEG'],
        anyWebp: ['Any to WebP', 'Convert any image to WebP'],
      },
    },
    imageTools: {
      category: 'Image Tools',
      items: {
        resizer: ['Image Resizer', 'Resize images to exact dimensions with fit controls'],
        upscaler: ['Image Upscaler', 'Enlarge images up to 4x with high-quality resampling'],
      },
    },
  },
  sw: {
    ai: {
      category: 'Zana za AI',
      items: {
        cvBuilder: ['Mtengenezaji wa CV wa ATS', 'Tengeneza CV za ATS kwa msaada wa AI'],
        roastCv: ['Roast My CV', 'Mapitio ya ATS kali na marekebisho ya AI'],
      },
    },
    document: {
      category: 'Kibadilishi cha hati',
      items: {
        pdfDocx: ['PDF kwenda DOCX', 'Badilisha PDF kuwa hati ya Word inayoharirika'],
        docxPdf: ['DOCX kwenda PDF', 'Badilisha hati ya Word kuwa PDF'],
        pdfTxt: ['PDF kwenda TXT', 'Toa maandishi tupu kutoka PDF'],
        txtPdf: ['TXT kwenda PDF', 'Badilisha faili ya maandishi kuwa PDF'],
        docxTxt: ['DOCX kwenda TXT', 'Toa maandishi tupu kutoka hati ya Word'],
      },
    },
    imageConversion: {
      category: 'Mabadiliko ya picha',
      items: {
        pngJpeg: ['PNG kwenda JPEG', 'Banisha PNG hadi JPEG'],
        jpegPng: ['JPEG kwenda PNG', 'Badilisha JPEG kuwa PNG isiyopoteza ubora'],
        pngWebp: ['PNG kwenda WebP', 'Badilisha PNG kuwa WebP ya kisasa'],
        jpegWebp: ['JPEG kwenda WebP', 'Badilisha JPEG kuwa WebP ya kisasa'],
        webpPng: ['WebP kwenda PNG', 'Badilisha WebP kuwa PNG'],
        webpJpeg: ['WebP kwenda JPEG', 'Badilisha WebP kuwa JPEG'],
        anyWebp: ['Picha yoyote kwenda WebP', 'Badilisha picha yoyote kuwa WebP'],
      },
    },
    imageTools: {
      category: 'Zana za picha',
      items: {
        resizer: ['Kirekebisha ukubwa wa picha', 'Badilisha vipimo vya picha kwa usahihi'],
        upscaler: ['Kikuza picha', 'Kuza picha hadi 4x kwa ubora wa juu'],
      },
    },
  },
} as const;

const BASE_TOOL_CATEGORIES = [
  {
    id: 'ai',
    icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-.687c-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
    color: 'blue',
    items: [
      { id: 'cvBuilder', href: '/tools/cv-builder', badge: 'AI', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
      { id: 'roastCv', href: '/roast-cv', badge: 'ROAST', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
    ],
  },
  {
    id: 'document',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    color: 'violet',
    items: [
      { id: 'pdfDocx', href: '/tools/document-converter?from=pdf&to=docx' },
      { id: 'docxPdf', href: '/tools/document-converter?from=docx&to=pdf' },
      { id: 'pdfTxt', href: '/tools/document-converter?from=pdf&to=txt' },
      { id: 'txtPdf', href: '/tools/document-converter?from=txt&to=pdf' },
      { id: 'docxTxt', href: '/tools/document-converter?from=docx&to=txt' },
    ],
  },
  {
    id: 'imageConversion',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    color: 'emerald',
    items: [
      { id: 'pngJpeg', href: '/tools/image-converter?from=png&to=jpeg' },
      { id: 'jpegPng', href: '/tools/image-converter?from=jpeg&to=png' },
      { id: 'pngWebp', href: '/tools/image-converter?from=png&to=webp' },
      { id: 'jpegWebp', href: '/tools/image-converter?from=jpeg&to=webp' },
      { id: 'webpPng', href: '/tools/image-converter?from=webp&to=png' },
      { id: 'webpJpeg', href: '/tools/image-converter?from=webp&to=jpeg' },
      { id: 'anyWebp', href: '/tools/image-converter?from=any&to=webp' },
    ],
  },
  {
    id: 'imageTools',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    color: 'emerald',
    items: [
      { id: 'resizer', href: '/tools/image-resizer' },
      { id: 'upscaler', href: '/tools/image-upscaler' },
    ],
  },
] as const;

export function getToolCategories(language: LanguageCode) {
  const copy = TOOL_COPY[language] ?? TOOL_COPY.en;

  return BASE_TOOL_CATEGORIES.map((category) => ({
    category: copy[category.id].category,
    icon: category.icon,
    color: category.color,
    items: category.items.map((item) => {
      const localizedItems = copy[category.id].items as Record<string, readonly [string, string]>;
      const [label, description] = localizedItems[item.id];
      return {
        label,
        href: item.href,
        description,
        badge: 'badge' in item ? item.badge : undefined,
        icon: 'icon' in item ? item.icon : undefined,
      };
    }),
  }));
}
