export type LanguageCode = "en" | "fr" | "es" | "pt" | "ar" | "sw";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
};

export const STORAGE_KEY = "eazitool-language";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French", nativeLabel: "Francais" },
  { code: "es", label: "Spanish", nativeLabel: "Espanol" },
  { code: "pt", label: "Portuguese", nativeLabel: "Portugues" },
  { code: "ar", label: "Arabic", nativeLabel: "Arabic" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
];

export type TranslationKey =
  | "nav.home"
  | "nav.tools"
  | "nav.services"
  | "nav.contact"
  | "nav.language"
  | "nav.languageHelper"
  | "tool.cvBuilder"
  | "tool.cvBuilderDesc"
  | "tool.documentConverter"
  | "tool.documentConverterDesc"
  | "tool.imageConverter"
  | "tool.imageConverterDesc";

export const TRANSLATIONS: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    "nav.home": "Home",
    "nav.tools": "Tools",
    "nav.services": "Services",
    "nav.contact": "Contact",
    "nav.language": "Language",
    "nav.languageHelper": "Choose your preferred language",
    "tool.cvBuilder": "CV Builder",
    "tool.cvBuilderDesc": "Create professional resumes",
    "tool.documentConverter": "Document Converter",
    "tool.documentConverterDesc": "Convert between formats",
    "tool.imageConverter": "Image Converter",
    "tool.imageConverterDesc": "Convert and optimize images",
  },
  fr: {
    "nav.home": "Accueil",
    "nav.tools": "Outils",
    "nav.services": "Services",
    "nav.contact": "Contact",
    "nav.language": "Langue",
    "nav.languageHelper": "Choisissez votre langue preferee",
    "tool.cvBuilder": "Createur de CV",
    "tool.cvBuilderDesc": "Creer des CV professionnels",
    "tool.documentConverter": "Convertisseur de documents",
    "tool.documentConverterDesc": "Convertir entre les formats",
    "tool.imageConverter": "Convertisseur d'images",
    "tool.imageConverterDesc": "Convertir et optimiser les images",
  },
  es: {
    "nav.home": "Inicio",
    "nav.tools": "Herramientas",
    "nav.services": "Servicios",
    "nav.contact": "Contacto",
    "nav.language": "Idioma",
    "nav.languageHelper": "Elige tu idioma preferido",
    "tool.cvBuilder": "Creador de CV",
    "tool.cvBuilderDesc": "Crea curriculums profesionales",
    "tool.documentConverter": "Convertidor de documentos",
    "tool.documentConverterDesc": "Convierte entre formatos",
    "tool.imageConverter": "Convertidor de imagenes",
    "tool.imageConverterDesc": "Convierte y optimiza imagenes",
  },
  pt: {
    "nav.home": "Inicio",
    "nav.tools": "Ferramentas",
    "nav.services": "Servicos",
    "nav.contact": "Contacto",
    "nav.language": "Idioma",
    "nav.languageHelper": "Escolha o seu idioma preferido",
    "tool.cvBuilder": "Criador de CV",
    "tool.cvBuilderDesc": "Crie curriculos profissionais",
    "tool.documentConverter": "Conversor de documentos",
    "tool.documentConverterDesc": "Converta entre formatos",
    "tool.imageConverter": "Conversor de imagens",
    "tool.imageConverterDesc": "Converta e otimize imagens",
  },
  ar: {
    "nav.home": "Home",
    "nav.tools": "Tools",
    "nav.services": "Services",
    "nav.contact": "Contact",
    "nav.language": "Language",
    "nav.languageHelper": "Choose your preferred language",
    "tool.cvBuilder": "CV Builder",
    "tool.cvBuilderDesc": "Create professional resumes",
    "tool.documentConverter": "Document Converter",
    "tool.documentConverterDesc": "Convert between formats",
    "tool.imageConverter": "Image Converter",
    "tool.imageConverterDesc": "Convert and optimize images",
  },
  sw: {
    "nav.home": "Nyumbani",
    "nav.tools": "Zana",
    "nav.services": "Huduma",
    "nav.contact": "Mawasiliano",
    "nav.language": "Lugha",
    "nav.languageHelper": "Chagua lugha unayopendelea",
    "tool.cvBuilder": "Mtengenezaji wa CV",
    "tool.cvBuilderDesc": "Tengeneza CV za kitaalamu",
    "tool.documentConverter": "Kibadilishi cha hati",
    "tool.documentConverterDesc": "Badilisha kati ya fomati",
    "tool.imageConverter": "Kibadilishi cha picha",
    "tool.imageConverterDesc": "Badilisha na boresha picha",
  },
};

export function getDirection(language: LanguageCode): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}

export function resolveLanguageCode(input?: string | null): LanguageCode {
  if (!input) return "en";

  const normalized = input.toLowerCase();
  const primary = normalized.split(",")[0]?.split(";")[0]?.trim() ?? normalized;
  const base = primary.split("-")[0];

  if (base === "es") return "es";
  if (base === "fr") return "fr";
  if (base === "pt") return "pt";
  if (base === "ar") return "ar";
  if (base === "sw") return "sw";
  return "en";
}

export function detectPreferredLanguage(locales: readonly string[] = []): LanguageCode {
  for (const locale of locales) {
    const code = resolveLanguageCode(locale);
    if (code !== "en" || locale.toLowerCase().startsWith("en")) {
      return code;
    }
  }

  return "en";
}

type ToolCategoryItemCopy = {
  category: string;
  items: Record<string, { label: string; description: string }>;
};

