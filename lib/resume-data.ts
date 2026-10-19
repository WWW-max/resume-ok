import type { ResumeAppearance } from "./resume-appearance";
export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  link: string;
  description: string;
}

export interface Skill {
  id: string;
  category: string;
  items: string;
}

export type BuiltinSectionKey =
  | "summary"
  | "workExperiences"
  | "projects"
  | "openSource"
  | "educations"
  | "skills";

export type CustomSectionKey = `custom:${string}`;

export type SectionKey = BuiltinSectionKey | CustomSectionKey;

export interface CustomSection {
  id: CustomSectionKey;
  title: string;
  content: string;
  items?: Project[];
}

export const DEFAULT_SECTION_ORDER: BuiltinSectionKey[] = [
  "skills",
  "workExperiences",
  "projects",
  "openSource",
  "educations",
  "summary",
];

export const SECTION_LABELS: Record<BuiltinSectionKey, string> = {
  summary: "自我评价",
  workExperiences: "工作经历",
  projects: "项目经历",
  openSource: "开源项目",
  educations: "教育经历",
  skills: "专业技能",
};

export function isCustomSectionKey(key: string): key is CustomSectionKey {
  return key.startsWith("custom:");
}

export function getSectionLabel(
  data: Pick<ResumeData, "sectionTitles" | "customSections">,
  key: SectionKey,
): string {
  const customTitle = data.sectionTitles?.[key]?.trim();
  if (customTitle) return customTitle;
  if (isCustomSectionKey(key)) {
    return (
      data.customSections?.find((s) => s.id === key)?.title.trim() ||
      "自定义模块"
    );
  }
  return SECTION_LABELS[key];
}

export interface ResumeData {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  github: string;
  website: string;
  avatar: string;
  schoolLogo: string;
  summary: string;
  workExperiences: WorkExperience[];
  educations: Education[];
  projects: Project[];
  openSource?: Project[];
  skills: Skill[];
  customSections?: CustomSection[];
  sectionOrder: SectionKey[];
  hiddenSections?: SectionKey[];
  sectionTitles?: Partial<Record<SectionKey, string>>;
  appearance?: ResumeAppearance;
}

