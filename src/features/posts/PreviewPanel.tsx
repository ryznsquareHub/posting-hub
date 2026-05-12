import { Fragment } from "react";

import { I } from "@/components/icons";
import { STATUSES, KINDS } from "@/data/seed";
import type { Campaign } from "@/types/campaign";
import type { Post, PostStatus } from "@/types/post";

/**
 * 본문 안의 이미지 자리 패턴.
 *   [사진1 — img: https://picsum.photos/seed/hair-salon/800/450]
 *   [사진2 - img: https://picsum.photos/seed/cafe/800/450]
 */
const IMG_LINE_RE = /^\s*\[사진\d+\s*[—\-]\s*img:\s*(https?:\/\/[^\]\s]+)\s*\]\s*$/;
const PICSUM_SEED_RE = /picsum\.photos\/seed\/([^/]+)\//;

function renderBody(body: string): React.ReactNode {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let buf: string[] = [];

  const flush = () => {
    if (buf.length) {
      out.push(
        <pre key={"t" + out.length} className="preview-body-text">
          {buf.join("\n")}
        </pre>,
      );
      buf = [];
    }
  };

  for (const line of lines) {
    const m = IMG_LINE_RE.exec(line);
    if (!m) {
      buf.push(line);
      continue;
    }
    flush();
    const url = m[1];
    const seedMatch = PICSUM_SEED_RE.exec(url);
    const keyword = seedMatch?.[1] ?? "";
    const unsplashUrl = keyword ? `https://unsplash.com/s/photos/${keyword}` : "";

    out.push(
      <div key={"i" + out.length} className="preview-img-wrap">
        <img src={url} alt={keyword || ""} className="preview-img" loading="lazy" />
        <div className="preview-img-actions">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-img-btn"
            title="원본 열기 (새 탭)"
          >
            <I.External size={11} />
          </a>
          <a
            href={url}
            download={`${keyword || "photo"}.jpg`}
            className="preview-img-btn"
            title="이미지 다운로드"
          >
            <I.Download size={11} />
          </a>
          {unsplashUrl && (
            <a
              href={unsplashUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="preview-img-btn"
              title={`unsplash 에서 '${keyword}' 다른 사진 검색`}
            >
              <I.Search size={11} />
            </a>
          )}
        </div>
        {keyword && (
          <div className="preview-img-caption">
            <I.Image size={10} /> {keyword}
          </div>
        )}
      </div>,
    );
  }
  flush();

  return <Fragment>{out}</Fragment>;
}

interface PreviewPanelProps {
  post: Post | null;
  campaign?: Campaign;
  onClose: () => void;
  onCopy: (p: Post) => void;
  onCopyText: (text: string, msg: string) => void;
  onChangeStatus: (id: string, status: PostStatus) => void;
}

function statusMeta(key: string) {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0];
}
function kindMeta(key: string) {
  return KINDS.find((k) => k.key === key) ?? { label: key, tone: "#888" };
}

function PlatTag({
  platform,
  mode = "short",
}: {
  platform: Post["platform"];
  mode?: "short" | "full";
}) {
  const isCafe = platform === "NAVER_CAFE";
  return (
    <span className={"plat-tag " + (isCafe ? "cafe" : "blog")}>
      {mode === "short"
        ? isCafe
          ? "CAFE"
          : "BLOG"
        : isCafe
          ? "Naver Cafe"
          : "Naver Blog"}
    </span>
  );
}

