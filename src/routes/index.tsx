import { createFileRoute } from "@tanstack/react-router";
import { MarketingHome } from "@/components/MarketingHome";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rio Bridge Finance" },
      { name: "description", content: "Personal Loans, Business Loans and Flexible Financing" },
      { property: "og:title", content: "Rio Bridge Finance" },
      {
        property: "og:description",
        content: "Personal Loans, Business Loans and Flexible Financing",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <MarketingHome />;
}
