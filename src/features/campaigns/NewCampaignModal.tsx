import { useEffect, useState } from "react";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { useCreateCampaign } from "./useCreateCampaign";

const PALETTE = [
  "#6e7af0", "#3acc81", "#f5a524", "#e2654a", "#a385ff",
  "#5e80f5", "#f06da5", "#43c7c2", "#d97cf4", "#7bcf52",
];

interface NewCampaignModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function NewCampaignModal({ open, onClose, onCreated }: NewCampaignModalProps) {
  const mut = useCreateCampaign();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [cta, setCta] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platforms, setPlatforms] = useState<("NAVER_BLOG" | "NAVER_CAFE")[]>([
    "NAVER_BLOG",
    "NAVER_CAFE",
  ]);
  const [color, setColor] = useState(PALETTE[0]);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setName("");
      setRegion("");
      setIndustry("");
      setCta("");
      setTone("");
      setAudience("");
      setKeywords("");
      setPlatforms(["NAVER_BLOG", "NAVER_CAFE"]);
      setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }
  }, [open]);

  // Esc 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const slug = "c_" + (name || "new").toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("캠페인 이름을 입력하세요");
      return;
    }
    try {
      const created = await mut.mutateAsync({
        id: slug + "_" + Math.random().toString(36).slice(2, 6),
        name: name.trim(),
        region: region.trim() || undefined,
        industry: industry.trim() || undefined,
        color,
        clientNote: undefined,
        brand: name.trim(),
        platforms,
        cta: cta.trim() || undefined,
        tone: tone.trim() || undefined,
        audience: audience.trim() || undefined,
        keywords: keywords
          .split(/[,，]/)
          .map((k) => k.trim())
          .filter(Boolean),
        startedAt: new Date().toISOString().slice(0, 10),
      });
      toast.success(`'${created.name}' 캠페인 생성됨`);
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      toast.error((err as Error).message ?? "생성 실패");
    }
  };

  const togglePlatform = (p: "NAVER_BLOG" | "NAVER_CAFE") => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <form
        className="copy-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        style={{ maxWidth: 520 }}
      >
        <div className="copy-modal-head">
          <div className="cd-prompt-eyebrow">NEW CAMPAIGN</div>
          <span className="preview-title" style={{ margin: 0, fontSize: 14 }}>
            새 캠페인
          </span>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="닫기 (Esc)"
          >
            <I.X size={12} />
          </button>
        </div>

        <div className="cd-set-grid" style={{ padding: 16 }}>
          <div className="cd-set-field wide-2">
            <label>캠페인 이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 신촌 와인바"
              autoFocus
            />
          </div>
          <div className="cd-set-field">
            <label>지역</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="서울 · 신촌"
            />
          </div>
          <div className="cd-set-field">
            <label>업종</label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="F&B"
            />
          </div>
          <div className="cd-set-field wide">
            <label>CTA</label>
            <input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="네이버 톡톡 예약 · 인스타 DM"
            />
          </div>
          <div className="cd-set-field wide">
            <label>톤 / 스타일</label>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="감성 · 데이트 톤"
            />
          </div>
          <div className="cd-set-field wide">
            <label>독자 / 타겟</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="20-30대 커플"
            />
          </div>
          <div className="cd-set-field wide-2">
            <label>키워드 (쉼표로 구분)</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="신촌 와인바, 데이트, 분위기 좋은 식당"
            />
          </div>
          <div className="cd-set-field">
            <label>플랫폼</label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["NAVER_BLOG", "NAVER_CAFE"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={"btn-ghost xs " + (platforms.includes(p) ? "on" : "")}
                  onClick={() => togglePlatform(p)}
                  style={{
                    background: platforms.includes(p)
                      ? "var(--bg-3)"
                      : undefined,
                    color: platforms.includes(p)
                      ? "var(--text-hi)"
                      : undefined,
                    borderColor: platforms.includes(p)
                      ? "var(--border-2)"
                      : undefined,
                  }}
                >
                  {p === "NAVER_BLOG" ? "Blog" : "Cafe"}
                </button>
              ))}
            </div>
          </div>
          <div className="cd-set-field">
            <label>색상</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {PALETTE.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: c,
                    cursor: "pointer",
                    border:
                      color === c
                        ? "2px solid var(--text-hi)"
                        : "1px solid var(--border-1)",
                    padding: 0,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="copy-modal-foot">
          <span className="kbd-hint">{name ? `id: ${slug}_xxxx` : "이름 필수"}</span>
          <button
            type="submit"
            className="btn-primary"
            disabled={mut.isPending || !name.trim()}
          >
            {mut.isPending ? (
              <>
                <I.Loader size={12} className="animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <I.Plus size={12} />
                캠페인 생성
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
