import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLoanGuidanceModel } from "@/lib/ai-gateway.server";

const LoanGuidanceInput = z.object({
  needs: z.string().trim().min(20, "Please share a little more detail.").max(3_000),
  amount: z.number().positive().max(10_000_000).nullable(),
  timeframe: z.string().trim().max(120).nullable(),
});

export const getLoanGuidance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LoanGuidanceInput.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "customer")
      .maybeSingle();
    if (!role.data) throw new Error("Loan guidance is available to customer accounts only.");

    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("AI guidance is temporarily unavailable. Please contact support.");

    const result = streamText({
      model: createLoanGuidanceModel(apiKey),
      maxRetries: 2,
      system: `You are Rio Bridge Finance's loan guidance assistant. Explain potentially suitable loan categories and practical next steps based only on the customer's stated needs. Be concise, calm, and transparent. Never promise approval, quote a guaranteed rate, claim eligibility, or make a lending decision. Do not ask for passwords, PINs, bank credentials, government ID numbers, or other sensitive data. State that final terms and eligibility require review by Rio Bridge Finance. Use short headings and bullet points.`,
      prompt: `Customer borrowing needs:\n${data.needs}\n\nRequested amount: ${data.amount === null ? "Not provided" : data.amount}\nTimeframe: ${data.timeframe || "Not provided"}\n\nGive up to three suitable options, explain why each may fit, list the documents or information typically needed, and provide clear next steps.`,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const guidance = await result.text;
    if (!guidance.trim()) throw new Error("No guidance was returned. Please try again later.");
    return { guidance };
  });