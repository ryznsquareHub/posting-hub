#!/usr/bin/env node
/**
 * Stop 훅: 마지막 assistant 메시지에 [HANDOFF: <ROLE> | <info>] 마커가 있으면
 * 다음 턴에 자동으로 해당 역할로 전환한다 (decision: block).
 *
 * 사용 마커 (역할 파일에 명시):
 *   [HANDOFF: DEV1 | T-101, T-102]
 *   [HANDOFF: DEV2 | T-301]
 *   [HANDOFF: QA | T-301: done]
 *   [HANDOFF: PM | T-301: FAIL — ...]
 *   [HANDOFF: DONE | T-301]   ← 자동 전환 종료
 *
 * 무한 루프 방지: 같은 (session_id + role + info) 핸드오프는 1회만 발동.
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '.handoff-state.json');
const DEBUG_LOG = path.join(__dirname, '.debug.log');

function debug(msg, data) {
  try {
    const line = `[${new Date().toISOString()}] ${msg}${data !== undefined ? ' ' + JSON.stringify(data).slice(0, 500) : ''}\n`;
    fs.appendFileSync(DEBUG_LOG, line);
  } catch (e) {}
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (e) {
    return '';
  }
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function normalizeWindowsPath(p) {
  if (!p) return p;
  const m = p.match(/^\/([a-zA-Z])\/(.*)$/);
  if (m) return `${m[1].toUpperCase()}:/${m[2]}`;
  return p;
}

function getLastAssistantText(transcriptPath) {
  const candidates = [transcriptPath, normalizeWindowsPath(transcriptPath)].filter(Boolean);
  let resolvedPath = '';
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      resolvedPath = p;
      break;
    }
  }
  if (!resolvedPath) return '';
  const lines = fs.readFileSync(resolvedPath, 'utf8').trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const msg = JSON.parse(lines[i]);
      if (msg.type !== 'assistant') continue;
      const content = msg.message?.content;
      if (!Array.isArray(content)) continue;
      const text = content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n');
      if (text) return text;
    } catch (e) {}
  }
  return '';
}

function buildPrompt(role, info) {
  const taskInfo = info ? ` (${info})` : '';
  switch (role) {
    case 'DEV1':
      return `너는 DEV1 이야.

PM 이 너한테 TASK 를 할당했어${taskInfo}.

docs/roles/dev1.md 기준으로 진행해:
1. TASK_BOARD.md 에서 너 담당 TASK 확인
2. work-log/dev1.md 에 [START T-XXX] 기록
3. 구현 (CLAUDE.md + docs/roles/dev1.md 준수)
4. tsc / lint / build 통과 확인
5. 모바일 375 / 태블릿 768 / 데스크톱 1280 시각 확인
6. work-log/dev1.md 에 [DONE T-XXX] + 변경 파일 + 검증 결과
7. 다음 TASK 로 이동

전부 끝나면 마지막 줄에 [HANDOFF: QA | <T-IDs>] 마커 남겨.
막히면 [BLOCKED] 표시 후 멈춰.`;

    case 'DEV2':
      return `너는 DEV2 야.

PM 이 너한테 TASK 를 할당했어${taskInfo}.

docs/roles/dev2.md 기준으로 진행해:
1. TASK_BOARD.md 에서 너 담당 TASK 확인
2. work-log/dev2.md 에 [START T-XXX] 기록
3. 구현 (CLAUDE.md + docs/roles/dev2.md 준수)
4. tsc / lint / build 통과 확인
5. RLS / 인증 가드 / 멱등성 검증
6. work-log/dev2.md 에 [DONE T-XXX] + 변경 파일 + 검증 결과
7. 다음 TASK 로 이동

전부 끝나면 마지막 줄에 [HANDOFF: QA | <T-IDs>] 마커 남겨.
막히면 [BLOCKED] 표시 후 멈춰.`;

    case 'QA':
      return `너는 QA 야.

DEV 작업이 끝났어${taskInfo}.

docs/roles/qa.md 기준으로 검증:
1. work-log/dev1.md, dev2.md 의 [DONE] 항목 확인
2. git diff 로 실제 변경 검증
3. §3 체크리스트 적용 (기능 / UX / 반응형 / 키보드 / 네비 / 캐시 / 보안 / 디자인 톤)
4. QA_REPORT.md 에 Q-LIVE-XX 형식 PASS/FAIL/BLOCKED 기록
5. 끝나면 PASS X건 / FAIL X건 한 줄 요약

FAIL 이 있으면 마지막 줄에 [HANDOFF: PM | <T-IDs>: FAIL] 남겨.
모두 PASS 면 [HANDOFF: DONE | <T-IDs>] 남겨.`;

    case 'PM':
      return `너는 PM 이야.

QA 또는 DEV 가 너한테 결정 / 재할당을 요청했어${taskInfo}.

1. 요청 내용 (QA_REPORT 의 FAIL, 또는 work-log 의 [BLOCKED]) 확인
2. 원인 분석 후 다음 중 하나 결정:
   - TASK 재정의 → TASK_BOARD.md 갱신, [HANDOFF: DEV<N>] 로 다시 토스
   - 새 D-XXX 결정 → DECISIONS.md 추가
   - 종결 → [HANDOFF: DONE]
3. 결정 한 줄 요약`;

    default:
      return null;
  }
}

function main() {
  debug('hook invoked');
  const raw = readStdin();
  debug('stdin length', raw.length);
  if (!raw) { debug('no stdin, exit'); return; }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (e) {
    debug('JSON parse error', e.message);
    return;
  }
  debug('event keys', Object.keys(event));

  if (event.stop_hook_active) { debug('stop_hook_active=true, exit'); return; }

  const text = getLastAssistantText(event.transcript_path);
  if (!text) { debug('no assistant text, exit'); return; }

  const match = text.match(/\[HANDOFF:\s*(DEV1|DEV2|QA|PM|DONE)\s*(?:\|\s*([^\]]*))?\]/i);
  if (!match) { debug('no HANDOFF marker found'); return; }
  debug('match', { role: match[1], info: match[2] });

  const role = match[1].toUpperCase();
  const info = (match[2] || '').trim();

  if (role === 'DONE') { debug('DONE marker, exit'); return; }

  const state = loadState();
  const fingerprint = `${event.session_id || 'no-session'}::${role}::${info}`;
  if (state.last === fingerprint) { debug('duplicate fingerprint, exit', fingerprint); return; }

  const prompt = buildPrompt(role, info);
  if (!prompt) { debug('no prompt for role', role); return; }
  debug('firing handoff', { role, info });

  state.last = fingerprint;
  state.timestamp = new Date().toISOString();
  state.role = role;
  state.info = info;
  saveState(state);

  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason: prompt,
    })
  );
}

main();
