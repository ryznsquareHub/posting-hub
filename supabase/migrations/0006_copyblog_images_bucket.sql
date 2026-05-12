-- D-011: /copyblog 슬래시 커맨드용 이미지 호스팅 bucket.
-- 외부 블로그 URL → 사진 다운로드 → 5종 변형 → 이 bucket 에 업로드 → public URL 을
-- posts 본문 [사진N — img: <url>] 자리에 박아 PreviewPanel 에서 바로 보이게.

-- 1. public bucket 생성 (이미 있으면 noop)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'copyblog-images',
  'copyblog-images',
  true,
  10485760, -- 10MB / 파일
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. RLS — 모두 read (public bucket 이지만 명시), service_role 만 write
--    스크립트는 SUPABASE_SERVICE_ROLE_KEY 로 업로드. 클라이언트 업로드 차단.

drop policy if exists "copyblog_images_public_read" on storage.objects;
create policy "copyblog_images_public_read"
  on storage.objects for select
  using (bucket_id = 'copyblog-images');

drop policy if exists "copyblog_images_service_write" on storage.objects;
create policy "copyblog_images_service_write"
  on storage.objects for insert
  with check (bucket_id = 'copyblog-images' and auth.role() = 'service_role');

drop policy if exists "copyblog_images_service_update" on storage.objects;
create policy "copyblog_images_service_update"
  on storage.objects for update
  using (bucket_id = 'copyblog-images' and auth.role() = 'service_role');

drop policy if exists "copyblog_images_service_delete" on storage.objects;
create policy "copyblog_images_service_delete"
  on storage.objects for delete
  using (bucket_id = 'copyblog-images' and auth.role() = 'service_role');
