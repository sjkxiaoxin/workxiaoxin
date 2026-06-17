# 飞任务 - 设计指南

## 品牌定位

**应用定位**：轻量级团队任务协作工具，专注于任务创建、派发、状态流转的核心流程
**设计风格**：工具型效率美学，借鉴 Linear、Notion、Things 3 的克制设计语言
**目标用户**：小型团队、项目组、需要任务协作的个人用户

## 配色方案

### 主色调（效率蓝）
- 浅色模式：`bg-blue-500`（#1890FF）
- 深色模式：`bg-blue-600`（#0066CC，降低饱和度）

### 辅助色（任务状态）
- 待办：`bg-orange-400`（#FAAD14）
- 进行中：`bg-green-500`（#52C41A）
- 已完成：`bg-gray-400`（#8C8C8C）
- 紧急：`bg-red-500`（#F5222D）

### 中性色
- 浅色模式：
  - 背景：`bg-white`、`bg-gray-50`
  - 文字：`text-gray-900`、`text-gray-600`、`text-gray-500`
  - 边框：`border-gray-200`
- 深色模式：
  - 背景：`bg-gray-900`、`bg-gray-800`
  - 文字：`text-gray-100`、`text-gray-300`、`text-gray-400`
  - 边框：`border-gray-700`

## 字体规范

- H1（页面标题）：`text-xl font-semibold`
- H2（任务标题）：`text-base font-medium`
- H3（次要信息）：`text-sm font-normal`
- Caption（辅助说明）：`text-xs font-normal`

## 间距系统

- 页面边距：`px-4`（16px）
- 卡片内边距：`p-3`（12px）
- 卡片间距：`space-y-3`（12px）
- 组件间距：`gap-2`（8px）

## 组件使用原则

**严格约束**：通用 UI 组件必须优先使用 `@/components/ui/*`，禁止用 View/Text 手搓

**页面组件选型清单**：
- 任务卡片 → `Card` + `Badge`（状态标签）
- 状态筛选 → `Tabs`（我创建的/我负责的/全部）
- 输入框 → `Input`（标题）`Textarea`（描述）
- 按钮 → `Button`（创建、取消、状态切换）
- 头像 → `Avatar`（负责人头像）
- 弹窗确认 → `AlertDialog`（删除确认）
- 提示反馈 → `Toast`（操作结果）
- 加载态 → `Skeleton`（列表加载）
- 空状态 → `Alert`（无任务提示）
- 日历选择 → `Calendar`（截止时间）
- 下拉选择 → `Select`（负责人选择）

## 导航结构

**TabBar 页面**：
1. 任务（pages/index/index）- 任务列表首页
2. 创建（pages/create/index）- 快速创建任务
3. 我的（pages/profile/index）- 个人中心

**普通页面**：
- 任务详情（pages/detail/index）- 查看任务详情、评论、历史记录

## 状态展示原则

- 空状态：居中显示图标+文案，引导用户创建任务
- 加载态：使用 `Skeleton` 骨架屏，避免空白等待
- 错误态：使用 `Alert` 或 `Toast` 显示错误信息

## 容器样式原则

- 卡片：圆角 `rounded-xl`，阴影 `shadow-sm`
- 输入框容器：圆角 `rounded-lg`，背景 `bg-gray-50`
- 按钮：圆角 `rounded-lg`，主按钮 `bg-blue-500 text-white`

## 小程序约束

- TabBar 图标必须使用本地 PNG（81x81），存放 `src/assets/tabbar/`
- 图片/视频资源通过 TOS 对象存储，代码中使用返回 URL
- 避免大图片打包，控制包体积
- 使用相对路径，让 Network 自动处理域名