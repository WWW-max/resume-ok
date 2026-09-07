<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 样式约定

- 项目页面和组件样式统一使用 Tailwind CSS 工具类，重复组合可提取为静态类常量。
- 响应式、交互状态、模板变体和打印样式使用 Tailwind variants；不新增自定义组件 CSS 或 CSS Modules。
- `app/globals.css` 仅保留 Tailwind 入口、主题变量与无法绑定元素的 `@page` 设置。
- 内联 `style` 仅用于运行时计算的尺寸、缩放和 CSS 自定义变量；固定值使用工具类。PDF 导出隔离副本的样式复制属于导出逻辑，不用于页面布局。
