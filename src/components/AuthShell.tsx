import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, TrendingUp } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import authImage from "@/assets/rio-auth-professional.jpg";

export function AuthShell({ children, eyebrow = "Secure client access" }: { children: ReactNode; eyebrow?: string }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,.95fr)]">
      <section className="auth-visual relative hidden overflow-hidden lg:block">
        <img src={authImage} alt="Financial professional using a secure tablet" className="absolute inset-0 h-full w-full object-cover" width={1408} height={1600} />
        <div className="auth-visual-shade absolute inset-0" />
        <Link to="/" className="absolute left-10 top-9 z-10"><BrandMark className="brand-on-dark" /></Link>
        <div className="absolute bottom-12 left-10 right-10 z-10 max-w-xl text-primary-foreground">
          <div className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase text-primary"><ShieldCheck size={16} /> {eyebrow}</div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">Finance with clarity.<br />Move with confidence.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/75">Access your accounts, applications and support through one protected Rio Bridge experience.</p>
        </div>
        <div className="auth-float-card absolute right-8 top-[28%] z-10"><TrendingUp size={18} className="text-primary" /><div><b>Protected access</b><span>Encrypted account session</span></div></div>
      </section>
      <section className="flex min-w-0 items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
        <div className="w-full max-w-lg">
          <Link to="/" className="mb-8 inline-flex lg:hidden"><BrandMark /></Link>
          {children}
        </div>
      </section>
    </main>
  );
}