export const TOOL_CATEGORY_COPY: Record<LanguageCode, Record<string, ToolCategoryItemCopy>> = {
  en: {
    ai: {
      category: "AI Tools",
      items: {
        cvBuilder: {
          label: "ATS CV Builder",
          description: "AI-powered, ATS-compliant resume builder via Groq",
        },
      },
    },
    document: {
      category: "Document Converter",
      items: {
        pdfDocx: { label: "PDF to DOCX", description: "Convert PDF to editable Word document" },
        docxPdf: { label: "DOCX to PDF", description: "Convert Word document to PDF" },
        pdfTxt: { label: "PDF to TXT", description: "Extract plain text from PDF" },
        txtPdf: { label: "TXT to PDF", description: "Convert plain text file to PDF" },
        docxTxt: { label: "DOCX to TXT", description: "Extract plain text from Word document" },
      },
    },
    imageConversion: {
      category: "Image Conversions",
      items: {
        pngJpeg: { label: "PNG to JPEG", description: "Compress PNG to JPEG format" },
        jpegPng: { label: "JPEG to PNG", description: "Convert JPEG to lossless PNG" },
        pngWebp: { label: "PNG to WebP", description: "Convert PNG to modern WebP" },
        jpegWebp: { label: "JPEG to WebP", description: "Convert JPEG to modern WebP" },
        webpPng: { label: "WebP to PNG", description: "Convert WebP to PNG" },
        webpJpeg: { label: "WebP to JPEG", description: "Convert WebP to JPEG" },
        anyWebp: { label: "Any to WebP", description: "Convert any image to WebP" },
      },
    },
    imageTools: {
      category: "Image Tools",
      items: {
        resizer: { label: "Image Resizer", description: "Resize images to exact dimensions with fit controls" },
        upscaler: { label: "Image Upscaler", description: "Enlarge images up to 4x with high-quality resampling" },
      },
    },
  },
  fr: {
    ai: {
      category: "Outils IA",
      items: {
        cvBuilder: { label: "Createur de CV ATS", description: "Createur de CV compatible ATS alimente par IA" },
      },
    },
    document: {
      category: "Convertisseur de documents",
      items: {
        pdfDocx: { label: "PDF vers DOCX", description: "Convertir un PDF en document Word modifiable" },
        docxPdf: { label: "DOCX vers PDF", description: "Convertir un document Word en PDF" },
        pdfTxt: { label: "PDF vers TXT", description: "Extraire le texte brut d'un PDF" },
        txtPdf: { label: "TXT vers PDF", description: "Convertir un fichier texte en PDF" },
        docxTxt: { label: "DOCX vers TXT", description: "Extraire le texte brut d'un document Word" },
      },
    },
    imageConversion: {
      category: "Conversions d'images",
      items: {
        pngJpeg: { label: "PNG vers JPEG", description: "Compresser un PNG en JPEG" },
        jpegPng: { label: "JPEG vers PNG", description: "Convertir un JPEG en PNG sans perte" },
        pngWebp: { label: "PNG vers WebP", description: "Convertir un PNG en WebP moderne" },
        jpegWebp: { label: "JPEG vers WebP", description: "Convertir un JPEG en WebP moderne" },
        webpPng: { label: "WebP vers PNG", description: "Convertir un WebP en PNG" },
        webpJpeg: { label: "WebP vers JPEG", description: "Convertir un WebP en JPEG" },
        anyWebp: { label: "Tout vers WebP", description: "Convertir n'importe quelle image en WebP" },
      },
    },
    imageTools: {
      category: "Outils d'image",
      items: {
        resizer: { label: "Redimensionneur d'image", description: "Redimensionner les images avec des dimensions precises" },
        upscaler: { label: "Ameliorateur d'image", description: "Agrandir les images jusqu'a 4x avec une haute qualite" },
      },
    },
  },
  es: {
    ai: {
      category: "Herramientas con IA",
      items: {
        cvBuilder: { label: "Creador de CV ATS", description: "Creador de curriculums con IA compatible con ATS" },
      },
    },
    document: {
      category: "Convertidor de documentos",
      items: {
        pdfDocx: { label: "PDF a DOCX", description: "Convierte PDF en un documento Word editable" },
        docxPdf: { label: "DOCX a PDF", description: "Convierte un documento Word en PDF" },
        pdfTxt: { label: "PDF a TXT", description: "Extrae texto sin formato de un PDF" },
        txtPdf: { label: "TXT a PDF", description: "Convierte un archivo de texto en PDF" },
        docxTxt: { label: "DOCX a TXT", description: "Extrae texto sin formato de un documento Word" },
      },
    },
    imageConversion: {
      category: "Conversiones de imagen",
      items: {
        pngJpeg: { label: "PNG a JPEG", description: "Comprime PNG al formato JPEG" },
        jpegPng: { label: "JPEG a PNG", description: "Convierte JPEG a PNG sin perdida" },
        pngWebp: { label: "PNG a WebP", description: "Convierte PNG al moderno formato WebP" },
        jpegWebp: { label: "JPEG a WebP", description: "Convierte JPEG al moderno formato WebP" },
        webpPng: { label: "WebP a PNG", description: "Convierte WebP a PNG" },
        webpJpeg: { label: "WebP a JPEG", description: "Convierte WebP a JPEG" },
        anyWebp: { label: "Cualquier imagen a WebP", description: "Convierte cualquier imagen a WebP" },
      },
    },
    imageTools: {
      category: "Herramientas de imagen",
      items: {
        resizer: { label: "Redimensionador de imagen", description: "Redimensiona imagenes con dimensiones exactas" },
        upscaler: { label: "Mejorador de imagen", description: "Amplia imagenes hasta 4x con alta calidad" },
      },
    },
  },
  pt: {
    ai: {
      category: "Ferramentas com IA",
      items: {
        cvBuilder: { label: "Criador de CV ATS", description: "Criador de curriculos com IA compativel com ATS" },
      },
    },
    document: {
      category: "Conversor de documentos",
      items: {
        pdfDocx: { label: "PDF para DOCX", description: "Converta PDF em documento Word editavel" },
        docxPdf: { label: "DOCX para PDF", description: "Converta documento Word em PDF" },
        pdfTxt: { label: "PDF para TXT", description: "Extraia texto simples de um PDF" },
        txtPdf: { label: "TXT para PDF", description: "Converta arquivo de texto em PDF" },
        docxTxt: { label: "DOCX para TXT", description: "Extraia texto simples de um documento Word" },
      },
    },
    imageConversion: {
      category: "Conversoes de imagem",
      items: {
        pngJpeg: { label: "PNG para JPEG", description: "Comprima PNG para JPEG" },
        jpegPng: { label: "JPEG para PNG", description: "Converta JPEG para PNG sem perdas" },
        pngWebp: { label: "PNG para WebP", description: "Converta PNG para WebP moderno" },
        jpegWebp: { label: "JPEG para WebP", description: "Converta JPEG para WebP moderno" },
        webpPng: { label: "WebP para PNG", description: "Converta WebP para PNG" },
        webpJpeg: { label: "WebP para JPEG", description: "Converta WebP para JPEG" },
        anyWebp: { label: "Qualquer imagem para WebP", description: "Converta qualquer imagem para WebP" },
      },
    },
    imageTools: {
      category: "Ferramentas de imagem",
      items: {
        resizer: { label: "Redimensionador de imagem", description: "Redimensione imagens com dimensoes exatas" },
        upscaler: { label: "Ampliador de imagem", description: "Amplie imagens ate 4x com alta qualidade" },
      },
    },
  },
  ar: {
    ai: {
      category: "AI Tools",
      items: {
        cvBuilder: { label: "ATS CV Builder", description: "AI-powered, ATS-compliant resume builder via Groq" },
      },
    },
    document: {
      category: "Document Converter",
      items: {
        pdfDocx: { label: "PDF to DOCX", description: "Convert PDF to editable Word document" },
        docxPdf: { label: "DOCX to PDF", description: "Convert Word document to PDF" },
        pdfTxt: { label: "PDF to TXT", description: "Extract plain text from PDF" },
        txtPdf: { label: "TXT to PDF", description: "Convert plain text file to PDF" },
        docxTxt: { label: "DOCX to TXT", description: "Extract plain text from Word document" },
      },
    },
    imageConversion: {
      category: "Image Conversions",
      items: {
        pngJpeg: { label: "PNG to JPEG", description: "Compress PNG to JPEG format" },
        jpegPng: { label: "JPEG to PNG", description: "Convert JPEG to lossless PNG" },
        pngWebp: { label: "PNG to WebP", description: "Convert PNG to modern WebP" },
        jpegWebp: { label: "JPEG to WebP", description: "Convert JPEG to modern WebP" },
        webpPng: { label: "WebP to PNG", description: "Convert WebP to PNG" },
        webpJpeg: { label: "WebP to JPEG", description: "Convert WebP to JPEG" },
        anyWebp: { label: "Any to WebP", description: "Convert any image to WebP" },
      },
    },
    imageTools: {
      category: "Image Tools",
      items: {
        resizer: { label: "Image Resizer", description: "Resize images to exact dimensions with fit controls" },
        upscaler: { label: "Image Upscaler", description: "Enlarge images up to 4x with high-quality resampling" },
      },
    },
  },
  sw: {
    ai: {
      category: "Zana za AI",
      items: {
        cvBuilder: { label: "Mtengenezaji wa CV wa ATS", description: "Tengeneza CV za ATS kwa msaada wa AI" },
      },
    },
    document: {
      category: "Kibadilishi cha hati",
      items: {
        pdfDocx: { label: "PDF kwenda DOCX", description: "Badilisha PDF kuwa hati ya Word inayoharirika" },
        docxPdf: { label: "DOCX kwenda PDF", description: "Badilisha hati ya Word kuwa PDF" },
        pdfTxt: { label: "PDF kwenda TXT", description: "Toa maandishi tupu kutoka PDF" },
        txtPdf: { label: "TXT kwenda PDF", description: "Badilisha faili ya maandishi kuwa PDF" },
        docxTxt: { label: "DOCX kwenda TXT", description: "Toa maandishi tupu kutoka hati ya Word" },
      },
    },
    imageConversion: {
      category: "Mabadiliko ya picha",
      items: {
        pngJpeg: { label: "PNG kwenda JPEG", description: "Banisha PNG hadi JPEG" },
        jpegPng: { label: "JPEG kwenda PNG", description: "Badilisha JPEG kuwa PNG isiyopoteza ubora" },
        pngWebp: { label: "PNG kwenda WebP", description: "Badilisha PNG kuwa WebP ya kisasa" },
        jpegWebp: { label: "JPEG kwenda WebP", description: "Badilisha JPEG kuwa WebP ya kisasa" },
        webpPng: { label: "WebP kwenda PNG", description: "Badilisha WebP kuwa PNG" },
        webpJpeg: { label: "WebP kwenda JPEG", description: "Badilisha WebP kuwa JPEG" },
        anyWebp: { label: "Picha yoyote kwenda WebP", description: "Badilisha picha yoyote kuwa WebP" },
      },
    },
    imageTools: {
      category: "Zana za picha",
      items: {
        resizer: { label: "Kirekebisha ukubwa wa picha", description: "Badilisha vipimo vya picha kwa usahihi" },
        upscaler: { label: "Kikuza picha", description: "Kuza picha hadi 4x kwa ubora wa juu" },
      },
    },
  },
};

