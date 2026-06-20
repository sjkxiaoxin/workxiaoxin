/**
 * PostCSS 插件：移除 WXSS 不兼容的 CSS 语法
 *
 * WXSS（微信小程序样式）基于 CSS 子集，不支持以下特性：
 * - :has() 伪类
 * - @supports 规则
 * - 未加引号的属性选择器值（如 [data-orientation=horizontal]）
 * - 通配符属性选择器（如 [class*=xxx]、[class^=xxx]）
 *
 * 本插件在构建阶段将这些不兼容规则过滤掉。
 */

import type { Plugin, Rule, AtRule } from 'postcss'

// WXSS 不支持的伪类
const UNSUPPORTED_PSEUDOS = [':has', ':is', ':where']

// 未加引号属性值正则：[key=value] 其中 value 无引号
const UNQUOTED_ATTR_RE = /\[([a-zA-Z][\w-]*)=([a-zA-Z][\w-]*)\]/g

// 通配符属性选择器正则：[key*=value], [key^=value], [key$=value]
const WILDCARD_ATTR_RE = /\[[a-zA-Z][\w-]*[*^$]=/g

function selectorNeedsCompat(selector: string): boolean {
  // 检查是否包含不支持的伪类
  for (const pseudo of UNSUPPORTED_PSEUDOS) {
    if (selector.includes(`:${pseudo}(`)) {
      return true
    }
  }
  // 检查未加引号的属性值
  if (UNQUOTED_ATTR_RE.test(selector)) {
    return true
  }
  // 检查通配符属性选择器
  if (WILDCARD_ATTR_RE.test(selector)) {
    return true
  }
  return false
}

const wxssCompatPlugin = (): Plugin => {
  return {
    postcssPlugin: 'postcss-wxss-compat',

    // 移除不支持的 at-rules（@supports 等）
    AtRule: {
      supports(atRule: AtRule) {
        atRule.remove()
      },
      'custom-variant'(atRule: AtRule) {
        atRule.remove()
      },
      theme(atRule: AtRule) {
        atRule.remove()
      },
    },

    // 移除包含不兼容选择器的规则
    Rule(rule: Rule) {
      if (selectorNeedsCompat(rule.selector)) {
        rule.remove()
      }
    },
  }
}

wxssCompatPlugin.postcss = true

export default wxssCompatPlugin
