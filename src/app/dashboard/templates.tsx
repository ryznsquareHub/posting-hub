import { toast } from "sonner";

import { I } from "@/components/icons";
import { useTemplates } from "@/features/templates/useTemplates";
import { useCreateTemplate } from "@/features/templates/useCreateTemplate";
import { PlatTag, timeAgo } from "@/lib/format/meta";

export default function TemplatesPage() {
  const { data: list = [], isLoading } = useTemplates();
  const create = useCreateTemplate();

  const onNew = async () => {
    const name = window.prompt("새 템플릿 이름");
    if (!name?.trim()) return;
    const platStr = window.prompt(
      "플랫폼 (BLOG 또는 CAFE — 기본 BLOG)",
      "BLOG",
    );
    const platform = (platStr ?? "BLOG").toUpperCase().includes("CAFE")
      ? ("NAVER_CAFE" as const)
      : ("NAVER_BLOG" as const);
    try {
      await create.mutateAsync({ name: name.trim(), platform });
      toast.success(`'${name.trim()}' 템플릿 추가`);
    } catch (e) {
      toast.error((e as Error).message ?? "추가 실패");
    }
  };

  return (
    <div className="tpl-page">
      <div className="t-head">
        <div>
          <h1>플랫폼 템플릿</h1>
          <div className="t-sub">발행 전 본문에 자동 적용되는 형식 변환 규칙</div>
        </div>
        <button className="btn-primary" onClick={onNew} disabled={create.isPending}>
          {create.isPending ? (
            <I.Loader size={12} className="animate-spin" />
          ) : (
            <I.Plus size={12} />
          )}{" "}
          새 템플릿
        </button>
      </div>
      <div className="tpl-table">
        <div className="tpl-th">
          <div>이름</div>
          <div>플랫폼</div>
          <div>사용</div>
          <div>수정</div>
          <div />
        </div>
        {isLoading && list.length === 0 ? (
          <div className="tpl-empty">불러오는 중...</div>
        ) : list.length === 0 ? (
          <div className="tpl-empty">아직 템플릿이 없습니다 — 위 버튼으로 추가</div>
        ) : (
          list.map((t) => (
            <div className="tpl-row" key={t.id}>
              <div className="tpl-name">{t.name}</div>
              <div>
                <PlatTag platform={t.platform} mode="full" />
              </div>
              <div className="tpl-mono">{t.uses}회</div>
              <div className="tpl-mono mute">{timeAgo(t.updatedAt)}</div>
              <div className="tpl-actions">
                <button className="btn-icon" title="편집">
                  <I.Edit size={11} />
                </button>
                <button className="btn-icon" title="복제">
                  <I.Copy size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
