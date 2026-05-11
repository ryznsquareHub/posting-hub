import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { usePrompts } from "@/features/prompts/usePrompts";
import { useHookEndpoints, useIntakeFeed } from "@/features/intake/useIntake";
import { useAutomation } from "@/features/intake/useAutomation";
import { NewPromptModal } from "@/features/prompts/NewPromptModal";
import { LiveDot, PlatTag, timeAgo } from "@/lib/format/meta";
import type { Prompt } from "@/types/prompt";

export default function WorkflowPage() {
  const { data: list = [] } = usePrompts();
  const { data: hooks = [] } = useHookEndpoints();
  const { data: feed = [] } = useIntakeFeed(50);
  const auto = useAutomation();
  const nav = useNavigate();
  const [pick, setPick] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const effectivePick = pick ?? list[0]?.id ?? null;
  const cur = list.find((p) => p.id === effectivePick) ?? null;

  const cats = useMemo(() => {
    const m: Record<string, Prompt[]> = {};
    list.forEach((p) => {
      (m[p.category] ||= []).push(p);
    });
    return m;
  }, [list]);

  const boundHook = cur ? hooks.find((h) => h.boundPrompts.includes(cur.id)) : undefined;
  const recentForPrompt = cur ? feed.filter((f) => f.promptId === cur.id).slice(0, 6) : [];

  const copyText = (text: string, msg: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast.success(msg);
  };

  return (
    <div className="wf-page">
      {/* Left: workflow list */}
      <div className="wf-side">
        <div className="wf-side-h">
          <div>
            <h2>AI Workflows</h2>
            <div className="wf-side-sub">Claude → Hook → PostingHub</div>
          </div>
          <button
            className="btn-icon"
            title="새 워크플로우"
            onClick={() => setNewOpen(true)}
          >
            <I.Plus size={12} />
          </button>
        </div>
        <div className="wf-side-stat">
          <div className="wf-side-stat-row">
            <LiveDot status={auto.hookLive ? "live" : "off"} />
            <span>Auto Parse</span>
            <span className="mono">
              {auto.autoParseOn}/{list.length}
            </span>
          </div>
          <div className="wf-side-stat-row">
            <span className="dot" style={{ background: "#3b82f6" }} />
            <span>Hook 24h</span>
            <span className="mono">{auto.intake24h}</span>
          </div>
        </div>
        <div className="wf-list">
          {Object.entries(cats).map(([cat, items]) => (
            <div className="wf-cat" key={cat}>
              <div className="wf-cat-h">
                {cat} <span className="wf-cat-c">{items.length}</span>
              </div>
              {items.map((p) => (
                <button
                  key={p.id}
                  className={"wf-item " + (effectivePick === p.id ? "on" : "")}
                  onClick={() => setPick(p.id)}
                >
                  <div className="wf-item-l">
                    <LiveDot
                      status={
                        p.webhookEnabled
                          ? p.autoParse
                            ? "live"
                            : "review"
                          : "off"
                      }
                    />
                    <div className="wf-item-text">
                      <div className="wf-item-t">{p.name}</div>
                      <div className="wf-item-s">
                        <span className="mono">{p.schedule || "수동"}</span>
                        <span className="sep">·</span>
                        <span>{Math.round((p.successRate ?? 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <PlatTag platform={p.platform} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right: workflow detail */}
      <div className="wf-detail">
        {cur ? (
          <>
            <div className="wf-d-head">
              <div className="wf-d-head-l">
                <div className="wf-d-crumb">
                  {cur.category} <span className="sep">·</span>{" "}
                  <PlatTag platform={cur.platform} mode="full" />
                </div>
                <h1>{cur.name}</h1>
                <div className="wf-d-sub">{cur.description}</div>
              </div>
              <div className="wf-d-head-r">
                <button className="btn-ghost xs">
                  <I.Edit size={11} /> 편집
                </button>
                <button
                  className="btn-primary"
                  onClick={() =>
                    copyText(cur.body, "프롬프트 복사 — Claude에 붙여넣기")
                  }
                >
                  <I.Copy size={12} /> Prompt 복사{" "}
                  <span className="kbd small invert">⌘C</span>
                </button>
              </div>
            </div>

            {/* Status strip */}
            <div className="wf-strip">
              <div
                className={"wf-strip-cell " + (cur.webhookEnabled ? "on" : "off")}
              >
                <div className="wf-strip-h">
                  <LiveDot
                    status={
                      cur.webhookEnabled
                        ? cur.autoParse
                          ? "live"
                          : "review"
                        : "off"
                    }
                  />
                  <span>Webhook</span>
                </div>
                <div className="wf-strip-v">
                  {cur.webhookEnabled ? "Ready" : "Off"}
                </div>
                <div className="wf-strip-s">
                  {boundHook ? boundHook.name : "엔드포인트 미연결"}
                </div>
              </div>
              <div className={"wf-strip-cell " + (cur.autoParse ? "on" : "off")}>
                <div className="wf-strip-h">
                  <I.Zap size={11} />
                  <span>Auto Parse</span>
                </div>
                <div className="wf-strip-v">
                  {cur.autoParse ? "Enabled" : "Manual"}
                </div>
                <div className="wf-strip-s">파싱 후 Queue 자동 등록</div>
              </div>
              <div className="wf-strip-cell">
                <div className="wf-strip-h">
                  <I.Calendar size={11} />
                  <span>Schedule</span>
                </div>
                <div className="wf-strip-v">{cur.schedule || "수동"}</div>
                <div className="wf-strip-s">
                  {cur.lastRunAt ? "마지막 실행 " + timeAgo(cur.lastRunAt) : "—"}
                </div>
              </div>
              <div className="wf-strip-cell">
                <div className="wf-strip-h">
                  <I.Check size={11} />
                  <span>Success</span>
                </div>
                <div className="wf-strip-v">
                  {Math.round((cur.successRate ?? 0) * 100)}
                  <small>%</small>
                </div>
                <div className="wf-strip-s">
                  최근 7일 · {cur.lastRunCount ?? 0} 등록
                </div>
              </div>
            </div>

            {/* Flow diagram */}
            <div className="wf-flow">
              <div className="wf-flow-step on">
                <div className="wf-flow-i">
                  <I.Edit size={11} />
                </div>
                <div className="wf-flow-l">Prompt</div>
                <div className="wf-flow-s">PostingHub</div>
              </div>
              <div className="wf-flow-arrow">→</div>
              <div className="wf-flow-step on">
                <div className="wf-flow-i">
                  <I.Zap size={11} />
                </div>
                <div className="wf-flow-l">Claude</div>
                <div className="wf-flow-s">{cur.schedule || "수동 실행"}</div>
              </div>
              <div className="wf-flow-arrow">→</div>
              <div
                className={"wf-flow-step " + (cur.webhookEnabled ? "on" : "dim")}
              >
                <div className="wf-flow-i">
                  <I.Inbox size={11} />
                </div>
                <div className="wf-flow-l">Hook</div>
                <div className="wf-flow-s">
                  {cur.webhookEnabled ? "Live" : "Off"}
                </div>
              </div>
              <div className="wf-flow-arrow">→</div>
              <div className={"wf-flow-step " + (cur.autoParse ? "on" : "dim")}>
                <div className="wf-flow-i">
                  <I.FileText size={11} />
                </div>
                <div className="wf-flow-l">Parser</div>
                <div className="wf-flow-s">
                  {cur.autoParse ? "Auto" : "Manual"}
                </div>
              </div>
              <div className="wf-flow-arrow">→</div>
              <div className="wf-flow-step on">
                <div className="wf-flow-i">
                  <I.List size={11} />
                </div>
                <div className="wf-flow-l">Queue</div>
                <div className="wf-flow-s">자동 등록</div>
              </div>
            </div>

            {/* Body grid */}
            <div className="wf-body-grid">
              <section className="wf-body-col">
                <div className="wf-body-h">
                  <span>Prompt 본문</span>
                  <span className="mute">{cur.body.length}자</span>
                </div>
                <pre className="wf-pre">{cur.body}</pre>
                <div className="wf-vars">
                  <span className="wf-vars-l">변수:</span>
                  {cur.variables.map((v) => (
                    <span key={v} className="kw-chip">
                      {`{${v}}`}
                    </span>
                  ))}
                </div>
              </section>

              <section className="wf-body-col">
                <div className="wf-body-h">
                  <span>Structured Output 스키마</span>
                  <span className="mute">Import 시 자동 파싱</span>
                </div>
                <pre className="wf-pre format">{cur.outputFormat}</pre>
                <div className="wf-format-note">
                  <I.Zap size={11} />
                  <span>
                    이 형식으로 출력하면 <b>Campaign · Platform · CTA</b> 가 자동
                    매칭되고 Queue에 바로 등록됩니다.
                  </span>
                </div>
              </section>
            </div>

            {/* Hook detail */}
            {boundHook && (
              <section className="wf-hook">
                <div className="wf-hook-h">
                  <div>
                    <div className="wf-body-h">
                      <span>Bound Hook</span>
                      <LiveDot status={boundHook.status} />
                    </div>
                    <h3>{boundHook.name}</h3>
                  </div>
                  <button
                    className="btn-ghost xs"
                    onClick={() => copyText(boundHook.url, "Hook URL 복사")}
                  >
                    <I.Copy size={11} /> URL 복사
                  </button>
                </div>
                <div className="wf-hook-grid">
                  <div className="wf-hook-cell">
                    <div className="wf-hook-l">Endpoint</div>
                    <code className="wf-hook-mono">{boundHook.url}</code>
                  </div>
                  <div className="wf-hook-cell">
                    <div className="wf-hook-l">Protocol</div>
                    <div className="mono">{boundHook.protocol}</div>
                  </div>
                  <div className="wf-hook-cell">
                    <div className="wf-hook-l">Auth</div>
                    <div className="mono">
                      {boundHook.authType} ·{" "}
                      <span className="mute">{boundHook.secret}</span>
                    </div>
                  </div>
                  <div className="wf-hook-cell">
                    <div className="wf-hook-l">P50 latency</div>
                    <div className="mono">{boundHook.p50LatencyMs}ms</div>
                  </div>
                  <div className="wf-hook-cell">
                    <div className="wf-hook-l">오늘 수신</div>
                    <div className="mono">
                      {boundHook.receivedToday}{" "}
                      <span className="mute">(에러 {boundHook.errorsToday})</span>
                    </div>
                  </div>
                  <div className="wf-hook-cell">
                    <div className="wf-hook-l">Uptime</div>
                    <div className="mono">
                      {(boundHook.uptime * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Recent intake */}
            <section className="wf-recent">
              <div className="wf-body-h">
                <span>이 워크플로우 최근 수집</span>
                <button
                  className="btn-ghost xs"
                  onClick={() => nav("/dashboard/import")}
                >
                  Intake 화면 →
                </button>
              </div>
              <div className="wf-recent-list">
                {recentForPrompt.length ? (
                  recentForPrompt.map((f) => (
                    <div
                      className={"wf-recent-row " + f.parseStatus}
                      key={f.id}
                    >
                      <span className={"feed-src " + f.source}>
                        {f.source === "hook" ? "HOOK" : "MAN"}
                      </span>
                      <span className="wf-recent-t">{f.title}</span>
                      <span className="mute mono">
                        {f.campaignMatched ?? "—"}
                      </span>
                      <span className="mute mono">{timeAgo(f.at)}</span>
                      <span className={"parse-tag " + f.parseStatus}>
                        {f.parseStatus === "ok"
                          ? "OK"
                          : f.parseStatus === "warn"
                            ? "WARN"
                            : "ERROR"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="t-empty">
                    이 워크플로우의 수집 기록이 없습니다
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="t-empty">워크플로우를 선택하세요</div>
        )}
      </div>
      <NewPromptModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => setPick(id)}
      />
    </div>
  );
}
