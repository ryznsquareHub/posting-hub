-- D-010: posts ←→ intake_events 1:1 매핑.
-- Intake row 의 캠페인 재지정 시 새 posts row 가 누적되는 버그 차단.
-- 같은 intake_event 가 두 번 promote 되면 update 만, 새 row 는 안 생긴다.

alter table public.posts
  add column if not exists source_intake_id text null;

create unique index if not exists posts_source_intake_id_uniq
  on public.posts(source_intake_id)
  where source_intake_id is not null;

comment on column public.posts.source_intake_id is
  'intake_events.id — 이 posts row 가 어느 intake 에서 자동 승급됐는지. 같은 intake 가 다시 매칭되면 update 만, insert 안 함.';
