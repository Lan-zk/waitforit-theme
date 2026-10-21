#!/usr/bin/env node
// 只读像素 diff：比较两张 PNG，输出差异分位数并按阈值判定。
// 零依赖（node:zlib 解 PNG），供 scenes 迁移基线与迁移后对照使用。
// 用法: node test/scene-diff.mjs --a <png> --b <png> [--region x,y,w,h] [--threshold 2]
//                              [--expect-identical] [--json] [--out <json>]
// 退出码: 0 通过（未指定 --expect-identical 时恒为 0）；1 解码/尺寸错误或未通过判定；2 参数错误。
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const arg = (key, fallback) => {
  const index = process.argv.indexOf(key);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const has = (key) => process.argv.includes(key);

const USAGE = `scene-diff: 比较两张 PNG 的像素差异（只读，零依赖）

选项:
  --a <png>            基准图
  --b <png>            对照图
  --region x,y,w,h     只统计该区域（默认整图）
  --threshold <n>      逐像素最大通道差异的统计阈值，默认 2
  --expect-identical   要求所有像素完全一致，否则退出 1
  --json               以 JSON 输出
  --out <json>         同时写 JSON 文件
  --help, -h           显示帮助

指标: 每像素取 RGB 通道最大绝对差；报告 mean/p95/p99/max、超过 threshold 与 8 的像素比例。`;

function readChunks(buffer) {
  if (buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) {
    throw new Error('不是 PNG 文件');
  }
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > buffer.length) {
      throw new Error(`PNG chunk ${type} 越界`);
    }
    chunks.push({ type, data: buffer.subarray(dataStart, dataEnd) });
    offset = dataEnd + 4;
    if (type === 'IEND') {
      break;
    }
  }
  return chunks;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) {
    return a;
  }
  return pb <= pc ? b : c;
}

function decodePng(file) {
  const chunks = readChunks(fs.readFileSync(file));
  const ihdr = chunks.find((chunk) => chunk.type === 'IHDR');
  if (!ihdr || ihdr.data.length !== 13) {
    throw new Error('缺少 IHDR');
  }
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  const compression = ihdr.data[10];
  const filter = ihdr.data[11];
  const interlace = ihdr.data[12];
  const channels = { 0: 1, 2: 3, 6: 4 }[colorType];
  if (bitDepth !== 8 || compression !== 0 || filter !== 0 || interlace !== 0 || !channels) {
    throw new Error(`不支持的 PNG 格式: bitDepth=${bitDepth} colorType=${colorType} interlace=${interlace}`);
  }
  const idat = Buffer.concat(chunks.filter((chunk) => chunk.type === 'IDAT').map((chunk) => chunk.data));
  const raw = zlib.inflateSync(idat);
  const stride = width * channels;
  if (raw.length < (stride + 1) * height) {
    throw new Error('IDAT 解压长度不足');
  }
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filterType = raw[y * (stride + 1)];
    const source = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const targetStart = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? pixels[targetStart + x - channels] : 0;
      const up = y > 0 ? pixels[targetStart - stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? pixels[targetStart - stride + x - channels] : 0;
      let value;
      switch (filterType) {
        case 0: value = source[x]; break;
        case 1: value = source[x] + left; break;
        case 2: value = source[x] + up; break;
        case 3: value = source[x] + Math.floor((left + up) / 2); break;
        case 4: value = source[x] + paeth(left, up, upLeft); break;
        default: throw new Error(`未知 PNG filter ${filterType}`);
      }
      pixels[targetStart + x] = value & 0xff;
    }
  }
  if (channels === 4) {
    return { width, height, pixels, file };
  }
  // 统一为 RGBA，便于 RGB 截图与 RGBA 导出图直接比较。
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const source = i * channels;
    const destination = i * 4;
    if (channels === 3) {
      rgba[destination] = pixels[source];
      rgba[destination + 1] = pixels[source + 1];
      rgba[destination + 2] = pixels[source + 2];
    } else {
      rgba[destination] = pixels[source];
      rgba[destination + 1] = pixels[source];
      rgba[destination + 2] = pixels[source];
    }
    rgba[destination + 3] = 255;
  }
  return { width, height, pixels: rgba, file };
}

