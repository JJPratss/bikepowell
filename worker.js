// BikePowell Worker
// Handles GET (read all businesses) and POST (add a business)
// Deploy with: wrangler deploy

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
};

export default {
  async fetch(request, env) {
    // Preflight for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // ── GET /businesses ──────────────────────────────────────
    // Returns the full list as JSON. Public, no auth required.
    if (request.method === "GET" && url.pathname === "/businesses") {
      const stored = await env.BUSINESSES.get("list");
      const list = stored ? JSON.parse(stored) : [];
      return new Response(JSON.stringify(list), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── POST /businesses ─────────────────────────────────────
    // Adds a new business. Requires X-Admin-Password header.
    if (request.method === "POST" && url.pathname === "/businesses") {
      const password = request.headers.get("X-Admin-Password");
      if (password !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Validate required fields
      const { name, type, address, accessible } = body;
      if (!name || !type || !address || accessible === undefined) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, type, address, accessible" }), {
          status: 400,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      // Load existing list, append, save back
      const stored = await env.BUSINESSES.get("list");
      const list = stored ? JSON.parse(stored) : [];
      const newEntry = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type: type.trim(),
        address: address.trim(),
        accessible: Boolean(accessible),
        added: new Date().toISOString(),
      };
      list.push(newEntry);
      await env.BUSINESSES.put("list", JSON.stringify(list));

      return new Response(JSON.stringify({ success: true, entry: newEntry }), {
        status: 201,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // ── DELETE /businesses/:id ────────────────────────────────
    // Removes a business by ID. Requires X-Admin-Password header.
    const deleteMatch = url.pathname.match(/^\/businesses\/([a-f0-9-]+)$/);
    if (request.method === "DELETE" && deleteMatch) {
      const password = request.headers.get("X-Admin-Password");
      if (password !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      const id = deleteMatch[1];
      const stored = await env.BUSINESSES.get("list");
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(b => b.id !== id);

      if (filtered.length === list.length) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      await env.BUSINESSES.put("list", JSON.stringify(filtered));
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
