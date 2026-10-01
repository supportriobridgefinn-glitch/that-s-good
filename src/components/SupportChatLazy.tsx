import { lazy, Suspense, useEffect, useState } from "react";

// Lazy-load the full chat widget so it is not in the initial bundle.
// SSR renders nothing; on the client we wait until the browser is idle
// (or 2s, whichever comes first) before pulling the chunk.
const SupportChatImpl = lazy(() =>
  import("./SupportChat").then((m) => ({ default: m.SupportChat })),
);

export function SupportChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (!cancelled) setReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(load, { timeout: 2000 });
    } else {
      const t = setTimeout(load, 1500);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <SupportChatImpl />
    </Suspense>
  );
}
