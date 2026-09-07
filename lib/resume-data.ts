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

export type SectionKey =
  | "summary"
  | "workExperiences"
  | "projects"
  | "educations"
  | "skills";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "workExperiences",
  "projects",
  "educations",
  "skills",
  "summary",
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "自我评价",
  workExperiences: "工作经历",
  projects: "项目经历",
  educations: "教育背景",
  skills: "技能特长",
};

export interface ResumeData {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  github: string;
  website: string;
  avatar: string;
  summary: string;
  workExperiences: WorkExperience[];
  educations: Education[];
  projects: Project[];
  skills: Skill[];
  sectionOrder: SectionKey[];
  hiddenSections?: SectionKey[];
  appearance?: ResumeAppearance;
}

export const defaultResumeData: ResumeData = {
  name: "张三",
  title: "高级前端工程师",
  phone: "138-0000-0000",
  email: "zhangsan@example.com",
  location: "北京市",
  github: "github.com/zhangsan",
  website: "",
  avatar: "",
  summary:
    "5年前端开发经验，熟练掌握 React、Vue、TypeScript 等主流技术栈，有大型复杂项目的架构设计和团队协作经验。热爱技术，持续学习，追求高质量代码与极致用户体验。",
  workExperiences: [
    {
      id: "we-1",
      company: "某某科技有限公司",
      position: "高级前端工程师",
      startDate: "2022-03",
      endDate: "",
      current: true,
      description:
        "• 主导公司核心业务系统的前端架构设计与重构，提升页面性能 40%\n• 负责组件库建设，封装 50+ 通用组件，团队研发效率提升 30%\n• 推动前端工程化建设，引入 CI/CD 流程，减少上线风险\n• 指导 3 名初级工程师，组织技术分享，提升团队整体技术水平",
    },
    {
      id: "we-2",
      company: "某互联网公司",
      position: "前端工程师",
      startDate: "2019-07",
      endDate: "2022-02",
      current: false,
      description:
        "• 参与公司电商平台的前端开发，负责商品详情、购物车等核心模块\n• 使用 React + Redux 构建单页应用，优化首屏加载速度\n• 与后端团队协作，设计并实现 RESTful API 接口对接方案",
    },
  ],
  educations: [
    {
      id: "edu-1",
      school: "某某大学",
      major: "计算机科学与技术",
      degree: "本科",
      startDate: "2015-09",
      endDate: "2019-06",
      gpa: "3.8/4.0",
      description: "主修数据结构、算法、操作系统、计算机网络等核心课程",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "企业级低代码平台",
      role: "技术负责人",
      startDate: "2023-01",
      endDate: "2023-12",
      link: "",
      description:
        "• 设计并实现可视化拖拽编辑器，支持 20+ 组件类型\n• 基于 JSON Schema 设计可扩展的表单配置系统\n• 实现多人实时协作编辑功能（WebSocket + OT 算法）\n• 平台上线后服务 200+ 企业客户，月活跃用户 5000+",
    },
  ],
  skills: [
    {
      id: "skill-1",
      category: "编程语言",
      items: "JavaScript / TypeScript / HTML / CSS",
    },
    {
      id: "skill-2",
      category: "框架与库",
      items: "React / Next.js / Vue 3 / Node.js",
    },
    {
      id: "skill-3",
      category: "工具与平台",
      items: "Git / Webpack / Vite / Docker / Linux",
    },
  ],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
};
