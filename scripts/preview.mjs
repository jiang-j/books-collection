// Lightweight Markdown preview server for the books-collection docs.
// Renders README.md (or any *.md via ?file=) to HTML on each request so
// edits show up on refresh. No build step required.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, resolve } from "node:path";
import MarkdownIt from "markdown-it";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body { max-width: 900px; margin: 0 auto; padding: 2rem 1.25rem 4rem;
    font: 16px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif; }
  h1, h2 { border-bottom: 1px solid #8884; padding-bottom: .3em; margin-top: 1.8em; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  code { background: #8882; padding: .15em .35em; border-radius: 4px; }
  ul { padding-left: 1.4em; }
  li { margin: .25em 0; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// Guard against path traversal: only allow *.md inside ROOT.
function safeMarkdownPath(fileParam) {
  const rel = normalize(fileParam).replace(/^(\.\.(\/|\\|$))+/, "");
  const abs = join(ROOT, rel);
  if (!abs.startsWith(ROOT) || !abs.toLowerCase().endsWith(".md")) return null;
  return abs;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const fileParam = url.searchParams.get("file") || "README.md";
    const abs = safeMarkdownPath(fileParam);
    if (!abs) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("Invalid file");
      return;
    }
    const source = await readFile(abs, "utf8");
    const html = md.render(source);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(page(fileParam, html));
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Error rendering markdown: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Markdown preview server running at http://${HOST}:${PORT}/`);
});
