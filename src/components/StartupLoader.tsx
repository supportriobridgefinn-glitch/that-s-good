import { useEffect, useState } from "react";

export function StartupLoader() {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || window.sessionStorage.getItem("rio-intro-seen")) return;
    setVisible(true);

    let hideTimer = 0;
    const finish = () => {
      window.sessionStorage.setItem("rio-intro-seen", "true");
      setDone(true);
      hideTimer = window.setTimeout(() => setVisible(false), 400);
    };

    if (document.readyState === "complete") {
      const t = window.setTimeout(finish, 300);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(hideTimer);
      };
    }

    window.addEventListener("load", finish, { once: true });
    const fallback = window.setTimeout(finish, 4000);
    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(fallback);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;
  return (
    <div
      className="startup-bar"
      data-done={done ? "true" : "false"}
      role="status"
      aria-label="Loading Rio Bridge Finance"
    >
      <span />
    </div>
  );
}
