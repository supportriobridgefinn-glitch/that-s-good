import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { maskPersonalText } from "@/lib/privacy";

type Notice = {
  id: string;
  title: string;
  body: string;
  kind: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationSheet() {
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("notifications")
      .select("id,title,body,kind,link,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notice[]);
  }

  useEffect(() => {
    if (open) void load();
  }, [open]);
  const unread = items.filter((n) => !n.read_at).length;

  async function markAll() {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    await load();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button aria-label="Notifications" className="relative p-2 rounded-full hover:bg-muted">
          <Bell size={20} className="text-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 grid h-4 min-w-4 px-1 place-items-center rounded-full text-[10px] font-bold text-white bg-red-700">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[340px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <div className="font-semibold text-sm">Notifications</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>
          <button onClick={() => void markAll()} className="text-xs font-medium text-red-700">
            Mark all read
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto divide-y">
          {items.length === 0 && (
            <li className="px-4 py-8 text-sm text-center text-muted-foreground">No notifications</li>
          )}
          {items.map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 flex items-start gap-3 ${!n.read_at ? "bg-red-50" : ""}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-red-50 shrink-0">
                <Bell size={16} className="text-red-700" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold truncate">{maskPersonalText(n.title)}</div>
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-red-700 shrink-0" />}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">{maskPersonalText(n.body)}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </div>
                {n.link && (
                  <Link
                    to={n.link as never}
                    onClick={() => setOpen(false)}
                    className="text-xs text-red-700"
                  >
                    View details
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/activity"
          onClick={() => setOpen(false)}
          className="block text-center py-3 text-sm font-semibold border-t text-red-700"
        >
          View account activity
        </Link>
      </PopoverContent>
    </Popover>
  );
}
