import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Phone, Mail, MessageSquare } from "lucide-react";

export const CONTACT = {
  whatsapp: "+13347808338",
  whatsappDisplay: "+1 (334) 780-8338 · Message support on WhatsApp",
  email: "support@riobridgefinance.com",
};

type Msg = { id: string; thread_id: string; sender_role: string; body: string; created_at: string };

function getVisitorToken() {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem("riobridge_visitor_token");
  if (!t) {
    t = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("riobridge_visitor_token", t);
  }
  return t;
}

export function SupportChat() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visitorToken = useMemo(getVisitorToken, []);

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // External "open chat" trigger (e.g. from login page)
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("riobridge:open-support", h);
    return () => window.removeEventListener("riobridge:open-support", h);
  }, []);

  // Ensure thread exists when chat opens
  useEffect(() => {
    if (!open || threadId) return;
    (async () => {
      if (userId) {
        const q = supabase
          .from("support_threads")
          .select("id,display_name")
          .eq("user_id", userId)
          .limit(1);
        const existing = await q.maybeSingle();
        if (existing.data) {
          setThreadId(existing.data.id);
          setName(existing.data.display_name);
          return;
        }
        const ins = await supabase
          .from("support_threads")
          .insert({
            user_id: userId,
            visitor_token: null,
            display_name: "Customer",
          })
          .select("id")
          .single();
        if (!ins.error && ins.data) setThreadId(ins.data.id);
      } else {
        const r = await (
          supabase.rpc as unknown as (
            n: string,
            a: Record<string, unknown>,
          ) => Promise<{ data: string | null; error: Error | null }>
        )("visitor_get_or_create_thread", { _token: visitorToken });
        if (!r.error && r.data) setThreadId(r.data);
      }
    })();
  }, [open, threadId, userId, visitorToken]);

  // Load + subscribe (authed) or poll (visitor) messages
  useEffect(() => {
    if (!threadId) return;
    const tid: string = threadId;
    let cancelled = false;
    async function load() {
      if (userId) {
        const r = await supabase
          .from("support_messages")
          .select("*")
          .eq("thread_id", tid)
          .order("created_at");
        if (!cancelled) setMessages((r.data ?? []) as Msg[]);
      } else {
        const r = await (
          supabase.rpc as unknown as (
            n: string,
            a: Record<string, unknown>,
          ) => Promise<{ data: Msg[] | null; error: Error | null }>
        )("visitor_list_messages", { _token: visitorToken, _thread: threadId });
        if (!cancelled) setMessages((r.data ?? []) as Msg[]);
      }
    }
    load();
    if (userId) {
      const ch = supabase
        .channel(`support_${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "support_messages",
            filter: `thread_id=eq.${threadId}`,
          },
          (p) => setMessages((m) => [...m, p.new as Msg]),
        )
        .subscribe();
      return () => {
        cancelled = true;
        void supabase.removeChannel(ch);
      };
    }
    const poll = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [threadId, userId, visitorToken]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !threadId) return;
    const body = text.trim();
    setText("");
    if (userId) {
      await supabase.from("support_messages").insert({
        thread_id: threadId,
        sender_role: "customer",
        sender_id: userId,
        body,
      });
      await supabase
        .from("support_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);
    } else {
      await (
        supabase.rpc as unknown as (
          n: string,
          a: Record<string, unknown>,
        ) => Promise<{ error: Error | null }>
      )("visitor_send_message", { _token: visitorToken, _thread: threadId, _body: body });
      // Optimistic append for visitor (no realtime)
      setMessages((m) => [
        ...m,
        {
          id: `local_${Date.now()}`,
          thread_id: threadId as string,
          sender_role: "visitor",
          body,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  }

  const waHref = `https://wa.me/${CONTACT.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Hello Rio Bridge Finance support,")}`;

  return (
    <>
      {!open && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
          {menuOpen && (
            <div className="rounded-xl shadow-2xl border bg-card overflow-hidden w-64 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-4 py-3" style={{ background: "var(--brand-navy)", color: "white" }}>
                <div className="font-semibold text-sm">Contact Rio Bridge Finance</div>
                <div className="text-[11px] opacity-80">Choose how to reach us</div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted border-b"
              >
                <MessageSquare size={20} style={{ color: "var(--brand-navy)" }} />
                <div>
                  <div className="text-sm font-medium">Live Web Chat</div>
                  <div className="text-[11px] text-muted-foreground">Chat with our agents</div>
                </div>
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted border-b"
              >
                <Phone size={20} style={{ color: "#25D366" }} />
                <div>
                  <div className="text-sm font-medium">WhatsApp Support</div>
                  <div className="text-[11px] text-muted-foreground">{CONTACT.whatsappDisplay}</div>
                </div>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted"
              >
                <Mail size={20} style={{ color: "var(--brand-navy)" }} />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-[11px] text-muted-foreground">{CONTACT.email}</div>
                </div>
              </a>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Contact us"
            className="rounded-full shadow-lg flex items-center justify-center"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", width: 56, height: 56 }}
          >
            {menuOpen ? <X size={26} /> : <MessageCircle size={26} />}
          </button>
        </div>
      )}
      {open && (
        <div
          className="fixed bottom-24 left-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg shadow-2xl flex flex-col overflow-hidden bg-card border"
          style={{ height: "min(70vh, 520px)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "var(--brand-navy)", color: "white" }}
          >
            <div className="min-w-0">
              <div className="font-semibold truncate">Rio Bridge Finance Support</div>
              <div className="text-xs opacity-80">We typically reply in a few minutes</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="shrink-0">
              <X size={20} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted">
            {messages.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6">
                Hi {name || "there"}! How can we help you today?
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender_role === "admin" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm break-words ${
                    m.sender_role === "admin" ? "bg-card border" : "text-white"
                  }`}
                  style={m.sender_role !== "admin" ? { background: "var(--brand-navy)" } : {}}
                >
                  {m.body}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-2 p-2 border-t bg-card">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
            />
            <Button type="submit" size="icon" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
