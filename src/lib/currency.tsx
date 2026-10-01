import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Rates = Record<string, number>;
type Ctx = {
  code: string;
  setCode: (c: string) => void;
  rate: number; // 1 USD = rate of target currency
  convert: (usd: number) => number;
  format: (usd: number) => string;
  formatNative: (amount: number, c?: string) => string;
  supported: string[];
  loading: boolean;
};

const SUPPORTED = [
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "INR",
  "NGN",
  "ZAR",
  "BRL",
  "MXN",
  "AED",
  "SGD",
  "HKD",
  "SEK",
  "NOK",
  "DKK",
  "NZD",
  "TRY",
  "KRW",
];
const CurrencyCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "riobridge_display_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<string>("USD");
  const [rates, setRates] = useState<Rates>({ USD: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) setCodeState(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLoading(true);
    // Frankfurter is free and key-less; falls back to open.er-api if needed.
    fetch("https://api.frankfurter.dev/v1/latest?base=USD")
      .then((r) => r.json())
      .then((d: { rates?: Rates }) => {
        if (d.rates) setRates({ USD: 1, ...d.rates });
      })
      .catch(() => {
        // Fallback rates (approximate) so UI still works offline.
        setRates({
          USD: 1,
          EUR: 0.93,
          GBP: 0.79,
          CHF: 0.88,
          CAD: 1.37,
          AUD: 1.52,
          JPY: 156,
          CNY: 7.25,
          INR: 83.5,
          NGN: 1550,
          ZAR: 18.5,
          BRL: 5.4,
          MXN: 17.2,
          AED: 3.67,
          SGD: 1.35,
          HKD: 7.81,
          SEK: 10.6,
          NOK: 10.7,
          DKK: 6.93,
          NZD: 1.65,
          TRY: 32,
          KRW: 1370,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function setCode(c: string) {
    setCodeState(c);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, c);
  }

  const rate = rates[code] ?? 1;
  function convert(usd: number) {
    return usd * rate;
  }
  function format(usd: number) {
    return convert(usd).toLocaleString("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    });
  }
  function formatNative(amount: number, c?: string) {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: c ?? code,
      maximumFractionDigits: 2,
    });
  }

  return (
    <CurrencyCtx.Provider
      value={{ code, setCode, rate, convert, format, formatNative, supported: SUPPORTED, loading }}
    >
      {children}
    </CurrencyCtx.Provider>
  );
}

export function useCurrency(): Ctx {
  const c = useContext(CurrencyCtx);
  if (!c) {
    // Safe fallback so SSR/preview doesn't crash if provider not mounted.
    return {
      code: "USD",
      setCode: () => {},
      rate: 1,
      convert: (u) => u,
      format: (u) => u.toLocaleString("en-US", { style: "currency", currency: "USD" }),
      formatNative: (a, cc) =>
        a.toLocaleString("en-US", { style: "currency", currency: cc ?? "USD" }),
      supported: SUPPORTED,
      loading: false,
    };
  }
  return c;
}

export function CurrencySelect({ className }: { className?: string }) {
  const { code, setCode, supported } = useCurrency();
  return (
    <select
      aria-label="Display currency"
      value={code}
      onChange={(e) => setCode(e.target.value)}
      className={
        className ??
        "bg-transparent border border-white/30 text-white text-xs rounded px-2 py-1 focus:outline-none"
      }
      style={{ colorScheme: "dark" }}
    >
      {supported.map((c) => (
        <option key={c} value={c} style={{ color: "black" }}>
          {c}
        </option>
      ))}
    </select>
  );
}