export const HOME_COPY: Record<LanguageCode, {
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  trustItems: string[];
  stats: { number: string; label: string }[];
  problemTitle: string;
  problemBody: string;
  cards: { problem: string; solution: string; cta: string; href: string }[];
  withEazitool: string;
  simpleTitle: string;
  simpleBody: string;
  steps: { title: string; desc: string }[];
  featuredTitle: string;
  featuredBody: string;
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  faqTitle: string;
  faqBody: string;
  footer: string;
  faqs: { question: string; answer: string }[];
}> = {
  en: {
    heroBadge: "Trusted by 10,000+ users worldwide",
    heroTitle: "Stop wasting hours on file tasks.",
    heroHighlight: "Do it in seconds.",
    heroSubtitle: "Convert, resize, compress, and transform your files instantly with browser-based tools that stay simple.",
    primaryCta: "Start Converting Free",
    secondaryCta: "Build ATS CV",
    trustItems: ["No signup required", "100% Private", "Works in your browser"],
    stats: [
      { number: "10K+", label: "Files Processed Daily" },
      { number: "50+", label: "Tools Available" },
      { number: "< 30s", label: "Average Process Time" },
      { number: "100%", label: "Privacy Guaranteed" },
    ],
    problemTitle: "The file tool you've been wishing existed",
    problemBody: "We built Eazitool because online file tools are often slow, cluttered, and unreliable. This one is fast and focused.",
    cards: [
      {
        problem: "Need to convert PDF to DOCX but do not have Adobe?",
        solution: "Upload your PDF and get an editable DOCX in seconds.",
        cta: "Try PDF to DOCX",
        href: "/tools/document-converter?from=pdf&to=docx",
      },
      {
        problem: "Need a larger image for a design or store listing?",
        solution: "Upscale your image up to 4x with sharper output and less blur.",
        cta: "Try AI Upscaler",
        href: "/tools/image-upscaler",
      },
      {
        problem: "Sending job applications and worried about ATS filters?",
        solution: "Build cleaner ATS-ready CVs with guided AI help.",
        cta: "Build ATS CV",
        href: "/tools/cv-builder",
      },
    ],
    withEazitool: "With Eazitool:",
    simpleTitle: "Simple. Fast. Done.",
    simpleBody: "Three steps to file freedom. No account needed.",
    steps: [
      { title: "Pick the task", desc: "Choose the file problem you want to solve." },
      { title: "Use the right tool", desc: "Upload your file and adjust the options that matter." },
      { title: "Download the result", desc: "Get your finished file in seconds." },
    ],
    featuredTitle: "Tools that actually work",
    featuredBody: "Purpose-built tools for real everyday tasks.",
    ctaTitle: "Ready to work faster with your files?",
    ctaBody: "Use one clean workspace for document conversion, image editing, and ATS-friendly CV creation.",
    ctaButton: "Get Started Free",
    faqTitle: "Frequently Asked Questions",
    faqBody: "Quick answers to common questions about Eazitool.",
    footer: "Built in Nigeria for the world. Making file work effortless, one tool at a time.",
    faqs: [
      { question: "Is Eazitool free to use?", answer: "Yes. You can use the tools without creating an account." },
      { question: "How do I convert PDF to DOCX?", answer: "Open the document converter, choose PDF to DOCX, upload the file, and download the converted document." },
      { question: "Can I resize images without losing quality?", answer: "Yes. The image resizer uses high-quality resizing, and the upscaler helps enlarge images with cleaner output." },
      { question: "Is my data safe?", answer: "Your files are processed only for the task and are not kept as a user account library." },
      { question: "What formats are supported?", answer: "Eazitool supports common document and image formats including PDF, DOCX, TXT, PNG, JPEG, WebP, AVIF, TIFF, HEIF, GIF, and SVG." },
    ],
  },
  fr: {
    heroBadge: "Utilise par plus de 10 000 personnes dans le monde",
    heroTitle: "Ne perdez plus des heures sur vos fichiers.",
    heroHighlight: "Faites-le en quelques secondes.",
    heroSubtitle: "Convertissez, redimensionnez et transformez vos fichiers avec des outils rapides dans le navigateur.",
    primaryCta: "Commencer gratuitement",
    secondaryCta: "Creer un CV ATS",
    trustItems: ["Sans inscription", "100% prive", "Fonctionne dans le navigateur"],
    stats: [
      { number: "10K+", label: "Fichiers traites chaque jour" },
      { number: "50+", label: "Outils disponibles" },
      { number: "< 30s", label: "Temps moyen" },
      { number: "100%", label: "Confidentialite garantie" },
    ],
    problemTitle: "L'outil de fichiers que vous attendiez",
    problemBody: "Nous avons cree Eazitool parce que les outils en ligne sont souvent lents et confus. Celui-ci reste simple.",
    cards: [
      { problem: "Besoin de convertir un PDF en DOCX ?", solution: "Importez votre PDF et obtenez un DOCX modifiable en quelques secondes.", cta: "Essayer PDF vers DOCX", href: "/tools/document-converter?from=pdf&to=docx" },
      { problem: "Image trop petite pour votre projet ?", solution: "Agrandissez votre image jusqu'a 4x avec un resultat plus net.", cta: "Essayer l'upscaler IA", href: "/tools/image-upscaler" },
      { problem: "Vous postulez et craignez les filtres ATS ?", solution: "Creez des CV plus propres et compatibles ATS.", cta: "Creer un CV ATS", href: "/tools/cv-builder" },
    ],
    withEazitool: "Avec Eazitool :",
    simpleTitle: "Simple. Rapide. Terminee.",
    simpleBody: "Trois etapes suffisent.",
    steps: [
      { title: "Choisissez la tache", desc: "Selectionnez le probleme de fichier a resoudre." },
      { title: "Utilisez le bon outil", desc: "Importez votre fichier et ajustez les options utiles." },
      { title: "Telechargez le resultat", desc: "Recuperez votre fichier final en quelques secondes." },
    ],
    featuredTitle: "Des outils qui fonctionnent vraiment",
    featuredBody: "Des outils construits pour des besoins concrets.",
    ctaTitle: "Pret a travailler plus vite avec vos fichiers ?",
    ctaBody: "Utilisez un espace simple pour la conversion de documents, l'edition d'images et les CV compatibles ATS.",
    ctaButton: "Commencer gratuitement",
    faqTitle: "Questions frequentes",
    faqBody: "Reponses rapides sur Eazitool.",
    footer: "Construit au Nigeria pour le monde entier.",
    faqs: [
      { question: "Eazitool est-il gratuit ?", answer: "Oui. Les outils sont disponibles sans compte." },
      { question: "Comment convertir un PDF en DOCX ?", answer: "Ouvrez le convertisseur, choisissez PDF vers DOCX, importez le fichier puis telechargez le resultat." },
      { question: "Puis-je redimensionner une image sans perdre en qualite ?", answer: "Oui. Le redimensionneur et l'upscaler privilegient un rendu propre." },
      { question: "Mes donnees sont-elles en securite ?", answer: "Vos fichiers sont utilises pour la tache demandee et ne sont pas conserves comme bibliotheque utilisateur." },
      { question: "Quels formats sont pris en charge ?", answer: "PDF, DOCX, TXT, PNG, JPEG, WebP, AVIF, TIFF, HEIF, GIF et SVG sont pris en charge." },
    ],
  },
  es: {
    heroBadge: "Con la confianza de mas de 10.000 usuarios en todo el mundo",
    heroTitle: "Deja de perder horas con tareas de archivos.",
    heroHighlight: "Hazlo en segundos.",
    heroSubtitle: "Convierte, redimensiona y transforma tus archivos al instante con herramientas simples en el navegador.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Crear CV ATS",
    trustItems: ["Sin registro", "100% privado", "Funciona en tu navegador"],
    stats: [
      { number: "10K+", label: "Archivos procesados al dia" },
      { number: "50+", label: "Herramientas disponibles" },
      { number: "< 30s", label: "Tiempo promedio" },
      { number: "100%", label: "Privacidad garantizada" },
    ],
    problemTitle: "La herramienta de archivos que estabas buscando",
    problemBody: "Creamos Eazitool porque muchas herramientas online son lentas, confusas y llenas de ruido. Esta va directo al resultado.",
    cards: [
      { problem: "Necesitas convertir PDF a DOCX y no tienes Adobe?", solution: "Sube tu PDF y descarga un DOCX editable en segundos.", cta: "Probar PDF a DOCX", href: "/tools/document-converter?from=pdf&to=docx" },
      { problem: "Tu imagen es muy pequena para tu proyecto?", solution: "Ampliala hasta 4x con una salida mas nitida y menos pixelacion.", cta: "Probar escalador IA", href: "/tools/image-upscaler" },
      { problem: "Envias solicitudes de empleo y te preocupa el ATS?", solution: "Crea CVs mas limpios y listos para ATS con ayuda guiada.", cta: "Crear CV ATS", href: "/tools/cv-builder" },
    ],
    withEazitool: "Con Eazitool:",
    simpleTitle: "Simple. Rapido. Listo.",
    simpleBody: "Tres pasos para resolver tu archivo. Sin cuenta.",
    steps: [
      { title: "Elige la tarea", desc: "Selecciona el problema de archivo que quieres resolver." },
      { title: "Usa la herramienta correcta", desc: "Sube tu archivo y ajusta solo las opciones que importan." },
      { title: "Descarga el resultado", desc: "Obtiene tu archivo final en segundos." },
    ],
    featuredTitle: "Herramientas que de verdad funcionan",
    featuredBody: "Herramientas hechas para tareas reales del dia a dia.",
    ctaTitle: "Listo para trabajar mas rapido con tus archivos?",
    ctaBody: "Usa un espacio limpio para conversion de documentos, edicion de imagenes y CVs compatibles con ATS.",
    ctaButton: "Empezar gratis",
    faqTitle: "Preguntas frecuentes",
    faqBody: "Respuestas rapidas sobre Eazitool.",
    footer: "Creado en Nigeria para el mundo. Haciendo el trabajo con archivos mas facil.",
    faqs: [
      { question: "Eazitool es gratis?", answer: "Si. Puedes usar las herramientas sin crear una cuenta." },
      { question: "Como convierto PDF a DOCX?", answer: "Abre el convertidor de documentos, elige PDF a DOCX, sube el archivo y descarga el documento convertido." },
      { question: "Puedo redimensionar imagenes sin perder calidad?", answer: "Si. El redimensionador usa un metodo de alta calidad y el escalador ayuda a ampliar con un mejor resultado." },
      { question: "Mis datos estan seguros?", answer: "Tus archivos se usan solo para la tarea y no se guardan como una biblioteca de usuario." },
      { question: "Que formatos estan disponibles?", answer: "Se admiten PDF, DOCX, TXT, PNG, JPEG, WebP, AVIF, TIFF, HEIF, GIF y SVG." },
    ],
  },
  pt: {
    heroBadge: "Confiado por mais de 10.000 usuarios no mundo",
    heroTitle: "Pare de perder horas com tarefas de ficheiros.",
    heroHighlight: "Faca isso em segundos.",
    heroSubtitle: "Converta, redimensione e transforme ficheiros de forma instantanea no navegador.",
    primaryCta: "Comecar gratis",
    secondaryCta: "Criar CV ATS",
    trustItems: ["Sem registo", "100% privado", "Funciona no navegador"],
    stats: [
      { number: "10K+", label: "Ficheiros processados por dia" },
      { number: "50+", label: "Ferramentas disponiveis" },
      { number: "< 30s", label: "Tempo medio" },
      { number: "100%", label: "Privacidade garantida" },
    ],
    problemTitle: "A ferramenta de ficheiros que faltava",
    problemBody: "Criamos o Eazitool porque muitas ferramentas online sao lentas e confusas. Esta mantem tudo simples.",
    cards: [
      { problem: "Precisa converter PDF para DOCX?", solution: "Envie o PDF e receba um DOCX editavel em segundos.", cta: "Experimentar PDF para DOCX", href: "/tools/document-converter?from=pdf&to=docx" },
      { problem: "Imagem pequena para o seu projeto?", solution: "Amplie a imagem ate 4x com um resultado mais nitido.", cta: "Experimentar ampliador IA", href: "/tools/image-upscaler" },
      { problem: "Candidata-se a empregos e teme filtros ATS?", solution: "Crie CVs mais limpos e prontos para ATS com ajuda guiada.", cta: "Criar CV ATS", href: "/tools/cv-builder" },
    ],
    withEazitool: "Com o Eazitool:",
    simpleTitle: "Simples. Rapido. Pronto.",
    simpleBody: "Tres passos bastam.",
    steps: [
      { title: "Escolha a tarefa", desc: "Selecione o problema de ficheiro que pretende resolver." },
      { title: "Use a ferramenta certa", desc: "Envie o ficheiro e ajuste apenas o necessario." },
      { title: "Descarregue o resultado", desc: "Receba o ficheiro final em segundos." },
    ],
    featuredTitle: "Ferramentas que realmente funcionam",
    featuredBody: "Ferramentas feitas para tarefas reais.",
    ctaTitle: "Pronto para trabalhar mais rapido com os seus ficheiros?",
    ctaBody: "Use um espaco simples para conversao de documentos, edicao de imagens e criacao de CV ATS.",
    ctaButton: "Comecar gratis",
    faqTitle: "Perguntas frequentes",
    faqBody: "Respostas rapidas sobre o Eazitool.",
    footer: "Construido na Nigeria para o mundo.",
    faqs: [
      { question: "O Eazitool e gratuito?", answer: "Sim. Pode usar as ferramentas sem criar conta." },
      { question: "Como converter PDF para DOCX?", answer: "Abra o conversor, escolha PDF para DOCX, envie o ficheiro e descarregue o resultado." },
      { question: "Posso redimensionar imagens sem perder qualidade?", answer: "Sim. O redimensionador usa processamento de alta qualidade e o ampliador melhora o resultado." },
      { question: "Os meus dados estao seguros?", answer: "Os ficheiros sao usados apenas na tarefa e nao ficam guardados como biblioteca de utilizador." },
      { question: "Quais formatos sao suportados?", answer: "PDF, DOCX, TXT, PNG, JPEG, WebP, AVIF, TIFF, HEIF, GIF e SVG sao suportados." },
    ],
  },
  ar: {
    heroBadge: "Trusted by 10,000+ users worldwide",
    heroTitle: "Stop wasting hours on file tasks.",
    heroHighlight: "Do it in seconds.",
    heroSubtitle: "Convert, resize, and transform files instantly in the browser.",
    primaryCta: "Start Free",
    secondaryCta: "Build ATS CV",
    trustItems: ["No signup required", "100% Private", "Works in your browser"],
    stats: [
      { number: "10K+", label: "Files Processed Daily" },
      { number: "50+", label: "Tools Available" },
      { number: "< 30s", label: "Average Process Time" },
      { number: "100%", label: "Privacy Guaranteed" },
    ],
    problemTitle: "The file tool you've been wishing existed",
    problemBody: "Eazitool keeps file work simple and fast.",
    cards: [
      { problem: "Need to convert PDF to DOCX?", solution: "Upload the file and download an editable DOCX.", cta: "Try PDF to DOCX", href: "/tools/document-converter?from=pdf&to=docx" },
      { problem: "Need a larger image?", solution: "Upscale up to 4x with a cleaner result.", cta: "Try AI Upscaler", href: "/tools/image-upscaler" },
      { problem: "Need an ATS-ready CV?", solution: "Build a cleaner resume with guided AI help.", cta: "Build ATS CV", href: "/tools/cv-builder" },
    ],
    withEazitool: "With Eazitool:",
    simpleTitle: "Simple. Fast. Done.",
    simpleBody: "Three steps to finish the task.",
    steps: [
      { title: "Pick the task", desc: "Choose the file problem to solve." },
      { title: "Use the right tool", desc: "Upload your file and adjust the options." },
      { title: "Download the result", desc: "Get the finished file in seconds." },
    ],
    featuredTitle: "Tools that actually work",
    featuredBody: "Purpose-built tools for everyday tasks.",
    ctaTitle: "Ready to work faster with files?",
    ctaBody: "Use one workspace for document conversion, image editing, and CV creation.",
    ctaButton: "Get Started Free",
    faqTitle: "Frequently Asked Questions",
    faqBody: "Quick answers about Eazitool.",
    footer: "Built in Nigeria for the world.",
    faqs: [
      { question: "Is Eazitool free?", answer: "Yes. You can use the tools without an account." },
      { question: "How do I convert PDF to DOCX?", answer: "Open the document converter, choose PDF to DOCX, upload the file, and download the result." },
      { question: "Can I resize images without losing quality?", answer: "Yes. The resizer and upscaler focus on cleaner output." },
      { question: "Is my data safe?", answer: "Files are used for the task and not kept as a personal library." },
      { question: "What formats are supported?", answer: "Common document and image formats are supported." },
    ],
  },
  sw: {
    heroBadge: "Inaaminiwa na zaidi ya watumiaji 10,000 duniani",
    heroTitle: "Acha kupoteza saa kwa kazi za faili.",
    heroHighlight: "Fanya kwa sekunde.",
    heroSubtitle: "Badilisha, rekebisha ukubwa na geuza faili papo hapo ndani ya kivinjari.",
    primaryCta: "Anza bure",
    secondaryCta: "Tengeneza CV ya ATS",
    trustItems: ["Hakuna usajili", "100% faragha", "Hufanya kazi kwenye kivinjari"],
    stats: [
      { number: "10K+", label: "Faili zinazochakatwa kila siku" },
      { number: "50+", label: "Zana zinazopatikana" },
      { number: "< 30s", label: "Muda wa wastani" },
      { number: "100%", label: "Faragha imethibitishwa" },
    ],
    problemTitle: "Zana ya faili uliyokuwa ukitaka",
    problemBody: "Eazitool inafanya kazi za faili ziwe rahisi na za haraka.",
    cards: [
      { problem: "Unahitaji kubadilisha PDF kwenda DOCX?", solution: "Pakia PDF yako na upate DOCX inayoharirika kwa sekunde.", cta: "Jaribu PDF kwenda DOCX", href: "/tools/document-converter?from=pdf&to=docx" },
      { problem: "Unahitaji picha kubwa zaidi?", solution: "Kuza picha hadi 4x kwa matokeo yaliyo safi zaidi.", cta: "Jaribu kikuza cha AI", href: "/tools/image-upscaler" },
      { problem: "Unahitaji CV iliyo tayari kwa ATS?", solution: "Tengeneza CV safi zaidi kwa msaada wa AI.", cta: "Tengeneza CV ya ATS", href: "/tools/cv-builder" },
    ],
    withEazitool: "Na Eazitool:",
    simpleTitle: "Rahisi. Haraka. Tayari.",
    simpleBody: "Hatua tatu tu.",
    steps: [
      { title: "Chagua kazi", desc: "Chagua tatizo la faili unalotaka kutatua." },
      { title: "Tumia zana sahihi", desc: "Pakia faili na badili chaguo muhimu tu." },
      { title: "Pakua matokeo", desc: "Pata faili yako iliyokamilika kwa sekunde." },
    ],
    featuredTitle: "Zana zinazofanya kazi kweli",
    featuredBody: "Zana zilizojengwa kwa kazi halisi za kila siku.",
    ctaTitle: "Uko tayari kufanya kazi kwa kasi zaidi na faili zako?",
    ctaBody: "Tumia sehemu moja kwa ubadilishaji wa hati, uhariri wa picha, na utengenezaji wa CV wa ATS.",
    ctaButton: "Anza bure",
    faqTitle: "Maswali yanayoulizwa mara kwa mara",
    faqBody: "Majibu ya haraka kuhusu Eazitool.",
    footer: "Imetengenezwa Nigeria kwa dunia nzima.",
    faqs: [
      { question: "Eazitool ni bure?", answer: "Ndiyo. Unaweza kutumia zana bila akaunti." },
      { question: "Ninabadilishaje PDF kwenda DOCX?", answer: "Fungua kibadilishi cha hati, chagua PDF kwenda DOCX, pakia faili, kisha pakua matokeo." },
      { question: "Naweza kurekebisha ukubwa wa picha bila kupoteza ubora?", answer: "Ndiyo. Kirekebisha ukubwa na kikuza vinazingatia matokeo safi." },
      { question: "Data yangu iko salama?", answer: "Faili hutumiwa kwa kazi hiyo tu na hazihifadhiwi kama maktaba yako binafsi." },
      { question: "Ni fomati zipi zinaungwa mkono?", answer: "Fomati za kawaida za hati na picha zinaungwa mkono." },
    ],
  },
};

