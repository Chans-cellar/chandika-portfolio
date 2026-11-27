import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../../keystatic.config";

/* Built on first request rather than at import: in production (GitHub mode)
   makeRouteHandler throws when the GitHub App env vars are missing, and that
   would fail the whole site build. Without them only the CMS sign-in is down. */

const REQUIRED = ["KEYSTATIC_GITHUB_CLIENT_ID", "KEYSTATIC_GITHUB_CLIENT_SECRET", "KEYSTATIC_SECRET"];
let handler: ReturnType<typeof makeRouteHandler> | undefined;

function get(): ReturnType<typeof makeRouteHandler> | Response {
  if (process.env.NODE_ENV !== "development") {
    const missing = REQUIRED.filter((k) => !process.env[k]);
    if (missing.length) {
      return new Response(`Keystatic is not configured yet. Missing env vars: ${missing.join(", ")}`, { status: 503 });
    }
  }
  return (handler ??= makeRouteHandler({ config }));
}

export async function GET(request: Request) {
  const h = get();
  return h instanceof Response ? h : h.GET(request);
}

export async function POST(request: Request) {
  const h = get();
  return h instanceof Response ? h : h.POST(request);
}
