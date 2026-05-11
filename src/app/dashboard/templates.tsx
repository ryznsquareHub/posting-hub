import { I } from "@/components/icons";
import { useTemplates } from "@/features/templates/useTemplates";
import { PlatTag, timeAgo } from "@/lib/format/meta";

export default function TemplatesPage() {
  const { data: list = [] } = useTemplates();
  return (
    <div className="tpl-page">
      <div className="t-head">
        <div>
          <h1>플랫폼 템플릿</h1>
          <div className="t-sub">발행 전 본문에 자동 적용되는 형식 변환 규칙</div>
        </div>
        <button className="btn-primary">
          <I.Plus size={12} /> 새 템플릿
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
        {list.map((t) => (
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
        ))}
        {!list.length && <div className="tpl-empty">아직 템플릿이 없습니다</div>}
      </div>
    </div>
  );
}
