/**
 * WXSS 兼容性清理脚本
 *
 * 处理 Taro + Tailwind CSS 生成的 WXSS 中微信小程序不支持的语法：
 * 1. @supports 块（含嵌套花括号，用括号计数移除整块）
 * 2. :has() 伪类选择器（移除整个 :has(...) 片段）
 * 3. 未加引号的属性值 [attr=value] → [attr="value"]
 * 4. 通配符属性选择器 [class*=xxx] → [class]
 */

const fs = require('node:fs');
const path = require('node:path');

/**
 * 移除 @supports 块（正确匹配嵌套花括号）
 */
function removeSupportsBlocks(css) {
  let result = '';
  let i = 0;

  while (i < css.length) {
    // 查找 @supports 关键字
    const idx = css.indexOf('@supports', i);
    if (idx === -1) {
      result += css.slice(i);
      break;
    }

    // 输出 @supports 之前的内容
    result += css.slice(i, idx);

    // 找到 { 的位置
    const braceStart = css.indexOf('{', idx);
    if (braceStart === -1) {
      // 没找到 {，保留原文
      result += css.slice(idx);
      break;
    }

    // 从 { 开始，用深度计数找到匹配的 }
    let depth = 0;
    let pos = braceStart;

    while (pos < css.length) {
      const char = css[pos];
      // 跳过字符串内容（避免字符串中的 { } 干扰）
      if (char === "'" || char === '"') {
        const quote = char;
        pos++;
        while (pos < css.length && css[pos] !== quote) {
          if (css[pos] === '\\') pos++; // 跳过转义字符
          pos++;
        }
        pos++; // 跳过结束引号
        continue;
      }

      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          // 找到了匹配的 }
          pos++; // 跳过 }
          break;
        }
      }
      pos++;
    }

    i = pos;
  }

  return result;
}

/**
 * 移除 :has(...) 伪类（保留其余选择器）
 */
function removeHasPseudo(css) {
  // :has(...) 中可能嵌套括号，用深度计数
  let result = '';
  let i = 0;

  while (i < css.length) {
    // 查找 :has(
    const idx = css.indexOf(':has(', i);
    if (idx === -1) {
      result += css.slice(i);
      break;
    }

    result += css.slice(i, idx);

    // 从 :has( 开始，计数括号深度
    let depth = 1;
    let pos = idx + 5; // 跳过 ':has('

    while (pos < css.length && depth > 0) {
      const char = css[pos];
      if (char === "'" || char === '"') {
        const quote = char;
        pos++;
        while (pos < css.length && css[pos] !== quote) {
          if (css[pos] === '\\') pos++;
          pos++;
        }
        pos++;
        continue;
      }
      if (char === '(') depth++;
      else if (char === ')') depth--;
      pos++;
    }

    i = pos;
  }

  return result;
}

/**
 * 给未加引号的属性值加引号
 * [data-disabled=true] → [data-disabled="true"]
 */
function quoteAttrValues(css) {
  return css.replace(
    /\[([a-zA-Z_][\w-]*)=([a-zA-Z_][\w-]*)\]/g,
    '[$1="$2"]'
  );
}

/**
 * 处理通配符属性选择器
 * :not([class*=xxx]) → :not([class])
 * [class^=xxx] → [class]
 * [class$=xxx] → [class]
 */
function simplifyWildcardAttrs(css) {
  // 处理 :not 中的通配符
  css = css.replace(
    /:not\(\[class[\*\^\$]=[^\]]+\]\)/g,
    ':not([class])'
  );
  // 处理独立的通配符属性选择器
  css = css.replace(
    /\[class[\*\^\$]=[^\]]+\]/g,
    '[class]'
  );
  return css;
}

// ========== 主逻辑 ==========
function cleanWxss(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[clean-wxss] File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const origLen = content.length;

  content = removeSupportsBlocks(content);
  content = removeHasPseudo(content);
  content = quoteAttrValues(content);
  content = simplifyWildcardAttrs(content);

  if (content.length !== origLen) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(
      `[clean-wxss] ${path.basename(filePath)}: ${origLen - content.length} bytes removed (${origLen} → ${content.length})`
    );
  } else {
    console.log(`[clean-wxss] ${path.basename(filePath)}: no changes needed`);
  }
}

// 命令行参数或默认路径
const outputDir = process.argv[2] || path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(outputDir)) {
  console.log(`[clean-wxss] Output dir not found: ${outputDir}`);
  process.exit(0);
}

const files = fs.readdirSync(outputDir);
const wxssFiles = files.filter((f) => f.endsWith('.wxss'));

if (wxssFiles.length === 0) {
  console.log('[clean-wxss] No WXSS files found');
  process.exit(0);
}

console.log(`[clean-wxss] Found ${wxssFiles.length} WXSS file(s) in ${outputDir}`);
for (const file of wxssFiles) {
  cleanWxss(path.join(outputDir, file));
}
console.log('[clean-wxss] Done');
