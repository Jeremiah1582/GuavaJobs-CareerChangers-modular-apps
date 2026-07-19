/**
 * Shared LLM style guidance: natural human writing without fabrications.
 * Imported by cover-letter and generated-cv generators.
 */
export const HUMAN_VOICE_PROMPT = `
HUMAN WRITING STYLE (required):
- Vary sentence length; mix short punchy lines with longer ones.
- Prefer concrete verbs and specific outcomes over vague claims.
- In cover letters, light contractions are fine (I've, I'm, don't) when natural.
- Avoid stacked buzzwords, filler phrases, and template openers ("I am writing to express…", "In today's fast-paced…").
- Do not start consecutive bullets or sentences with the same word or pattern.
- Sound like a thoughtful person, not a chatbot: no hype, no hollow enthusiasm.
- Never invent employers, dates, degrees, metrics, tools, or skills — honesty beats polish.
`.trim();
