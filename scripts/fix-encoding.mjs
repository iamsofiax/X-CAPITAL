import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const targets = [
  "frontend/src/app/commerce/page.tsx",
  "frontend/src/app/dashboard/page.tsx",
];

const EM = "\u00e2\u20ac\u201d";
const EN = "\u00e2\u20ac\u201c";
const ELL = "\u00e2\u20ac\u00a6";

const replacements = [
  [ELL, "\u2026"],
  [`0${EN}60`, "0\u201360"],
  [`100${EN}300`, "100\u2013300"],
  [`25${EN}60`, "25\u201360"],
  [`5${EN}7`, "5\u20137"],
  [`Mar 17 ${EN} 23`, "Mar 17 \u2013 23"],
  [`purchase${ELL}`, "purchase\u2026"],
  [` ${EM}`, " \u2014"],
  [EM, "\u2014"],
  [EN, "\u2013"],
  ['"0\u201360"', '"0-60"'],
  [
    "AI-generated trade intelligence \u2014",
    "Live trade intelligence \u2014",
  ],
];

for (const rel of targets) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  text = text.replace(/^\s*imageEmoji:.*,\r?\n/gm, "");
  text = text.replace(/q=70/g, "q=90");
  fs.writeFileSync(file, text, "utf8");
  console.log("fixed:", rel);
}
