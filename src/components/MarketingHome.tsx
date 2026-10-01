import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { StartupLoader } from "@/components/StartupLoader";
import { useAuthSession } from "@/hooks/use-auth";
import heroImage from "@/assets/rio-team-hero.jpg";
import supportImage from "@/assets/rio-support-agent.jpg";
import { ArrowRight, BadgeCheck, Banknote, BarChart3, Bolt, Check, ChevronRight, CircleDollarSign, Clock3, Globe2, Headphones, LockKeyhole, Menu, ShieldCheck, Sparkles, X } from "lucide-react";

const countries = [
  { flag: " DL🇲🇽", name: "Mexico", status: "Loans available", live: true },
  { flag: "🇰🇾", name: "Cayman Islands", status: "Loans available", live: true },
  { flag: "🇺🇸", name: "United States", status: "Loans available", live: true },
  { flag: "🇨🇦", name: "Canada", status: "Coming soon", live: false },
  { flag: "🇬🇧", name: "United Kingdom", status: "Coming soon", live: false },
  { flag: "🇨🇭", name: "Switzerland", status: "Coming soon", live: false },
];

const products = [
  { icon: CircleDollarSign, title: "Personal loans", text: "Structured financing for major plans and meaningful milestones." },
  { icon: BarChart3, title: "Business loans", text: "Flexible working capital designed around business momentum." },
  { icon: Banknote, title: "Bridge financing", text: "Clear short-term finance for time-sensitive opportunities." },
];

