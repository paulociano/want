const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    redirect: "follow",
    headers: {
      "Accept": "application/json,text/plain,*/*",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Apps Script returned non-JSON (${response.status}): ${preview}`);
  }

  if (!response.ok) {
    throw new Error(data.error || `Apps Script HTTP ${response.status}`);
  }
  return data;
}

export default async function handler(req, res) {
  try {
    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_TOKEN) {
      return json(res, 503, {
        ok: false,
        error: "Server sync is not configured. Missing APPS_SCRIPT_URL or APPS_SCRIPT_TOKEN."
      });
    }

    const action = String(req.query.action || (req.body && req.body.action) || "get");
    if (!["get", "history", "replace", "workspace", "complete", "experiments", "experiment", "deleteExperiment", "events", "event", "clusters", "createDemand", "supportDemand"].includes(action)) {
      return json(res, 400, { ok: false, error: "Unsupported action" });
    }

    if (req.method === "GET") {
      if (!["get", "history", "workspace", "experiments", "events", "clusters"].includes(action)) {
        return json(res, 405, { ok: false, error: "Action requires POST" });
      }
      const target = new URL(APPS_SCRIPT_URL);
      target.searchParams.set("action", action);
      target.searchParams.set("token", APPS_SCRIPT_TOKEN);
      if (action === "history" || action === "events") {
        target.searchParams.set("limit", String(req.query.limit || 150));
      }
      const data = await fetchJson(target.toString(), { method: "GET" });
      return json(res, 200, data);
    }

    if (req.method === "POST") {
      if (!["replace","complete","experiment","deleteExperiment", "event", "createDemand", "supportDemand"].includes(action)) {
        return json(res, 405, { ok: false, error: "Unsupported POST action" });
      }
      const payload = {
        ...(req.body || {}),
        action,
        token: APPS_SCRIPT_TOKEN
      };
      const data = await fetchJson(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return json(res, 200, data);
    }

    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error("WANT sheets proxy error:", err);
    return json(res, 502, { ok: false, error: String(err && err.message ? err.message : err) });
  }
}
