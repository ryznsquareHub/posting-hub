import { useEffect, useState } from "react";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { useCreatePrompt } from "./useCreatePrompt";

const DEFAULT_OUTPUT_FORMAT = `#CAMPAIGN: {campaign}
#PLATFORM: BLOG|CAFE
#KIND: 원본|변형|재활용
#KEYWORDS: kw1, kw2
#REGION: ...
#INDUSTRY: ...
#CTA: ...

제목: ...

본문:
...`;

interface NewPromptModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function NewPromptModal({ open, onClose, onCreated }: NewPromptModalProps) {
  const mut = useCreatePrompt();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [platform, setPlatform] = useState<"NAVER_BLOG" | "NAVER_CAFE">(
    "NAVER_BLOG",
  );
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [autoParse, setAutoParse] = useState(true);

  useEffect(() => {
    if (open) {
      setName("");
      setCategory("");
      setPlatform("NAVER_BLOG");
      setDescription("");
      setBody("");
      setSchedule("");
      setWebhookEnabled(true);
      setAutoParse(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      toast.error("이름 + 본문 필수");
      return;
    }
    try {
      const id = "pr_" + Math.random().toString(36).slice(2, 8);
      const created = await mut.mutateAsync({
        id,
        name: name.trim(),
        category: category.trim() || "기타",
        platform,
        description: description.trim() || undefined,
        variables: [],
        outputFormat: DEFAULT_OUTPUT_FORMAT,
        body: body.trim(),
        webhookEnabled,
        autoParse,
        schedule: schedule.trim() || null,
      });
      toast.success(`'${created.name}' 워크플로우 생성`);
      onCreated?.(created.id);
      onClose();
    } catch (err) {
      toast.error((err as Error).message ?? "생성 실패");
    }
  };

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <form
        className="copy-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        style={{ maxWidth: 640 }}
      >
        <div className="copy-modal-head">
          <div className="cd-prompt-eyebrow">NEW WORKFLOW</div>
          <span className="preview-title" style={{ margin: 0, fontSize: 14 }}>
            새 Prompt / Workflow
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
          <div className="cd-set-field wide">
            <label>이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 청주 식당 후기형"
              autoFocus
            />
          </div>
          <div className="cd-set-field">
            <label>카테고리</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="F&B / 의료 / 맘카페..."
            />
          </div>
          <div className="cd-set-field">
            <label>플랫폼</label>
            <div style={{ display: "flex", gap: 6 }}>
              {(["NAVER_BLOG", "NAVER_CAFE"] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className="btn-ghost xs"
                  onClick={() => setPlatform(p)}
                  style={{
                    background: platform === p ? "var(--bg-3)" : undefined,
                    color: platform === p ? "var(--text-hi)" : undefined,
                    borderColor: platform === p ? "var(--border-2)" : undefined,
                  }}
                >
                  {p === "NAVER_BLOG" ? "Blog" : "Cafe"}
                </button>
              ))}
            </div>
          </div>
          <div className="cd-set-field wide-2">
            <label>설명</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 워크플로우가 만들 글의 톤 / 형식 한 줄"
            />
          </div>
          <div className="cd-set-field wide-2">
            <label>Prompt 본문 *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="너는 ... &#10;&#10;출력 형식: &#10;#CAMPAIGN: ...&#10;..."
              rows={8}
              style={{
                width: "100%",
                padding: 8,
                background: "var(--bg-2)",
                border: "1px solid var(--border-1)",
                borderRadius: 6,
                color: "var(--text)",
                fontFamily: "var(--mono)",
                fontSize: 12,
                resize: "vertical",
              }}
            />
          </div>
          <div className="cd-set-field">
            <label>스케줄</label>
            <input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="매일 08:30 (비우면 수동)"
            />
          </div>
          <div className="cd-set-field">
            <label>옵션</label>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <label
                style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={webhookEnabled}
                  onChange={(e) => setWebhookEnabled(e.target.checked)}
                />
                <span>Webhook enabled</span>
              </label>
              <label
                style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={autoParse}
                  onChange={(e) => setAutoParse(e.target.checked)}
                />
                <span>Auto parse</span>
              </label>
            </div>
          </div>
        </div>

        <div className="copy-modal-foot">
          <span className="kbd-hint">{body.length}자 prompt body</span>
          <button
            type="submit"
            className="btn-primary"
            disabled={mut.isPending || !name.trim() || !body.trim()}
          >
            {mut.isPending ? (
              <>
                <I.Loader size={12} className="animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <I.Plus size={12} />
                Prompt 생성
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
