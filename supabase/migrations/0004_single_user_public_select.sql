-- D-009: Single-user 모드 — anon 도 read + modify 가능
-- 본인만 anon key 보유 가정. Magic-link / password 흐름 우회 + Dashboard 직진.
-- 팀 모드 확장 시 0005 으로 owner_id = auth.uid() 복귀.
--
-- 멱등성: drop if exists + create. 여러 번 실행 안전.

-- ── SELECT 정책: anon read 허용 ────────────────────────────────────────
drop policy if exists "campaigns_owner_select" on public.campaigns;
drop policy if exists "campaigns_public_select" on public.campaigns;
create policy "campaigns_public_select" on public.campaigns for select using (true);

drop policy if exists "posts_owner_select" on public.posts;
drop policy if exists "posts_public_select" on public.posts;
create policy "posts_public_select" on public.posts for select using (true);

drop policy if exists "prompts_owner_select" on public.prompts;
drop policy if exists "prompts_public_select" on public.prompts;
create policy "prompts_public_select" on public.prompts for select using (true);

drop policy if exists "templates_owner_select" on public.templates;
drop policy if exists "templates_public_select" on public.templates;
create policy "templates_public_select" on public.templates for select using (true);

drop policy if exists "hooks_owner_select" on public.hooks;
drop policy if exists "hooks_public_select" on public.hooks;
create policy "hooks_public_select" on public.hooks for select using (true);

drop policy if exists "intake_events_owner_select" on public.intake_events;
drop policy if exists "intake_events_public_select" on public.intake_events;
create policy "intake_events_public_select" on public.intake_events for select using (true);

drop policy if exists "imports_owner_select" on public.imports;
drop policy if exists "imports_public_select" on public.imports;
create policy "imports_public_select" on public.imports for select using (true);

drop policy if exists "campaign_variants_owner_select" on public.campaign_variants;
drop policy if exists "campaign_variants_public_select" on public.campaign_variants;
create policy "campaign_variants_public_select" on public.campaign_variants for select using (true);

-- ── MODIFY 정책: anon insert/update/delete 도 허용 ────────────────────
drop policy if exists "campaigns_owner_modify" on public.campaigns;
drop policy if exists "campaigns_public_modify" on public.campaigns;
create policy "campaigns_public_modify" on public.campaigns for all using (true) with check (true);

drop policy if exists "posts_owner_modify" on public.posts;
drop policy if exists "posts_public_modify" on public.posts;
create policy "posts_public_modify" on public.posts for all using (true) with check (true);

drop policy if exists "prompts_owner_modify" on public.prompts;
drop policy if exists "prompts_public_modify" on public.prompts;
create policy "prompts_public_modify" on public.prompts for all using (true) with check (true);

drop policy if exists "templates_owner_modify" on public.templates;
drop policy if exists "templates_public_modify" on public.templates;
create policy "templates_public_modify" on public.templates for all using (true) with check (true);

drop policy if exists "hooks_owner_modify" on public.hooks;
drop policy if exists "hooks_public_modify" on public.hooks;
create policy "hooks_public_modify" on public.hooks for all using (true) with check (true);

drop policy if exists "intake_events_owner_modify" on public.intake_events;
drop policy if exists "intake_events_public_modify" on public.intake_events;
create policy "intake_events_public_modify" on public.intake_events for all using (true) with check (true);

drop policy if exists "imports_owner_modify" on public.imports;
drop policy if exists "imports_public_modify" on public.imports;
create policy "imports_public_modify" on public.imports for all using (true) with check (true);

drop policy if exists "campaign_variants_owner_modify" on public.campaign_variants;
drop policy if exists "campaign_variants_public_modify" on public.campaign_variants;
create policy "campaign_variants_public_modify" on public.campaign_variants for all using (true) with check (true);
