import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("landing page is TSX and renders TokenWatch positioning", () => {
  const source = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /export default function HomePage/);
  assert.match(source, /Keep AI API costs visible/);
  assert.doesNotMatch(source, /^aW1wb3J0/);
});

test("API client uses the public base URL and rejects insecure remote URLs", () => {
  const source = fs.readFileSync(new URL("../lib/api.ts", import.meta.url), "utf8");
  assert.match(source, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(source, /must use HTTPS outside local development/);
  assert.doesNotMatch(source, /tokenwatch-backend\.vercel\.app/);
});
