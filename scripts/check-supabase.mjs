#!/usr/bin/env node
/**
 * Verify Supabase URL is reachable (DNS + auth health).
 * Usage: node scripts/check-supabase.mjs
 * Reads NEXT_PUBLIC_SUPABASE_URL from .env.local or environment.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { lookup } from "dns/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadUrl() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
  }
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("No NEXT_PUBLIC_SUPABASE_URL in env and no .env.local");
    process.exit(1);
  }
  const match = readFileSync(envPath, "utf8").match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m);
  if (!match) {
    console.error(".env.local has no NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }
  return match[1].trim();
}

const url = loadUrl();
const host = new URL(url).hostname;
console.log("Supabase URL:", url.replace(/^(https:\/\/[^.]+).*/, "$1.***"));

try {
  await lookup(host);
  console.log("DNS:", host, "→ OK");
} catch {
  console.error("DNS:", host, "→ NOT FOUND (project deleted or wrong URL)");
  process.exit(1);
}

try {
  const res = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: "health-check" },
  });
  console.log("Auth health:", res.status, res.ok ? "OK" : "(check anon key on real requests)");
} catch (e) {
  console.error("HTTP request failed:", e.message);
  process.exit(1);
}