export const IMAGE_CONVERTER_COPY: Record<LanguageCode, {
  title: string;
  subtitle: string;
  convertTo: string;
  quality: string;
  smallest: string;
  bestQuality: string;
  dropTitle: string;
  fileAccepted: string;
  clickToChange: string;
  preview: string;
  previewPlaceholder: string;
  previewUnavailable: string;
  done: string;
  loading: string;
  convertingTo: string;
}> = {
  en: {
    title: "Image Converter",
    subtitle: "Convert between modern image formats in a few clicks.",
    convertTo: "Convert To",
    quality: "Quality",
    smallest: "10% - smallest file",
    bestQuality: "100% - best quality",
    dropTitle: "Drop your image here",
    fileAccepted: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted",
    clickToChange: "Click to change",
    preview: "Preview",
    previewPlaceholder: "Image preview will appear here",
    previewUnavailable: "Preview not available for this format",
    done: "Done! Your converted image is downloading.",
    loading: "Converting...",
    convertingTo: "converting to",
  },
  fr: {
    title: "Convertisseur d'images",
    subtitle: "Convertissez entre les formats d'image modernes en quelques clics.",
    convertTo: "Convertir vers",
    quality: "Qualite",
    smallest: "10% - fichier le plus leger",
    bestQuality: "100% - meilleure qualite",
    dropTitle: "Deposez votre image ici",
    fileAccepted: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG acceptes",
    clickToChange: "Cliquez pour changer",
    preview: "Apercu",
    previewPlaceholder: "L'apercu apparaitra ici",
    previewUnavailable: "Apercu indisponible pour ce format",
    done: "Termine ! Votre image convertie est en cours de telechargement.",
    loading: "Conversion...",
    convertingTo: "conversion vers",
  },
  es: {
    title: "Convertidor de imagenes",
    subtitle: "Convierte entre formatos de imagen modernos en pocos clics.",
    convertTo: "Convertir a",
    quality: "Calidad",
    smallest: "10% - archivo mas pequeno",
    bestQuality: "100% - mejor calidad",
    dropTitle: "Suelta tu imagen aqui",
    fileAccepted: "Se aceptan JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF y SVG",
    clickToChange: "Haz clic para cambiar",
    preview: "Vista previa",
    previewPlaceholder: "La vista previa aparecera aqui",
    previewUnavailable: "No hay vista previa para este formato",
    done: "Listo. Tu imagen convertida se esta descargando.",
    loading: "Convirtiendo...",
    convertingTo: "convirtiendo a",
  },
  pt: {
    title: "Conversor de imagens",
    subtitle: "Converta entre formatos modernos de imagem em poucos cliques.",
    convertTo: "Converter para",
    quality: "Qualidade",
    smallest: "10% - ficheiro menor",
    bestQuality: "100% - melhor qualidade",
    dropTitle: "Largue a sua imagem aqui",
    fileAccepted: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF e SVG aceites",
    clickToChange: "Clique para alterar",
    preview: "Pre-visualizacao",
    previewPlaceholder: "A pre-visualizacao aparece aqui",
    previewUnavailable: "Sem pre-visualizacao para este formato",
    done: "Concluido. A sua imagem convertida esta a transferir.",
    loading: "A converter...",
    convertingTo: "a converter para",
  },
  ar: {
    title: "Image Converter",
    subtitle: "Convert between modern image formats in a few clicks.",
    convertTo: "Convert To",
    quality: "Quality",
    smallest: "10% - smallest file",
    bestQuality: "100% - best quality",
    dropTitle: "Drop your image here",
    fileAccepted: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted",
    clickToChange: "Click to change",
    preview: "Preview",
    previewPlaceholder: "Image preview will appear here",
    previewUnavailable: "Preview not available for this format",
    done: "Done! Your converted image is downloading.",
    loading: "Converting...",
    convertingTo: "converting to",
  },
  sw: {
    title: "Kibadilishi cha picha",
    subtitle: "Badilisha kati ya fomati za kisasa za picha kwa mibofyo michache.",
    convertTo: "Badilisha kwenda",
    quality: "Ubora",
    smallest: "10% - faili ndogo zaidi",
    bestQuality: "100% - ubora bora",
    dropTitle: "Dondosha picha yako hapa",
    fileAccepted: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG zinakubaliwa",
    clickToChange: "Bonyeza kubadilisha",
    preview: "Hakiki",
    previewPlaceholder: "Hakiki ya picha itaonekana hapa",
    previewUnavailable: "Hakiki haipatikani kwa fomati hii",
    done: "Imekamilika. Picha yako iliyobadilishwa inapakuliwa.",
    loading: "Inabadilisha...",
    convertingTo: "inabadilisha kwenda",
  },
};

