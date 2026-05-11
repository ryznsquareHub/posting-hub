/**
 * 디자인 톤에 맞는 skeleton. design.css 의 token 사용.
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={"sk-pulse " + className}
      style={{
        background: "var(--bg-2)",
        borderRadius: 4,
        ...style,
      }}
    />
  );
}

/** Posts row 8 컬럼 grid 자리표시 */
export function PostsListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rows">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="row compact"
          style={{
            background: i % 2 === 0 ? "transparent" : "var(--bg-1)",
            opacity: 0.6,
          }}
        >
          <div className="row-check">
            <Skeleton style={{ width: 14, height: 14, borderRadius: 3 }} />
          </div>
          <div className="row-status">
            <Skeleton style={{ width: 8, height: 8, borderRadius: 4 }} />
          </div>
          <div className="row-cmp">
            <Skeleton style={{ width: 90, height: 11 }} />
          </div>
          <div className="row-title" style={{ flex: 1 }}>
            <Skeleton style={{ width: "70%", height: 12, marginBottom: 4 }} />
            <Skeleton style={{ width: "40%", height: 10 }} />
          </div>
          <div className="row-kind">
            <Skeleton style={{ width: 36, height: 12 }} />
          </div>
          <div className="row-status-text">
            <Skeleton style={{ width: 44, height: 12 }} />
          </div>
          <div className="row-copies" />
          <div className="row-time">
            <Skeleton style={{ width: 60, height: 11 }} />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes sk-pulse {
          0%,100% { opacity: 0.55; }
          50% { opacity: 0.25; }
        }
        .sk-pulse { animation: sk-pulse 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
