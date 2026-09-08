<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 技术栈与架构约定

- 前端统一使用 Next.js App Router 与 TypeScript；页面、布局和组件遵循 Next.js 当前版本的目录与服务端/客户端组件约定。
- 样式统一使用 Tailwind CSS，不引入其他 CSS 框架。
- 后端接口统一使用 Next.js Route Handlers，放在 `app/api/**/route.ts`；不单独搭建 Express、Koa 等后端服务。
- 数据库统一使用 PostgreSQL。所有数据库访问仅在服务端代码或 Route Handlers 中执行，禁止在浏览器端直接连接数据库或暴露数据库凭据。
- 新增功能应沿用以上技术栈；如确需引入其他框架、后端服务或数据库，必须先说明原因并获得项目负责人确认。

## 样式约定

- 项目页面和组件样式统一使用 Tailwind CSS 工具类，重复组合可提取为静态类常量。
- 响应式、交互状态、模板变体和打印样式使用 Tailwind variants；不新增自定义组件 CSS 或 CSS Modules。
- `app/globals.css` 仅保留 Tailwind 入口、主题变量与无法绑定元素的 `@page` 设置。
- 内联 `style` 仅用于运行时计算的尺寸、缩放和 CSS 自定义变量；固定值使用工具类。PDF 导出隔离副本的样式复制属于导出逻辑，不用于页面布局。

- 全项目品牌与强调色统一使用绿色系；不混用蓝色、青色或紫色主题。正文可使用中性深色/灰色，错误和警告保留语义颜色。
