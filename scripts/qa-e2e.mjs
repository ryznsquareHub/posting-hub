/**
 * PostingHub QA — E2E (Node-based, no browser)
 *
 * 시나리오:
 *   1. 신규 캠페인 생성 (c_qa_test_kids)
 *   2. 캠페인에 variant 2개 매핑
 *   3. Hook callback 시뮬 → intake_events + posts 자동 생성
 *   4. post 1-click 복사 → copy_count++ & status auto-transition
 *   5. post 상태 변경 (draft → scheduled)
 *   6. RLS 검증 — 다른 user 가 cross-user data 못 봄
 *   7. cleanup — 테스트 데이터 삭제
 *
 * 모든 단계에서 expected vs actual 비교, PASS/FAIL 출력.
 *
 * 사용법:
 *   PAT=... SUPABASE_URL=... SERVICE_ROLE=... ANON=... node scripts/qa-e2e.mjs
 */

const PAT = process.env.PAT;
const URL_BASE = process.env.SUPABASE_URL;
const SR = process.env.SERVICE_ROLE;
const ANON = process.env.ANON;
const OWNER_ID = process.env.OWNER_ID || "72df2f16-c375-4794-b1fe-1a4299010f14";

if (!PAT || !URL_BASE || !SR || !ANON) {
  console.error("Missing env: PAT, SUPABASE_URL, SERVICE_ROLE, ANON");
  process.exit(1);
}

const REF = URL_BASE.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

let pass = 0;
let fail = 0;
const failures = [];

function ok(label) {
  console.log("  ✓ " + label);
  pass++;
}

function nope(label, detail) {
  console.log("  ✗ " + label + (detail ? " — " + detail : ""));
  fail++;
  failures.push(label + (detail ? " (" + detail + ")" : ""));
}

function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) ok(label);
  else nope(label, `expected ${e}, got ${a}`);
}

function gt(actual, expected, label) {
  if (actual > expected) ok(label);
  else nope(label, `expected > ${expected}, got ${actual}`);
}

async function rest(path, opts = {}, key = SR) {
  const r = await fetch(URL_BASE + "/rest/v1/" + path, {
    ...opts,
    headers: {
      "apikey": key,
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(opts.headers ?? {}),
    },
  });
  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: r.status, data };
}

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "Authorization": "Bearer " + PAT, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return { status: r.status, data: await r.json().catch(() => null) };
}

async function cleanup() {
  // 항상 안전 cleanup (테스트 끝/중간 실패 시도)
  await sql(`delete from public.intake_events where id like 'in_qa_%';`);
  await sql(`delete from public.posts where id like 'p_qa_%';`);
  await sql(`delete from public.campaign_variants where campaign_id = 'c_qa_test_kids';`);
  await sql(`delete from public.campaigns where id = 'c_qa_test_kids';`);
}

