/**
 * Remote MCP server (HTTP / streamable HTTP) — Claude.ai Connectors 호환.
 *
 * Endpoint: https://posting-hub.vercel.app/api/mcp
 * Auth:     Authorization: Bearer <HOOK_SHARED_SECRET>
 *
 * Claude.ai → Settings / Connectors → Add custom connector →
 *   URL: https://posting-hub.vercel.app/api/mcp
 *   Auth: Bearer phk_dev_f97c9092a46f6ce4c613492c
 *
 * 그러면 claude.ai 가 자연어 요청 시 send_to_postinghub 를 자동 호출.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// Vercel Dashboard 에서 사용자가 큰따옴표 포함해 저장한 경우를 방어
function envClean(v: string | undefined): string {
  if (!v) return "";
  let s = v.trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    s = s.slice(1, -1);
  }
  return s;
}

const HOOK_URL =
  envClean(process.env.POSTING_HUB_URL) ||
  "https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake";
const SECRET =
  envClean(process.env.POSTING_HUB_SECRET) ||
  envClean(process.env.HOOK_SHARED_SECRET);
const OWNER_ID = envClean(process.env.POSTING_HUB_OWNER_ID);

const SCHEMA_HINT = `반드시 아래 구조화 형식으로 출력하세요. 다른 설명/대화 줄 절대 추가 X.

#CAMPAIGN: <캠페인 이름 — PostingHub DB 와 정확히 일치>
#PLATFORM: BLOG  (또는 CAFE)
#KIND: 원본  (또는 변형 / 재활용)
#KEYWORDS: kw1, kw2, kw3
#REGION: 지역
#INDUSTRY: 업종
#CTA: 한 줄

제목: 한 줄

본문:
본문 — 줄바꿈 그대로 보존. 여러 단락 OK.

여러 글이면 \`---\` 로 구분.`;

const TOOLS = [
  {
    name: "send_to_postinghub",
    description:
      "사용자가 작성을 요청한 콘텐츠 (블로그/카페 후기 등) 를 PostingHub 의 운영 큐에 등록한다. " +
      "raw 인자에는 반드시 #CAMPAIGN / #PLATFORM / #KIND / #KEYWORDS / #REGION / #INDUSTRY / #CTA + 제목 + 본문 형식 문자열을 그대로 담아 전달한다.",
    inputSchema: {
      type: "object",
      properties: {
        raw: {
          type: "string",
          description:
            "PostingHub 구조화 형식 글 본문 전체. 형식 예시:\n" + SCHEMA_HINT,
        },
      },
      required: ["raw"],
    },
  },
  {
    name: "get_format_help",
    description:
      "PostingHub 가 받는 구조화 출력 형식 가이드. 글 쓰기 전 호출해서 형식 확인 가능.",
    inputSchema: { type: "object", properties: {} },
  },
];

interface JsonRpcReq {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function rpcOk(id: string | number | null | undefined, result: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result };
}
function rpcErr(id: string | number | null | undefined, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for browser-based MCP clients
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization, content-type, mcp-protocol-version, mcp-session-id",
  );

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") {
    // Some clients probe with GET — return server info
    return res.json({
      ok: true,
      name: "posting-hub",
      version: "0.1.0",
      transport: "streamable-http",
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // Auth — Bearer header (Claude Desktop) 또는 URL query token (claude.ai web Custom Connector)
  const auth = String(req.headers["authorization"] ?? "");
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1];
  const q = req.query ?? {};
  const queryToken = String(
    (q as Record<string, unknown>).t ??
      (q as Record<string, unknown>).token ??
      (q as Record<string, unknown>).key ??
      "",
  );
  const provided = bearer || queryToken;
  if (!SECRET || provided !== SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const body = (req.body ?? {}) as JsonRpcReq;
  const method = body.method ?? "";
  const id = body.id;

  if (method === "initialize") {
    return res.json(
      rpcOk(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "posting-hub", version: "0.1.0" },
      }),
    );
  }

  if (method === "notifications/initialized") {
    return res.status(204).end();
  }

  if (method === "tools/list") {
    return res.json(rpcOk(id, { tools: TOOLS }));
  }

  if (method === "tools/call") {
    const { name, arguments: args } = (body.params ?? {}) as {
      name?: string;
      arguments?: Record<string, unknown>;
    };

    if (name === "get_format_help") {
      return res.json(
        rpcOk(id, {
          content: [{ type: "text", text: SCHEMA_HINT }],
        }),
      );
    }

    if (name === "send_to_postinghub") {
      const raw = String(args?.raw ?? "");
      if (!raw.trim()) {
        return res.json(
          rpcOk(id, {
            isError: true,
            content: [{ type: "text", text: "raw 가 비어 있습니다" }],
          }),
        );
      }
      if (!OWNER_ID) {
        return res.json(
          rpcOk(id, {
            isError: true,
            content: [{ type: "text", text: "POSTING_HUB_OWNER_ID 미설정" }],
          }),
        );
      }
      try {
        const r = await fetch(HOOK_URL, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + SECRET,
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({ ownerId: OWNER_ID, raw }),
        });
        const text = await r.text();
        let parsed: { ok?: boolean; ingested?: number; posts?: number } & Record<string, unknown>;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { raw: text };
        }
        const summary =
          r.ok && parsed.ok
            ? `✅ PostingHub 저장 — intake_events ${parsed.ingested ?? 0}건` +
              ((parsed.posts ?? 0) > 0 ? `, posts ${parsed.posts}건` : "")
            : `❌ HTTP ${r.status} — ${JSON.stringify(parsed).slice(0, 300)}`;
        return res.json(
          rpcOk(id, {
            content: [{ type: "text", text: summary }],
            isError: !r.ok || !parsed.ok,
          }),
        );
      } catch (e) {
        return res.json(
          rpcOk(id, {
            isError: true,
            content: [
              {
                type: "text",
                text: "네트워크 에러: " + ((e as Error)?.message ?? String(e)),
              },
            ],
          }),
        );
      }
    }

    return res.json(rpcErr(id, -32601, `알 수 없는 tool: ${name}`));
  }

  return res.json(rpcErr(id, -32601, `Method not found: ${method}`));
}