export const IMAGE_RESIZER_COPY: Record<LanguageCode, {
  title: string;
  subtitle: string;
  uploadTitle: string;
  uploadHint: string;
  clickToChange: string;
  dimensions: string;
  percentage: string;
  width: string;
  height: string;
  original: string;
  fitMode: string;
  outputFormat: string;
  quality: string;
  smallest: string;
  bestQuality: string;
  result: string;
  preview: string;
  previewPlaceholder: string;
  target: string;
  resize: string;
  loadingMessages: string[];
  ready: string;
  download: string;
}> = {
  en: {
    title: "Image Resizer",
    subtitle: "Resize to exact dimensions with live preview updates.",
    uploadTitle: "Upload an image to get started",
    uploadHint: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted",
    clickToChange: "Click to change",
    dimensions: "Dimensions",
    percentage: "Percentage",
    width: "Width",
    height: "Height",
    original: "Original",
    fitMode: "Fit Mode",
    outputFormat: "Output Format",
    quality: "Quality",
    smallest: "10% smallest file",
    bestQuality: "100% highest quality",
    result: "Result",
    preview: "Preview",
    previewPlaceholder: "Upload an image to preview",
    target: "Target",
    resize: "Resize Image",
    loadingMessages: [
      "Hold on, we are finalizing your task.",
      "Sit tight while we finish your work.",
      "Great, your result is almost ready.",
    ],
    ready: "Great, your result is ready.",
    download: "Download Result",
  },
  fr: {
    title: "Redimensionneur d'image",
    subtitle: "Redimensionnez avec des dimensions precises et un apercu instantane.",
    uploadTitle: "Importez une image pour commencer",
    uploadHint: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG acceptes",
    clickToChange: "Cliquez pour changer",
    dimensions: "Dimensions",
    percentage: "Pourcentage",
    width: "Largeur",
    height: "Hauteur",
    original: "Original",
    fitMode: "Mode d'ajustement",
    outputFormat: "Format de sortie",
    quality: "Qualite",
    smallest: "10% fichier plus leger",
    bestQuality: "100% meilleure qualite",
    result: "Resultat",
    preview: "Apercu",
    previewPlaceholder: "Importez une image pour l'apercu",
    target: "Cible",
    resize: "Redimensionner l'image",
    loadingMessages: [
      "Patientez, nous finalisons votre tache.",
      "Un instant pendant la preparation du fichier.",
      "Parfait, votre resultat est presque pret.",
    ],
    ready: "Parfait, votre resultat est pret.",
    download: "Telecharger le resultat",
  },
  es: {
    title: "Redimensionador de imagenes",
    subtitle: "Redimensiona a medidas exactas con vista previa en tiempo real.",
    uploadTitle: "Sube una imagen para empezar",
    uploadHint: "Se aceptan JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF y SVG",
    clickToChange: "Haz clic para cambiar",
    dimensions: "Dimensiones",
    percentage: "Porcentaje",
    width: "Ancho",
    height: "Alto",
    original: "Original",
    fitMode: "Modo de ajuste",
    outputFormat: "Formato de salida",
    quality: "Calidad",
    smallest: "10% archivo mas pequeno",
    bestQuality: "100% mayor calidad",
    result: "Resultado",
    preview: "Vista previa",
    previewPlaceholder: "Sube una imagen para verla",
    target: "Objetivo",
    resize: "Redimensionar imagen",
    loadingMessages: [
      "Espera un momento, estamos terminando tu archivo.",
      "Un momento mientras completamos el trabajo.",
      "Perfecto, tu resultado ya casi esta listo.",
    ],
    ready: "Perfecto, tu resultado esta listo.",
    download: "Descargar resultado",
  },
  pt: {
    title: "Redimensionador de imagens",
    subtitle: "Redimensione para medidas exatas com pre-visualizacao em tempo real.",
    uploadTitle: "Carregue uma imagem para comecar",
    uploadHint: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG aceites",
    clickToChange: "Clique para alterar",
    dimensions: "Dimensoes",
    percentage: "Percentagem",
    width: "Largura",
    height: "Altura",
    original: "Original",
    fitMode: "Modo de ajuste",
    outputFormat: "Formato de saida",
    quality: "Qualidade",
    smallest: "10% ficheiro menor",
    bestQuality: "100% maior qualidade",
    result: "Resultado",
    preview: "Pre-visualizacao",
    previewPlaceholder: "Carregue uma imagem para ver a pre-visualizacao",
    target: "Destino",
    resize: "Redimensionar imagem",
    loadingMessages: [
      "Aguarde, estamos a finalizar o seu ficheiro.",
      "Mais um instante enquanto terminamos o trabalho.",
      "Perfeito, o seu resultado esta quase pronto.",
    ],
    ready: "Perfeito, o seu resultado esta pronto.",
    download: "Descarregar resultado",
  },
  ar: {
    title: "Image Resizer",
    subtitle: "Resize to exact dimensions with live preview updates.",
    uploadTitle: "Upload an image to get started",
    uploadHint: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted",
    clickToChange: "Click to change",
    dimensions: "Dimensions",
    percentage: "Percentage",
    width: "Width",
    height: "Height",
    original: "Original",
    fitMode: "Fit Mode",
    outputFormat: "Output Format",
    quality: "Quality",
    smallest: "10% smallest file",
    bestQuality: "100% highest quality",
    result: "Result",
    preview: "Preview",
    previewPlaceholder: "Upload an image to preview",
    target: "Target",
    resize: "Resize Image",
    loadingMessages: [
      "Hold on, we are finalizing your task.",
      "Sit tight while we finish your work.",
      "Great, your result is almost ready.",
    ],
    ready: "Great, your result is ready.",
    download: "Download Result",
  },
  sw: {
    title: "Kirekebisha ukubwa wa picha",
    subtitle: "Badili picha kwa vipimo halisi na hakiki ya moja kwa moja.",
    uploadTitle: "Pakia picha ili kuanza",
    uploadHint: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG zinakubaliwa",
    clickToChange: "Bonyeza kubadilisha",
    dimensions: "Vipimo",
    percentage: "Asilimia",
    width: "Upana",
    height: "Urefu",
    original: "Asili",
    fitMode: "Njia ya kutoshea",
    outputFormat: "Fomati ya matokeo",
    quality: "Ubora",
    smallest: "10% faili ndogo zaidi",
    bestQuality: "100% ubora wa juu zaidi",
    result: "Matokeo",
    preview: "Hakiki",
    previewPlaceholder: "Pakia picha ili kuona hakiki",
    target: "Lengo",
    resize: "Rekebisha ukubwa wa picha",
    loadingMessages: [
      "Subiri kidogo, tunakamilisha faili yako.",
      "Tuliza moyo wakati tunamaliza kazi yako.",
      "Vizuri, matokeo yako yako karibu kuwa tayari.",
    ],
    ready: "Vizuri, matokeo yako yako tayari.",
    download: "Pakua matokeo",
  },
};