export function MarketingHome() {
  const { user, role, loading } = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState(25000);
  const [months, setMonths] = useState(24);
  const estimate = useMemo(() => amount * (1 + 0.079 * (months / 12)) / months, [amount, months]);
  const dashboard = role === "admin" ? "/admin" : "/dashboard";
  const close = () => setMenuOpen(false);
  return (
    <div className="marketing-site overflow-x-clip bg-background text-foreground">
      <StartupLoader />
      <header className="marketing-header sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:px-8">
          <Link to="/" aria-label="Rio Bridge Finance home"><BrandMark /></Link>
          <nav className="hidden items-center justify-center gap-7 text-xs font-semibold lg:flex" aria-label="Main navigation">
            <a href="#home">Home</a><a href="#products">Loans</a><a href="#about">About Us</a><a href="#business">Business Loans</a><a href="#support">Support</a><a href="#contact">Contact</a>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {!loading && user ? <Button asChild variant="outline"><Link to={dashboard as never}>Dashboard</Link></Button> : <Button asChild variant="ghost"><Link to="/login">Log In</Link></Button>}
            <Button asChild><Link to="/register">Apply Now <ArrowRight /></Link></Button>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</Button>
        </div>
        {menuOpen && <nav className="border-t border-border bg-background px-5 py-4 lg:hidden" aria-label="Mobile navigation"><div className="grid gap-1 text-sm font-semibold">{[["Home","#home"],["Loans","#products"],["About Us","#about"],["Business Loans","#business"],["Support","#support"],["Contact","#contact"]].map(([label,href]) => <a key={href} href={href} onClick={close} className="rounded-md px-3 py-3 hover:bg-muted">{label}</a>)}<div className="mt-3 grid grid-cols-2 gap-2">{!user && <Button asChild variant="outline"><Link to="/login">Log In</Link></Button>}<Button asChild><Link to="/register">Apply Now</Link></Button></div></div></nav>}
      </header>

      <main>
        <section id="home" className="hero-band scroll-mt-20">
          <div className="mx-auto grid min-h-[580px] max-w-7xl lg:grid-cols-[.88fr_1.12fr]">
            <div className="relative z-10 flex flex-col justify-center px-5 py-14 sm:px-8 lg:px-8 lg:py-16">
              <div className="section-kicker"><span /> Welcome to Rio Bridge Finance</div>
              <h1 className="mt-5 max-w-xl font-display text-[clamp(2.75rem,5vw,5.1rem)] font-extrabold leading-[.96]">Smart finance.<br /><span className="text-primary">Real possibilities.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">Clear personal and business financing, built around your goals and supported by real people.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/register">Apply Now <ArrowRight /></Link></Button><Button asChild size="lg" variant="outline"><a href="#about">Learn More</a></Button></div>
              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">{[[Bolt,"Fast approval","A clear review process"],[ShieldCheck,"Secure process","Protected account access"],[Globe2,"Global support","Help across time zones"]].map(([Icon,title,text]) => <div key={String(title)} className="trust-item"><Icon className="text-primary" size={19} /><div><b>{String(title)}</b><span>{String(text)}</span></div></div>)}</div>
            </div>
            <div className="hero-image relative min-h-[430px] overflow-hidden lg:min-h-[580px]">
              <img src={heroImage} alt="Professionals collaborating on financial plans" className="absolute inset-0 h-full w-full object-cover" width={1600} height={1050} />
              <div className="float-card float-approval"><span className="status-icon"><Check size={13} /></span><div><b>Application reviewed</b><small>Your request is progressing</small></div></div>
              <div className="float-card float-security"><LockKeyhole size={18} /><div><b>Secure access</b><small>Your data is protected</small></div></div>
              <div className="float-card float-simple"><BrandMark compact /><div><b>Quick. Simple. Transparent.</b><small>Finance with fewer surprises</small></div></div>
            </div>
          </div>
        </section>

        <section className="country-band border-y border-border bg-secondary/50 py-7"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="mb-5 flex items-center gap-2"><Globe2 size={18} /><h2 className="font-display text-lg font-bold">Countries We Support</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{countries.map((c) => <article key={c.name} className="country-card"><span className="text-2xl" aria-hidden="true">{c.flag}</span><div><h3>{c.name}</h3><span className={c.live ? "status-live" : "status-soon"}>{c.status}</span></div></article>)}</div></div></section>

        <section className="feature-strip" id="support"><div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_300px]"><div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{[[Banknote,"Flexible Loan Options","Personal and business plans."],[CircleDollarSign,"Competitive Rates","Clear, transparent terms."],[Bolt,"Fast Disbursement","Funds move after approval."],[Headphones,"24/7 Support","Help when you need it."]].map(([Icon,title,text]) => <div key={String(title)} className="dark-feature"><Icon /><div><b>{String(title)}</b><span>{String(text)}</span></div></div>)}</div><div className="support-panel"><img src={supportImage} alt="Rio Bridge customer support specialist" loading="lazy" width={1000} height={1200} /><div><b>Need help?</b><span>Our support team is here for you.</span><Button asChild size="sm"><a href="#contact">Contact Support <ArrowRight /></a></Button></div></div></div></section>

        <section id="about" className="content-section"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="section-heading"><div className="section-kicker"><span /> A better way to borrow</div><h2>Designed for confidence at every step.</h2><p>From your first application to your final repayment, every stage is clear, secure and supported.</p></div><div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">{[["01","Apply online","Tell us what you need through a protected application."],["02","Complete review","Our team reviews your information and confirms next steps."],["03","Manage with ease","Track balances, payments and support from your account."]].map(([n,t,d]) => <article key={n} className="process-step"><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>

        <section id="products" className="content-section bg-secondary/45"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="section-heading row-heading"><div><div className="section-kicker"><span /> Loan products</div><h2>Finance built around real plans.</h2></div><p>Choose a clear starting point. Final terms are confirmed after review and approval.</p></div><div className="grid gap-4 md:grid-cols-3">{products.map(({icon:Icon,title,text}) => <article className="product-card" key={title}><Icon /><h3>{title}</h3><p>{text}</p><Link to="/register">Start an application <ChevronRight /></Link></article>)}</div></div></section>

        <section id="business" className="content-section"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2"><div><div className="section-kicker"><span /> Plan your financing</div><h2 className="mt-4 font-display text-4xl font-extrabold">A practical monthly estimate.</h2><p className="mt-4 text-muted-foreground">Adjust the amount and term to explore an illustrative payment. This is not an offer or approval.</p><div className="mt-7 space-y-6"><label className="range-label"><span>Amount</span><b>${amount.toLocaleString()}</b><input type="range" min="5000" max="100000" step="1000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label><label className="range-label"><span>Term</span><b>{months} months</b><input type="range" min="12" max="60" step="12" value={months} onChange={(e) => setMonths(Number(e.target.value))} /></label></div></div><div className="estimate-panel"><span>Illustrative monthly payment</span><strong>${estimate.toLocaleString(undefined,{maximumFractionDigits:0})}</strong><p>Based on an illustrative 7.9% annual rate. Actual eligibility, rate and payment may differ.</p><Button asChild><Link to="/register">Apply for a full review <ArrowRight /></Link></Button></div></div></section>

        <section className="security-band"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr]"><div><div className="section-kicker light"><span /> Security first</div><h2 className="mt-4 font-display text-4xl font-extrabold">Your financial life deserves serious protection.</h2></div><div className="grid gap-3 sm:grid-cols-2">{[[LockKeyhole,"Protected sessions"],[ShieldCheck,"Role-based access"],[BadgeCheck,"Verified actions"],[Clock3,"Account monitoring"]].map(([Icon,label]) => <div className="security-point" key={String(label)}><Icon /><span>{String(label)}</span></div>)}</div></div></section>

        <section className="content-section"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="section-heading"><div className="section-kicker"><span /> Client perspective</div><h2>Clear guidance makes a difference.</h2></div><div className="grid gap-4 md:grid-cols-3">{["The process was structured and the team explained every step clearly.","I can see my activity and loan information in one place without confusion.","The support team is responsive and treats every question professionally."].map((q,i) => <blockquote className="quote-card" key={q}><Sparkles /><p>“{q}”</p><footer>Verified client experience {i+1}</footer></blockquote>)}</div></div></section>

        <section className="content-section bg-secondary/45"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr]"><div><div className="section-kicker"><span /> Common questions</div><h2 className="mt-4 font-display text-4xl font-extrabold">Answers before you apply.</h2></div><Accordion type="single" collapsible className="faq-list">{[["How does the application process work?","Submit your details online. Our team reviews the application and, if approved, creates your secure account from the confirmed information."],["Is an application a guarantee of funding?","No. Every application is reviewed, and final eligibility and terms are confirmed only after approval."],["How do I access an approved account?","Approved customers receive their account access information and sign in through the secure customer portal."],["Where can I get help?","Use the support chat or contact section. Existing customers can also reach support from their account."]].map(([q,a]) => <AccordionItem key={q} value={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></div></section>

        <section className="cta-band"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-center"><div><span>Ready when you are.</span><h2>Build your next move with Rio Bridge Finance.</h2></div><Button asChild size="lg"><Link to="/register">Apply Now <ArrowRight /></Link></Button></div></section>
      </main>

       <footer id="contact" className="site-footer"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.4fr_.6fr_.6fr_.8fr]"> <div><BrandMark className="brand-on-dark" /><p className="mt-5 max-w-sm">Personal and business financing with secure account access and responsive support.</p></div><div><b>Explore</b><a href="#products">Loans</a><a href="#about">How it works</a><Link to="/register">Apply</Link></div><div><b>Account</b><Link to="/login">Customer login</Link><Link to="/terms-of-data">Terms of data</Link></div><div><b>Contact</b><a href="mailto:support@riobridgefinance.com">support@riobridgefinance.com</a><a href="https://wa.me/13347808338?text=Hello%20Rio%20Bridge%20Finance%20support%2C" target="_blank" rel="noopener">WhatsApp +1 (334) 780-8338</a><span>Support is available through the secure chat.</span></div></div><div className="border-t border-primary-foreground/10"><div className="mx-auto max-w-7xl px-5 py-6 sm:px-8"><p className="max-w-4xl text-xs leading-5 text-primary-foreground/70">Rio Bridge Finance is a financial technology platform, All financing subject to approval; terms confirmed in writing prior to disbursement.</p></div></div><div className="border-t border-primary-foreground/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} Rio Bridge Finance.</span><span>Financing is subject to review and approval.</span></div></div></footer>
    </div>
  );
}