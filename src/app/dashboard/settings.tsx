import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { usePostsShell } from "./posts-shell";

const SETTINGS_SECTIONS = [
  { id: "workspace", label: "Workspace", hint: "이름 · 지역 · 시간대" },
  { id: "hook", label: "Hook & Webhook", hint: "엔드포인트 · Secret · 재시도" },
  { id: "claude", label: "Claude 연동", hint: "모델 · 프롬프트 prepend" },
  { id: "defaults", label: "기본값", hint: "톤 · 키워드 · 변형 수" },
  { id: "members", label: "Members", hint: "팀 · 권한 · SSO" },
  { id: "notifications", label: "Notifications", hint: "알림 채널 · 이벤트" },
  { id: "api", label: "API & Tokens", hint: "PAT · 사용 통계" },
  { id: "billing", label: "Billing", hint: "플랜 · 사용량" },
  { id: "danger", label: "Danger Zone", hint: "전송 · 삭제" },
] as const;

type SectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

export default function SettingsPage() {
  const { copyText } = usePostsShell();
  const [active, setActive] = useState<SectionId>("workspace");
  const [dirty, setDirty] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const [ws, setWs] = useState({
    name: "PostingHub Workspace",
    slug: "postinghub-main",
    timezone: "Asia/Seoul (UTC+9)",
    locale: "ko-KR",
    defaultPlatforms: ["NAVER_BLOG", "NAVER_CAFE"] as string[],
  });

  const [hook, setHook] = useState({
    endpoint:
      "https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake",
    secret: "phk_dev_••••••••••",
    autoParse: true,
    retry: 3,
    retryBackoff: "exponential" as "linear" | "exponential" | "fixed",
    timeout: 30,
    allowlist: ["claude.ai", "api.anthropic.com"] as string[],
    hmacHeader: "X-PostingHub-Signature",
    lastReceived: "2026-05-12T09:42:18",
    requestsToday: 47,
    errorsToday: 1,
  });

  const [claude, setClaude] = useState({
    model: "claude-opus-4-7",
    maxTokens: 8192,
    temperature: 0.7,
    promptPrepend:
      "너는 네이버 블로그/카페 마케팅 카피라이터다. 한국어로 자연스럽게, 광고 티 나지 않게 작성한다.",
    outputFormat: "JSON" as "JSON" | "MARKDOWN" | "XML",
  });

  const [defaults, setDefaults] = useState({
    tone: "친근",
    ctaChannels: ["전화", "카톡채널"] as string[],
    keywordsPerPost: 4,
    variantsPerCampaign: 3,
    bodyMinChars: 800,
    bodyMaxChars: 1600,
    hashtagsMax: 5,
  });

  const members = [
    {
      id: "u1",
      name: "Founder",
      email: "creative.field666@gmail.com",
      role: "Owner",
      avatar: "#6e7af0",
      lastActive: "방금",
    },
  ];

  const [notify, setNotify] = useState({
    slack: {
      on: false,
      channel: "#posting-ops",
      webhook: "https://hooks.slack.com/services/T0••••/B0••••/x••••",
    },
    email: { on: false, list: "creative.field666@gmail.com" },
    events: {
      hook_error: true,
      hook_received: false,
      publish: true,
      schedule_due: true,
      campaign_created: false,
      copy_burst: true,
    } as Record<string, boolean>,
  });

  const tokens = [
    {
      id: "t1",
      name: "Claude.ai Connector",
      prefix: "phk_dev_f97c",
      createdAt: "2026-05-11",
      lastUsed: "2026-05-12T09:42",
      scopes: ["write:intake", "read:campaigns"],
    },
  ];

  function markDirty<T extends object>(
    setter: React.Dispatch<React.SetStateAction<T>>,
  ) {
    return <K extends keyof T>(k: K, v: T[K]) => {
      setter((prev) => ({ ...prev, [k]: v }));
      setDirty(true);
    };
  }

  const onSave = () => {
    setDirty(false);
    toast.success("설정이 저장되었습니다");
  };

  useEffect(() => {
    const sc = scrollRef.current;
    if (!sc) return;
    const onScroll = () => {
      const top = sc.scrollTop;
      for (const s of SETTINGS_SECTIONS) {
        const el = sectionRefs.current[s.id];
        if (el && el.offsetTop - 40 > top) {
          setActive(s.id);
          return;
        }
      }
      setActive(SETTINGS_SECTIONS[SETTINGS_SECTIONS.length - 1].id);
    };
    sc.addEventListener("scroll", onScroll);
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty]);

  const jumpTo = (id: SectionId) => {
    const el = sectionRefs.current[id];
    const sc = scrollRef.current;
    if (el && sc) {
      sc.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
      setActive(id);
    }
  };

  const setWsField = markDirty(setWs);
  const setHookField = markDirty(setHook);
  const setClaudeField = markDirty(setClaude);
  const setDefaultsField = markDirty(setDefaults);

  return (
    <div className="set-page">
      <div className="set-head">
        <div className="set-head-l">
          <div className="set-head-eyebrow mono">
            /dashboard/settings · workspace · {ws.slug}
          </div>
          <div className="set-head-t">Settings</div>
        </div>
        <div className="set-head-r">
          {dirty && <span className="set-dirty">● 저장되지 않은 변경사항</span>}
          <button
            className="btn-ghost sm"
            onClick={() => setDirty(false)}
            disabled={!dirty}
          >
            되돌리기
          </button>
          <button
            className={"btn-primary sm " + (!dirty ? "disabled" : "")}
            onClick={onSave}
            disabled={!dirty}
          >
            저장 <span className="kbd">⌘S</span>
          </button>
        </div>
      </div>

      <div className="set-body">
        <aside className="set-toc">
          {SETTINGS_SECTIONS.map((s) => (
            <button
              key={s.id}
              className={
                "set-toc-it " +
                (active === s.id ? "on " : "") +
                (s.id === "danger" ? "danger" : "")
              }
              onClick={() => jumpTo(s.id)}
            >
              <span className="set-toc-l">{s.label}</span>
              <span className="set-toc-h">{s.hint}</span>
            </button>
          ))}
        </aside>

        <main className="set-scroll" ref={scrollRef}>
          {/* Workspace */}
          <SetSection
            id="workspace"
            title="Workspace"
            subtitle="이 워크스페이스의 정체성. 이름은 URL에 영향을 주지 않습니다."
            refMap={sectionRefs}
          >
            <SetField2col>
              <SetField label="Workspace 이름" required>
                <input
                  className="set-input"
                  value={ws.name}
                  onChange={(e) => setWsField("name", e.target.value)}
                />
              </SetField>
              <SetField label="Slug (URL용)" hint="hub.posting/{slug}">
                <div className="set-prefix-input">
                  <span className="set-prefix-l mono">hub.posting/</span>
                  <input
                    className="set-input"
                    value={ws.slug}
                    onChange={(e) => setWsField("slug", e.target.value)}
                  />
                </div>
              </SetField>
              <SetField label="기본 시간대">
                <select
                  className="set-input"
                  value={ws.timezone}
                  onChange={(e) => setWsField("timezone", e.target.value)}
                >
                  <option>Asia/Seoul (UTC+9)</option>
                  <option>Asia/Tokyo (UTC+9)</option>
                  <option>UTC</option>
                </select>
              </SetField>
              <SetField label="언어">
                <select
                  className="set-input"
                  value={ws.locale}
                  onChange={(e) => setWsField("locale", e.target.value)}
                >
                  <option value="ko-KR">한국어 (ko-KR)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </SetField>
            </SetField2col>
            <SetField label="기본 플랫폼" hint="새 캠페인 생성 시 기본 선택" full>
              <div className="set-chips">
                {["NAVER_BLOG", "NAVER_CAFE", "TISTORY", "BRUNCH"].map((p) => {
                  const on = ws.defaultPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      className={"set-chip " + (on ? "on" : "")}
                      onClick={() =>
                        setWsField(
                          "defaultPlatforms",
                          on
                            ? ws.defaultPlatforms.filter((x) => x !== p)
                            : [...ws.defaultPlatforms, p],
                        )
                      }
                    >
                      {p
                        .replace("NAVER_", "Naver ")
                        .replace("BLOG", "Blog")
                        .replace("CAFE", "Cafe")
                        .replace("TISTORY", "Tistory")
                        .replace("BRUNCH", "Brunch")}
                    </button>
                  );
                })}
              </div>
            </SetField>
          </SetSection>

          {/* Hook & Webhook */}
          <SetSection
            id="hook"
            title="Hook & Webhook"
            subtitle="Claude 결과를 받는 엔드포인트. Manual paste fallback은 항상 사용 가능합니다."
            refMap={sectionRefs}
          >
            <div className="set-status-card">
              <div className="set-status-l">
                <span className="live-dot live">
                  <span className="live-pulse" />
                </span>
                <div>
                  <div className="set-status-t">Hook 활성</div>
                  <div className="set-status-s mono">
                    마지막 수신 {hook.lastReceived.slice(11, 16)} · 오늘{" "}
                    {hook.requestsToday}회 · 에러 {hook.errorsToday}
                  </div>
                </div>
              </div>
              <div className="set-status-r">
                <button
                  className="btn-ghost sm"
                  onClick={() => copyText(hook.endpoint, "endpoint 복사됨")}
                >
                  <I.Copy size={11} /> URL 복사
                </button>
                <button className="btn-ghost sm">테스트 호출</button>
              </div>
            </div>

            <SetField label="엔드포인트 URL" full>
              <div className="set-prefix-input">
                <input
                  className="set-input mono"
                  value={hook.endpoint}
                  readOnly
                />
                <button
                  className="set-input-act"
                  onClick={() => copyText(hook.endpoint, "endpoint 복사됨")}
                >
                  <I.Copy size={12} />
                </button>
              </div>
            </SetField>
            <SetField label="Webhook Secret" hint="HMAC SHA-256 서명에 사용" full>
              <div className="set-prefix-input">
                <input className="set-input mono" value={hook.secret} readOnly />
                <button
                  className="set-input-act"
                  onClick={() => copyText(hook.secret, "secret 복사됨")}
                >
                  <I.Copy size={12} />
                </button>
                <button className="set-input-act" title="재발급">
                  ↻
                </button>
              </div>
            </SetField>
            <SetField label="HMAC Header" full>
              <input
                className="set-input mono"
                value={hook.hmacHeader}
                onChange={(e) => setHookField("hmacHeader", e.target.value)}
              />
            </SetField>

            <SetField2col>
              <SetField label="자동 파싱">
                <SetToggle
                  on={hook.autoParse}
                  onClick={() => setHookField("autoParse", !hook.autoParse)}
                  labelOn="ON — 수신 즉시 글로 변환"
                  labelOff="OFF — 수동 검토 후 적용"
                />
              </SetField>
              <SetField label="타임아웃" hint="초">
                <Stepper
                  v={hook.timeout}
                  onCh={(v) => setHookField("timeout", v)}
                  min={5}
                  max={120}
                  step={5}
                  unit="s"
                />
              </SetField>
              <SetField label="재시도 횟수">
                <Stepper
                  v={hook.retry}
                  onCh={(v) => setHookField("retry", v)}
                  min={0}
                  max={10}
                />
              </SetField>
              <SetField label="Backoff 전략">
                <Radio
                  v={hook.retryBackoff}
                  options={[
                    ["linear", "Linear"],
                    ["exponential", "Exp"],
                    ["fixed", "Fixed"],
                  ]}
                  onCh={(v) =>
                    setHookField("retryBackoff", v as typeof hook.retryBackoff)
                  }
                />
              </SetField>
            </SetField2col>

            <SetField
              label="IP / 도메인 Allowlist"
              hint="Hook 호출을 허용할 출처. 빈 값이면 모두 허용"
              full
            >
              <div className="set-list">
                {hook.allowlist.map((ip, i) => (
                  <div key={ip + i} className="set-list-row mono">
                    <span>{ip}</span>
                    <button
                      className="set-list-x"
                      onClick={() =>
                        setHookField(
                          "allowlist",
                          hook.allowlist.filter((_, j) => j !== i),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="set-list-add">
                  <input
                    className="set-input set-input-bare mono"
                    placeholder="3.84.x.x 또는 example.com"
                    onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        setHookField("allowlist", [
                          ...hook.allowlist,
                          e.currentTarget.value.trim(),
                        ]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <span className="kbd-hint">↵ 추가</span>
                </div>
              </div>
            </SetField>
          </SetSection>

          {/* Claude */}
          <SetSection
            id="claude"
            title="Claude 연동"
            subtitle="생성 단계에서 사용할 모델 및 시스템 프롬프트"
            refMap={sectionRefs}
          >
            <SetField2col>
              <SetField label="모델">
                <select
                  className="set-input"
                  value={claude.model}
                  onChange={(e) => setClaudeField("model", e.target.value)}
                >
                  <option value="claude-opus-4-7">claude-opus-4-7</option>
                  <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                  <option value="claude-haiku-4-5">claude-haiku-4-5</option>
                </select>
              </SetField>
              <SetField label="Max Tokens">
                <Stepper
                  v={claude.maxTokens}
                  onCh={(v) => setClaudeField("maxTokens", v)}
                  min={1024}
                  max={32768}
                  step={1024}
                />
              </SetField>
              <SetField
                label="Temperature"
                hint={`현재 ${claude.temperature.toFixed(1)} · 0=결정적, 1=자유`}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={claude.temperature}
                  className="set-range"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setClaudeField("temperature", Number(e.target.value))
                  }
                />
              </SetField>
              <SetField label="출력 포맷">
                <Radio
                  v={claude.outputFormat}
                  options={[
                    ["JSON", "JSON"],
                    ["MARKDOWN", "Markdown"],
                    ["XML", "XML"],
                  ]}
                  onCh={(v) =>
                    setClaudeField(
                      "outputFormat",
                      v as typeof claude.outputFormat,
                    )
                  }
                />
              </SetField>
            </SetField2col>
            <SetField
              label="시스템 프롬프트 prepend"
              hint="모든 캠페인 프롬프트 앞에 자동 삽입"
              full
            >
              <textarea
                className="set-input set-textarea"
                rows={3}
                value={claude.promptPrepend}
                onChange={(e) =>
                  setClaudeField("promptPrepend", e.target.value)
                }
              />
            </SetField>
          </SetSection>

          {/* Defaults */}
          <SetSection
            id="defaults"
            title="새 캠페인 기본값"
            subtitle="캠페인 생성 시 자동으로 채워지는 초기값"
            refMap={sectionRefs}
          >
            <SetField2col>
              <SetField label="기본 톤">
                <Radio
                  v={defaults.tone}
                  options={[
                    ["친근", "친근"],
                    ["전문", "전문"],
                    ["감성", "감성"],
                    ["정보", "정보"],
                    ["솔직", "솔직"],
                  ]}
                  onCh={(v) => setDefaultsField("tone", v)}
                />
              </SetField>
              <SetField label="기본 CTA 채널">
                <div className="set-chips">
                  {["전화", "카톡채널", "링크", "DM", "폼"].map((c) => {
                    const on = defaults.ctaChannels.includes(c);
                    return (
                      <button
                        key={c}
                        className={"set-chip sm " + (on ? "on" : "")}
                        onClick={() =>
                          setDefaultsField(
                            "ctaChannels",
                            on
                              ? defaults.ctaChannels.filter((x) => x !== c)
                              : [...defaults.ctaChannels, c],
                          )
                        }
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </SetField>
              <SetField label="키워드 / 글">
                <Stepper
                  v={defaults.keywordsPerPost}
                  onCh={(v) => setDefaultsField("keywordsPerPost", v)}
                  min={1}
                  max={10}
                />
              </SetField>
              <SetField label="Variant / 캠페인">
                <Stepper
                  v={defaults.variantsPerCampaign}
                  onCh={(v) => setDefaultsField("variantsPerCampaign", v)}
                  min={1}
                  max={8}
                />
              </SetField>
              <SetField label="본문 최소 자수">
                <Stepper
                  v={defaults.bodyMinChars}
                  onCh={(v) => setDefaultsField("bodyMinChars", v)}
                  min={300}
                  max={3000}
                  step={100}
                />
              </SetField>
              <SetField label="본문 최대 자수">
                <Stepper
                  v={defaults.bodyMaxChars}
                  onCh={(v) => setDefaultsField("bodyMaxChars", v)}
                  min={500}
                  max={5000}
                  step={100}
                />
              </SetField>
              <SetField label="해시태그 최대 수">
                <Stepper
                  v={defaults.hashtagsMax}
                  onCh={(v) => setDefaultsField("hashtagsMax", v)}
                  min={0}
                  max={15}
                />
              </SetField>
            </SetField2col>
          </SetSection>

          {/* Members */}
          <SetSection
            id="members"
            title="Members"
            subtitle={`팀원 ${members.length}명 · 권한별로 캠페인 접근 제어`}
            refMap={sectionRefs}
            action={
              <button className="btn-primary sm">
                <I.Plus size={11} /> 멤버 초대
              </button>
            }
          >
            <div className="set-table">
              <div className="set-table-h">
                <span>멤버</span>
                <span>이메일</span>
                <span>권한</span>
                <span>최근 접속</span>
                <span></span>
              </div>
              {members.map((m) => (
                <div key={m.id} className="set-table-r">
                  <span className="set-m-l">
                    <span className="set-m-av" style={{ background: m.avatar }}>
                      {m.name[0]}
                    </span>
                    <span className="set-m-n">{m.name}</span>
                  </span>
                  <span className="set-m-em mono">{m.email}</span>
                  <span>
                    <span className={"set-role role-" + m.role.toLowerCase()}>
                      {m.role}
                    </span>
                  </span>
                  <span className="set-m-la">{m.lastActive}</span>
                  <span className="set-m-act">
                    <button className="set-mini">⋯</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="set-sso-card">
              <div>
                <div className="set-sso-t">SSO / SAML</div>
                <div className="set-sso-s">
                  Google Workspace · @postinghub.kr 자동 가입
                </div>
              </div>
              <SetToggle on={false} onClick={() => undefined} compact />
            </div>
          </SetSection>

          {/* Notifications */}
          <SetSection
            id="notifications"
            title="Notifications"
            subtitle="중요한 이벤트를 외부 채널로 전송"
            refMap={sectionRefs}
          >
            <div className="set-notify-block">
              <div className="set-notify-h">
                <span className="set-notify-name">Slack</span>
                <SetToggle
                  on={notify.slack.on}
                  onClick={() => {
                    setNotify({
                      ...notify,
                      slack: { ...notify.slack, on: !notify.slack.on },
                    });
                    setDirty(true);
                  }}
                  compact
                />
              </div>
              <div className="set-notify-body">
                <SetField label="채널">
                  <input
                    className="set-input mono"
                    value={notify.slack.channel}
                    onChange={(e) => {
                      setNotify({
                        ...notify,
                        slack: { ...notify.slack, channel: e.target.value },
                      });
                      setDirty(true);
                    }}
                  />
                </SetField>
                <SetField label="Webhook URL" full>
                  <div className="set-prefix-input">
                    <input
                      className="set-input mono"
                      value={notify.slack.webhook}
                      readOnly
                    />
                    <button
                      className="set-input-act"
                      onClick={() =>
                        copyText(notify.slack.webhook, "Slack webhook 복사됨")
                      }
                    >
                      <I.Copy size={12} />
                    </button>
                  </div>
                </SetField>
              </div>
            </div>

            <div className="set-notify-block">
              <div className="set-notify-h">
                <span className="set-notify-name">Email</span>
                <SetToggle
                  on={notify.email.on}
                  onClick={() => {
                    setNotify({
                      ...notify,
                      email: { ...notify.email, on: !notify.email.on },
                    });
                    setDirty(true);
                  }}
                  compact
                />
              </div>
              <div className="set-notify-body">
                <SetField label="수신 이메일" full>
                  <input
                    className="set-input mono"
                    value={notify.email.list}
                    onChange={(e) => {
                      setNotify({
                        ...notify,
                        email: { ...notify.email, list: e.target.value },
                      });
                      setDirty(true);
                    }}
                  />
                </SetField>
              </div>
            </div>

            <SetField label="알림 이벤트" full>
              <div className="set-events">
                {(
                  [
                    ["hook_error", "Hook 에러", "401, 파싱 실패, 타임아웃"],
                    [
                      "hook_received",
                      "Hook 수신",
                      "정상 수신 알림 (시끄러울 수 있음)",
                    ],
                    ["publish", "글 발행", "published 상태로 변경됨"],
                    [
                      "schedule_due",
                      "예약 도래",
                      "예약된 글의 시간이 다가옴",
                    ],
                    ["campaign_created", "캠페인 생성", "새 캠페인이 추가됨"],
                    ["copy_burst", "복사 폭주 감지", "10분에 10회 이상 복사"],
                  ] as [string, string, string][]
                ).map(([k, l, h]) => (
                  <label key={k} className="set-event-row">
                    <input
                      type="checkbox"
                      checked={notify.events[k]}
                      onChange={(e) => {
                        setNotify({
                          ...notify,
                          events: { ...notify.events, [k]: e.target.checked },
                        });
                        setDirty(true);
                      }}
                    />
                    <span className="set-event-l">
                      <span className="set-event-n">{l}</span>
                      <span className="set-event-h">{h}</span>
                    </span>
                  </label>
                ))}
              </div>
            </SetField>
          </SetSection>

          {/* API */}
          <SetSection
            id="api"
            title="API & Personal Access Tokens"
            subtitle="외부 도구 / 스크립트가 사용할 인증 토큰"
            refMap={sectionRefs}
            action={
              <button className="btn-primary sm">
                <I.Plus size={11} /> 새 토큰
              </button>
            }
          >
            <div className="set-table">
              <div className="set-table-h tokens">
                <span>이름</span>
                <span>Prefix</span>
                <span>Scopes</span>
                <span>마지막 사용</span>
                <span></span>
              </div>
              {tokens.map((t) => (
                <div key={t.id} className="set-table-r tokens">
                  <span className="set-tok-n">{t.name}</span>
                  <span className="mono dim">{t.prefix}_••••••</span>
                  <span className="set-tok-sc">
                    {t.scopes.map((s) => (
                      <span key={s} className="set-scope mono">
                        {s}
                      </span>
                    ))}
                  </span>
                  <span className="mono dim">
                    {t.lastUsed.slice(5, 16).replace("T", " ")}
                  </span>
                  <span className="set-m-act">
                    <button className="set-mini" title="복사">
                      <I.Copy size={11} />
                    </button>
                    <button className="set-mini danger">↻</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="set-api-stats">
              <span className="dim">최근 24시간 API 호출</span>
              <span className="mono">2,148 req · 1.4% 4xx · 0% 5xx</span>
            </div>
          </SetSection>

          {/* Billing */}
          <SetSection
            id="billing"
            title="Billing"
            subtitle="현재 플랜 및 사용량"
            refMap={sectionRefs}
          >
            <div className="set-plan-card">
              <div className="set-plan-l">
                <div className="set-plan-tag mono">CURRENT PLAN</div>
                <div className="set-plan-name">Solo · ₩0 / mo</div>
                <div className="set-plan-s">
                  Single-user · Hook 무제한 · Claude 호출 별도 정산
                </div>
              </div>
              <button className="btn-ghost sm">플랜 변경</button>
            </div>
            <div className="set-meters">
              <Meter label="멤버 1 / 10" pct={10} />
              <Meter label="캠페인 9 / 30" pct={30} />
              <Meter label="Hook 호출 47 / 50,000 (이번 달)" pct={0.1} />
              <Meter label="Claude 토큰 (별도 정산)" pct={0} />
            </div>
          </SetSection>

          {/* Danger */}
          <SetSection
            id="danger"
            title="Danger Zone"
            subtitle="되돌릴 수 없는 작업입니다"
            refMap={sectionRefs}
            danger
          >
            <DangerRow
              t="워크스페이스 이름 변경"
              s="모든 멤버에게 즉시 반영됩니다."
              cta="이름 변경"
            />
            <DangerRow
              t="데이터 내보내기"
              s="모든 캠페인 · 글 · 히스토리를 JSON.zip으로 받습니다."
              cta="Export 시작"
            />
            <DangerRow
              t="모든 캠페인 보관 처리"
              s="진행 중인 캠페인을 전부 archive 합니다."
              cta="전체 보관"
              danger
            />
            <DangerRow
              t="워크스페이스 삭제"
              s="모든 데이터가 영구 삭제됩니다. 30일 grace period 없음."
              cta="삭제..."
              danger
            />
          </SetSection>

          <div style={{ height: 80 }} />
        </main>
      </div>
    </div>
  );
}

// ── Reusable bits ────────────────────────────────────────────────────────
function SetSection({
  id,
  title,
  subtitle,
  children,
  refMap,
  action,
  danger,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  refMap: React.MutableRefObject<Record<string, HTMLElement | null>>;
  action?: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      id={id}
      className={"set-sec " + (danger ? "danger" : "")}
      ref={(el) => {
        refMap.current[id] = el;
      }}
    >
      <header className="set-sec-h">
        <div>
          <div className="set-sec-t">{title}</div>
          <div className="set-sec-s">{subtitle}</div>
        </div>
        {action && <div className="set-sec-act">{action}</div>}
      </header>
      <div className="set-sec-body">{children}</div>
    </section>
  );
}

function SetField({
  label,
  hint,
  children,
  required,
  full,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={"set-field " + (full ? "full" : "")}>
      <div className="set-field-h">
        <span className="set-field-l">
          {label}
          {required && <span className="set-req"> *</span>}
        </span>
        {hint && <span className="set-field-hint">{hint}</span>}
      </div>
      <div className="set-field-c">{children}</div>
    </div>
  );
}

function SetField2col({ children }: { children: ReactNode }) {
  return <div className="set-fields-2col">{children}</div>;
}

function SetToggle({
  on,
  onClick,
  labelOn,
  labelOff,
  compact,
}: {
  on: boolean;
  onClick: () => void;
  labelOn?: string;
  labelOff?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={"set-toggle " + (on ? "on " : "") + (compact ? "compact" : "")}
      onClick={onClick}
    >
      <span className="set-toggle-track">
        <span className="set-toggle-knob" />
      </span>
      {!compact && (
        <span className="set-toggle-l">{on ? labelOn : labelOff}</span>
      )}
    </button>
  );
}

function Stepper({
  v,
  onCh,
  min,
  max,
  step,
  unit,
}: {
  v: number;
  onCh: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const s = step ?? 1;
  return (
    <div className="set-stepper">
      <button onClick={() => onCh(Math.max(min, v - s))}>−</button>
      <span className="mono">
        {v}
        {unit && <span className="dim">{unit}</span>}
      </span>
      <button onClick={() => onCh(Math.min(max, v + s))}>+</button>
    </div>
  );
}

function Radio({
  v,
  options,
  onCh,
}: {
  v: string;
  options: [string, string][];
  onCh: (v: string) => void;
}) {
  return (
    <div className="set-radio">
      {options.map(([val, lbl]) => (
        <button
          key={val}
          className={v === val ? "on" : ""}
          onClick={() => onCh(val)}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

function Meter({
  label,
  pct,
  warn,
}: {
  label: string;
  pct: number;
  warn?: boolean;
}) {
  return (
    <div className={"set-meter " + (warn ? "warn" : "")}>
      <div className="set-meter-l">
        <span>{label}</span>
        <span className="mono dim">{pct}%</span>
      </div>
      <div className="set-meter-bar">
        <div className="set-meter-fill" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}

function DangerRow({
  t,
  s,
  cta,
  danger,
}: {
  t: string;
  s: string;
  cta: string;
  danger?: boolean;
}) {
  return (
    <div className="set-danger-row">
      <div>
        <div className="set-danger-t">{t}</div>
        <div className="set-danger-s">{s}</div>
      </div>
      <button className={"set-danger-btn " + (danger ? "danger" : "")}>
        {cta}
      </button>
    </div>
  );
}
