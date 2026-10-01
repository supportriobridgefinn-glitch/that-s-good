import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms-of-data")({
  head: () => ({
    meta: [
      { title: "Terms of Data | RIO BRIDGE FINANCE" },
      {
        name: "description",
        content:
          "How RIO BRIDGE FINANCE collects, uses and protects your personal data under our loan services.",
      },
      { property: "og:title", content: "Terms of Data | RIO BRIDGE FINANCE" },
      {
        property: "og:description",
        content: "RIO BRIDGE FINANCE Privacy Statement and Terms of Data.",
      },
    ],
  }),
  component: TermsOfData,
});

const NAV_BG = "var(--brand-navy)";
const GOLD = "var(--primary)";

function TermsOfData() {
  return (
    <div className="min-h-screen bg-muted">
      <header
        style={{ background: NAV_BG, borderBottom: `3px solid ${GOLD}` }}
        className="text-white"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img
              src="/site/images/rio-bridge-logo.png"
              alt="RIO BRIDGE FINANCE"
              className="h-9 w-auto shrink-0"
            />
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight">RIO BRIDGE FINANCE</div>
              <div className="text-[10px] opacity-80 leading-tight">
                Private Loans and Loan Management
              </div>
            </div>
          </Link>
          <Link to="/login" className="text-xs hover:underline" style={{ color: GOLD }}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:underline">
            Home
          </Link>{" "}
          <span className="mx-1">/</span> Terms of Data
        </nav>
        <h1 className="text-3xl font-bold mb-2" style={{ color: NAV_BG }}>
          Terms of Data
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          RIO BRIDGE FINANCE — Loan Privacy Policy. Learn more about how RIO BRIDGE FINANCE protects
          and uses your personal information.
        </p>

        <Section title="Our Terms of Data">
          <p>
            We are <strong>RIO BRIDGE FINANCE Private Lending</strong>, the data controller. You can
            contact our Data Protection Officer (DPO) at Dreibündenstrasse 56, Daillens, Switzerland
            1340 if you have any questions.
          </p>
          <p>
            This is our Privacy Statement which explains how we obtain, use and keep your personal
            data safe in relation to the RIO BRIDGE FINANCE website.
          </p>
          <p>
            Your personal data is data which by itself or with other data available to us can be
            used to identify you.
          </p>
          <p>
            We are committed to keeping your personal information safe in accordance with applicable
            data protection laws.
          </p>
        </Section>

        <Section title="The types of personal data we collect and use">
          <p>
            The types of personal data we capture and use will depend on what you are doing on the
            website. We will use your personal data for some or all of the reasons set out in this
            Privacy Statement. If you become a customer we will also use it to manage the account,
            policy or service you have applied for and we will provide you with a separate data
            protection statement specifically in relation to that as part of the application
            process. Some of the information relevant to that is included in this Privacy Statement
            for consistency. Examples of the personal data we use in relation to our website may
            include:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Full name and personal details including contact information (e.g. home address and
              address history, email address, home and mobile telephone numbers); date of birth
              and/or age (e.g. to make sure you are eligible to apply for a product or service).
            </li>
            <li>
              Financial details (e.g. salary and details of other income, and details of accounts
              held with other providers if you apply for a product or service with us); records of
              products and services you have obtained or applied for, how you use them and the
              relevant technology used to access or manage them (e.g. mobile phone location data, IP
              address, MAC address).
            </li>
            <li>
              Biometric data (e.g. fingerprints and voice recordings for Touch ID and voice
              recognition); information from credit reference or fraud prevention agencies,
              electoral roll, court records of debt judgement and bankruptcies and other publicly
              available sources, as well as information on any financial associates you may have if
              you apply for a product or service with us.
            </li>
            <li>
              Family, lifestyle or social circumstances if relevant to the product or service you
              apply for (e.g. the number of dependants you have).
            </li>
            <li>
              Education and employment details / employment status for credit and fraud prevention
              purposes if you apply for a product or service with us.
            </li>
            <li>
              Personal data about other named individuals as required. Where you provide the
              personal data of others you must have their authority to provide their personal data
              to us and share this Privacy Statement and any related data protection statement with
              them beforehand together with details of what you have agreed on their behalf.
            </li>
          </ul>
        </Section>

        <Section title="Our app">
          <p>
            Our digital loan platform is up to date and completely trustworthy. You can use your
            mobile to perform transactions, loan applications and repayments.
          </p>
          <p className="text-muted-foreground text-sm">Over 9.2 million downloads worldwide.</p>
        </Section>

        <Section title="Careers">
          <p>
            RIO BRIDGE FINANCE welcomes talented professionals to join our young and dynamic team.
            We are looking for highly qualified professionals, graduates and financial specialists
            who share our values of integrity and excellence to grow with us.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center mt-4">
            <div className="rounded border bg-card p-4">
              <div className="text-2xl font-bold" style={{ color: NAV_BG }}>
                500+
              </div>
              <div className="text-xs text-muted-foreground">Team Members</div>
            </div>
            <div className="rounded border bg-card p-4">
              <div className="text-2xl font-bold" style={{ color: NAV_BG }}>
                50+
              </div>
              <div className="text-xs text-muted-foreground">Open Positions</div>
            </div>
          </div>
        </Section>

        <Section title="Apply for an Account in Minutes">
          <p>Get your RIO BRIDGE FINANCE account today and experience lending excellence.</p>
          <Link
            to="/register"
            className="inline-block mt-2 px-4 py-2 rounded text-white"
            style={{ background: NAV_BG }}
          >
            Get your RIO BRIDGE FINANCE account
          </Link>
        </Section>

        <Section title="About RIO BRIDGE FINANCE">
          <p>
            RIO BRIDGE FINANCE is a premier lender, offering loan and financing products to Large
            Corporates and SMEs, International Clients, Institutional Investors, Provident and
            Pension Funds, Equity Funds as well as High Net Worth Individuals.
          </p>
        </Section>

        <Section title="Contact">
          <p>Dreibündenstrasse 56, Daillens, Switzerland 1340</p>
          <p>Mercy School Institute, 1000 Mercy Dr, El Paso, Texas 79912, USA</p>
          <p>1450 Brickell Ave, Suite 2300, Miami, FL 33131, USA</p>
          <p>350 Fifth Avenue, 21st Floor, New York, NY 10118, USA</p>
          <p>Av. Tecnológico 2905, Col. Quintas del Sol, Chihuahua, Chih. 31214, Mexico</p>
          <p>Via Monte Napoleone 8, 20121 Milano, Italy</p>
          <p>Shanghai Tower, 501 Yincheng Middle Rd, Pudong, Shanghai 200120, China</p>
          <p>support@riobridgefinance.com</p>
          <p className="text-muted-foreground">
            Languages: EN · IT · ZH · ES · DE — Currencies: USD · EUR · CNY · MXN · CHF
          </p>
        </Section>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          Copyright © {new Date().getFullYear()} RIO BRIDGE FINANCE. All rights reserved.
        </p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 bg-card border rounded-lg p-5 space-y-3 text-sm text-foreground leading-relaxed">
      <h2 className="text-lg font-semibold" style={{ color: NAV_BG }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
