/**
 * ============================================================================
 * ResumeOK 会员体系核心配置文件 (Single Source of Truth)
 * ============================================================================
 *
 * 维护指南：
 * 1. 修改价格、有效天数、推荐角标 -> 直接修改下方 `MEMBERSHIP_PLANS`
 * 2. 修改免费版 / 月卡 / 季卡 / 年卡的功能边界或简历数量上限 -> 直接修改下方 `PLAN_ENTITLEMENTS`
 * 3. 修改受限功能的弹窗提示语 -> 直接修改下方 `FEATURE_UPGRADE_PROMPTS`
 *
 * 前后端所有组件与 API 路由均通过本文件导出的辅助函数读取配置，无需去业务组件中逐个修改。
 */

/** 会员等级标识：免费版 | 月卡 | 季卡 | 年卡 */
export type MembershipPlan = "free" | "monthly" | "quarterly" | "yearly";

/** 支持的在线支付方式标识 */
export type PaymentMethod = "wechat" | "alipay";

/**
 * ============================================================================
 * 客服联系与激活码获取渠道配置（修改此处或配置环境变量即可全站生效）
 * ============================================================================
 * 当用户没有激活码、或希望通过添加个人微信/自动发卡平台购买激活码时展示此信息。
 */
export const CUSTOMER_SERVICE_CONFIG = {
  /** 客服微信号（支持用户一键复制添加好友获取激活码） */
  wechatId:
    process.env.NEXT_PUBLIC_SUPPORT_WECHAT || "ResumeOK_VIP",
  /** 客服联系邮箱或备用联系方式 */
  supportEmail:
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@resumeok.cn",
  /** 客服微信二维码图片地址（可选：将二维码图片放到 public/brand/support-qr.png 后填入路径即可直接展示图片） */
  qrCodeImageUrl: process.env.NEXT_PUBLIC_SUPPORT_QR || "",
  /** 外部 24 小时自动发卡商品页链接（可选：如面包多、爱发电、闲鱼商品链接） */
  externalShopUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL || "",
  /** 客服引导说明文案 */
  guideText:
    "添加客服微信并备注「ResumeOK 会员」，支持微信或支付宝红包/转账，付款后秒发对应激活码。",
};

/** 支持权限控制的导出文件格式 */
export type ExportCapabilityFormat = "pdf" | "word" | "image" | "markdown";

/**
 * 支持权限开关控制的高级功能标识：
 * - importResume: 导入现有简历文件（PDF / 图片 OCR / Markdown / TXT）智能解析
 * - translateEnglish: 一键生成英文版简历
 * - shareOnlineResume: 生成与同步发布在线简历分享链接 (/online-resume/[slug])
 * - viewFullVisitorStats: 查看完整的 HR 访客追踪详情 (/view-statistic)
 */
export type FeatureKey =
  | "importResume"
  | "translateEnglish"
  | "shareOnlineResume"
  | "viewFullVisitorStats";

export interface PlanEntitlements {
  /** 该等级允许创建的最大简历份数（例如：免费版 1 份，会员 100 份） */
  maxResumes: number;
  /** 允许使用的模板 ID 数组（如 ['classic']），或设为 'all' 代表解锁全部模板 */
  allowedTemplates: readonly string[] | "all";
  /** 允许导出的文件格式列表（例如免费版仅 ['pdf']，会员开放全部格式） */
  allowedExportFormats: readonly ExportCapabilityFormat[];
  /** 各高级功能的布尔开关（true = 开放使用，false = 点击时弹出升级会员提示） */
  features: Record<FeatureKey, boolean>;
  /** 首页价格卡片（/#pricing）上渲染的该档位权益要点列表 */
  displayFeatures: readonly string[];
}

export interface MembershipPlanConfig {
  /** 对应数据库 plan_type 字段值 */
  id: Exclude<MembershipPlan, "free">;
  /** 档位名称（如：求职月卡） */
  name: string;
  /** 右上角高亮角标（如：最受欢迎 / 超值之选，不填则不显示） */
  badge?: string;
  /** 实际售价（展示用，单位：元） */
  price: string;
  /** 原价划线价（用于价格锚点展示，单位：元） */
  originalPrice: string;
  /** 兑换后增加的有效天数 */
  durationDays: number;
  /** 有效期标签文案 */
  periodLabel: string;
  /** 折合日均价格提示文案 */
  dailyCostLabel: string;
  /** 适用人群简短描述 */
  description: string;
}

