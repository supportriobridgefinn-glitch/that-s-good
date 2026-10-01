import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { maskName, maskPersonalText } from "@/lib/privacy";
import { useEffect, useRef, useState } from "react";
import { AppShell, GateLoading, useGate } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support inbox | Rio Bridge Finance Admin" }] }),
  component: AdminSupport,
});

type Thread = {
  id: string;
  user_id: string | null;
  visitor_token: string | null;
  display_name: string;
  last_message_at: string;
};
type Msg = { id: string; thread_id: string; sender_role: string; body: string; created_at: string };

function AdminSupport() {
  const navigate = useNavigate();
  const { user, role, loading } = useGate("admin");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/admin/login" });
      return;
    }
    if (role !== "admin") {
      navigate({ to: "/" });
      return;
    }
    void loadThreads();
    const ch = supabase
      .channel("admin_support_threads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_threads" },
        loadThreads,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, role]);

  async function loadThreads() {
    const r = await supabase
      .from("support_threads")
      .select("*")
      .order("last_message_at", { ascending: false });
    setThreads((r.data ?? []) as Thread[]);
  }

  useEffect(() => {
    if (!active) return;
    (async () => {
      const r = await supabase
        .from("support_messages")
        .select("*")
        .eq("thread_id", active)
        .order("created_at");
      setMsgs((r.data ?? []) as Msg[]);
    })();
    const ch = supabase
      .channel(`admin_msgs_${active}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `thread_id=eq.${active}`,
        },
        (p) => {
          if (p.eventType === "INSERT") setMsgs((m) => [...m, p.new as Msg]);
          else if (p.eventType === "DELETE")
            setMsgs((m) => m.filter((x) => x.id !== (p.old as Msg).id));
          else if (p.eventType === "UPDATE")
            setMsgs((m) => m.map((x) => (x.id === (p.new as Msg).id ? (p.new as Msg) : x)));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [active]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !active || !user) return;
    const body = text.trim();
    setText("");
    await supabase.from("support_messages").insert({
      thread_id: active,
      sender_role: "admin",
      sender_id: user.id,
      body,
    });
    await supabase
      .from("support_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", active);
  }

  async function delMsg(id: string) {
    if (!confirm("Delete this message?")) return;
    await supabase.from("support_messages").delete().eq("id", id);
  }
  async function editMsg(m: Msg) {
    const next = prompt("Edit message", m.body);
    if (next === null) return;
    await supabase.from("support_messages").update({ body: next }).eq("id", m.id);
  }

  if (loading) return <GateLoading />;

  return (
    <AppShell title="Support inbox" role="admin">
      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Conversations ({threads.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
            {threads.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">No conversations yet.</div>
            )}
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`w-full text-left p-3 border-t hover:bg-muted ${active === t.id ? "bg-muted" : ""}`}
              >
                <div className="text-sm font-medium truncate">{maskName(t.display_name)}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {t.user_id ? "Customer" : "Visitor"} ·{" "}
                  {new Date(t.last_message_at).toLocaleString()}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="flex flex-col" style={{ minHeight: 420 }}>
          {!active ? (
            <CardContent className="text-sm text-muted-foreground p-6">Select a conversation.</CardContent>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted">
                {msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`flex group ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm break-words ${
                        m.sender_role === "admin" ? "text-white" : "bg-card border"
                      }`}
                      style={m.sender_role === "admin" ? { background: "var(--brand-navy)" } : {}}
                    >
                      {maskPersonalText(m.body)}
                      <div className="text-[9px] opacity-60 mt-1">
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 ml-1 text-xs">
                      <button onClick={() => editMsg(m)} className="text-primary">
                        edit
                      </button>
                      <button onClick={() => delMsg(m.id)} className="text-red-600">
                        del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 p-2 border-t">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Reply…"
                />
                <Button type="submit" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  Send
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
