'use client';

import { TENANCY_TEMPLATE } from '@/lib/docs/legal-templates';
import { LegalDocTool } from '@/components/legal/LegalDocTool';

export default function TenancyAgreementPage() {
  return (
    <LegalDocTool
      toolId="tenancy-agreement"
      title="Tenancy Agreement Generator"
      subtitle="A structured agreement both parties can review, print and sign."
      templates={[TENANCY_TEMPLATE]}
      disclaimer="This is a general template, not legal advice. Review every clause together before signing; for long leases or high-value property, have a lawyer review it and register applicable stamp duty."
    />
  );
}
