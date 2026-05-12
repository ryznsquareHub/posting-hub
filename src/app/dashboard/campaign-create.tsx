import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { useCreateCampaign } from "@/features/campaigns/useCreateCampaign";

const CC_COLORS = [
  "#f5a524",
  "#e2654a",
  "#5e80f5",
  "#3acc81",
  "#a385ff",
  "#6e7af0",
  "#f06da5",
  "#43c7c2",
  "#d97cf4",
  "#7bcf52",
];

const CC_INDUSTRIES = [
  "미용",
  "F&B",
  "의료",
  "육아",
  "헬스/PT",
  "교육",
  "여행",
  "리테일",
  "부동산",
  "법률",
];

const CC_TONES = [
  { key: "friendly", label: "친근", sub: "솔직 · 일상" },
  { key: "info", label: "정보", sub: "비교 · 가격" },
  { key: "experience", label: "체험단", sub: "긍정 70%" },
  { key: "mom", label: "맘카페", sub: "질문답·후기" },
  { key: "seo", label: "SEO", sub: "키워드 강조" },
];

const CC_CTA_KINDS = [
  { key: "phone", label: "전화" },
  { key: "kakao", label: "카카오톡" },
  { key: "naver", label: "네이버 톡톡" },
  { key: "insta", label: "인스타 DM" },
  { key: "none", label: "없음" },
];

const CC_PROMPT_PRESETS = [
  {
    id: "blog_review",
    name: "블로그 SEO 후기형",
    platform: "NAVER_BLOG" as const,
    hint: "키워드 4-6회 · H2 3개",
  },
  {
    id: "cafe_mom",
    name: "맘카페 자연형",
    platform: "NAVER_CAFE" as const,
    hint: "과장광고 금지 · 짧은 단락",
  },
  {
    id: "experience",
    name: "체험단 스타일",
    platform: "NAVER_BLOG" as const,
    hint: "긍정 70% + 작은 단점 1개",
  },
  {
    id: "compare",
    name: "가성비 비교형",
    platform: "NAVER_CAFE" as const,
    hint: "3-5곳 비교 · 표 형태",
  },
  {
    id: "short",
    name: "짧은 후기형",
    platform: "NAVER_CAFE" as const,
    hint: "3-4문장 · 즉시 발행용",
  },
  {
    id: "medical",
    name: "의료 가이드형",
    platform: "NAVER_BLOG" as const,
    hint: "개인 경험만 · 단정 금지",
  },
];
type PresetId = (typeof CC_PROMPT_PRESETS)[number]["id"];

interface FormState {
  name: string;
  color: string;
  region: string;
  industry: string;
  clientNote: string;
  platforms: { blog: boolean; cafe: boolean };
  tone: string;
  keywords: string[];
  cta: string;
  ctaKind: string;
  variants: Record<PresetId, boolean>;
  postsPerRun: number;
  hookEnabled: boolean;
}

const ccDefault = (): FormState => ({
  name: "",
  color: CC_COLORS[0],
  region: "",
  industry: "",
  clientNote: "",
  platforms: { blog: true, cafe: true },
  tone: "friendly",
  keywords: [],
  cta: "",
  ctaKind: "phone",
  variants: {
    blog_review: true,
    cafe_mom: true,
    experience: false,
    compare: false,
    short: false,
    medical: false,
  },
  postsPerRun: 3,
  hookEnabled: true,
});