/**
 * ============================================================================
 * 1. 会员档位价格与周期配置（修改此处即可同步更新首页价格表与工作台升级弹窗）
 * ============================================================================
 */
export const MEMBERSHIP_PLANS: MembershipPlanConfig[] = [
  {
    id: "monthly",
    name: "求职月卡",
    price: "19.9",
    originalPrice: "29.9",
    durationDays: 30,
    periodLabel: "30 天有效",
    dailyCostLabel: "日均 ¥0.66",
    description: "适合短期集中修改简历与近期急投岗位的求职者",
  },
  {
    id: "quarterly",
    name: "求职季卡",
    badge: "最受欢迎",
    price: "39.9",
    originalPrice: "59.7",
    durationDays: 90,
    periodLabel: "90 天有效",
    dailyCostLabel: "日均 ¥0.44 · 相当于买二送一",
    description: "完整覆盖春招、秋招或日常跳槽周期，从容应对多轮面试",
  },
  {
    id: "yearly",
    name: "求职年卡",
    badge: "超值之选",
    price: "89.9",
    originalPrice: "199.0",
    durationDays: 365,
    periodLabel: "365 天有效",
    dailyCostLabel: "日均仅 ¥0.24",
    description: "全年无限次畅享全部高级功能，随时复盘更新职业履历",
  },
];

/**
 * 付费会员默认全功能配置模板。
 * 如果后续希望让「月卡 / 季卡 / 年卡」拥有全部相同功能，直接复用此对象即可；
 * 如果希望不同卡种功能不同（例如月卡最多 5 份简历、季卡 20 份、年卡 100 份），
 * 可在下方的 `PLAN_ENTITLEMENTS` 中针对具体卡种单独覆盖对应字段。
 */
const PRO_FULL_ENTITLEMENTS: PlanEntitlements = {
  maxResumes: 100,
  allowedTemplates: "all",
  allowedExportFormats: ["pdf", "word", "image", "markdown"],
  features: {
    importResume: true,
    translateEnglish: true,
    shareOnlineResume: true,
    viewFullVisitorStats: true,
  },
  displayFeatures: [
    "最多创建 100 份岗位定制简历",
    "解锁全部专业模板（极简/商务等）",
    "PDF / 图片 / 文本智能解析导入",
    "一键生成专业英文版简历",
    "解锁 Word / 高清图片 / MD 导出",
    "在线简历分享 + HR 访客实时追踪",
  ],
};

/**
 * ============================================================================
 * 2. 各等级权益边界配置中心（修改此处即可调整免费版与各档会员的功能边界）
 * ============================================================================
 *
 * 常见调整示例：
 * - 想把免费版简历数量改成 2 份：将 `free.maxResumes` 改为 `2`
 * - 想让免费版连 PDF 导出也收费：将 `free.allowedExportFormats` 改为 `[]`
 * - 想让月卡最多建 10 份简历：写成 `monthly: { ...PRO_FULL_ENTITLEMENTS, maxResumes: 10 }`
 */
export const PLAN_ENTITLEMENTS: Record<MembershipPlan, PlanEntitlements> = {
  free: {
    maxResumes: 1,
    allowedTemplates: ["classic"],
    allowedExportFormats: ["pdf"],
    features: {
      importResume: false,
      translateEnglish: false,
      shareOnlineResume: false,
      viewFullVisitorStats: false,
    },
    displayFeatures: [
      "最多创建 1 份简历",
      "清新专业基础模板",
      "可视化编辑与内容检查",
      "免费无水印导出 PDF",
    ],
  },
  monthly: {
    ...PRO_FULL_ENTITLEMENTS,
  },
  quarterly: {
    ...PRO_FULL_ENTITLEMENTS,
  },
  yearly: {
    ...PRO_FULL_ENTITLEMENTS,
  },
};

/** 工作台「升级 PRO 会员」弹窗中展示的 6 大核心权益文案 */
export const PRO_MODAL_PRIVILEGES: readonly string[] = [
  "最多创建 100 份简历（免费版仅限 1 份），支持按岗位定制",
  "解锁全部专业简历模板（清新绿意、极简紧凑、现代分栏）",
  "导入现有简历智能解析（支持 PDF、图片 OCR 识别与文本导入）",
  "一键生成英文版简历，轻松应对外企与大厂双语投递",
  "全格式导出下载（解锁 Word、高清图片、Markdown 及 PDF）",
  "在线简历专属分享链接 + HR 访客实时追踪（查看公司、城市 IP 与下载状态）",
];

