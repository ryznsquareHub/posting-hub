/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SUPABASE_URL?: string;
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY?: string;
  /** D-008: 둘 다 있으면 자동 sign-in (single-user 운영) */
  readonly VITE_PUBLIC_AUTO_SIGNIN_EMAIL?: string;
  readonly VITE_PUBLIC_AUTO_SIGNIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
