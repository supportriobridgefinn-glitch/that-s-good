import { useState } from "react";
import { Bot, CircleAlert, Sparkles } from "lucide-react";
import { getLoanGuidance } from "@/lib/loan-guidance.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoanGuidance() {
  const [needs, setNeeds] = useState("");
  const [amount, setAmount] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [guidance, setGuidance] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setGuidance("");
    try {
      const result = await getLoanGuidance({
        data: {
          needs,
          amount: amount ? Number(amount) : null,
          timeframe: timeframe.trim() || null,
        },
      });
      setGuidance(result.guidance);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI guidance is unavailable right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="loan-guidance-card mb-5 overflow-hidden">
      <CardHeader className="border-b border-border/70 bg-secondary/60">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles size={18} />
          </span>
          <div>
            <CardTitle className="font-display text-lg">Explore your borrowing options</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Describe what you need. AI-powered guidance will explain potential options and next steps.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="borrowing-needs">What are you hoping to finance?</Label>
            <textarea id="borrowing-needs" required minLength={20} maxLength={3000} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="For example: I need equipment for my business and want manageable monthly payments..." className="mt-1 min-h-28 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div><Label htmlFor="guidance-amount">Estimated amount (optional)</Label><Input id="guidance-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="25000" /></div>
          <div><Label htmlFor="guidance-timeframe">When do you need it? (optional)</Label><Input id="guidance-timeframe" value={timeframe} onChange={(event) => setTimeframe(event.target.value)} placeholder="Within three months" /></div>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || needs.trim().length < 20}><Bot />{busy ? "Reviewing your needs…" : "Get AI guidance"}</Button>
            <span className="text-xs text-muted-foreground">Guidance is informational and is not a credit decision.</span>
          </div>
        </form>
        {error && <div role="alert" className="mt-5 flex gap-2 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><CircleAlert className="mt-0.5 shrink-0" size={16} />{error}</div>}
        {guidance && <section aria-live="polite" className="mt-6 border-t pt-5"><div className="mb-3 flex items-center gap-2 font-display text-sm font-bold"><Sparkles size={16} className="text-primary" />Your guidance</div><div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{guidance}</div><p className="mt-4 text-xs text-muted-foreground">Final eligibility, rates, and terms are confirmed only after review by Rio Bridge Finance.</p></section>}
      </CardContent>
    </Card>
  );
}