import { createBrowserRouter, Navigate } from "react-router-dom";

import { RequireAuth } from "./lib/auth/RequireAuth";

import DashboardLayout from "./app/dashboard/layout";
import TodayPage from "./app/dashboard/today";
import PostsPage from "./app/dashboard/posts";
import CampaignDetailPage from "./app/dashboard/campaign-detail";
import TemplatesPage from "./app/dashboard/templates";
import PromptLibraryPage from "./app/dashboard/prompt-library";
import IntakePage from "./app/dashboard/intake";
import HistoryPage from "./app/dashboard/history";
import SettingsPage from "./app/dashboard/settings";
import LoginPage from "./app/login";
import AuthCallbackPage from "./app/auth-callback";
import NotFoundPage from "./app/not-found";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/auth-callback", element: <AuthCallbackPage /> },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <TodayPage /> },
      { path: "posts", element: <PostsPage /> },
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
