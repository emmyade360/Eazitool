import 'server-only';

/**
 * Current Groq model used across Eazitool's server-side AI features.
 * The environment variable allows deployments to opt into another supported
 * Groq model without changing individual routes.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';
