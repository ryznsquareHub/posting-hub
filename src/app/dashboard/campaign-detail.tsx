import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { useIntakeFeed } from "@/features/intake/useIntake";
import { useCampaign } from "@/features/campaigns/useCampaigns";
import {
  LiveDot,
  PlatTag,
  kindMeta,
  statusMeta,
  timeAgo,
} from "@/lib/format/meta";
import { buildPrompt } from "@/features/campaigns/PromptBuilder";

import { usePostsShell } from "./posts-shell";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaignData } = useCampaign(id);
  const campaign = campaignData ?? undefined;

  const { posts, doCopy, copyText } = usePostsShell();
  const { data: feedAll = [] } = useIntakeFeed(100);
  const nav = useNavigate();

  const variants = campaign?.variants ?? [];
  const [vid, setVid] = useState<string>(
    campaign?.activeVariantId ?? variants[0]?.id ?? "",
  );
  const variant = variants.find((v) => v.id === vid) ?? variants[0];
  const [batchSize, setBatchSize] = useState<number>(
    variant?.id === "short_review" ? 5 : variant?.id === "mom_cafe" ? 3 : 1,
  );
  const [editSettings, setEditSettings] = useState(false);

  const promptBody = useMemo(
    () => (campaign ? buildPrompt(campaign, variant, batchSize) : ""),
    [campaign, variant, batchSize],
  );

  if (!campaign) {
    return (
      <div className="t-empty">
        존재하지 않는 캠페인입니다.{" "}
        <Link to="/dashboard" className="t-jump" style={{ marginLeft: 8 }}>
          Today 로 이동
        </Link>
      </div>
    );
  }

  const cmpPosts = posts.filter((p) => p.campaignId === campaign.id);
  // 캠페인별 batches — intake_events 를 그룹핑
  const cmpFeed = feedAll.filter((f) => f.campaignId === campaign.id);
  const cmpBatches = cmpFeed.map((f) => ({
    id: f.id,
    source: f.source,
    variantName: f.promptName,
    platform: f.platform,
    at: f.at,
    viewed: false,
    received: 1,
    parseOk: f.parseStatus === "ok" ? 1 : 0,
    queued: f.queued,
    posts: [
      {
        id: f.id,
        status: f.parseStatus,
        title: f.title,
        warnings: f.warnings ?? [],
      },
    ],
  }));
  const newBatchCount = cmpBatches.filter((b) => !b.viewed).length;

  const byStatus = cmpPosts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  const hook = campaign.hook ?? { connected: false, receivedCount: 0 };

  const copyPrompt = () => {
    copyText(promptBody, "프롬프트 복사됨 — Claude에 붙여넣으세요");
  };

  return (
    <div className="cd-page">
      {/* Header */}
      <div className="cd-head">
        <div className="cd-head-l">
          <div
            className="cd-head-color"
            style={{ background: campaign.color }}
          />
          <div>
            <div className="cd-head-crumb">
              <button
                className="cd-head-back"
                onClick={() => nav("/dashboard/posts")}
              >
                ← 캠페인 목록
              </button>
              <span className="sep">·</span>
              <span>{campaign.region}</span>
              <span className="sep">·</span>
              <span>{campaign.industry}</span>
            </div>
            <h1 className="cd-head-name">{campaign.name}</h1>
            <div className="cd-head-note">{campaign.clientNote}</div>
          </div>
        </div>
        <div className="cd-head-r">
          <div
            className={"cd-hook " + (hook.connected ? "on" : "off")}
            title="Webhook 상태"
          >
            <LiveDot status={hook.connected ? "live" : "off"} />
            <span className="cd-hook-l">
              {hook.connected ? "Webhook Ready" : "Webhook Off"}
            </span>
            <span className="cd-hook-sep">·</span>
            <span className="mono">{hook.receivedCount ?? 0}</span>
            <span className="mute">received</span>
          </div>
          <button
            className="btn-ghost xs"
            onClick={() => nav("/dashboard/import")}
          >
            <I.Inbox size={11} /> Inbox
            {newBatchCount > 0 && (
              <span className="cd-inbox-badge">{newBatchCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="cd-stats">
        <div className="cd-stat">
          <div className="cd-stat-v">{cmpPosts.length}</div>
          <div className="cd-stat-l">총 글</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-v">{byStatus.ready ?? 0}</div>
          <div className="cd-stat-l">발행대기</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-v">{byStatus.scheduled ?? 0}</div>
          <div className="cd-stat-l">예약</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-v">{byStatus.published ?? 0}</div>
          <div className="cd-stat-l">발행완료</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-v">
            {cmpBatches.reduce((s, b) => s + b.received, 0)}
          </div>
          <div className="cd-stat-l">Claude 수신</div>
        </div>
      </div>

      {/* PROMPT */}
      <section className="cd-prompt">
        <div className="cd-prompt-h">
          <div>
            <div className="cd-prompt-eyebrow">CLAUDE PROMPT</div>
            <h2>이 캠페인의 프롬프트</h2>
            <div className="cd-prompt-sub">
              아래 프롬프트를 복사 → <b>Claude Desktop</b> 또는{" "}
              <b>Scheduled Tasks</b>에 붙여넣으세요. 결과는 Webhook으로 자동
              회수됩니다.
            </div>
          </div>
          <button
            className="cd-prompt-edit"
            onClick={() => setEditSettings((s) => !s)}
          >
            <I.Edit size={11} /> 캠페인 설정 {editSettings ? "닫기" : "편집"}
          </button>
        </div>

        {editSettings && <CampaignSettingsEditor campaign={campaign} />}

        {/* Variant tabs */}
        <div className="cd-variants">
          {variants.map((v) => (
            <button
              key={v.id}
              className={"cd-variant " + (v.id === vid ? "on" : "")}
              onClick={() => setVid(v.id)}
            >
              <div className="cd-variant-name">
                {v.name}
                <PlatTag platform={v.platform} mode="full" />
              </div>
              <div className="cd-variant-style">{v.style}</div>
            </button>
          ))}
        </div>

        {/* Prompt body + Big Copy */}
        <div className="cd-prompt-card">
          <div className="cd-prompt-card-l">
            <div className="cd-prompt-card-h">
              <span className="cd-prompt-card-label">PROMPT</span>
              <div className="cd-prompt-card-meta">
                <span className="mute mono">{promptBody.length}자</span>
                <span className="sep">·</span>
                <span className="mute">변수 자동 치환됨</span>
              </div>
            </div>
            <pre className="cd-prompt-body">{promptBody}</pre>
          </div>

          <div className="cd-prompt-card-r">
            <div className="cd-prompt-card-r-h">
              <div className="cd-prompt-card-label">실행 설정</div>
            </div>

            <div className="cd-control">
              <div className="cd-control-l">한 번에 생성할 글</div>
              <div className="cd-batch">
                {[1, 2, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    className={"cd-batch-b " + (batchSize === n ? "on" : "")}
                    onClick={() => setBatchSize(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="cd-control">
              <div className="cd-control-l">Platform</div>
              <div className="cd-control-v">
                {variant && <PlatTag platform={variant.platform} mode="full" />}
              </div>
            </div>

            <div className="cd-control">
              <div className="cd-control-l">Style</div>
              <div className="cd-control-v small">{variant?.style}</div>
            </div>

            <button className="cd-copy-cta" onClick={copyPrompt}>
              <I.Copy size={16} />
              <span>프롬프트 복사</span>
              <span className="cd-copy-cta-sub">→ Claude에 붙여넣기</span>
            </button>

            <div className="cd-copy-secondaries">
              <button
                className="btn-ghost xs"
                onClick={() => {
                  copyPrompt();
                  window.open("https://claude.ai/new", "_blank");
                }}
              >
                <I.External size={11} /> Claude 열기
              </button>
              <button
                className="btn-ghost xs"
                onClick={() => copyText("(Hook URL — Phase 2)", "Hook URL 복사")}
              >
                <I.Link size={11} /> Hook URL
              </button>
            </div>

            <div className="cd-hook-mini">
              <LiveDot status={hook.connected ? "live" : "off"} />
              <span>응답은 Webhook으로 자동 회수</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent from Claude */}
      <section className="cd-inbox">
        <div className="cd-section-h">
          <h3>
            <I.Inbox size={13} /> Claude에서 받은 글
            <span className="t-c">{cmpBatches.length}</span>
            {newBatchCount > 0 && (
              <span className="cd-section-new">{newBatchCount} new</span>
            )}
          </h3>
          <button className="t-jump" onClick={() => nav("/dashboard/import")}>
            전체 Inbox →
          </button>
        </div>
        <div className="cd-batches">
          {cmpBatches.length === 0 ? (
            <div className="t-empty cd-empty">
              <div>아직 이 캠페인으로 받은 글이 없습니다.</div>
              <div className="mute">
                위 프롬프트를 복사 → Claude에 붙여넣어 보세요.
              </div>
            </div>
          ) : (
            cmpBatches.slice(0, 4).map((b) => (
              <div className={"cd-batch-card " + (b.viewed ? "" : "new")} key={b.id}>
                <div className="cd-batch-card-h">
                  <div className="cd-batch-card-hl">
                    <span className={"feed-src " + b.source}>
                      {b.source === "hook" ? "HOOK" : "MAN"}
                    </span>
                    <span className="cd-batch-variant">{b.variantName}</span>
                    <PlatTag platform={b.platform} mode="full" />
                  </div>
                  <div className="cd-batch-card-hr">
                    <span className="mute mono">{timeAgo(b.at)}</span>
                    {!b.viewed && <span className="cd-new-dot" />}
                  </div>
                </div>
                <div className="cd-batch-card-body">
                  {b.posts.map((p) => (
                    <div key={p.id} className={"cd-batch-post " + p.status}>
                      <span className={"parse-tag " + p.status}>
                        {p.status === "ok"
                          ? "OK"
                          : p.status === "warn"
                            ? "WARN"
                            : "ERR"}
                      </span>
                      <span className="cd-batch-post-t">{p.title}</span>
                      {p.warnings.length > 0 && (
                        <span className="cd-batch-warn">
                          {p.warnings.join(", ")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="cd-batch-card-f">
                  <span className="mute">
                    <b>{b.parseOk}</b>/{b.received} 파싱 ·{" "}
                    {b.queued ? "Queue 등록됨" : "Queue 미등록"}
                  </span>
                  <button
                    className="btn-ghost xs"
                    onClick={() => nav("/dashboard/import")}
                  >
                    열기 →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* This campaign's posts */}
      <section className="cd-posts">
        <div className="cd-section-h">
          <h3>
            <I.List size={13} /> 이 캠페인의 글{" "}
            <span className="t-c">{cmpPosts.length}</span>
          </h3>
          <button className="t-jump" onClick={() => nav("/dashboard/posts")}>
            전체 보기 →
          </button>
        </div>
        <div className="cd-posts-list">
          {cmpPosts.slice(0, 8).map((p) => (
            <div
              className="cd-post-row"
              key={p.id}
              onClick={() => nav("/dashboard/posts")}
            >
              <span
                className="dot"
                style={{ background: statusMeta(p.status).dot }}
              />
              <PlatTag platform={p.platform} />
              <span
                className="kind-tag mini"
                style={{
                  color: kindMeta(p.kind).tone,
                  borderColor: kindMeta(p.kind).tone + "55",
                }}
              >
                {kindMeta(p.kind).label}
              </span>
              <span className="cd-post-title">{p.title}</span>
              <span className="mute mono">{timeAgo(p.createdAt)}</span>
              <button
                className="btn-copy xs"
                onClick={(e) => {
                  e.stopPropagation();
                  doCopy(p);
                }}
              >
                <I.Copy size={10} />
              </button>
            </div>
          ))}
          {!cmpPosts.length && (
            <div className="t-empty">아직 글이 없습니다</div>
          )}
        </div>
      </section>
    </div>
  );
}

function CampaignSettingsEditor({
  campaign,
}: {
  campaign: {
    settings?: {
      brand?: string;
      cta?: string;
      tone?: string;
      audience?: string;
      keywords?: string[];
    };
    region: string;
    industry: string;
  };
}) {
  const s = campaign.settings ?? {};
  return (
    <div className="cd-settings-edit">
      <div className="cd-set-grid">
        <div className="cd-set-field">
          <label>업체명</label>
          <input defaultValue={s.brand ?? ""} />
        </div>
        <div className="cd-set-field">
          <label>지역</label>
          <input defaultValue={campaign.region} />
        </div>
        <div className="cd-set-field">
          <label>업종</label>
          <input defaultValue={campaign.industry} />
        </div>
        <div className="cd-set-field">
          <label>CTA</label>
          <input defaultValue={s.cta ?? ""} />
        </div>
        <div className="cd-set-field wide">
          <label>톤 / 스타일</label>
          <input defaultValue={s.tone ?? ""} />
        </div>
        <div className="cd-set-field wide">
          <label>독자 / 타겟</label>
          <input defaultValue={s.audience ?? ""} />
        </div>
        <div className="cd-set-field wide-2">
          <label>키워드</label>
          <div className="cd-set-kws">
            {(s.keywords ?? []).map((k) => (
              <span key={k} className="kw-chip">
                {k} <button className="kw-chip-x">×</button>
              </span>
            ))}
            <button className="kw-chip add">＋ 추가</button>
          </div>
        </div>
      </div>
      <div className="cd-set-foot">
        <span className="mute">
          설정을 바꾸면 위 프롬프트가 즉시 다시 빌드됩니다
        </span>
        <button
          className="btn-primary xs"
          onClick={() => toast.success("저장 (mock)")}
        >
          <I.Check size={11} /> 저장
        </button>
      </div>
    </div>
  );
}
