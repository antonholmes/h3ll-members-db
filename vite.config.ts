import type { IncomingHttpHeaders } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function apiDev(): Plugin {
  return {
    name: "api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const match = url.pathname.match(/^\/api\/([a-z-]+)$/);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          const method = req.method ?? "GET";
          const handler = mod[method];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(
            req.headers as IncomingHttpHeaders,
          )) {
            if (typeof v === "string") headers.set(k, v);
          }
          const hasBody = method !== "GET" && method !== "HEAD";
          const request = new Request(url, {
            method,
            headers,
            body: hasBody ? Buffer.concat(chunks) : undefined,
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach(
            (v, k) => k !== "set-cookie" && res.setHeader(k, v),
          );
          const cookies = response.headers.getSetCookie();
          if (cookies.length) res.setHeader("set-cookie", cookies);
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String(e));
          res.statusCode = 500;
          res.end("Server error");
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env))
    if (process.env[k] === undefined) process.env[k] = v;
  return { plugins: [react(), tailwindcss(), apiDev()] };
});
