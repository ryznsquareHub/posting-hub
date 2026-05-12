/**
 * /copyblog 슬래시 커맨드 전용 — 외부 블로그 이미지 처리 파이프라인
 *
 * 동작:
 *   1. URL 들을 photos/input/copyblog/<slug>/ 에 다운로드
 *   2. transform-images.mjs 호출 → photos/output/copyblog/<slug>/ 에 5종 변형
 *   3. 변형본을 Supabase Storage bucket 'copyblog-images/<slug>/' 에 업로드
 *   4. public URL 리스트를 stdout 에 JSON 으로 출력 (슬래시 커맨드가 파싱)
 *
 * 사용법:
 *   node scripts/copyblog-images.mjs <slug> <url1> [url2] ...
 *
 * 필요 env (SERVICE_ROLE 사용 — 클라이언트 번들 절대 X):
 *   SUPABASE_URL              (또는 VITE_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * 변형 종류 — 1장당 5장 (v1_flop / v2_crop_bright / v3_rotate_desat / v4_blur_noise / v5_warmcrop)
 * 슬래시 커맨드는 통상 v1_flop 1장씩만 본문에 박음 (나머지는 운영자 선택용).
 *
 * stdout JSON 형식:
 *   {
 *     "ok": true,
 *     "slug": "sodo-wine-2026-05-13",
 *     "images": [
 *       { "n": 1, "primary": "<v1_flop public url>", "all": { "v1_flop": "...", "v2_crop_bright": "...", ... } },
 *       ...
 *     ]
 *   }
 */

import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "copyblog-images";

const [, , slug, ...urls] = process.argv;

function die(msg, extra = {}) {
  console.error(JSON.stringify({ ok: false, error: msg, ...extra }));
  process.exit(1);
}

if (!slug || urls.length === 0) {
  die("usage: node scripts/copyblog-images.mjs <slug> <url1> [url2] ...");
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  die("slug 는 영문 소문자/숫자/하이픈만 허용");
}
if (!SUPABASE_URL || !SERVICE_ROLE) {
  die(
    "Missing env: SUPABASE_URL (or VITE_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY",
  );
}

const inputRel = `photos/input/copyblog/${slug}`;
const outputRel = `photos/output/copyblog/${slug}`;
const inputDir = path.join(ROOT, inputRel);
const outputDir = path.join(ROOT, outputRel);

await mkdir(inputDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

// ── 1) 다운로드 ────────────────────────────────────────────────
console.error(`[다운로드] ${urls.length}장 → ${inputRel}/`);

const downloaded = []; // { n, fileName }
for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  const n = String(i + 1).padStart(2, "0");
  try {
    const res = await fetch(url, {
      headers: {
        // 네이버 등 일부 CDN 은 UA / Referer 없으면 거부
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 PostingHub-Copyblog",
        Referer: new URL(url).origin + "/",
      },
    });
    if (!res.ok) {
      console.error(`  ✗ ${n} HTTP ${res.status} ${url}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get("content-type") || "";
    const ext = ct.includes("png")
      ? ".png"
      : ct.includes("webp")
        ? ".webp"
        : ".jpg";
    const fileName = `photo${n}${ext}`;
    await writeFile(path.join(inputDir, fileName), buf);
    console.error(`  ✓ ${fileName} (${(buf.length / 1024).toFixed(1)} KB)`);
    downloaded.push({ n: i + 1, fileName });
  } catch (err) {
    console.error(`  ✗ ${n} ${err.message}`);
  }
}

if (downloaded.length === 0) {
  die("download_failed — 한 장도 받지 못함");
}

// ── 2) 변형 ────────────────────────────────────────────────────
console.error(`\n[변형] ${downloaded.length}장 × 5종 → ${outputRel}/`);

const transformResult = spawnSync(
  process.execPath,
  [path.join(ROOT, "scripts/transform-images.mjs")],
  {
    env: { ...process.env, IMG_INPUT: inputRel, IMG_OUTPUT: outputRel },
    stdio: ["ignore", "inherit", "inherit"],
  },
);

if (transformResult.status !== 0) {
  die("transform_failed", { exitCode: transformResult.status });
}

// ── 3) Storage 업로드 ─────────────────────────────────────────
console.error(`\n[업로드] Supabase Storage ${BUCKET}/${slug}/ ...`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const outputFiles = (await readdir(outputDir)).filter((f) =>
  /\.(jpg|jpeg|png|webp)$/i.test(f),
);

if (outputFiles.length === 0) {
  die("no_output_files");
}

const VARIANT_RE =
  /^(photo\d+)__(v1_flop|v2_crop_bright|v3_rotate_desat|v4_blur_noise|v5_warmcrop)\.jpg$/i;

const grouped = new Map(); // photoN → { v1_flop: localPath, v2_..., ... }
for (const file of outputFiles) {
  const m = VARIANT_RE.exec(file);
  if (!m) continue;
  const [, base, variant] = m;
  if (!grouped.has(base)) grouped.set(base, {});
  grouped.get(base)[variant.toLowerCase()] = file;
}

const result = { ok: true, slug, bucket: BUCKET, images: [] };

const sortedBases = [...grouped.keys()].sort();
let uploadOk = 0;
let uploadFail = 0;

for (const base of sortedBases) {
  const variants = grouped.get(base);
  const n = parseInt(base.replace("photo", ""), 10);
  const all = {};
  for (const [variant, fileName] of Object.entries(variants)) {
    const localPath = path.join(outputDir, fileName);
    const remotePath = `${slug}/${fileName}`;
    try {
      const buf = await readFile(localPath);
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(remotePath, buf, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: true,
        });
      if (error) {
        console.error(`  ✗ ${remotePath} ${error.message}`);
        uploadFail++;
        continue;
      }
      const { data: pub } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(remotePath);
      all[variant] = pub.publicUrl;
      uploadOk++;
    } catch (err) {
      console.error(`  ✗ ${remotePath} ${err.message}`);
      uploadFail++;
    }
  }
  if (Object.keys(all).length > 0) {
    result.images.push({
      n,
      primary: all.v1_flop || Object.values(all)[0],
      all,
    });
  }
}

result.uploadOk = uploadOk;
result.uploadFail = uploadFail;
result.images.sort((a, b) => a.n - b.n);

console.error(`  ✓ 업로드 ${uploadOk} / 실패 ${uploadFail}\n`);

// stdout 에는 오직 JSON 1줄 (슬래시 커맨드가 파싱)
console.log(JSON.stringify(result));