export const IMAGE_UPSCALER_COPY: Record<LanguageCode, {
  title: string;
  subtitle: string;
  scaleFactor: string;
  outputFormat: string;
  quality: string;
  smallest: string;
  bestQuality: string;
  dropTitle: string;
  dropHint: string;
  clickToChange: string;
  preview: string;
  previewPlaceholder: string;
  original: string;
  output: string;
  done: string;
  loading: string;
  button: string;
}> = {
  en: {
    title: "Image Upscaler",
    subtitle: "Enlarge images up to 4x with a cleaner result.",
    scaleFactor: "Scale Factor",
    outputFormat: "Output Format",
    quality: "Quality",
    smallest: "10% - smallest file",
    bestQuality: "100% - best quality",
    dropTitle: "Drop your image here",
    dropHint: "JPEG, PNG, WebP, AVIF, TIFF, HEIF accepted",
    clickToChange: "Click to change",
    preview: "Preview",
    previewPlaceholder: "Upload an image to preview",
    original: "Original",
    output: "Output",
    done: "Done! Your upscaled image is downloading.",
    loading: "Upscaling...",
    button: "Upscale",
  },
  fr: {
    title: "Ameliorateur d'image",
    subtitle: "Agrandissez des images jusqu'a 4x avec un resultat plus net.",
    scaleFactor: "Facteur d'echelle",
    outputFormat: "Format de sortie",
    quality: "Qualite",
    smallest: "10% - fichier le plus leger",
    bestQuality: "100% - meilleure qualite",
    dropTitle: "Deposez votre image ici",
    dropHint: "JPEG, PNG, WebP, AVIF, TIFF, HEIF acceptes",
    clickToChange: "Cliquez pour changer",
    preview: "Apercu",
    previewPlaceholder: "Importez une image pour l'apercu",
    original: "Original",
    output: "Sortie",
    done: "Termine ! Votre image agrandie est en cours de telechargement.",
    loading: "Agrandissement...",
    button: "Agrandir",
  },
  es: {
    title: "Escalador de imagenes",
    subtitle: "Amplia imagenes hasta 4x con un resultado mas limpio.",
    scaleFactor: "Factor de escala",
    outputFormat: "Formato de salida",
    quality: "Calidad",
    smallest: "10% - archivo mas pequeno",
    bestQuality: "100% - mejor calidad",
    dropTitle: "Suelta tu imagen aqui",
    dropHint: "Se aceptan JPEG, PNG, WebP, AVIF, TIFF y HEIF",
    clickToChange: "Haz clic para cambiar",
    preview: "Vista previa",
    previewPlaceholder: "Sube una imagen para verla",
    original: "Original",
    output: "Salida",
    done: "Listo. Tu imagen ampliada se esta descargando.",
    loading: "Ampliando...",
    button: "Ampliar",
  },
  pt: {
    title: "Ampliador de imagens",
    subtitle: "Amplie imagens ate 4x com um resultado mais limpo.",
    scaleFactor: "Fator de escala",
    outputFormat: "Formato de saida",
    quality: "Qualidade",
    smallest: "10% - ficheiro menor",
    bestQuality: "100% - melhor qualidade",
    dropTitle: "Largue a sua imagem aqui",
    dropHint: "JPEG, PNG, WebP, AVIF, TIFF, HEIF aceites",
    clickToChange: "Clique para alterar",
    preview: "Pre-visualizacao",
    previewPlaceholder: "Carregue uma imagem para ver",
    original: "Original",
    output: "Saida",
    done: "Concluido. A sua imagem ampliada esta a transferir.",
    loading: "A ampliar...",
    button: "Ampliar",
  },
  ar: {
    title: "Image Upscaler",
    subtitle: "Enlarge images up to 4x with a cleaner result.",
    scaleFactor: "Scale Factor",
    outputFormat: "Output Format",
    quality: "Quality",
    smallest: "10% - smallest file",
    bestQuality: "100% - best quality",
    dropTitle: "Drop your image here",
    dropHint: "JPEG, PNG, WebP, AVIF, TIFF, HEIF accepted",
    clickToChange: "Click to change",
    preview: "Preview",
    previewPlaceholder: "Upload an image to preview",
    original: "Original",
    output: "Output",
    done: "Done! Your upscaled image is downloading.",
    loading: "Upscaling...",
    button: "Upscale",
  },
  sw: {
    title: "Kikuza picha",
    subtitle: "Kuza picha hadi 4x kwa matokeo safi zaidi.",
    scaleFactor: "Kipimo cha ukubwa",
    outputFormat: "Fomati ya matokeo",
    quality: "Ubora",
    smallest: "10% - faili ndogo zaidi",
    bestQuality: "100% - ubora bora",
    dropTitle: "Dondosha picha yako hapa",
    dropHint: "JPEG, PNG, WebP, AVIF, TIFF, HEIF zinakubaliwa",
    clickToChange: "Bonyeza kubadilisha",
    preview: "Hakiki",
    previewPlaceholder: "Pakia picha ili kuona hakiki",
    original: "Asili",
    output: "Matokeo",
    done: "Imekamilika. Picha yako iliyokuzwa inapakuliwa.",
    loading: "Inakuza...",
    button: "Kuza",
  },
};