export default function CampaignCreatePage() {
  const nav = useNavigate();
  const createMut = useCreateCampaign();

  const [f, setF] = useState<FormState>(ccDefault());
  const [kw, setKw] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<PresetId>("blog_review");
  const [hookId] = useState(
    () => "phk_" + Math.random().toString(36).slice(2, 10),
  );
  const [hookSecret, setHookSecret] = useState(
    () =>
      "phk_" +
      Math.random().toString(36).slice(2, 6) +
      "•••••••••" +
      Math.random().toString(36).slice(2, 6),
  );
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  function setNested<K extends "platforms" | "variants">(
    k: K,
    sub: string,
    v: boolean,
  ) {
    setF((prev) => ({ ...prev, [k]: { ...(prev[k] as object), [sub]: v } } as FormState));
  }

  function addKeyword(raw: string) {
    const cleaned = raw.trim().replace(/^#/, "");
    if (!cleaned) return;
    if (f.keywords.includes(cleaned)) return;
    setF((prev) => ({ ...prev, keywords: [...prev.keywords, cleaned] }));
    setKw("");
  }
  function removeKeyword(k: string) {
    set("keywords", f.keywords.filter((x) => x !== k));
  }
  function onKwKey(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addKeyword(kw);
    } else if (e.key === "Backspace" && !kw && f.keywords.length) {
      removeKeyword(f.keywords[f.keywords.length - 1]);
    }
  }

  const selectedVariantIds = useMemo(
    () =>
      (Object.entries(f.variants) as [PresetId, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k),
    [f.variants],
  );

  useEffect(() => {
    if (!selectedVariantIds.includes(selectedVariant) && selectedVariantIds[0]) {
      setSelectedVariant(selectedVariantIds[0]);
    }
  }, [selectedVariantIds, selectedVariant]);

  const checks = [
    { id: "name", label: "업체명", ok: !!f.name.trim() },
    { id: "region", label: "지역", ok: !!f.region.trim() },
    { id: "industry", label: "업종", ok: !!f.industry },
    {
      id: "plat",
      label: "플랫폼 1개 이상",
      ok: f.platforms.blog || f.platforms.cafe,
    },
    {
      id: "kw",
      label: "키워드 2개 이상",
      ok: f.keywords.length >= 2,
    },
    {
      id: "variant",
      label: "Variant 1개 이상",
      ok: selectedVariantIds.length > 0,
    },
  ];
  const passed = checks.filter((c) => c.ok).length;
  const canCreate = passed === checks.length && !createMut.isPending;

  const platformLine =
    [
      f.platforms.blog && "NAVER_BLOG",
      f.platforms.cafe && "NAVER_CAFE",
    ]
      .filter(Boolean)
      .join(" + ") || "(미선택)";

  const generatedPrompt = useMemo(
    () => buildPrompt(f, selectedVariant),
    [f, selectedVariant],
  );

  function copyPrompt() {
    navigator.clipboard?.writeText(generatedPrompt).catch(() => undefined);
    toast.success("프롬프트 복사됨");
  }
  function copyHook() {
    navigator.clipboard
      ?.writeText(`https://hub.posting/intake/${hookId.slice(4)}`)
      .catch(() => undefined);
    toast.success("Hook URL 복사됨");
  }

  // Cancel on Esc / Cmd+Enter to create
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "Escape") {
        if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
        nav(-1);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canCreate) {
        e.preventDefault();
        handleCreate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreate]);

  async function handleCreate() {
    if (!canCreate) return;
    const slug = (f.name || "campaign")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24);
    const id = "c_" + slug + "_" + Math.random().toString(36).slice(2, 6);
    const platforms: ("NAVER_BLOG" | "NAVER_CAFE")[] = [
      f.platforms.blog && "NAVER_BLOG",
      f.platforms.cafe && "NAVER_CAFE",
    ].filter(Boolean) as ("NAVER_BLOG" | "NAVER_CAFE")[];
    try {
      await createMut.mutateAsync({
        id,
        name: f.name.trim(),
        region: f.region.trim() || undefined,
        industry: f.industry || undefined,
        color: f.color,
        clientNote: f.clientNote.trim() || undefined,
        brand: f.name.trim(),
        platforms,
        cta: f.cta.trim() || undefined,
        tone: f.tone,
        keywords: f.keywords,
        startedAt: new Date().toISOString().slice(0, 10),
      });
      toast.success(`${f.name} 캠페인 생성됨`);
      nav(`/dashboard/campaign/${id}`);
    } catch (e) {
      toast.error((e as Error).message ?? "캠페인 생성 실패");
    }
  }

  return (
    <div className="cc-page">
      <div className="cc-head">
        <div className="cc-head-l">
          <button className="cc-back" onClick={() => nav(-1)}>
            <I.Chevron size={11} style={{ transform: "rotate(180deg)" }} />
            <span>Cancel</span>
          </button>
          <span className="cc-head-div" />
          <div className="cc-head-title">
            <span className="cc-head-eyebrow">New campaign</span>
            <span className="cc-head-name">
              {f.name || <span className="dim">업체명 미입력</span>}
            </span>
          </div>
        </div>
        <div className="cc-head-r">
          <div className="cc-progress">
            {checks.map((c) => (
              <div
                key={c.id}
                className={"cc-prog-dot " + (c.ok ? "ok" : "")}
                title={c.label}
              />
            ))}
            <span className="cc-prog-text mono">
              {passed}/{checks.length}
            </span>
          </div>
          <button className="btn-ghost" onClick={() => nav(-1)}>
            취소
          </button>
          <button
            className={"btn-primary " + (canCreate ? "" : "disabled")}
            onClick={handleCreate}
            disabled={!canCreate}
          >
            <I.Plus size={11} />
            <span>{createMut.isPending ? "생성 중…" : "생성 후 열기"}</span>
            <span className="kbd">⌘↵</span>
          </button>
        </div>
      </div>

      <div className="cc-body">
        {/* LEFT: Form */}
        <div className="cc-form">
          <Section
            index="01"
            title="기본 정보"
            hint="캠페인을 사이드바에서 빠르게 식별하는 정보"
          >
            <Field
              label="업체명"
              required
              ok={!!f.name.trim()}
              hint="예: 잠실 키즈카페"
            >
              <input
                ref={nameRef}
                className="cc-input lg"
                value={f.name}
                placeholder="잠실 키즈카페"
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="색상" hint="사이드바 · 리스트 · 도트 색">
              <div className="cc-swatches">
                {CC_COLORS.map((c) => (
                  <button
                    key={c}
                    className={"cc-swatch " + (f.color === c ? "on" : "")}
                    style={{ background: c }}
                    onClick={() => set("color", c)}
                    title={c}
                  />
                ))}
              </div>
            </Field>
            <div className="cc-row-2">
              <Field
                label="지역"
                required
                ok={!!f.region.trim()}
                hint="시 · 구/동"
              >
                <input
                  className="cc-input"
                  value={f.region}
                  placeholder="서울 · 송파"
                  onChange={(e) => set("region", e.target.value)}
                />
                <div className="cc-suggest">
                  {[
                    "서울 · 강남",
                    "서울 · 잠실",
                    "서울 · 마곡",
                    "경기 · 분당",
                    "경기 · 수원",
                    "경기 · 다산",
                    "충북 · 청주",
                    "부산 · 해운대",
                  ].map((r) => (
                    <button
                      key={r}
                      className="cc-chip ghost"
                      onClick={() => set("region", r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="업종" required ok={!!f.industry}>
                <div className="cc-chips-wrap">
                  {CC_INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      className={"cc-chip " + (f.industry === ind ? "on" : "")}
                      onClick={() => set("industry", ind)}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field
              label="클라이언트 메모"
              hint="선택 · 프롬프트 마지막에 자동 삽입"
            >
              <textarea
                className="cc-textarea"
                value={f.clientNote}
                rows={2}
                placeholder="예: 평일 노출 강화 · 만 3~7세 위주 · 컷펌 8만원 프로모션"
                onChange={(e) => set("clientNote", e.target.value)}
              />
            </Field>
          </Section>

          <Section
            index="02"
            title="콘텐츠 전략"
            hint="이 캠페인의 모든 글이 따를 톤 · 키워드 · CTA"
          >
            <Field
              label="플랫폼"
              required
              ok={f.platforms.blog || f.platforms.cafe}
            >
              <div className="cc-plat">
                <label
                  className={"cc-plat-card " + (f.platforms.blog ? "on" : "")}
                >
                  <input
                    type="checkbox"
                    checked={f.platforms.blog}
                    onChange={(e) =>
                      setNested("platforms", "blog", e.target.checked)
                    }
                  />
                  <div className="cc-plat-name">Naver Blog</div>
                  <div className="cc-plat-sub">긴 후기 · SEO · H2 구조</div>
                </label>
                <label
                  className={"cc-plat-card " + (f.platforms.cafe ? "on" : "")}
                >
                  <input
                    type="checkbox"
                    checked={f.platforms.cafe}
                    onChange={(e) =>
                      setNested("platforms", "cafe", e.target.checked)
                    }
                  />
                  <div className="cc-plat-name">Naver Cafe</div>
                  <div className="cc-plat-sub">짧은 후기 · 맘카페 톤</div>
                </label>
              </div>
            </Field>
            <Field label="기본 톤" hint="개별 글마다 덮어쓰기 가능">
              <div className="cc-tones">
                {CC_TONES.map((t) => (
                  <button
                    key={t.key}
                    className={"cc-tone " + (f.tone === t.key ? "on" : "")}
                    onClick={() => set("tone", t.key)}
                  >
                    <div className="cc-tone-name">{t.label}</div>
                    <div className="cc-tone-sub">{t.sub}</div>
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label="키워드"
              required
              ok={f.keywords.length >= 2}
              hint={`Enter · , · Space 로 추가 · 2개 이상 권장 (${f.keywords.length})`}
            >
              <div className="cc-kw-input">
                {f.keywords.map((k) => (
                  <span key={k} className="cc-kw-chip">
                    <span>#{k}</span>
                    <button
                      className="cc-kw-x"
                      onClick={() => removeKeyword(k)}
                    >
                      <I.X size={9} />
                    </button>
                  </span>
                ))}
                <input
                  className="cc-kw-text"
                  value={kw}
                  placeholder={
                    f.keywords.length ? "" : "키워드 입력 후 Enter"
                  }
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setKw(e.target.value)
                  }
                  onKeyDown={onKwKey}
                />
              </div>
              {f.industry && (
                <div className="cc-suggest">
                  <span className="cc-suggest-l">추천</span>
                  {getKwSuggestions(f.industry, f.region).map((k) => (
                    <button
                      key={k}
                      className="cc-chip ghost"
                      onClick={() => addKeyword(k)}
                    >
                      + {k}
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <div className="cc-row-2">
              <Field label="CTA 문구" hint="본문 끝에 삽입">
                <input
                  className="cc-input"
                  value={f.cta}
                  placeholder="예약문의 010-XXXX-XXXX"
                  onChange={(e) => set("cta", e.target.value)}
                />
              </Field>
              <Field label="CTA 채널">
                <div className="cc-cta-kinds">
                  {CC_CTA_KINDS.map((k) => (
                    <button
                      key={k.key}
                      className={
                        "cc-chip " + (f.ctaKind === k.key ? "on" : "")
                      }
                      onClick={() => set("ctaKind", k.key)}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section
            index="03"
            title="Prompt Variants"
            hint="Claude에 보낼 프롬프트 종류 · 우측 미리보기에서 탭으로 전환"
          >
            <div className="cc-variants">
              {CC_PROMPT_PRESETS.map((p) => (
                <label
                  key={p.id}
                  className={"cc-variant " + (f.variants[p.id] ? "on" : "")}
                >
                  <input
                    type="checkbox"
                    checked={!!f.variants[p.id]}
                    onChange={(e) =>
                      setNested("variants", p.id, e.target.checked)
                    }
                  />
                  <div className="cc-variant-l">
                    <div className="cc-variant-name">{p.name}</div>
                    <div className="cc-variant-meta">
                      <span
                        className={
                          "plat-tag " +
                          (p.platform === "NAVER_BLOG" ? "blog" : "cafe")
                        }
                      >
                        {p.platform === "NAVER_BLOG" ? "BLOG" : "CAFE"}
                      </span>
                      <span className="cc-variant-hint">{p.hint}</span>
                    </div>
                  </div>
                  <button
                    className="cc-variant-preview"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedVariant(p.id);
                      setNested("variants", p.id, true);
                    }}
                    title="우측에서 미리보기"
                  >
                    ↗
                  </button>
                </label>
              ))}
            </div>
            <div className="cc-run-cfg">
              <span>Claude 1회 실행 시 생성할 글 수</span>
              <div className="cc-stepper">
                <button
                  onClick={() =>
                    set("postsPerRun", Math.max(1, f.postsPerRun - 1))
                  }
                >
                  −
                </button>
                <span className="mono">{f.postsPerRun}</span>
                <button
                  onClick={() =>
                    set("postsPerRun", Math.min(10, f.postsPerRun + 1))
                  }
                >
                  +
                </button>
              </div>
              <span className="cc-run-hint">
                = {f.postsPerRun}개 · 결과는 Inbox로 batch 도착
              </span>
            </div>
          </Section>

          <Section
            index="04"
            title="Hook 설정"
            hint="Claude가 결과를 자동 저장할 webhook 엔드포인트 · 보조 설정"
          >
            <div className="cc-hook">
              <div className="cc-hook-toggle">
                <label className="cc-toggle-row">
                  <input
                    type="checkbox"
                    checked={f.hookEnabled}
                    onChange={(e) => set("hookEnabled", e.target.checked)}
                  />
                  <span className="cc-toggle-tx">
                    Webhook 활성화 — Claude → PostingHub 자동 저장
                  </span>
                </label>
                {!f.hookEnabled && (
                  <div className="cc-hook-fallback">
                    비활성 시 결과는 <b>Manual paste</b> 화면에서 직접
                    붙여넣어야 합니다.
                  </div>
                )}
              </div>
              {f.hookEnabled && (
                <>
                  <Field label="Endpoint URL" hint="이 캠페인 전용">
                    <div className="cc-hook-url">
                      <span className="mono">
                        https://hub.posting/intake/{hookId.slice(4)}
                      </span>
                      <button
                        className="cc-mini-btn"
                        onClick={copyHook}
                        title="복사"
                      >
                        <I.Copy size={10} />
                      </button>
                    </div>
                  </Field>
                  <div className="cc-row-2">
                    <Field label="인증" hint="Bearer · Authorization 헤더">
                      <div className="cc-hook-secret">
                        <span className="mono">{hookSecret}</span>
                        <button
                          className="cc-mini-btn"
                          onClick={() =>
                            setHookSecret(
                              "phk_" +
                                Math.random().toString(36).slice(2, 6) +
                                "•••••••••" +
                                Math.random().toString(36).slice(2, 6),
                            )
                          }
                          title="재발급"
                        >
                          <I.Refresh size={10} />
                        </button>
                      </div>
                    </Field>
                    <Field
                      label="Auto Parse"
                      hint="#CAMPAIGN · #PLATFORM · 제목 · 본문 추출"
                    >
                      <div className="cc-hook-parse">
                        <span className="live-dot live">
                          <span className="live-pulse" />
                        </span>
                        <span>활성 · 기본 스키마</span>
                        <button className="link-btn">스키마 보기 →</button>
                      </div>
                    </Field>
                  </div>
                </>
              )}
            </div>
          </Section>
        </div>

        {/* RIGHT: Live preview */}
        <aside className="cc-side">
          <div className="cc-side-card cc-prompt">
            <div className="cc-prompt-head">
              <div className="cc-prompt-h-l">
                <div className="cc-prompt-eyebrow">Live · Claude prompt</div>
                <div className="cc-prompt-title">자동 생성 미리보기</div>
              </div>
              <button className="cc-prompt-copy" onClick={copyPrompt}>
                <I.Copy size={11} />
                <span>복사</span>
                <span className="kbd">⌘C</span>
              </button>
            </div>
            <div className="cc-variant-tabs">
              {selectedVariantIds.length === 0 && (
                <span className="dim small">Variant를 1개 이상 선택하세요</span>
              )}
              {selectedVariantIds.map((vid) => {
                const v = CC_PROMPT_PRESETS.find((p) => p.id === vid);
                if (!v) return null;
                return (
                  <button
                    key={vid}
                    className={
                      "cc-vtab " + (selectedVariant === vid ? "on" : "")
                    }
                    onClick={() => setSelectedVariant(vid)}
                  >
                    <span
                      className={
                        "plat-tag " +
                        (v.platform === "NAVER_BLOG" ? "blog" : "cafe")
                      }
                    >
                      {v.platform === "NAVER_BLOG" ? "BLOG" : "CAFE"}
                    </span>
                    <span>{v.name}</span>
                  </button>
                );
              })}
            </div>
            <pre className="cc-prompt-body mono">{generatedPrompt}</pre>
            <div className="cc-prompt-foot">
              <span className="cc-prompt-stat">
                {generatedPrompt.length.toLocaleString()} chars ·{" "}
                {generatedPrompt.split("\n").length} lines
              </span>
              <span className="cc-prompt-stat">출력 → Hook 또는 Manual</span>
            </div>
          </div>

          <div className="cc-side-card cc-flow">
            <div className="cc-flow-h">동작 흐름</div>
            <div className="cc-flow-steps">
              <div className="cc-flow-s">
                <span className="cc-flow-num">1</span>
                <div>
                  <b>복사</b>
                  <div className="cc-flow-d">우측 프롬프트 → Claude</div>
                </div>
              </div>
              <div className="cc-flow-s">
                <span className="cc-flow-num">2</span>
                <div>
                  <b>Claude 실행</b>
                  <div className="cc-flow-d">{f.postsPerRun}개 글 생성</div>
                </div>
              </div>
              <div className="cc-flow-s">
                <span className="cc-flow-num">3</span>
                <div>
                  <b>{f.hookEnabled ? "Webhook 콜백" : "Manual paste"}</b>
                  <div className="cc-flow-d">
                    {f.hookEnabled
                      ? "자동 파싱 · Inbox 등록"
                      : "직접 붙여넣기"}
                  </div>
                </div>
              </div>
              <div className="cc-flow-s">
                <span className="cc-flow-num">4</span>
                <div>
                  <b>발행 큐</b>
                  <div className="cc-flow-d">제목/본문/CTA 복사 → 네이버</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cc-side-card cc-summary">
            <div className="cc-summary-h">요약</div>
            <div className="cc-summary-row">
              <span>플랫폼</span>
              <span className="mono">{platformLine}</span>
            </div>
            <div className="cc-summary-row">
              <span>톤</span>
              <span>{CC_TONES.find((t) => t.key === f.tone)?.label}</span>
            </div>
            <div className="cc-summary-row">
              <span>키워드</span>
              <span className="mono">{f.keywords.length}</span>
            </div>
            <div className="cc-summary-row">
              <span>Variants</span>
              <span className="mono">{selectedVariantIds.length}</span>
            </div>
            <div className="cc-summary-row">
              <span>회당 글 수</span>
              <span className="mono">{f.postsPerRun}</span>
            </div>
            <div className="cc-summary-row">
              <span>Hook</span>
              <span>
                {f.hookEnabled ? (
                  <>
                    <span className="live-dot live">
                      <span className="live-pulse" />
                    </span>{" "}
                    Active
                  </>
                ) : (
                  "Off"
                )}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────
function Section({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cc-section">
      <header className="cc-section-h">
        <span className="cc-section-idx mono">{index}</span>
        <div>
          <div className="cc-section-t">{title}</div>
          {hint && <div className="cc-section-hint">{hint}</div>}
        </div>
      </header>
      <div className="cc-section-body">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  ok,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  ok?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="cc-field">
      <div className="cc-field-h">
        <label className="cc-field-l">
          {label}
          {required && (
            <span className={"cc-req " + (ok ? "ok" : "")}>
              {ok ? "✓" : "*"}
            </span>
          )}
        </label>
        {hint && <div className="cc-field-hint">{hint}</div>}
      </div>
      <div className="cc-field-c">{children}</div>
    </div>
  );
}

function getKwSuggestions(industry: string, region: string): string[] {
  const r = (region || "").split("·").pop()?.trim() || "지역";
  const base: Record<string, string[]> = {
    미용: ["1인샵", "컷펌", "가격비교", "후기"],
    "F&B": ["맛집", "데이트", "가성비", "신상"],
    의료: ["검진", "비용", "후기", "예약"],
    육아: ["키즈카페", "주말", "가족", "평일 가성비"],
    "헬스/PT": ["1:1", "체험", "가격", "직장인"],
    교육: ["학원", "체험수업", "후기", "수업료"],
    여행: ["펜션", "오션뷰", "가성비", "비수기"],
    리테일: ["오픈", "할인", "신상", "후기"],
    부동산: ["매물", "시세", "임장", "후기"],
    법률: ["상담", "수임료", "후기", "사례"],
  };
  const seeds = base[industry] || ["후기", "가격", "비교"];
  return [r + " " + (seeds[0] || "후기"), ...seeds.slice(0, 3)];
}

function buildPrompt(f: FormState, variantId: PresetId): string {
  const v = CC_PROMPT_PRESETS.find((p) => p.id === variantId);
  if (!v) return "// Variant를 선택하면 프롬프트가 여기에 표시됩니다.";
  const campaign = f.name || "{업체명}";
  const region = f.region || "{지역}";
  const industry = f.industry || "{업종}";
  const platform = v.platform === "NAVER_BLOG" ? "BLOG" : "CAFE";
  const kw = f.keywords.length
    ? f.keywords.map((k) => "#" + k).join(" ")
    : "{키워드}";
  const cta = f.cta || "{CTA}";
  const toneLabel = CC_TONES.find((t) => t.key === f.tone)?.label || "친근";
  const memo = f.clientNote?.trim();
  const variantHead: Record<PresetId, string> = {
    blog_review: `당신은 네이버 블로그 후기 작성자입니다.\n키워드를 본문에 자연스럽게 4~6회, 첫 단락에 [지역+업종] 키워드를 명시하세요.\nH2 헤딩 3개 구조 · 단락당 3~5문장.`,
    cafe_mom: `당신은 지역 맘카페 회원처럼 정보를 공유합니다.\n과장된 광고 톤 금지 · 후기 위주 · 짧은 단락 · 이모지 1~2개 허용.`,
    experience: `당신은 체험단 리뷰어입니다.\n긍정 70% + 작은 단점 1개를 솔직하게 언급 · 사진 위치 표시.`,
    compare: `당신은 가성비 비교 리뷰어입니다.\n${campaign} 외 2~4곳을 가격/접근성/만족도 기준으로 표 형태로 비교.`,
    short: `짧은 후기 3~4문장.\n첫 문장에 ${region} + ${industry} 키워드 명시. CTA 마지막 줄.`,
    medical: `당신은 의료 광고 가이드를 따르는 후기 작성자입니다.\n효능 단정 금지 · 개인 경험만 서술 · 객관 수치만 허용.`,
  };
  const head = variantHead[variantId];
  return `${head}

# 캠페인 정보
- 업체명: ${campaign}
- 지역: ${region}
- 업종: ${industry}
- 기본 톤: ${toneLabel}
- CTA: ${cta}
- 키워드: ${kw}${memo ? `\n- 클라이언트 메모: ${memo}` : ""}

# 출력 형식 (반드시 준수 · Hook 자동 파싱용)
#CAMPAIGN: ${campaign}
#PLATFORM: ${platform}
#KIND: 원본|변형|재활용
#KEYWORDS: ${f.keywords.slice(0, 4).join(", ") || "kw1, kw2"}
#REGION: ${region}
#INDUSTRY: ${industry}
#CTA: ${cta}

제목: ...

본문:
...

# 실행
이 형식 그대로 ${f.postsPerRun}편을 연속으로 출력하세요. 각 편 사이는 빈 줄 한 줄.
`;
}