const percentile = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);

function compare(a, b, threshold, region) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`尺寸不同: ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  }
  const rect = region ?? { x: 0, y: 0, w: a.width, h: a.height };
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > a.width || rect.y + rect.h > a.height) {
    throw new Error('region 越界');
  }
  const diffs = [];
  let max = 0;
  let overThreshold = 0;
  let overEight = 0;
  let lumaA = 0;
  let lumaB = 0;
  for (let y = rect.y; y < rect.y + rect.h; y += 1) {
    for (let x = rect.x; x < rect.x + rect.w; x += 1) {
      const offset = (y * a.width + x) * 4;
      let diff = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        diff = Math.max(diff, Math.abs(a.pixels[offset + channel] - b.pixels[offset + channel]));
      }
      lumaA += (a.pixels[offset] * 0.2126 + a.pixels[offset + 1] * 0.7152 + a.pixels[offset + 2] * 0.0722);
      lumaB += (b.pixels[offset] * 0.2126 + b.pixels[offset + 1] * 0.7152 + b.pixels[offset + 2] * 0.0722);
      diffs.push(diff);
      max = Math.max(max, diff);
      if (diff > threshold) {
        overThreshold += 1;
      }
      if (diff > 8) {
        overEight += 1;
      }
    }
  }
  diffs.sort((left, right) => left - right);
  const total = diffs.length;
  const sum = diffs.reduce((acc, value) => acc + value, 0);
  return {
    a: path.resolve(a.file),
    b: path.resolve(b.file),
    size: [a.width, a.height],
    region: rect,
    pixels: total,
    mean: sum / total,
    p95: percentile(diffs, 0.95),
    p99: percentile(diffs, 0.99),
    p999: percentile(diffs, 0.999),
    max,
    lumaA: lumaA / total,
    lumaB: lumaB / total,
    lumaDelta: (lumaB - lumaA) / total,
    overThreshold,
    overThresholdRatio: overThreshold / total,
    overEight,
    overEightRatio: overEight / total,
    identical: max === 0,
  };
}

function parseRegion(raw) {
  const parts = String(raw).split(',').map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('--region 需要 x,y,w,h 四个非负整数');
  }
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
}

function main() {
  if (has('--help') || has('-h')) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }
  const aPath = arg('--a');
  const bPath = arg('--b');
  if (!aPath || !bPath) {
    process.stderr.write(`参数错误: 缺少 --a 或 --b\n\n${USAGE}\n`);
    return 2;
  }
  const threshold = Number(arg('--threshold', '2'));
  if (!Number.isFinite(threshold) || threshold < 0) {
    process.stderr.write('参数错误: --threshold 需要非负数\n');
    return 2;
  }
  let result;
  try {
    const region = arg('--region') ? parseRegion(arg('--region')) : null;
    result = compare(decodePng(aPath), decodePng(bPath), threshold, region);
  } catch (error) {
    process.stderr.write(`diff 失败: ${error.message}\n`);
    return 1;
  }
  result.threshold = threshold;
  result.expectIdentical = has('--expect-identical');
  const text = JSON.stringify(result, null, 2);
  if (has('--json')) {
    process.stdout.write(`${text}\n`);
  } else {
    process.stdout.write(
      `${path.basename(result.a)} vs ${path.basename(result.b)} @ ${result.size[0]}x${result.size[1]}` +
        `${result.region.w === result.size[0] && result.region.h === result.size[1] ? '' : ` region ${JSON.stringify(result.region)}`}\n` +
        `  mean=${result.mean.toFixed(4)} p95=${result.p95} p99=${result.p99} p99.9=${result.p999} max=${result.max}\n` +
        `  >${threshold}: ${(result.overThresholdRatio * 100).toFixed(3)}%  >8: ${(result.overEightRatio * 100).toFixed(3)}%\n`,
    );
  }
  const out = arg('--out');
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(path.resolve(out), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result.expectIdentical && !result.identical ? 1 : 0;
}

process.exitCode = main();
