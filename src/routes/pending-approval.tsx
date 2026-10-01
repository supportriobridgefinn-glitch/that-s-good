import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/pending-approval")({
  head: () => ({
    meta: [
      { title: "Application received | Rio Bridge Finance" },
      {
        name: "description",
        content:
          "Your Rio Bridge Finance account application has been received and is awaiting review by our account team.",
      },
      { property: "og:title", content: "Application received | Rio Bridge Finance" },
      {
        property: "og:description",
        content: "Your account application is awaiting approval by the Rio Bridge team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PendingApproval,
});

function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-app-gradient">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <img
            src="/site/images/rio-bridge-monogram.png"
            alt="Rio Bridge Finance"
            width={72}
            height={72}
            className="h-16 w-16 mx-auto mb-3"
          />
          <CardTitle>Waiting for admin approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground text-center">
          <p>
            Thank you — your application has been received and is now in the review queue. Our
            account team verifies your details before your account is opened.
          </p>
          <ol className="text-left space-y-2 bg-muted/60 rounded-lg p-4">
            <li>
              <b className="text-foreground">1. Received</b> — your details are securely stored.
            </li>
            <li>
              <b className="text-foreground">2. Review</b> — an administrator confirms your
              information.
            </li>
            <li>
              <b className="text-foreground">3. Account created</b> — on approval your account is
              created automatically from the details you submitted, and you'll be given sign-in
              credentials.
            </li>
          </ol>
          <p>You can close this page — we'll contact you at the email address you provided.</p>
          <Link to="/" className="text-primary hover:underline block">
            ← Back to Rio Bridge Finance
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
