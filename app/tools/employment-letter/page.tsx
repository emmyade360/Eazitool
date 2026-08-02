'use client';

import { EMPLOYMENT_TEMPLATES } from '@/lib/docs/legal-templates';
import { LegalDocTool } from '@/components/legal/LegalDocTool';

export default function EmploymentLetterPage() {
  return (
    <LegalDocTool
      toolId="employment-letter"
      title="Employment Letter Generator"
      subtitle="Offer letters and employment confirmations, for employers."
      templates={EMPLOYMENT_TEMPLATES}
      disclaimer="For employers documenting real employment only. Banks and embassies verify these letters directly with the business that issued them — issuing one for employment that does not exist is fraud."
    />
  );
}
