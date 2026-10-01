import { readFileSync, writeFileSync } from "fs";

const html = readFileSync("/tmp/riobridge-site/index.html", "utf-8");

let processed = html;

// ── Color replacements ──────────────────────────────────────────────
// Primary red -> dark navy
processed = processed.replace(/#c10e0e/gi, "#0A2540");
processed = processed.replace(/#9e0b0b/gi, "#06192e");
processed = processed.replace(/#2d8659/gi, "#0A2540"); // theme-color

// Navy sections -> darker navy
processed = processed.replace(/rgba\(69,86,138,1\)/g, "rgba(10,37,64,1)");
processed = processed.replace(/rgba\(10,48,169,0\.41\)/g, "rgba(10,37,64,0.85)");
processed = processed.replace(/#3e4e83/gi, "#0A2540");
processed = processed.replace(/#34416d/gi, "#06192e");

// Gold gradient for buttons / accents
const goldGradient = "linear-gradient(135deg, #D4AF37 0%, #F4C430 50%, #FFD700 100%)";
processed = processed.replace(
  /background: #0A2540; color: white;/g,
  `background: ${goldGradient}; color: #0A2540;`
);

// ── Text replacements ───────────────────────────────────────────────
// Case-insensitive replacement for "Rio Bridge Finance" / "Rio Bridge Finance" / "Zip Bank"
processed = processed.replace(/Rio Bridge Finance/gi, "Rio Bridge Finance");
processed = processed.replace(/Rio Bridge Finance/gi, "Rio Bridge Finance");
processed = processed.replace(/Zip Bank/gi, "Rio Bridge Finance");

// ── Fix absolute links to original domain ─────────────────────────
processed = processed.replace(/https:\/\/vontbn\.online\//g, "/site/");
processed = processed.replace(/https:\/\/vontbn\.online/g, "/site/index.html");

// Update title and meta
processed = processed.replace(/<title>.*?<\/title>/, "<title>Rio Bridge Finance</title>");
processed = processed.replace(
  /<meta name="apple-mobile-web-app-title" content="[^"]*">/,
  '<meta name="apple-mobile-web-app-title" content="Rio Bridge Finance">'
);
processed = processed.replace(
  /<meta name="application-name" content="[^"]*">/,
  '<meta name="application-name" content="Rio Bridge Finance">'
);

writeFileSync("public/site/index.html", processed);
console.log("Processed and wrote public/site/index.html");
