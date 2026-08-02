'use client';

import { AFFIDAVIT_TEMPLATES } from '@/lib/docs/legal-templates';
import { LegalDocTool } from '@/components/legal/LegalDocTool';

export default function AffidavitGeneratorPage() {
  return (
    <LegalDocTool
      toolId="affidavit-generator"
      title="Affidavit Generator"
      subtitle="Correctly formatted depositions, ready to swear at a court registry."
      templates={AFFIDAVIT_TEMPLATES}
      disclaimer="The downloaded document only becomes a valid affidavit once sworn before a Commissioner for Oaths at a court registry (or a notary public). Everything you state in it must be true — swearing a false affidavit is a criminal offence."
    />
  );
}
