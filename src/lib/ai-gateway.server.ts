import { createOpenAI } from "@ai-sdk/openai";

// Netlify AI Gateway injects OPENAI_API_KEY / OPENAI_BASE_URL at runtime.
export function createLoanGuidanceModel(apiKey: string) {
  return createOpenAI({
    baseURL: process.env["OPENAI_BASE_URL"],
    apiKey,
  }).responses("gpt-6-astra");
}
