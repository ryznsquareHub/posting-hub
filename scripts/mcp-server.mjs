#!/usr/bin/env node
/**
 * PostingHub MCP server (stdio)
 *
 * Claude Desktop 에 등록하면 Claude 가 prompt 응답 작성 후
 * `send_to_postinghub` tool 을 자동 호출 → Hook endpoint POST → DB 저장.
 *
 * 등록 (Claude Desktop):
 *   ~/AppData/Roaming/Claude/claude_desktop_config.json (Windows)
 *   ~/Library/Application Support/Claude/claude_desktop_config.json (Mac)
 *
 *   {
 *     "mcpServers": {
 *       "posting-hub": {
 *         "command": "node",
 *         "args": ["D:/2026_workspace/PostingHub/scripts/mcp-server.mjs"],
 *         "env": {
 *           "POSTING_HUB_URL": "https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake",
 *           "POSTING_HUB_SECRET": "phk_dev_f97c9092a46f6ce4c613492c",
 *           "POSTING_HUB_OWNER_ID": "72df2f16-c375-4794-b1fe-1a4299010f14"
 *         }
 *       }
 *     }
 *   }
 *
 * 사용 예 (Claude Desktop 자연어):
 *   "잠실 키즈카페 후기 한 편 써서 PostingHub 에 보내"
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const URL_BASE =
  process.env.POSTING_HUB_URL ||
  "https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake";
const SECRET = process.env.POSTING_HUB_SECRET || "";
const OWNER_ID = process.env.POSTING_HUB_OWNER_ID || "";

const SCHEMA_HINT = `반드시 아래 구조화 형식으로 출력하세요. 다른 설명/대화 줄 절대 추가 X.

#CAMPAIGN: <캠페인 이름 — PostingHub DB 의 캠페인과 정확히 일치>
#PLATFORM: BLOG  (또는 CAFE)
#KIND: 원본  (또는 변형 / 재활용)
#KEYWORDS: kw1, kw2, kw3
#REGION: 지역
#INDUSTRY: 업종
#CTA: 콜투액션 한 줄

제목: 글 제목 한 줄

본문:
본문 — 줄바꿈 그대로 보존.
여러 단락 OK.

여러 글이면 \`---\` 로 구분.`;

const server = new Server(
  { name: "posting-hub", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "send_to_postinghub",
      description:
        "Claude 가 작성한 글을 PostingHub Hook endpoint 로 전송 → intake_events / posts 자동 등록. " +
        "글 본문은 반드시 PostingHub 의 구조화 형식 (#CAMPAIGN / #PLATFORM / #KIND / 제목 / 본문) 으로 작성한 후 raw 인자에 그대로 전달.",
      inputSchema: {
        type: "object",
        properties: {
          raw: {
            type: "string",
            description:
              "구조화 형식 글 본문 전체. 형식 예시:\n" + SCHEMA_HINT,
          },
          campaignHint: {
            type: "string",
            description:
              "(선택) 어느 캠페인용 글인지 — Claude 가 사용자 요청으로부터 추출. PostingHub 의 #CAMPAIGN 라인과 일치하면 매칭됨.",
          },
        },
        required: ["raw"],
      },
    },
    {
      name: "get_format_help",
      description:
        "PostingHub 가 받는 구조화 출력 형식 가이드. 글 쓰기 전 호출해서 형식 확인.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = req.params.arguments ?? {};

  if (name === "get_format_help") {
    return {
      content: [{ type: "text", text: SCHEMA_HINT }],
    };
  }

  if (name === "send_to_postinghub") {
    const raw = String(args.raw ?? "");
    if (!raw.trim()) {
      return {
        isError: true,
        content: [{ type: "text", text: "raw 가 비어 있습니다" }],
      };
    }
    if (!SECRET || !OWNER_ID) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              "POSTING_HUB_SECRET 또는 POSTING_HUB_OWNER_ID 미설정 — Claude Desktop config 의 env 확인",
          },
        ],
      };
    }
    try {
      const r = await fetch(URL_BASE, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + SECRET,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ ownerId: OWNER_ID, raw }),
      });
      const text = await r.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }
      const summary =
        r.ok && parsed.ok
          ? `✅ PostingHub 저장 — intake_events ${parsed.ingested ?? 0}건` +
            (parsed.posts > 0 ? `, posts 자동 등록 ${parsed.posts}건` : "")
          : `❌ HTTP ${r.status} — ${JSON.stringify(parsed).slice(0, 300)}`;
      return {
        content: [{ type: "text", text: summary }],
        isError: !r.ok || !parsed.ok,
      };
    } catch (e) {
      return {
        isError: true,
        content: [
          { type: "text", text: "네트워크 에러: " + (e?.message ?? String(e)) },
        ],
      };
    }
  }

  return {
    isError: true,
    content: [{ type: "text", text: `알 수 없는 tool: ${name}` }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("[posting-hub mcp] ready\n");