export const defaultResumeData: ResumeData = {
  name: "吴志鹏",
  title: "",
  phone: "189-6909-5697",
  email: "464711201@qq.com",
  location: "",
  github: "https://github.com/www-max",
  website: "",
  avatar: "",
  schoolLogo: "",
  summary: "",
  skills: [
    {
      id: "skill-1",
      category: "Web 前端",
      items:
        "掌握 **HTML5、CSS3、JavaScript、TypeScript**，遵循 **W3C 标准** 及 **ES6+ 规范**，理解 **函数式编程** 和 **面向对象编程思想**。",
    },
    {
      id: "skill-2",
      category: "React 生态",
      items:
        "深入理解 **React 设计理念** 及 **核心原理**，阅读过相关 **源码**，熟练使用 **React 全家桶（React Router、Redux、Hooks）**。",
    },
    {
      id: "skill-3",
      category: "Vue 生态",
      items:
        "熟练掌握 **Vue 2 / Vue 3** 框架语法，熟练使用 **Vuex、Pinia** 进行状态管理，能基于 Vue 框架进行完整项目开发。",
    },
    {
      id: "skill-4",
      category: "前沿技术",
      items:
        "熟悉 **Next.js 全栈** 框架，理解 **SSR、SSG** 等概念，掌握 **TailwindCSS、Zustand、Jotai、shadcn/ui** 等热门技术栈。",
    },
    {
      id: "skill-5",
      category: "工程化与优化",
      items:
        "熟悉 **Webpack、Vite** 等前端主流 **构建工具**，能对项目配置优化，提高研发效率，针对 **系统性能优化**。",
    },
    {
      id: "skill-6",
      category: "后端开发",
      items:
        "熟悉 **Node.js**，熟练掌握 **Express、Koa、Egg、NestJS** 进行接口开发；熟悉 **Java / Python**，具备基本的服务端开发能力。",
    },
    {
      id: "skill-7",
      category: "网络与浏览器",
      items:
        "熟悉 **HTTP/HTTPS** 协议，理解 **浏览器运行原理** 及 **渲染机制**，具备 **浏览器插件开发** 经验，并设计实现高效提效工具。",
    },
    {
      id: "skill-8",
      category: "跨移动端开发",
      items:
        "具备 **React Native、Expo、Flutter** 开发企业级业务需求的实战经验，熟悉 **Uniapp、Taro 跨端框架** 及原生 **微信小程序** 开发。",
    },
    {
      id: "skill-9",
      category: "桌面端开发",
      items:
        "熟悉 **Electron** 框架使用及核心实现原理，具备使用 **Electron** 开发 **Windows** 和 **MacOS** 桌面端提效工具和应用实际经验。",
    },
    {
      id: "skill-10",
      category: "数据库与运维",
      items:
        "熟悉关系型数据库 **MySQL**、非关系型 **MongoDB**、了解 **Docker** 等容器化技术，了解 DevOps 相关工具链。",
    },
    {
      id: "skill-11",
      category: "AI 相关",
      items:
        "熟悉 **LangChain 框架**、理解 **LLM、RAG、Embedding、AI agent** 等概念，熟悉 **Dify，FastGPT** 等 **AI** 项目及各种 **AI 工具**的使用。",
    },
  ],
  workExperiences: [
    {
      id: "we-1",
      company: "一家专注 AI 精神健康、脑机接口创业公司",
      position: "",
      startDate: "2025-03",
      endDate: "",
      current: true,
      description:
        "• 负责围绕非侵入式脑机接口、心理、梦境相关、围绕大模型相关技术实现公司AI产品包括APP、SaaS、小程序、桌面端应用等；\n• 公司新项目开发技术选型、落地实现技术方案编写、项目技术难点突破、前沿技术探索、盈利项目日常需求迭代功能开发、缺陷修复工作；\n• 公司内部提效工具研发、系统性能优化、项目代码持续优化、团队级项目 Agent Skills 编写；",
    },
    {
      id: "we-2",
      company: "杭州萃蓝网络科技有限公司",
      position: "",
      startDate: "2024-08",
      endDate: "2024-11",
      current: false,
      description:
        "• 负责数据库迁移系统 portal 控制端及云端前端页面设计及功能落地编码、测试以及针对前端交互优化改进工作；\n• 和设计师配合参与公司产品官网页面设计，完成产品官网前端技术选型和功能设计并从0到1独立实现产品官网；\n• 负责司内面向海外市场的 AI 相关移动端 APP 产品功能开发工作；",
    },
    {
      id: "we-3",
      company: "熙牛医疗科技（浙江）有限公司",
      position: "",
      startDate: "2021-12",
      endDate: "2024-06",
      current: false,
      description:
        "• 负责医疗信息系统前端四大业务线（医生&护士站、药房&医技医辅、公共卫生、支付结算）日常业务需求研发；\n• 司内前端业务框架 Jarvis 的架构设计及落地实现、维护公司前端 UI 组件库、封装通用业务组件库、前端脚手架工具基建；\n• 医疗信息系统前端性能优化、持续改进交互提升用户体验、保障生产稳定性、承担团队前端新人指导和 Code Review 工作；",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "基于非侵入式脑机接口的多端睡眠干预与 AI 智能助眠系统",
      role: "",
      startDate: "2025-03",
      endDate: "至今",
      link: "",
      description:
        "项目简介： 一个软硬件一体化的前沿智能助眠舱全栈生态系统。通过接收非侵入式脑机设备（BCI）的高频生理特征数据，结合大语言模型进行长周期睡眠状态的意图识别与规则推理，秒级下发结构化的物理干预指令，实现“监测-推理-干预”的智能助眠闭环。\n技术栈： React + uni-app + Flutter + TypeScript + Nest.js + WebSockets + LangGraph.js + pnpm Monorepo + Jenkins\n主要成果与难点：\n• 设计并实现基于 LangGraph.js 的有向无环图（DAG）多智能体状态机，将复杂的睡眠周期与干预动作抽象为图节点，利用大模型 JSON Mode 实现结构化输出（Structured Outputs），让 LLM 充当“智能调度大脑”，确保干预指令 100% 具备程序可执行性；\n• 构建高可用、低延迟的端到端全双工通信管道，基于 TypeScript 独立封装了一套具备指数退避重连、智能心跳检测与 Token 无感续签的全局 WebSocket 状态 Hook，攻克了长达 8 小时睡眠交互中移动端长连接易断连、假死的痛点；\n• 攻克高频生理数据流导致的端侧性能瓶颈，设计了端侧数据缓冲区与时间窗口节流阀，将毫秒级脑电特征平滑转化为秒级数据流，有效避免了前端页面频繁重复渲染（Re-render）导致的卡顿现象，保障弱网及低性能设备的丝滑体验；\n• 推行现代化的前端 Monorepo 工程化架构与自动化部署，基于 pnpm Monorepo 将跨端小程序、Flutter App 与管理后台的公共 API、长连接协议及加解密算法完全抽离，核心代码复用率达 40%；深度定制 Jenkins 自动化构建管线，日常迭代发布效率提升 3 倍。",
    },
    {
      id: "proj-2",
      name: "Bluepipe - 产品官网",
      role: "",
      startDate: "2024-08",
      endDate: "2024-10",
      link: "",
      description:
        "项目简介：包含产品落地页、价格页、文档中心、博客四大核心模块的官方网站，为用户提供全方位的产品信息展示和技术支持。\n技术栈：Next.js + Nextra + Tailwind CSS + Zustand + TypeScript + Docsaurus + shadcn/ui + GitHub Actions\n主要成果与难点：\n• 开发前期对网站开发前端工具技术进行调研，比对多种主流框架工具，最终完成技术选型；\n• 基于主流 APP Router 搭建项目框架结构，利用 Docsaurus 替代 Nextra 解决 Nextra 无法同时支持文档和博客主题的局限性；\n• 通过编写 GitHub Actions Workflow 脚本实现项目开发阶段自动化 CI/CD 流程，大幅提升开发和部署效率；",
    },
    {
      id: "proj-3",
      name: "1st-console — 数据迁移系统控制台 & 云端运营管理中心 & 产品官网",
      role: "",
      startDate: "2024-08",
      endDate: "2024-11",
      link: "",
      description:
        "项目简介：国产数据库替换和本地数据库迁移上云等背景下，一套高效的数据迁移与同步工具及其配套云端运营管理系统及产品官网。\n技术栈：Vite + pnpm + Vitest + TanStack Query + ky + Mantine UI + D3.js + Radix UI + Jotai + TailwindCSS + TS +\n主要成果与难点：\n• 使用 D3.js 开源可视化库开发数据迁移过程中流任务和批任务的甘特图，直观展示任务的进度、时间线；\n• 通过使用 Vite 插件，提高系统在低版本浏览器中的兼容性，并实现打包时通过命令行传参一键替换系统 logo 和名称的功能；\n• 通过vite 打包依赖关系图分析，调整vite分包策略配置，解决项目index文件体积过大问题，有效提升页面加载性能；",
    },
    {
      id: "proj-4",
      name: "Bible-chat-app — 圣经 AI 聊天 APP",
      role: "",
      startDate: "2024-08",
      endDate: "2024-11",
      link: "https://www.bibles.chat/",
      description:
        "项目简介：一款面向海外用户，基于大语言模型的圣经AI聊天APP\n技术栈：Expo + Google Firebase Analytics + expo-apple-authentication + Axios + TypeScript\n主要成果与难点：\n• AI聊天模块开发，设计并实现首页圣经角色AI聊天功能，基于大语言模型提供准确、生动的圣经问答和交互；\n• 苹果登录集成，基于 expo-apple-authentication 封装通用登录组件，成功接入苹果登录功能，提升用户体验和兼容性；\n• 用户行为数据分析，使用 Google Firebase Analytics 完成全链路埋点和用户行为数据上报，为产品迭代提供数据支撑；",
    },
    {
      id: "proj-5",
      name: "HBOS — 医疗健康业务操作系统",
      role: "",
      startDate: "2023-01",
      endDate: "2024-06",
      link: "",
      description:
        "项目简介：一个高效可扩展性强的医疗业务操作平台，提供成体系化的大型医院通用业务能力及小医院定制化前端需求解决方案。\n技术栈：UmiJS + qiankun + React + Redux + React Router + React Hooks + TypeScript + Less + Ant Design + InversifyJS\n主要成果与难点：\n• 设计并落地针对医疗业务的前端框架，系统整体可扩展性粒度达到组件方法级别，实现一套代码多家医疗机构共用且支持定制；\n• 使用 TS 重构原系统 JS 代码，利用类型声明、泛型函数、泛型类、面向接口编程等方式提高系统整体的健壮性和可维护性；\n• 引入 InversifyJS 以依赖注入的方式解耦模块，通过自定义业务 Hooks 封装业务逻辑，构建业务 Hooks 库，提高代码复用性；\n• 基于 OpenAPI 规范实现脚手架工具命令一键生成类型定义文件，简化 TypeScript 开发流程，前端业务开发效率提升25%；",
    },
    {
      id: "proj-6",
      name: "HIS — 医疗信息系统",
      role: "",
      startDate: "2021-12",
      endDate: "2023-01",
      link: "",
      description:
        "项目简介：该系统采用微前端架构实现医院全业务流程闭环的后台管理，涵盖医生、护士、药房、收费等多个业务模块。系统已在浙江大学第一附属医院、复旦大学中山老年医院、天台县人民等医院上线。\n技术栈：ice.js + React + React Router + DvaJS + JavaScript + Alibaba Fusion Design + Sass + Axios\n主要成果与难点：\n• owner医护/药房/收费/公卫四大业务线，承接多家医疗机构日常前端业务新需求的开发，线上故障及系统缺陷查证与修复；\n• 改进webpack打包配置，降低“巨石”应用构建耗时，整体构建耗时从45min降到20min左右，提升团队前端开发体验及效率；\n• 通过接口合并等方式优化了系统性能和首屏渲染，对系统中影响客户使用体验的交互及功能点进行合理优化，提升用户体验；",
    },
  ],
  openSource: [
    {
      id: "os-1",
      name: "react-low-code — 全栈问卷低代码平台",
      role: "",
      startDate: "",
      endDate: "",
      link: "http://121.40.194.197/react-low-code/",
      description:
        "项目简介：用于搭建调查问卷的低代码平台，项目核心功能模块包括B端的问卷低代码编辑器、问卷管理、答卷可视化数据统计、以及C端发布、提交问卷。\n技术栈： CRA + React + Redux + Ant Design + Sass + ahooks + dnd-kit + Recharts + Next.js + Express + Jest + Storybook\n主要成果与难点：\n• 设计问卷物料组件与页面布局间映射关系数据结构，实现了基于物料组件的问卷页面低代码搭建功能；\n• 基于dnd-kit实现图层拖拽排序并同步修改问卷画布中组件排版功能，使用ahooks实现快捷键快速搭建问卷功能提升用户体验；\n• 利用 Source-Map-Explore 进行打包体积分析，通过缓存数据，splitChunks 等方式对项目bundle 文件进行合理拆分，系统首屏加载耗时由 100ms 左右降低到 30ms 左右，速度提升将近 70%，Lighthouse 检测工具综合评分由原来72提升到100分；\n• 使用 Jest 和 Storybook 工具库对7个原子物料进行单元测试和可视化测试，物料组件测试覆盖面达100%，通过率100%；",
    },
    {
      id: "os-2",
      name: "artifonia — AI 语音助手 APP",
      role: "",
      startDate: "",
      endDate: "",
      link: "",
      description:
        "项目简介：一款基于Google Gemini API，采用 React Native 技术栈开发的 AI 语音助手 APP\n技术栈：Google Gemini API + Expo + expo-av + expo-speech + lottie-react-native\n主要成果与难点：\n• 使用 React Native 框架 （Expo）快速搭建项目结构，有效降低 RN 桥接原生代码复杂度，显著提升开发效率；\n• 利用 expo-av 和 expo-speech 完成用户语音输入和 AI 语音回答功能，Gemini API 完成语音转录文本、生成文本功能；\n• 通过 lottie-react-native 实现 APP 前端页面语音输入动态效果，提升产品美观度；\n• 通过添加特定 Prompt 对 Gemini 大模型进行合理的提示词优化，提升产品用户体验；",
    },
  ],
  educations: [
    {
      id: "edu-1",
      school: "东华理工大学",
      major: "软件工程",
      degree: "本科",
      startDate: "2017-09",
      endDate: "2021-07",
      gpa: "",
      description: "软件学院 全日制",
    },
  ],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  hiddenSections: ["summary"],
  appearance: {
    template: "classic",
    accent: "none",
    fontSize: 12,
    spacing: "compact",
    showBrand: false,
    paddingTop: 36,
    paddingRight: 36,
    paddingBottom: 36,
    paddingLeft: 36,
    dividerColor: "#262626",
    showIcons: false,
    personalInfoLayout: "center",
  },
};