/** 当用户触发未解锁功能时，在升级弹窗顶部显示的引导原因文案 */
export const FEATURE_UPGRADE_PROMPTS: Record<FeatureKey, string> = {
  importResume:
    "「导入现有简历智能解析」为会员专享功能，升级后即可一键导入 PDF、图片或文本简历。",
  translateEnglish:
    "「一键译为英文简历」为会员专享功能，升级后即可自动生成一份专业英文版简历。",
  shareOnlineResume:
    "「在线简历专属链接与 HR 访客实时追踪」为会员专享功能，升级后即可生成在线分享链接并实时查看 HR 访问详情。",
  viewFullVisitorStats:
    "「HR 访客完整追踪统计」为会员专享功能，升级后即可实时查看访问公司、城市 IP 与 PDF 下载记录。",
};

/** 获取指定会员等级的完整权益配置 */
export function getPlanEntitlements(plan: MembershipPlan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS.free;
}

/** 判断当前等级是否允许继续新建/复制简历 */
export function canCreateMoreResumes(
  plan: MembershipPlan,
  currentCount: number,
): boolean {
  const { maxResumes } = getPlanEntitlements(plan);
  return currentCount < maxResumes;
}

/** 获取当前等级允许创建的最大简历份数 */
export function getMaxResumesForPlan(plan: MembershipPlan): number {
  return getPlanEntitlements(plan).maxResumes;
}

/** 判断当前等级是否允许使用指定模板（如 'classic' | 'minimal' | 'modern'） */
export function canUseTemplate(
  plan: MembershipPlan,
  templateId: string,
): boolean {
  const { allowedTemplates } = getPlanEntitlements(plan);
  return allowedTemplates === "all" || allowedTemplates.includes(templateId);
}

/** 判断当前等级是否允许导出指定格式（'pdf' | 'word' | 'image' | 'markdown'） */
export function canExportFormat(
  plan: MembershipPlan,
  format: ExportCapabilityFormat,
): boolean {
  return getPlanEntitlements(plan).allowedExportFormats.includes(format);
}

/** 判断当前等级是否可使用指定高级功能 */
export function canUseFeature(
  plan: MembershipPlan,
  feature: FeatureKey,
): boolean {
  return Boolean(getPlanEntitlements(plan).features[feature]);
}

export interface MembershipStatus {
  /** 当前有效等级（若已过期则自动降级为 'free'） */
  plan: MembershipPlan;
  /** 会员到期时间 ISO 字符串 */
  expiresAt: string | null;
  /** 当前是否处于有效付费会员期内 */
  isPro: boolean;
  /** 用于 UI 展示的会员状态名称 */
  planLabel: string;
}

export function normalizeMembershipPlan(value: unknown): MembershipPlan {
  if (value === "monthly" || value === "quarterly" || value === "yearly") {
    return value;
  }
  return "free";
}

/**
 * 根据数据库中的 `membership_plan` 和 `membership_expires_at` 计算当前实时生效的会员状态。
 * 若 `membership_expires_at` 已过期，会自动将生效等级回退为 `'free'`。
 */
export function resolveMembershipStatus(
  rawPlan?: unknown,
  rawExpiresAt?: Date | string | null,
): MembershipStatus {
  const plan = normalizeMembershipPlan(rawPlan);
  if (plan === "free" || !rawExpiresAt) {
    return {
      plan: "free",
      expiresAt: null,
      isPro: false,
      planLabel: "免费版",
    };
  }
  const expiresDate =
    rawExpiresAt instanceof Date ? rawExpiresAt : new Date(rawExpiresAt);
  if (
    Number.isNaN(expiresDate.getTime()) ||
    expiresDate.getTime() <= Date.now()
  ) {
    return {
      plan: "free",
      expiresAt: Number.isNaN(expiresDate.getTime())
        ? null
        : expiresDate.toISOString(),
      isPro: false,
      planLabel: "免费版（已过期）",
    };
  }

  const labelMap: Record<Exclude<MembershipPlan, "free">, string> = {
    monthly: "PRO 月卡会员",
    quarterly: "PRO 季卡会员",
    yearly: "PRO 年卡会员",
  };

  return {
    plan,
    expiresAt: expiresDate.toISOString(),
    isPro: true,
    planLabel: labelMap[plan],
  };
}

/** 将到期时间格式化为 YYYY-MM-DD 供前端展示 */
export function formatMembershipExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
