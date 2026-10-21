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
  name: "张三",
  title: "算法工程师",
  phone: "138-0000-0000",
  email: "zhangsan@example.com",
  location: "北京",
  github: "https://github.com/zhangsan-ai",
  website: "",
  avatar: "",
  schoolLogo: "",
  summary:
    "硕士毕业于计算机科学与技术专业，专注于大语言模型（LLM）微调对齐、RAG 检索增强生成、多智能体系统与高性能推理加速落地。",
  skills: [
    {
      id: "skill-1",
      category: "大模型与 NLP",
      items:
        "深入理解 **Transformer、Qwen、LLaMA** 等主流架构，熟练掌握 **CPT 持续预训练、SFT 指令微调（LoRA / QLoRA）、RLHF / DPO 对齐、RAG 检索增强** 与 **Agent 工具调用**。",
    },
    {
      id: "skill-2",
      category: "训练与推理加速",
      items:
        "熟练使用 **PyTorch、Transformers、LLaMA-Factory、DeepSpeed（ZeRO）** 进行分布式训练；掌握 **vLLM、TensorRT-LLM、AWQ / GPTQ 量化** 高并发推理部署。",
    },
    {
      id: "skill-3",
      category: "检索与机器学习",
      items:
        "熟练构建 **Milvus、Faiss、Elasticsearch** 向量与混合检索引擎，掌握 **BGE / SimCSE 语义表征、Cross-Encoder 重排** 以及 **XGBoost、LightGBM** 经典算法。",
    },
    {
      id: "skill-4",
      category: "编程与工程化",
      items:
        "熟练掌握 **Python、C++、SQL**，具备扎实的算法与数据结构功底；熟悉 **Linux、Docker、Kubernetes、Triton** 模型服务化与工程落地。",
    },
  ],
  workExperiences: [
    {
      id: "we-1",
      company: "星云智算科技有限公司",
      position: "算法工程师（大模型方向）",
      startDate: "2023-07",
      endDate: "",
      current: true,
      description:
        "• 负责垂直领域大语言模型的 **指令微调（SFT）与偏好对齐（DPO）**，构建自动化数据清洗与合成管线，沉淀高质量领域指令集 20w+ 条；\n• 主导企业级 **RAG 知识库问答与多路召回重排（Hybrid Search + Reranker）** 架构升级，端到端复杂问答准确率由 71% 提升至 89%；\n• 基于 **vLLM + PagedAttention + AWQ 4-bit 量化** 优化线上推理服务，单卡吞吐量提升 2.6 倍，P99 首字延迟（TTFT）降低 45%。",
    },
    {
      id: "we-2",
      company: "云帆数据科技有限公司",
      position: "NLP 算法工程师",
      startDate: "2022-03",
      endDate: "2023-06",
      current: false,
      description:
        "• 参与智能客服对话系统的 **意图识别与槽位填充（RoBERTa + GlobalPointer）** 模型研发，覆盖 60+ 核心业务场景，线上 F1 达 93.4%；\n• 构建基于 **SimCSE 对比学习** 的语义向量召回模型与 Faiss 索引服务，线上 FAQ 检索 Top-1 命中率提升 8.5 个百分点。",
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "企业级智能投研大模型与多智能体（Multi-Agent）分析平台",
      role: "核心算法负责人",
      startDate: "2023-10",
      endDate: "至今",
      link: "",
      description:
        "项目简介：面向金融投研场景的深度研报解析、财报指标抽取与自动化研报生成平台，支持长文档跨表推理与外部工具调用。\n技术栈：Qwen2.5 + LLaMA-Factory + DeepSpeed ZeRO-3 + Milvus + BGE-M3 + vLLM\n主要成果与难点：\n• 采用 **Self-Instruct + 专家校验** 构建 8 万条金融垂域 CoT 思维链数据，结合 **LoRA + DPO** 对齐训练，复杂财报指标推理准确率提升 19%；\n• 设计 **稠密向量（BGE-M3）+ 稀疏检索（BM25）** 混合检索与父子文档切分策略，有效解决跨页表格截断导致的模型幻觉问题；\n• 引入 **Prefix Caching 与投机采样（Speculative Decoding）** 优化长上下文推理性能，显存占用降低 35%，生成速度提升 1.8 倍。",
    },
    {
      id: "proj-2",
      name: "多模态商品表征与高并发智能搜索推荐系统",
      role: "核心算法研发",
      startDate: "2022-07",
      endDate: "2023-05",
      link: "",
      description:
        "项目简介：支撑千万级商品库的搜索相关性匹配与召回粗排系统，融合商品文本语义与主图视觉多模态特征。\n技术栈：PyTorch + Chinese-CLIP + Faiss + LightGBM + TensorRT + Triton Inference Server\n主要成果与难点：\n• 基于 **Chinese-CLIP** 进行领域图文对比学习微调，构建统一的多模态商品向量表征，长尾冷启动商品点击率（CTR）提升 6.2%；\n• 使用 **TensorRT FP16 量化** 与动态 Batching 部署在线推理服务，单实例 QPS 突破 1800，平响稳定在 12ms 以内。",
    },
  ],
  openSource: [],
  educations: [
    {
      id: "edu-1",
      school: "某某科技大学",
      major: "计算机科学与技术（人工智能方向）",
      degree: "硕士",
      startDate: "2020-09",
      endDate: "2023-06",
      gpa: "3.85 / 4.0",
      description:
        "研究方向：自然语言处理与大模型高效微调，以第一作者发表 ACL / EMNLP 论文 2 篇",
    },
  ],
  sectionOrder: [
    "educations",
    "skills",
    "workExperiences",
    "projects",
    "openSource",
    "summary",
  ],
  hiddenSections: ["openSource", "summary"],
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