export const CV_BUILDER_COPY: Record<LanguageCode, {
  title: string;
  subtitle: string;
  badge: string;
  steps: string[];
  sectionsTitle: string;
  sectionsHint: string;
  personalInfo: string;
  activeSections: string;
  removeSection: string;
  emptyState: string;
  generating: string;
  generateButton: string;
  chooseDesignTitle: string;
  chooseDesignBody: string;
  reshuffleDesigns: string;
  editDetails: string;
  selectDesign: string;
  downloadSource: string;
  designHint: string;
  reshuffleThisDesign: string;
  seeAllDesigns: string;
  previewSuffix: string;
  switchDirection: string;
}> = {
  en: {
    title: "ATS CV Builder",
    subtitle: "Build cleaner ATS-ready CVs with AI-generated content and flexible templates.",
    badge: "AI",
    steps: ["Fill in your details", "Choose a design", "Preview and export"],
    sectionsTitle: "CV Sections",
    sectionsHint: "Toggle sections on or off and reorder them.",
    personalInfo: "Personal Information",
    activeSections: "sections active",
    removeSection: "Remove section",
    emptyState: "Enable sections from the left panel to get started.",
    generating: "Generating your CV with AI...",
    generateButton: "Generate CV",
    chooseDesignTitle: "Choose your CV design",
    chooseDesignBody: "Your resume copy is ready. Pick the design direction you want to use.",
    reshuffleDesigns: "Reshuffle designs",
    editDetails: "Edit details",
    selectDesign: "Select this design",
    downloadSource: "Download source text",
    designHint: "Use reshuffle if you want more visual options without rewriting the CV content.",
    reshuffleThisDesign: "Reshuffle this design",
    seeAllDesigns: "See all designs",
    previewSuffix: "preview",
    switchDirection: "Switch to a different content direction:",
  },
  fr: {
    title: "Createur de CV ATS",
    subtitle: "Creez des CV compatibles ATS avec du contenu genere par IA et des modeles flexibles.",
    badge: "IA",
    steps: ["Renseignez vos informations", "Choisissez un design", "Apercu et export"],
    sectionsTitle: "Sections du CV",
    sectionsHint: "Activez, desactivez et reordonnez les sections.",
    personalInfo: "Informations personnelles",
    activeSections: "sections actives",
    removeSection: "Retirer la section",
    emptyState: "Activez des sections depuis le panneau de gauche pour commencer.",
    generating: "Generation de votre CV avec l'IA...",
    generateButton: "Generer mon CV",
    chooseDesignTitle: "Choisissez votre design de CV",
    chooseDesignBody: "Le contenu du CV est pret. Choisissez la direction visuelle qui vous convient.",
    reshuffleDesigns: "Melanger les designs",
    editDetails: "Modifier les details",
    selectDesign: "Choisir ce design",
    downloadSource: "Telecharger le texte source",
    designHint: "Utilisez melanger pour voir plus d'options visuelles sans reescrire le contenu.",
    reshuffleThisDesign: "Melanger ce design",
    seeAllDesigns: "Voir tous les designs",
    previewSuffix: "apercu",
    switchDirection: "Passer a une autre direction de contenu :",
  },
  es: {
    title: "Creador de CV ATS",
    subtitle: "Crea CVs compatibles con ATS con contenido generado por IA y plantillas flexibles.",
    badge: "IA",
    steps: ["Completa tus datos", "Elige un diseno", "Vista previa y exportacion"],
    sectionsTitle: "Secciones del CV",
    sectionsHint: "Activa, desactiva y reordena las secciones.",
    personalInfo: "Informacion personal",
    activeSections: "secciones activas",
    removeSection: "Quitar seccion",
    emptyState: "Activa secciones desde el panel izquierdo para empezar.",
    generating: "Generando tu CV con IA...",
    generateButton: "Generar CV",
    chooseDesignTitle: "Elige el diseno de tu CV",
    chooseDesignBody: "El contenido de tu CV ya esta listo. Elige la direccion visual que quieres usar.",
    reshuffleDesigns: "Cambiar disenos",
    editDetails: "Editar datos",
    selectDesign: "Elegir este diseno",
    downloadSource: "Descargar texto fuente",
    designHint: "Usa cambiar disenos si quieres mas opciones visuales sin reescribir el contenido.",
    reshuffleThisDesign: "Cambiar este diseno",
    seeAllDesigns: "Ver todos los disenos",
    previewSuffix: "vista previa",
    switchDirection: "Cambiar a otra direccion de contenido:",
  },
  pt: {
    title: "Criador de CV ATS",
    subtitle: "Crie CVs compativeis com ATS com conteudo gerado por IA e modelos flexiveis.",
    badge: "IA",
    steps: ["Preencha os seus dados", "Escolha um design", "Pre-visualizacao e exportacao"],
    sectionsTitle: "Seccoes do CV",
    sectionsHint: "Ative, desative e reordene as seccoes.",
    personalInfo: "Informacao pessoal",
    activeSections: "seccoes ativas",
    removeSection: "Remover seccao",
    emptyState: "Ative seccoes no painel esquerdo para comecar.",
    generating: "A gerar o seu CV com IA...",
    generateButton: "Gerar CV",
    chooseDesignTitle: "Escolha o design do seu CV",
    chooseDesignBody: "O conteudo do CV esta pronto. Escolha a direcao visual que prefere.",
    reshuffleDesigns: "Misturar designs",
    editDetails: "Editar dados",
    selectDesign: "Escolher este design",
    downloadSource: "Descarregar texto fonte",
    designHint: "Use misturar para ver mais opcoes visuais sem reescrever o conteudo.",
    reshuffleThisDesign: "Misturar este design",
    seeAllDesigns: "Ver todos os designs",
    previewSuffix: "pre-visualizacao",
    switchDirection: "Mudar para outra direcao de conteudo:",
  },
  ar: {
    title: "ATS CV Builder",
    subtitle: "Build cleaner ATS-ready CVs with AI-generated content and flexible templates.",
    badge: "AI",
    steps: ["Fill in your details", "Choose a design", "Preview and export"],
    sectionsTitle: "CV Sections",
    sectionsHint: "Toggle sections on or off and reorder them.",
    personalInfo: "Personal Information",
    activeSections: "sections active",
    removeSection: "Remove section",
    emptyState: "Enable sections from the left panel to get started.",
    generating: "Generating your CV with AI...",
    generateButton: "Generate CV",
    chooseDesignTitle: "Choose your CV design",
    chooseDesignBody: "Your resume copy is ready. Pick the design direction you want to use.",
    reshuffleDesigns: "Reshuffle designs",
    editDetails: "Edit details",
    selectDesign: "Select this design",
    downloadSource: "Download source text",
    designHint: "Use reshuffle if you want more visual options without rewriting the CV content.",
    reshuffleThisDesign: "Reshuffle this design",
    seeAllDesigns: "See all designs",
    previewSuffix: "preview",
    switchDirection: "Switch to a different content direction:",
  },
  sw: {
    title: "Mtengenezaji wa CV wa ATS",
    subtitle: "Tengeneza CV safi zinazokubalika na ATS kwa msaada wa AI na templeti zinazobadilika.",
    badge: "AI",
    steps: ["Jaza taarifa zako", "Chagua muundo", "Hakiki na hamisha"],
    sectionsTitle: "Sehemu za CV",
    sectionsHint: "Washa, zima na panga upya sehemu.",
    personalInfo: "Taarifa binafsi",
    activeSections: "sehemu zinazotumika",
    removeSection: "Ondoa sehemu",
    emptyState: "Washa sehemu kutoka paneli ya kushoto ili kuanza.",
    generating: "Inazalisha CV yako kwa AI...",
    generateButton: "Zalisha CV",
    chooseDesignTitle: "Chagua muundo wa CV yako",
    chooseDesignBody: "Maudhui ya CV yako yako tayari. Chagua mwonekano unaotaka kutumia.",
    reshuffleDesigns: "Badili miundo",
    editDetails: "Hariri taarifa",
    selectDesign: "Chagua muundo huu",
    downloadSource: "Pakua maandishi chanzo",
    designHint: "Tumia badili miundo kuona chaguo zaidi bila kuandika upya maudhui ya CV.",
    reshuffleThisDesign: "Badili muundo huu",
    seeAllDesigns: "Ona miundo yote",
    previewSuffix: "hakiki",
    switchDirection: "Badili kwenda mwelekeo mwingine wa maudhui:",
  },
};