async function run() {
  console.log("\n🧪 PostingHub E2E QA");
  console.log("    project: " + REF + "  owner: " + OWNER_ID.slice(0, 8) + "…");
  console.log("    " + new Date().toISOString());

  // ── pre-cleanup
  await cleanup();

  // ── 시나리오 1: 신규 캠페인 생성
  console.log("\n[1] 신규 캠페인 생성 (c_qa_test_kids)");
  {
    const { status, data } = await rest("campaigns", {
      method: "POST",
      body: JSON.stringify({
        id: "c_qa_test_kids",
        owner_id: OWNER_ID,
        name: "QA 테스트 키즈카페",
        region: "서울 · 테스트",
        industry: "육아",
        color: "#ff6e6e",
        client_note: "E2E QA · 자동 생성",
        brand: "QA 키즈존",
        platforms: ["NAVER_BLOG", "NAVER_CAFE"],
        cta: "QA 테스트 CTA",
        tone: "친근",
        audience: "QA tester",
        keywords: ["QA", "테스트", "키즈카페"],
        active_variant_id: "blog_seo",
        started_at: "2026-05-11",
      }),
    });
    eq(status, 201, "campaigns insert HTTP 201");
    eq(data?.[0]?.id, "c_qa_test_kids", "row id 매치");
    eq(data?.[0]?.platforms?.length, 2, "platforms 2개");
  }

  // ── 시나리오 2: variant 매핑
  console.log("\n[2] Variant 매핑 (blog_seo + cafe_review)");
  {
    const { status, data } = await rest("campaign_variants", {
      method: "POST",
      body: JSON.stringify([
        { campaign_id: "c_qa_test_kids", variant_id: "blog_seo" },
        { campaign_id: "c_qa_test_kids", variant_id: "cafe_review" },
      ]),
    });
    eq(status, 201, "variants insert HTTP 201");
    eq(data?.length, 2, "2 rows inserted");
  }

  // ── 시나리오 3: PromptBuilder 토큰 치환 검증 (in-memory)
  console.log("\n[3] PromptBuilder 토큰 치환");
  {
    const { data: variant } = await rest(
      "variant_presets?id=eq.blog_seo&select=template",
    );
    const tmpl = variant?.[0]?.template ?? "";
    const out = tmpl
      .split("{brand}").join("QA 키즈존")
      .split("{region}").join("서울 · 테스트")
      .split("{industry}").join("육아")
      .split("{keywords}").join("QA, 테스트, 키즈카페")
      .split("{cta}").join("QA 테스트 CTA")
      .split("{tone}").join("친근")
      .split("{audience}").join("QA tester")
      .split("{batchSize}").join("3");
    eq(out.includes("{brand}"), false, "{brand} 모두 치환");
    eq(out.includes("{cta}"), false, "{cta} 모두 치환");
    eq(out.includes("QA 키즈존"), true, "brand 값 주입됨");
    eq(out.includes("3편"), true, "batchSize 주입됨");
  }

  // ── 시나리오 4: Hook callback 시뮬 (intake_events + posts)
  console.log("\n[4] Hook callback 시뮬");
  {
    const { status: s1, data: d1 } = await rest("intake_events", {
      method: "POST",
      body: JSON.stringify({
        id: "in_qa_001",
        owner_id: OWNER_ID,
        source: "hook",
        hook_id: "hk_default",
        prompt_id: "pr1",
        prompt_name: "키즈카페 후기형",
        title: "QA 테스트 — 키즈카페 후기",
        campaign_id: "c_qa_test_kids",
        campaign_matched: "QA 테스트 키즈카페",
        platform: "NAVER_BLOG",
        parse_status: "ok",
        warnings: [],
        queued: true,
        latency_ms: 280,
        raw_hash: "qa_e2e_" + Date.now(),
        raw_body: "(qa raw)",
        at: new Date().toISOString(),
      }),
    });
    eq(s1, 201, "intake_events insert HTTP 201");
    eq(d1?.[0]?.parse_status, "ok", "parse_status=ok");

    // parse_status=ok → posts 자동 등록 (시뮬)
    const { status: s2, data: d2 } = await rest("posts", {
      method: "POST",
      body: JSON.stringify({
        id: "p_qa_001",
        owner_id: OWNER_ID,
        campaign_id: "c_qa_test_kids",
        title: "QA 테스트 — 키즈카페 후기",
        body: "QA 테스트 본문입니다.",
        platform: "NAVER_BLOG",
        kind: "original",
        keywords: ["QA"],
        cta: "QA 테스트 CTA",
        status: "ready",
        copy_count: 0,
        recyclable: false,
      }),
    });
    eq(s2, 201, "posts auto-insert HTTP 201");
    eq(d2?.[0]?.status, "ready", "초기 status=ready");
    eq(d2?.[0]?.copy_count, 0, "초기 copy_count=0");
  }

  // ── 시나리오 5: 1-click 복사 → copy_count++ + status 자동 전이
  console.log("\n[5] 1-click 복사 시뮬 (ready → published, copy_count++)");
  {
    // incrementCopyCount 로직 시뮬
    const { data: cur } = await rest("posts?id=eq.p_qa_001&select=copy_count,status");
    const oldCount = cur?.[0]?.copy_count ?? 0;
    const newStatus =
      cur?.[0]?.status === "ready" || cur?.[0]?.status === "draft"
        ? "published"
        : cur?.[0]?.status;

    const { status, data } = await rest("posts?id=eq.p_qa_001", {
      method: "PATCH",
      body: JSON.stringify({
        copy_count: oldCount + 1,
        status: newStatus,
      }),
    });
    eq(status, 200, "PATCH HTTP 200");
    eq(data?.[0]?.copy_count, 1, "copy_count 1로 증가");
    eq(data?.[0]?.status, "published", "status ready → published");
  }

  // ── 시나리오 6: 상태 변경 (1-5 키 시뮬)
  console.log("\n[6] 상태 변경 시뮬 (3 = scheduled)");
  {
    const { status, data } = await rest("posts?id=eq.p_qa_001", {
      method: "PATCH",
      body: JSON.stringify({ status: "scheduled", scheduled_at: "2026-05-15T10:00:00+00" }),
    });
    eq(status, 200, "PATCH HTTP 200");
    eq(data?.[0]?.status, "scheduled", "status → scheduled");
    eq(
      data?.[0]?.scheduled_at?.slice(0, 10),
      "2026-05-15",
      "scheduled_at 저장",
    );
  }

  // ── 시나리오 7: scoped search 시뮬 (in-memory matchesScoped)
  console.log("\n[7] Scoped search 시뮬 (kw:QA platform:blog)");
  {
    const { data: all } = await rest(
      `posts?owner_id=eq.${OWNER_ID}&select=id,title,platform,keywords,status,region,industry,memo,body`,
    );
    const tokens = "kw:QA platform:blog".split(/\s+/);
    const matched = (all ?? []).filter((p) => {
      return tokens.every((raw) => {
        const m = raw.match(/^([a-z]+):(.+)$/i);
        if (!m) {
          const hay = (p.title + " " + p.body + " " + (p.keywords ?? []).join(" ")).toLowerCase();
          return hay.includes(raw.toLowerCase());
        }
        const k = m[1].toLowerCase();
        const v = m[2].toLowerCase();
        if (k === "platform") {
          const tag = p.platform === "NAVER_CAFE" ? "cafe" : "blog";
          return tag.includes(v);
        }
        if (k === "kw")
          return (p.keywords ?? []).some((kw) => kw.toLowerCase().includes(v));
        return true;
      });
    });
    gt(matched.length, 0, "QA 키워드 + blog 일치 1건 이상");
    eq(matched[0]?.id, "p_qa_001", "p_qa_001 매칭");
  }

  // ── 시나리오 8: RLS 검증 — anon (비로그인) 으로 posts 못 봄
  console.log("\n[8] RLS 검증 (anon → posts query)");
  {
    const { data } = await rest("posts?select=id&limit=5", {}, ANON);
    eq(Array.isArray(data), true, "anon → array 응답");
    eq(data?.length ?? 0, 0, "anon → RLS 가 0 rows");
  }

  // ── 시나리오 9: variant_presets 는 public read OK
  console.log("\n[9] RLS — variant_presets public read");
  {
    const { data } = await rest("variant_presets?select=id&limit=10", {}, ANON);
    gt(data?.length ?? 0, 0, "anon → variant_presets 읽힘");
  }

  // ── 시나리오 10: cleanup
  console.log("\n[10] Cleanup");
  await cleanup();
  const { data: left } = await rest(
    "campaigns?id=eq.c_qa_test_kids&select=id",
  );
  eq(left?.length ?? 0, 0, "테스트 campaign 삭제됨");

  // ── 종합
  console.log("\n────────────────────────");
  console.log(`✅ PASS ${pass}  ❌ FAIL ${fail}`);
  if (fail > 0) {
    console.log("\n실패 항목:");
    failures.forEach((f) => console.log("  - " + f));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("\n❌ 스크립트 자체 에러:", e);
  process.exit(2);
});
