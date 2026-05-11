import { useRef, useState } from "react";
import { toast } from "sonner";

import { useQueryClient } from "@tanstack/react-query";

import { I } from "@/components/icons";
import { useIntakeFeed, useHookEndpoints } from "@/features/intake/useIntake";
import { useImports } from "@/features/intake/useImports";
import { useAutomation } from "@/features/intake/useAutomation";
import { useManualPaste } from "@/features/intake/useManualPaste";
import { usePrompts } from "@/features/prompts/usePrompts";
import { LiveDot, PlatTag, kindMeta, timeAgo } from "@/lib/format/meta";
import {
  parseClaudeOutput,
  SAMPLE_IMPORT,
  type ParsedBlock,
} from "@/features/intake/parseClaudeOutput";

import { usePostsShell } from "./posts-shell";

type Tab = "live" | "paste" | "hooks" | "batches" | "format";

export default function IntakePage() {
  const { campaigns } = usePostsShell();
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedBlock[]>([]);
  const [tab, setTab] = useState<Tab>("live");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const auto = useAutomation();
  const qc = useQueryClient();
  const { data: feed = [], isLoading: feedLoading } = useIntakeFeed(100);
  const { data: hooks = [] } = useHookEndpoints();
  const { data: prompts = [] } = usePrompts();
  const { data: imports = [] } = useImports();
  const manualPaste = useManualPaste();

  const onPaste: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const v = e.target.value;
    setRaw(v);
    setParsed(v.trim() ? parseClaudeOutput(v, campaigns) : []);
  };
  const loadSample = () => {
    setRaw(SAMPLE_IMPORT);
    setParsed(parseClaudeOutput(SAMPLE_IMPORT, campaigns));
    taRef.current?.focus();
  };

  const okCount = parsed.filter((p) => p.ok).length;
  const warnCount = parsed.reduce(
    (s, p) => s + (p.warnings.length && p.ok ? 1 : 0),
    0,
  );
  const errorCount = parsed.length - okCount;

  const doImport = async () => {
    if (!okCount) return;
    try {
      const { ingested, posts } = await manualPaste.mutateAsync(parsed);
      setRaw("");
      setParsed([]);
      toast.success(
        `${ingested}건 Queue 등록${posts > 0 ? ` · ${posts}건 자동 발행대기 등록` : ""}`,
      );
    } catch (e) {
      toast.error((e as Error).message ?? "Import 실패");
    }
  };

  const intake24h = feed.length;
  const okFeed = feed.filter((f) => f.parseStatus === "ok").length;
  const warnFeed = feed.filter((f) => f.parseStatus === "warn").length;
  const errFeed = feed.filter((f) => f.parseStatus === "error").length;

  return (
    <div className="imp-page">
      <div className="t-head">
        <div>
          <h1>AI Output Intake</h1>
          <div className="t-sub">
            <LiveDot status={auto.hookLive ? "live" : "off"} />
            <span>
              {auto.hookLive ? "Auto Import Active" : "Hook Offline"} ·{" "}
              {auto.hookCount} hooks live · 마지막 수신 {timeAgo(auto.lastHookAt)}
            </span>
          </div>
        </div>
        <div className="t-head-actions">
          <button className="btn-ghost xs" onClick={loadSample}>
            <I.FileText size={11} /> 샘플
          </button>
        </div>
      </div>

      {/* Health strip */}
      <div className="intake-strip">
        <div className="intake-strip-cell">
          <div className="t-stat-l">24h 수집</div>
          <div className="t-stat-v">{intake24h}</div>
          <div className="t-stat-s mono">
            OK {okFeed} · WARN {warnFeed} · ERR {errFeed}
          </div>
        </div>
        <div className="intake-strip-cell">
          <div className="t-stat-l">Auto Queue 등록</div>
          <div className="t-stat-v">{auto.queuedToday}</div>
          <div className="t-stat-s">파싱 후 자동 추가</div>
        </div>
        <div className="intake-strip-cell">
          <div className="t-stat-l">활성 Hook</div>
          <div className="t-stat-v">
            {hooks.filter((h) => h.status === "live").length}
            <span className="mute">/{hooks.length}</span>
          </div>
          <div className="t-stat-s">
            {hooks.map((h) => (
              <span
                key={h.id}
                className={"hook-pip " + h.status}
                title={h.name}
              >
                <LiveDot status={h.status} />
              </span>
            ))}
          </div>
        </div>
        <div className="intake-strip-cell">
          <div className="t-stat-l">에러</div>
          <div
            className="t-stat-v"
            style={{ color: errFeed ? "#ff6e6e" : undefined }}
          >
            {errFeed}
          </div>
          <div className="t-stat-s">파싱 실패 — 수동 확인 필요</div>
        </div>
      </div>

      <div className="imp-tabs">
        <button
          className={"f-tab " + (tab === "live" ? "on" : "")}
          onClick={() => setTab("live")}
        >
          <LiveDot status={auto.hookLive ? "live" : "off"} /> 자동 수집 라이브{" "}
          <span className="f-count">{feed.length}</span>
        </button>
        <button
          className={"f-tab " + (tab === "paste" ? "on" : "")}
          onClick={() => setTab("paste")}
        >
          <I.Edit size={10} /> Manual Paste <span className="f-count">fallback</span>
        </button>
        <button
          className={"f-tab " + (tab === "hooks" ? "on" : "")}
          onClick={() => setTab("hooks")}
        >
          Hook 엔드포인트 <span className="f-count">{hooks.length}</span>
        </button>
        <button
          className={"f-tab " + (tab === "batches" ? "on" : "")}
          onClick={() => setTab("batches")}
        >
          Batch 이력 <span className="f-count">{imports.length}</span>
        </button>
        <button
          className={"f-tab " + (tab === "format" ? "on" : "")}
          onClick={() => setTab("format")}
        >
          Format 스키마
        </button>
      </div>

      {/* LIVE feed */}
      {tab === "live" && (
        <div className="intake-feed">
          <div className="intake-feed-h">
            <span className="mute">
              실시간 수신 · Hook과 Manual paste가 같은 큐로 흘러들어옵니다
            </span>
            <button
              className="btn-ghost xs"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["intake"] });
                qc.invalidateQueries({ queryKey: ["imports"] });
                toast("새로고침");
              }}
              disabled={feedLoading}
            >
              <I.Refresh size={11} /> 새로고침
            </button>
          </div>
          <div className="intake-feed-list">
            <div className="intake-feed-th">
              <div>시간</div>
              <div>소스</div>
              <div>Prompt</div>
              <div>제목</div>
              <div>Campaign</div>
              <div>상태</div>
              <div>Queue</div>
            </div>
            {feed.map((f) => {
              const c = campaigns.find((x) => x.id === f.campaignId);
              return (
                <div className={"intake-feed-row " + f.parseStatus} key={f.id}>
                  <div className="mono mute">
                    {new Date(f.at).toTimeString().slice(0, 5)}
                  </div>
                  <div>
                    <span className={"feed-src " + f.source}>
                      {f.source === "hook" ? "HOOK" : "MAN"}
                    </span>
                  </div>
                  <div className="mono mute ellip">{f.promptName}</div>
                  <div className="ellip">{f.title}</div>
                  <div className="ellip">
                    {c && (
                      <span
                        className="cmp-color"
                        style={{ background: c.color }}
                      />
                    )}
                    {f.campaignMatched ?? "—"}
                  </div>
                  <div>
                    <span className={"parse-tag " + f.parseStatus}>
                      {f.parseStatus === "ok"
                        ? "OK"
                        : f.parseStatus === "warn"
                          ? "WARN"
                          : "ERROR"}
                    </span>
                    {f.warnings && f.warnings.length > 0 && (
                      <span className="intake-warn-x">
                        {" "}
                        · {f.warnings.join(", ")}
                      </span>
                    )}
                  </div>
                  <div>
                    {f.queued ? (
                      <span className="parse-tag ok">queued</span>
                    ) : (
                      <span className="parse-tag error">skip</span>
                    )}
                  </div>
                </div>
              );
            })}
            {!feed.length && (
              <div className="t-empty">아직 수집된 결과가 없습니다</div>
            )}
          </div>
        </div>
      )}

      {/* MANUAL paste */}
      {tab === "paste" && (
        <>
          <div className="intake-fallback-note">
            <I.Inbox size={11} />
            <span>
              Manual Paste는 <b>fallback</b>입니다 — 일반 운영은 Hook 자동 수집으로
              처리됩니다. 디버깅·예외 처리에 사용하세요.
            </span>
          </div>
          <div className="imp-grid">
            <div className="imp-left">
              <div className="imp-left-h">
                <span>붙여넣기</span>
                <span className="lib-mute">
                  여러 글은 <code>---</code> 또는 새로운 <code>#CAMPAIGN:</code> 로
                  구분
                </span>
              </div>
              <textarea
                ref={taRef}
                className="imp-textarea"
                placeholder="Claude 출력 결과를 여기에 붙여넣으세요…"
                value={raw}
                onChange={onPaste}
              />
              <div className="imp-foot">
                <span className="lib-mute">{raw.length}자</span>
                <button
                  className="btn-ghost xs"
                  onClick={() => {
                    setRaw("");
                    setParsed([]);
                  }}
                >
                  초기화
                </button>
              </div>
            </div>
            <div className="imp-right">
              <div className="imp-right-h">
                <span>
                  파싱 프리뷰 <b>{parsed.length}</b>
                </span>
                <span className="parse-tag ok">{okCount} OK</span>
                {warnCount > 0 && (
                  <span className="parse-tag warn">{warnCount} WARN</span>
                )}
                {errorCount > 0 && (
                  <span className="parse-tag error">{errorCount} ERROR</span>
                )}
                <button
                  className="btn-primary"
                  disabled={!okCount}
                  onClick={doImport}
                >
                  <I.Check size={12} /> {okCount}건 Queue 등록
                </button>
              </div>
              <div className="imp-results">
                {!parsed.length && (
                  <div className="t-empty">붙여넣으면 자동으로 파싱됩니다</div>
                )}
                {parsed.map((p) => (
                  <div
                    key={p._idx}
                    className={
                      "imp-card " +
                      (!p.ok ? "error" : p.warnings.length ? "warn" : "")
                    }
                  >
                    <div className="imp-card-h">
                      <span className="imp-card-i">#{p._idx + 1}</span>
                      {p.campaignName ? (
                        <span
                          className={
                            "imp-card-cmp " + (p.campaignId ? "" : "unknown")
                          }
                        >
                          {p.campaignId && (
                            <span
                              className="cmp-color"
                              style={{
                                background: campaigns.find(
                                  (c) => c.id === p.campaignId,
                                )?.color,
                              }}
                            />
                          )}
                          {p.campaignName}
                          {!p.campaignId && (
                            <span className="imp-new-tag">새 캠페인</span>
                          )}
                        </span>
                      ) : (
                        <span className="imp-card-cmp unknown">캠페인 미지정</span>
                      )}
                      <PlatTag platform={p.platform} mode="full" />
                      <span
                        className="kind-tag mini"
                        style={{
                          color: kindMeta(p.kind).tone,
                          borderColor: kindMeta(p.kind).tone + "55",
                        }}
                      >
                        {kindMeta(p.kind).label}
                      </span>
                    </div>
                    <div className="imp-card-t">{p.title}</div>
                    <div className="imp-card-b">
                      {p.body.slice(0, 140)}
                      {p.body.length > 140 ? "…" : ""}
                    </div>
                    <div className="imp-card-f">
                      {p.keywords.map((k) => (
                        <span key={k} className="kw">
                          #{k}
                        </span>
                      ))}
                      {p.warnings.map((w) => (
                        <span key={w} className="imp-warn">
                          ⚠ {w}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* HOOK endpoints */}
      {tab === "hooks" && (
        <div className="hooks-grid">
          {hooks.map((h) => (
            <div key={h.id} className={"hook-card " + h.status}>
              <div className="hook-card-h">
                <div className="hook-card-hl">
                  <LiveDot status={h.status} />
                  <h3>{h.name}</h3>
                </div>
                <span
                  className={
                    "parse-tag " +
                    (h.status === "live"
                      ? "ok"
                      : h.status === "review"
                        ? "warn"
                        : "error")
                  }
                >
                  {h.status === "live"
                    ? "LIVE"
                    : h.status === "review"
                      ? "REVIEW"
                      : "OFF"}
                </span>
              </div>
              <div className="hook-card-row">
                <div className="hook-card-l">Endpoint</div>
                <code className="wf-hook-mono">{h.url}</code>
              </div>
              <div className="hook-card-grid">
                <div>
                  <div className="hook-card-l">Protocol</div>
                  <div className="mono">{h.protocol}</div>
                </div>
                <div>
                  <div className="hook-card-l">Auth</div>
                  <div className="mono">{h.authType}</div>
                </div>
                <div>
                  <div className="hook-card-l">Secret</div>
                  <div className="mono mute">{h.secret}</div>
                </div>
                <div>
                  <div className="hook-card-l">P50</div>
                  <div className="mono">{h.p50LatencyMs}ms</div>
                </div>
                <div>
                  <div className="hook-card-l">오늘</div>
                  <div className="mono">
                    {h.receivedToday} ({h.errorsToday}e)
                  </div>
                </div>
                <div>
                  <div className="hook-card-l">Uptime</div>
                  <div className="mono">{(h.uptime * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="hook-card-f">
                <span className="hook-card-l">연결된 워크플로우</span>
                <span>
                  {h.boundPrompts.map((pid) => {
                    const p = prompts.find((x) => x.id === pid);
                    return p ? (
                      <span key={pid} className="kw-chip">
                        {p.name}
                      </span>
                    ) : null;
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BATCH history */}
      {tab === "batches" && (
        <div className="imp-recent">
          {imports.map((im) => (
            <div key={im.id} className={"imp-rrow " + im.status}>
              <div className="imp-rrow-l">
                <div className="imp-rrow-src">
                  <span className={"feed-src " + im.source}>
                    {im.source === "hook" ? "HOOK" : "MAN"}
                  </span>
                  {im.sourceName}
                </div>
                <div className="imp-rrow-t">{im.summary || "정상 처리"}</div>
              </div>
              <div className="imp-rrow-r">
                <span
                  className={
                    "parse-tag " +
                    (im.status === "applied"
                      ? "ok"
                      : im.status === "partial"
                        ? "warn"
                        : "error")
                  }
                >
                  {im.parsed}/{im.count}
                </span>
                <span className="t-row-time mute">{timeAgo(im.at)}</span>
              </div>
            </div>
          ))}
          {!imports.length && (
            <div className="t-empty">아직 Import 내역이 없습니다</div>
          )}
        </div>
      )}

      {/* FORMAT guide */}
      {tab === "format" && (
        <div className="imp-fmt">
          <p className="lib-mute">
            PostingHub는 Claude/Scheduled Tasks 출력을 다음 구조화 형식으로 자동
            파싱합니다. 메타 라인은 모두 <code>#KEY: value</code> 형식.
          </p>
          <pre className="lib-d-out">{`#CAMPAIGN: 잠실 키즈카페   ← 캠페인 자동 매칭 (없으면 신규 후보)
#PLATFORM: BLOG          ← BLOG | CAFE
#KIND: 원본              ← 원본 | 변형 | 재활용
#KEYWORDS: 키워드1, 키워드2, 키워드3
#REGION: 잠실
#INDUSTRY: 키즈카페
#CTA: 주말 예약 필수

제목: 잠실에서 진짜 만족했던 키즈카페 후기

본문:
... 본문 내용 ...
... 줄바꿈 그대로 보존됩니다 ...

---   ← 여러 글은 점 3개로 구분

#CAMPAIGN: 강남 미용실
...`}</pre>
          <div className="imp-fmt-tip">
            <I.Zap size={12} />
            <span>
              AI Workflow Control Center의 Prompt를 그대로 사용하면 이 형식이
              보장됩니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
