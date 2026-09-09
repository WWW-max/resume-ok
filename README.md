# ResumeOK

按 `public/designs/web-ui.png` 实现的在线简历编辑器。Next.js 16.2、React 19、TypeScript、Tailwind CSS，后端使用 Next.js Route Handlers 与本地 PostgreSQL。

## 本地启动

需要 Node.js 20+、pnpm 与 Docker Compose。

```sh
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm run db:migrate
pnpm run dev
```

打开 http://localhost:3000 查看首页，访问 http://localhost:3000/editor 会要求登录。验证码邮件在 Mailpit 的 http://localhost:8025 查看。

`docker-compose.yml` 只将 PostgreSQL、Mailpit SMTP 和 Mailpit Web 收件箱绑定到 `127.0.0.1`。PostgreSQL 使用 `trust` 认证仅为本机开发便利，不能用于共享或生产环境。`.env.example` 只包含非秘密的本地开发配置；生产环境必须使用独立的数据库认证、HTTPS 和受保护的 SMTP 配置。

## 账号与认证

- `/register`：兼容旧地址，保留 `next` 并跳转到统一登录入口。
- `/login`：默认邮箱 + 6 位验证码登录 / 注册，保留已有账号的密码登录。
- 新旧邮箱均可请求验证码，只有验证成功后才创建新账号；新账号无需设置密码。不会覆盖已有账号的密码或简历。
- 验证码只存 bcrypt 哈希，10 分钟过期、一次性使用，最多尝试 5 次；同一邮箱 60 秒内不能重复请求，每小时最多请求 5 次。
- 会话令牌通过密码学随机数生成，数据库只保存 SHA-256 哈希；浏览器使用 `HttpOnly`、`SameSite=Lax` Cookie，生产环境自动启用 `Secure`。
- 登录后 `next` 跳转仅接受同源相对路径，所有写接口拒绝跨源浏览器请求。

本地验证码端到端流程：进入 `/login`，输入邮箱并发送验证码，然后在 Mailpit 收件箱打开邮件并输入 6 位验证码。新邮箱自动注册，已有邮箱直接登录。

升级已有数据库前先运行 `pnpm run db:migrate`：迁移会保留原账号与验证码，允许无密码账号和按邮箱签发验证码。

## 数据存储边界

简历库保存在 PostgreSQL 的 `resume_libraries` 表，并以 `user_id` 作为主键和外键。`/api/resumes` 只从当前会话取得用户 ID，客户端不能提交或选择用户 ID，因此不同账号的数据彼此隔离。服务端在写入前调用现有 `parseLibrary` 完整校验，JSON 请求限制为 5 MiB。

浏览器 `localStorage` 不再是主存储。账号首次登录且服务器还没有简历库时，编辑器会读取合法的旧 `resumeok.library.v1` 数据、上传到当前账号，并在成功后删除本地副本；如果服务器已有数据，则服务器优先并清理旧副本，避免账号之间串数据。之后编辑器以 500 ms debounce 自动保存到 API，并在页面隐藏或卸载时尽可能使用 keepalive 刷新。JSON 导入、导出仍可用于手动备份和迁移。

数据库包含：

- `users`：规范化唯一邮箱和密码哈希。
- `sessions`：会话令牌哈希、过期时间和用户外键。
- `login_codes`：验证码哈希、过期/消费时间、尝试次数和节流记录。
- `resume_libraries`：每个用户一份经过校验的 JSONB 简历库。

`db/schema.sql` 与 `pnpm run db:migrate` 都是幂等的。数据库访问只发生在运行时请求路径，执行生产构建不需要数据库在线。

## API

- `POST /api/auth/register`（已停用，返回 410 并提示使用验证码）
- `POST /api/auth/login/password`
- `POST /api/auth/login/code/request`
- `POST /api/auth/login/code/verify`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/resumes`
- `PUT /api/resumes`

除 GET 外，接口接收 `application/json`（登出无请求体），统一错误格式为 `{ "error": { "code", "message" } }`。

## 已实现

- 统一绿色主题的三栏工作台；手机底部导航、单栏编辑与预览切换、窄屏单列表单。
- 邮箱注册、密码登录、Mailpit 验证码登录、注销与账号专属会话。
- 个人信息、头像、工作、项目、教育、技能和自我评价编辑。
- 模块拖拽排序、键盘可操作的上移 / 下移、隐藏与恢复。
- PostgreSQL 账号数据自动保存；新建、复制、重命名、归档与恢复简历。
- 旧版浏览器数据一次性迁移；JSON 导出备份与校验导入。
- 撤销 / 重做，支持 Cmd / Ctrl + Z 与 Cmd / Ctrl + Shift + Z。
- 三种模板，强调色、字号、间距、品牌标识设置。
- 自适应和 50%–150% 缩放，A4 多页 PDF 下载；失败时可使用浏览器打印。
- 本地完整度检查与对应模块跳转。

## 数据与功能限制

头像接受 JPG / PNG / WebP，最大 5 MB，并缩小至最长边 400px。简历库最多 100 份，每个列表模块最多 100 条；JSON 导入文件上限 10 MB，API 简历库请求上限 5 MiB。PDF 下载为图像式 PDF；需要可选择文字时可使用浏览器打印。简历检查使用明确的本地规则，不是 AI 或招聘评分。

## 验证

```sh
pnpm test
pnpm lint
pnpm build
RUN_DB_INTEGRATION=1 pnpm run test:integration
```

数据库集成测试要求 Compose PostgreSQL 已启动并完成迁移。测试使用带随机标记的临时用户，并只清理自己创建的数据。它验证两个用户的同名简历互不可见、会话仅存哈希、验证码过期以及验证码一次性消费。

如需完全重置本项目的本地数据库，可在确认不再需要数据后手动执行 `docker compose down -v`；普通停止使用 `docker compose down`，不会删除卷。

## 首页与响应式

- `/` 为可滚动 Landing 首页；`/editor` 为受登录保护的全屏工作台。
- 首页采用移动优先布局，窄屏折叠菜单、功能网格及步骤卡片。
- 编辑器在 900px 以下切换到底部导航和单面板；420px 以下表单切换单列。
- 触控输入字号为 16px，主要操作最小高度 44px；底部导航包含安全区间距。
- 预览根据容器实际内边距计算缩放，纸张内部保持 A4 排版；手动放大后仅预览区域横向滚动。
- 所有主题强调色统一绿色；历史蓝/灰强调色设置导入时迁移为绿色系，简历内容不变。
