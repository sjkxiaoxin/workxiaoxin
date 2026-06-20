/**
 * Vite 插件：在 writeBundle 阶段清理 WXSS 不兼容语法
 *
 * weapp-tailwindcss 转换后仍会残留一些 WXSS 不兼容的 CSS 特性：
 * - @supports 规则（整块移除）
 * - 未加引号的属性选择器值 [data-xxx=yyy]（加引号）
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

// 移除 @supports 块（支持跨行）
// 输入: ...@supports (color: color(display-p3 0 0 0%)){\n}...
// 输出: ...
function removeSupportsBlocks(css: string): string {
  // 匹配 @supports 后跟任意内容直到 } 结束
  // 使用非贪婪方式匹配，处理嵌套和跨行
  return css.replace(/@supports\s*\([^{]*\)\s*\{[^}]*\}/g, '')
}

// 给未加引号的属性值加上引号
// [data-disabled=true] → [data-disabled="true"]
// [data-orientation=vertical] → [data-orientation="vertical"]
// 但不影响 [data-disabled]（无值属性）或已经加引号的
function quoteAttrValues(css: string): string {
  // 匹配 [attr=value] 其中 value 不以引号开头
  return css.replace(
    /\[([a-zA-Z_][\w-]*)=([a-zA-Z_][\w-]*)\]/g,
    '[$1="$2"]'
  )
}

// 移除 WXSS 不支持的选择器中的通配符属性选择器
// [class*=xxx], [class^=xxx], [class$=xxx] 等 → 简化处理
// 注意：:not([class*=xxx]) 无法简单去掉，需要整条规则移除或简化
function handleWildcardAttrs(css: string): string {
  // 对于独立的 [class*=xxx] 选择器，需要移除整条规则
  // 这里先简化：将 :not([class*=xxx]) 替换为 :not([class])
  return css.replace(/:not\(\[class[\*\^\$]=[^\]]+\]\)/g, ':not([class])')
}

export function vitePluginWxssCleanup(outputDir: string): Plugin {
  return {
    name: 'vite-plugin-wxss-cleanup',
    apply: 'build',
    enforce: 'post',

    writeBundle() {
      if (!fs.existsSync(outputDir)) return

      const files = fs.readdirSync(outputDir)
      const wxssFiles = files.filter((f) => f.endsWith('.wxss'))

      for (const file of wxssFiles) {
        const filePath = path.join(outputDir, file)
        let content = fs.readFileSync(filePath, 'utf-8')
        const origLen = content.length

        content = removeSupportsBlocks(content)
        content = quoteAttrValues(content)
        content = handleWildcardAttrs(content)

        if (content.length !== origLen) {
          fs.writeFileSync(filePath, content, 'utf-8')
          console.log(
            `[wxss-cleanup] ${file}: ${origLen - content.length} bytes removed`
          )
        }
      }
    },
  }
}
