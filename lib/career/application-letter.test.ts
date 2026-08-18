import { describe, expect, it } from 'vitest';
import { normaliseApplicationLetter } from './application-letter';

describe('normaliseApplicationLetter', () => {
  it('keeps the draft as clean, plain application-letter prose', () => {
    const output = normaliseApplicationLetter(`\`\`\`markdown
# Application Letter
Dear Hiring Manager,

**I am writing** to apply for this role—my relevant experience is in customer service.

* I communicate clearly and work well with teams.

Kind regards,
Ada
\`\`\``);

    expect(output).toBe(
      'I am writing to apply for this role, my relevant experience is in customer service.\n\nI communicate clearly and work well with teams.',
    );
    expect(output).not.toMatch(/[\`*_#•—–]/);
  });
});
