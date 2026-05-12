/**
 * 블로그용 이미지 변형 — 1장 → 5종 변형본
 *
 * 목적: 네이버/구글 유사 이미지 검사 우회 + 같은 매장 사진을 여러 글에 재사용
 *
 * 변형 종류 (고정 5종):
 *   v1_flop          좌우반전 (가장 강력, EXIF/해시 완전 다름)
 *   v2_crop_bright   테두리 5% 크롭 + 밝기↑ + 채도↑
 *   v3_rotate_desat  2° 회전 + 채도↓ + 살짝 어둡게
 *   v4_blur_noise    약한 가우시안 블러 + 미디안 노이즈
 *   v5_warmcrop      상하 10% 크롭 + 색온도 따뜻하게
 *
 * 공통: EXIF 메타데이터 제거, JPEG 재인코딩(q85), 가로 1200px 으로 리사이즈
 *
 * 사용법:
 *   1. photos/input/ 에 원본 이미지 넣기 (.jpg, .jpeg, .png, .webp)
 *   2. npm run img:transform
 *   3. photos/output/<원본명>__v1_flop.jpg 등으로 결과 저장
 */

import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// env 로 input/output 폴더 override 가능 (copyblog-images.mjs 가 활용)
const INPUT_DIR = process.env.IMG_INPUT
  ? path.resolve(ROOT, process.env.IMG_INPUT)
  : path.join(ROOT, "photos/input");
const OUTPUT_DIR = process.env.IMG_OUTPUT
  ? path.resolve(ROOT, process.env.IMG_OUTPUT)
  : path.join(ROOT, "photos/output");

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const TARGET_WIDTH = 1200;
const JPEG_QUALITY = 85;

const VARIANTS = [
  {
    name: "v1_flop",
    desc: "좌우반전",
    apply: (img) => img.flop(),
  },
  {
    name: "v2_crop_bright",
    desc: "테두리 5% 크롭 + 밝기↑ + 채도↑",
    apply: async (img) => {
      const meta = await img.metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      const cx = Math.max(1, Math.round(w * 0.05));
      const cy = Math.max(1, Math.round(h * 0.05));
      return img
        .extract({ left: cx, top: cy, width: w - cx * 2, height: h - cy * 2 })
        .modulate({ brightness: 1.1, saturation: 1.05 });
    },
  },
  {
    name: "v3_rotate_desat",
    desc: "2° 회전 + 채도↓ + 살짝 어둡게",
    apply: (img) =>
      img
        .rotate(2, { background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .modulate({ brightness: 0.95, saturation: 0.9 }),
  },
  {
    name: "v4_blur_noise",
    desc: "약한 블러 + 미디안 노이즈",
    apply: (img) => img.blur(0.3).median(1),
  },
  {
    name: "v5_warmcrop",
    desc: "상하 10% 크롭 + 색온도 따뜻하게",
    apply: async (img) => {
      const meta = await img.metadata();
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      const cy = Math.max(1, Math.round(h * 0.1));
      return img
        .extract({ left: 0, top: cy, width: w, height: h - cy * 2 })
        .modulate({ brightness: 1.02, saturation: 1.0, hue: 10 });
    },
  },
];

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function processFile(filePath, baseName) {
  console.log(`\n[처리] ${path.basename(filePath)}`);
  for (const variant of VARIANTS) {
    // EXIF orientation 자동 정규화 → 매 variant 마다 새 인스턴스
    const img = sharp(filePath, { failOn: "none" }).rotate();
    const transformed = await variant.apply(img);
    const outName = `${baseName}__${variant.name}.jpg`;
    const outPath = path.join(OUTPUT_DIR, outName);
    await transformed
      .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
      .flatten({ background: "#ffffff" }) // PNG alpha → 흰 배경
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(outPath); // withMetadata() 호출 안 함 → EXIF 자동 제거
    console.log(`  ✓ ${variant.name.padEnd(16)} ${variant.desc}`);
  }
}

async function main() {
  await ensureDir(INPUT_DIR);
  await ensureDir(OUTPUT_DIR);

  const entries = await readdir(INPUT_DIR);
  const targets = entries.filter((f) =>
    SUPPORTED.has(path.extname(f).toLowerCase()),
  );

  if (targets.length === 0) {
    console.log(
      `${INPUT_DIR} 에 이미지 없음. (지원: ${[...SUPPORTED].join(", ")})`,
    );
    console.log(`→ 원본을 넣고 다시 실행하세요.`);
    return;
  }

  console.log(
    `총 ${targets.length}장 → 각 5종 변형 → ${targets.length * 5}장 생성`,
  );

  let okCount = 0;
  let failCount = 0;
  for (const file of targets) {
    const filePath = path.join(INPUT_DIR, file);
    const ext = path.extname(file);
    const baseName = path.basename(file, ext);
    try {
      await processFile(filePath, baseName);
      okCount++;
    } catch (err) {
      console.error(`  ✗ ${file} 실패:`, err.message);
      failCount++;
    }
  }

  console.log(
    `\n완료 — 성공 ${okCount} / 실패 ${failCount} → ${OUTPUT_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
