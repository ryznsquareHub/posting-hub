import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="h-dvh grid place-items-center bg-bg text-center px-6">
      <div>
        <div className="text-text-dim text-xxs font-mono mb-2">404</div>
        <h1 className="text-text-hi text-xl font-semibold tracking-tight2 mb-1">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-text-mid text-sm mb-4">
          요청한 경로가 PostingHub 에 없습니다.
        </p>
        <Link to="/dashboard" className="btn-primary">
          Today 로 이동
        </Link>
      </div>
    </div>
  );
}
