import { getStore } from "@netlify/blobs";

const STORE_NAME = "comments";
const BLOB_KEY = "all";

async function getComments() {
  const store = getStore(STORE_NAME);
  const raw = await store.get(BLOB_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function saveComments(comments) {
  const store = getStore(STORE_NAME);
  await store.set(BLOB_KEY, JSON.stringify(comments));
}

export default async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  try {
    if (req.method === "GET") {
      const comments = await getComments();
      return new Response(JSON.stringify(comments), { headers });
    }

    const body = await req.json();

    if (req.method === "POST") {
      const comments = await getComments();
      const newComment = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        section: body.section || "",
        text: body.text || "",
        author: body.author || "匿名",
        createdAt: new Date().toISOString(),
      };
      comments.push(newComment);
      await saveComments(comments);
      return new Response(JSON.stringify(newComment), { status: 201, headers });
    }

    if (req.method === "PUT") {
      const comments = await getComments();
      const idx = comments.findIndex(c => c.id === body.id);
      if (idx === -1) return new Response('{"error":"not found"}', { status: 404, headers });
      comments[idx].text = body.text;
      comments[idx].updatedAt = new Date().toISOString();
      await saveComments(comments);
      return new Response(JSON.stringify(comments[idx]), { headers });
    }

    if (req.method === "DELETE") {
      let comments = await getComments();
      comments = comments.filter(c => c.id !== body.id);
      await saveComments(comments);
      return new Response('{"ok":true}', { headers });
    }

    return new Response('{"error":"method not allowed"}', { status: 405, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/comments" };
