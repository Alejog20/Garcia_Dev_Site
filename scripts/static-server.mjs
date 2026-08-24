// Serves the repo root exactly like Vercel would: same files, and the same
// response headers from vercel.json. Used for local dev and by the
// Playwright config, so CSP violations (e.g. a blocked inline script) show
// up in tests instead of only in production.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const vercelConfig = JSON.parse(await readFile(join(ROOT, "vercel.json"), "utf8"));

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// vercel.json's `source` values here are only ever a literal prefix
// followed by the wildcard capture group `(.*)` — not the full path-to-regexp
// syntax Vercel supports. Good enough for these three rules.
function patternToRegExp(pattern) {
  const [prefix, suffix] = pattern.split("(.*)");
  if (suffix === undefined) return new RegExp(`^${escapeRegExp(pattern)}$`);
  return new RegExp(`^${escapeRegExp(prefix)}.*${escapeRegExp(suffix)}$`);
}

const headerRules = vercelConfig.headers.map((rule) => ({
  regex: patternToRegExp(rule.source),
  headers: rule.headers,
}));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let relPath = urlPath === "/" ? "/index.html" : urlPath;
  let filePath = normalize(join(ROOT, relPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);

    for (const rule of headerRules) {
      if (rule.regex.test(urlPath)) {
        for (const h of rule.headers) res.setHeader(h.key, h.value);
      }
    }
    res.setHeader("Content-Type", MIME_TYPES[extname(filePath)] || "application/octet-stream");
    res.writeHead(200);
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`static server with vercel.json headers on http://127.0.0.1:${PORT}`);
});
