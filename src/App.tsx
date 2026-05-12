import { createBrowserRouter, Navigate } from "react-router-dom";

import DashboardLayout from "./app/dashboard/layout";
import TodayPage from "./app/dashboard/today";
import PostsPage from "./app/dashboard/posts";
import CampaignDetailPage from "./app/dashboard/campaign-detail";
import CampaignCreatePage from "./app/dashboard/campaign-create";
import TemplatesPage from "./app/dashboard/templates";
import PromptLibraryPage from "./app/dashboard/prompt-library";
import IntakePage from "./app/dashboard/intake";
import HistoryPage from "./app/dashboard/history";
import SettingsPage from "./app/dashboard/settings";
import AuthCallbackPage from "./app/auth-callback";
import NotFoundPage from "./app/not-found";

export const router = createBrowserRouter([
  // D-009: Single-user 모드 — RequireAuth 제거. RLS 의 select 정책이 anon 도 허용.
  // /login 직접 진입은 dashboard 로 자동 redirect (팀 모드 복귀 시 보존).
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <Navigate to="/dashboard" replace /> },
  { path: "/auth-callback", element: <AuthCallbackPage /> },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: "posts", element: <PostsPage /> },
      { path: "campaign/new", element: <CampaignCreatePage /> },
      { path: "campaign/:id", element: <CampaignDetailPage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "prompt-library", element: <PromptLibraryPage /> },
      { path: "import", element: <IntakePage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
