import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cancelWithdrawal, getWithdrawalDetail } from "@/lib/finance.functions";
import { useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/withdraw/$id")({
  head: () => ({ meta: [{ title: "Withdrawal Details | Rio Bridge Finance" }] }),
  component: Detail,
});
type Req = {
  id: string;
  amount: number;
  processing_fee: number;
  network_fee: number;
  net_amount: number;
  payout_kind: string;
  destination_summary: string;
  status: string;
  estimated_time: string;
  provider_reference: string;
  admin_notes: string;
  created_at: string;
  hold_active: boolean;
};
type History = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string;
  actor_role: string;
  created_at: string;
};

function Detail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, role, loading } = useGate("customer");
  const { format } = useCurrency();
  const [req, setReq] = useState<Req | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await getWithdrawalDetail({ data: { id } });
      setReq(r.request as Req);
      setHistory(r.history as History[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load withdrawal");
    }
  }
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (role !== "customer") {
      navigate({ to: "/" });
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role, id, navigate]);
  if (loading || !req)
    return error ? <div className="p-6 text-red-700">{error}</div> : <GateLoading />;
  const cancellable = [
    "draft",
    "submitted",
    "identity_verification_required",
    "under_review",
  ].includes(req.status);
  async function cancel() {
    if (!confirm("Cancel this withdrawal and release any held funds?")) return;
    setBusy(true);
    try {
      await cancelWithdrawal({ data: { id } });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed");
    }
    setBusy(false);
  }
  return (
    <AppShell title="Withdrawal Details" role="customer">
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between gap-3 text-base">
            <span>{format(Number(req.amount))}</span>
            <span className="capitalize text-sm">{req.status.replaceAll("_", " ")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row
            a="Destination"
            b={`${req.payout_kind.replaceAll("_", " ")} · ${req.destination_summary}`}
          />
          <Row a="Processing fee" b={format(Number(req.processing_fee))} />
          <Row a="Network fee" b={format(Number(req.network_fee))} />
          <Row a="Net amount" b={format(Number(req.net_amount))} />
          <Row a="Estimated time" b={req.estimated_time || "—"} />
          <Row a="Provider reference" b={req.provider_reference || "Pending"} />
          <Row a="Funds held" b={req.hold_active ? "Yes" : "No"} />
          {req.admin_notes && (
            <div className="rounded bg-muted p-3 text-foreground">{req.admin_notes}</div>
          )}
          <div className="flex gap-2 pt-3">
            <Link to="/withdraw">
              <Button variant="outline">Back</Button>
            </Link>
            {cancellable && (
              <Button variant="outline" className="text-red-600" disabled={busy} onClick={cancel}>
                Cancel request
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Status timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.map((h) => (
            <div key={h.id} className="relative border-l-2 border-border pl-4">
              <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-red-700" />
              <div className="font-medium capitalize text-sm">
                {h.to_status.replaceAll("_", " ")}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(h.created_at).toLocaleString()} · {h.actor_role}
              </div>
              {h.note && <div className="text-sm text-muted-foreground">{h.note}</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
function Row({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2">
      <span className="text-muted-foreground">{a}</span>
      <span className="text-right font-medium capitalize">{b}</span>
    </div>
  );
}