function StatusPill({ status }: { status: PostStatus }) {
  const m = statusMeta(status);
  return (
    <span className="pill sm">
      <span className="pill-dot" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}

export function PreviewPanel({
  post,
  campaign,
  onClose,
  onCopy,
  onCopyText,
  onChangeStatus,
}: PreviewPanelProps) {
  if (!post) {
    return (
      <div className="preview-empty">
        <div className="empty-mark">
          <I.Eye size={18} />
        </div>
        <div className="empty-text">콘텐츠를 선택하면 미리보기가 표시됩니다</div>
        <div className="empty-keys">
          <span>
            <span className="kbd small">J</span>
            <span className="kbd small">K</span> 이동
          </span>
          <span>
            <span className="kbd small">C</span> 복사
          </span>
          <span>
            <span className="kbd small">P</span> 발행완료
          </span>
        </div>
      </div>
    );
  }

  const justCopied = Boolean(post._justCopied);
  const km = kindMeta(post.kind);

  return (
    <div className="preview">
      <div className="preview-head">
        <div className="preview-head-l">
          {campaign && (
            <span
              className="preview-cmp"
              style={{ borderColor: campaign.color + "66" }}
            >
              <span className="cmp-color" style={{ background: campaign.color }} />
              {campaign.name}
            </span>
          )}
          <PlatTag platform={post.platform} mode="full" />
          <StatusPill status={post.status} />
          <span
            className="kind-tag mini"
            style={{ color: km.tone, borderColor: km.tone + "55" }}
          >
            {km.label}
          </span>
        </div>
        <div className="preview-head-r">
          <button className="btn-icon" onClick={onClose} title="닫기 (Esc)">
            <I.X size={12} />
          </button>
        </div>
      </div>

      <div className="preview-title-row">
        <h3 className="preview-title">{post.title}</h3>
        <button
          className="btn-icon-only"
          title="제목 복사 (⇧C)"
          onClick={() => onCopyText(post.title, "제목 복사됨")}
        >
          <I.Copy size={12} />
        </button>
      </div>

      <div className="preview-meta-grid">
        <div>
          <span>지역</span>
          <b>
            <I.MapPin size={10} /> {post.region}
          </b>
        </div>
        <div>
          <span>업종</span>
          <b>{post.industry}</b>
        </div>
        <div>
          <span>복사</span>
          <b>{post.copyCount}회</b>
        </div>
        <div>
          <span>{post.scheduledAt ? "예약" : "생성"}</span>
          <b>
            {new Date(post.scheduledAt ?? post.createdAt).toLocaleString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </b>
        </div>
      </div>

      <div className="preview-kw">
        {post.keywords.map((k) => (
          <button
            key={k}
            className="kw-chip"
            onClick={() => onCopyText(k, `${k} 복사됨`)}
          >
            #{k} <I.Copy size={9} />
          </button>
        ))}
      </div>

      <div className="preview-actions">
        <button
          className={"btn-primary big " + (justCopied ? "ok " : "")}
          onClick={() => onCopy(post)}
        >
          {justCopied ? (
            <>
              <I.Check size={14} strokeWidth={2.4} /> 복사됨 — 상태 변경됨
            </>
          ) : (
            <>
              <I.Copy size={14} /> 본문 복사 <span className="kbd small invert">C</span>
            </>
          )}
        </button>
        <div className="status-change">
          {STATUSES.filter((s) => s.key !== post.status).map((s) => (
            <button
              key={s.key}
              className="status-mini"
              onClick={() => onChangeStatus(post.id, s.key)}
            >
              <span className="pill-dot" style={{ background: s.dot }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="preview-cta">
        <div className="preview-cta-l">CTA</div>
        <div className="preview-cta-r">
          <span>{post.cta}</span>
          <button
            className="btn-icon-only"
            title="CTA 복사 (⌥C)"
            onClick={() => onCopyText(post.cta ?? "", "CTA 복사됨")}
          >
            <I.Copy size={11} />
          </button>
        </div>
      </div>

      <div className="preview-body-wrap">
        <div className="preview-body-h">
          <span>본문</span>
          <span className="body-count">{post.body.length}자</span>
        </div>
        <div className="preview-body">{renderBody(post.body)}</div>
      </div>

      {post.memo && (
        <div className="preview-memo">
          <I.Edit size={10} />
          <span>{post.memo}</span>
        </div>
      )}
    </div>
  );
}
