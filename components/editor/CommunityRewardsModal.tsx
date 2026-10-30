"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Gift,
  Mail,
  MessageSquarePlus,
  QrCode,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ReferralItem {
  id: string;
  maskedEmail: string;
  rewardGranted: boolean;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  category: string;
  content: string;
  contact: string;
  status: "pending" | "adopted" | "replied";
  adminNote: string;
  rewardedDays: number;
  createdAt: string;
}

interface RewardsOverviewData {
  referralCode: string | null;
  totalInvited: number;
  currentCycleCount: number;
  nextRewardNeed: number;
  rewardedMonths: number;
  invitedUsers: ReferralItem[];
  feedbacks: FeedbackItem[];
}

export interface CommunityRewardsModalProps {
  open: boolean;
  initialTab?: "invite" | "feedback";
  userEmail?: string | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  feature: "功能建议",
  template: "模板需求",
  ux: "体验优化",
  bug: "问题反馈",
  other: "其他合作",
};

export function CommunityRewardsModal({
  open,
  initialTab = "invite",
  userEmail,
  onClose,
}: CommunityRewardsModalProps) {
  const [activeTab, setActiveTab] = useState<"invite" | "feedback">(initialTab);
  const [data, setData] = useState<RewardsOverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showWechatQr, setShowWechatQr] = useState(false);

  // Feedback form states
  const [category, setCategory] = useState("feature");
  const [content, setContent] = useState("");
  const [contact, setContact] = useState(userEmail || "");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setActiveTab(initialTab);
      setFeedbackNotice("");
      setFeedbackError("");
      if (userEmail && !contact) {
        setContact(userEmail);
      }
    }
  }

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/rewards", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as RewardsOverviewData;
        setData(json);
      }
    } catch {
      // ignore network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/rewards", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: RewardsOverviewData | null) => {
        if (!cancelled && json) {
          setData(json);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://resumeok.cn";
  const inviteUrl = data?.referralCode
    ? `${origin}/login?ref=${data.referralCode}`
    : `${origin}/login`;

  const handleCopyInvite = async () => {
    const shareText = `推荐一款超好用的 AI 简历排版工具 Resume.ok，一键排版导出高清 PDF！用我的专属链接注册：${inviteUrl}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("service@resumeok.cn");
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFeedbackError("");
    setFeedbackNotice("");

    if (content.trim().length < 4) {
      setFeedbackError("请至少输入 4 个字的建议或反馈内容。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content: content.trim(),
          contact: contact.trim(),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        feedback?: FeedbackItem;
      };
      if (!res.ok) {
        throw new Error(json.message || "提交失败，请稍后重试。");
      }
      setContent("");
      setFeedbackNotice(
        "🎉 感谢您的宝贵建议！我们已收到，若建议被采纳将直接为您赠送 1 个月 PRO 会员。",
      );
      void loadOverview();
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "提交失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cycleCount = data?.currentCycleCount ?? 0;
  const totalInvited = data?.totalInvited ?? 0;
  const rewardedMonths = data?.rewardedMonths ?? 0;
  const nextNeed = data?.nextRewardNeed ?? 3;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-neutral-950/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="免费领会员与反馈建议"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-green-50/80 via-white to-green-50/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-xs">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  福利中心 & 联系我们
                </h2>
                <Badge className="border-0 bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                  免费送 PRO 会员
                </Badge>
              </div>
              <p className="text-xs text-neutral-500">
                邀请好友注册或提供产品建议，均可获赠 1 个月 PRO 会员权益
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="关闭窗口"
            className="rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body with Tabs */}
        <div className="overflow-y-auto p-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "invite" | "feedback")}
          >
            <TabsList className="mb-5 grid h-11 w-full grid-cols-2 rounded-xl bg-neutral-100 p-1">
              <TabsTrigger
                value="invite"
                className="gap-1.5 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-xs"
              >
                <Users className="h-4 w-4" />
                邀请好友送月卡
              </TabsTrigger>
              <TabsTrigger
                value="feedback"
                className="gap-1.5 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-xs"
              >
                <MessageSquarePlus className="h-4 w-4" />
                联系我们 / 提建议送会员
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Invite Friends */}
            <TabsContent value="invite" className="space-y-5">
              {/* Rule Hero Card */}
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-green-50/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge className="mb-2 border-0 bg-green-600 text-xs font-semibold text-white">
                      限时福利 · 多邀多得
                    </Badge>
                    <h3 className="text-lg font-extrabold text-neutral-900">
                      每邀请 3 位新用户注册，免费送 1 个月 PRO 会员
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      好友通过您的专属链接完成邮箱注册，系统自动统计进度；满 3 人立即自动到账 30 天会员，可无限叠加！
                    </p>
                  </div>
                </div>

                {/* 3-Step Visual Progress */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((step) => {
                    const reached = cycleCount >= step;
                    return (
                      <div
                        key={step}
                        className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                          reached
                            ? "border-green-500 bg-green-50/90 text-green-900"
                            : "border-neutral-200 bg-white/90 text-neutral-500"
                        }`}
                      >
                        <div
                          className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            reached
                              ? "bg-green-600 text-white"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {reached ? <Check className="h-4 w-4" /> : step}
                        </div>
                        <span className="text-xs font-semibold">
                          {step === 3 ? "第 3 位 · 送月卡" : `第 ${step} 位好友`}
                        </span>
                        <span className="mt-0.5 text-[11px] text-neutral-400">
                          {reached ? "已达成" : "待邀请"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Stats Row */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 px-3.5 py-2.5 text-xs text-neutral-600">
                  <span>
                    累计已成功邀请{" "}
                    <strong className="font-bold text-green-700">
                      {totalInvited}
                    </strong>{" "}
                    人
                  </span>
                  <span>
                    已累计获赠{" "}
                    <strong className="font-bold text-green-700">
                      {rewardedMonths}
                    </strong>{" "}
                    个月 PRO 会员
                  </span>
                  <span className="font-medium text-green-700">
                    当前周期再邀 {nextNeed} 人即可再领 1 个月
                  </span>
                </div>
              </div>

              {/* Referral Link Box */}
              {userEmail ? (
                <div className="space-y-2.5 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
                  <Label className="text-xs font-semibold text-neutral-700">
                    您的专属邀请链接（复制发给同学、朋友或社群）
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      readOnly
                      value={loading ? "正在生成专属链接..." : inviteUrl}
                      className="h-10 flex-1 bg-white font-mono text-xs text-neutral-700"
                    />
                    <Button
                      type="button"
                      onClick={handleCopyInvite}
                      disabled={loading || !data?.referralCode}
                      className="h-10 shrink-0 gap-1.5 rounded-xl bg-green-600 px-4 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-4 w-4" />
                          已复制邀请文案
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          一键复制邀请链接
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-dashed border-green-300 bg-green-50/40 p-5 text-center sm:flex-row sm:text-left">
                  <div>
                    <div className="text-sm font-bold text-neutral-900">
                      登录后即可生成您的专属邀请链接
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      登录账号后系统会自动绑定您的邀请码，好友注册立即计入进度
                    </p>
                  </div>
                  <Button
                    asChild
                    className="rounded-xl bg-green-600 px-5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    <Link href="/login">立即登录获取链接</Link>
                  </Button>
                </div>
              )}

              {/* Invited Friends History */}
              {userEmail && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-700">
                      我的邀请记录 ({data?.invitedUsers.length ?? 0})
                    </h4>
                    <span className="text-[11px] text-neutral-400">
                      仅统计新注册用户
                    </span>
                  </div>
                  {!data?.invitedUsers.length ? (
                    <div className="py-5 text-center text-xs text-neutral-400">
                      暂未邀请好友，快复制上方链接分享给求职伙伴吧～
                    </div>
                  ) : (
                    <div className="max-h-40 divide-y divide-neutral-100 overflow-y-auto">
                      {data.invitedUsers.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <span className="font-mono text-neutral-700">
                            {item.maskedEmail}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400">
                              {new Date(item.createdAt).toLocaleDateString(
                                "zh-CN",
                              )}
                            </span>
                            <Badge
                              variant="secondary"
                              className={
                                item.rewardGranted
                                  ? "border-0 bg-green-100 text-[11px] text-green-800"
                                  : "border-0 bg-neutral-100 text-[11px] text-neutral-600"
                              }
                            >
                              {item.rewardGranted ? "已发奖" : "已计入进度"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Contact Us & Feedback */}
            <TabsContent value="feedback" className="space-y-5">
              {/* Reward Notice Banner */}
              <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 via-green-50/60 to-white p-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">
                      有奖建议征集：建议被采纳立送 1 个月 PRO 会员
                    </h3>
                    <Badge className="border-0 bg-green-600 text-[11px] text-white">
                      送 30 天会员
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                    无论是希望新增的简历模板、导出细节优化还是遇到的任何小问题，欢迎随时告诉我们！一旦您的建议被采纳，系统将自动为您账号赠送{" "}
                    <strong className="font-semibold text-green-700">
                      1 个月（30 天）PRO 会员
                    </strong>
                    。
                  </p>
                </div>
              </div>

              {/* Official Contact Channels */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-green-700 shadow-2xs">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">
                        官方客服邮箱
                      </div>
                      <div className="font-mono text-xs text-neutral-500">
                        service@resumeok.cn
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmail}
                    className="h-8 rounded-lg px-2.5 text-xs"
                  >
                    {copiedEmail ? "已复制" : "复制"}
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-green-700 shadow-2xs">
                      <QrCode className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">
                        微信人工客服
                      </div>
                      <div className="text-xs text-neutral-500">
                        扫码添加客服微信交流
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWechatQr((prev) => !prev)}
                    className="h-8 rounded-lg border-green-200 bg-white px-2.5 text-xs text-green-700 hover:bg-green-50"
                  >
                    {showWechatQr ? "收起二维码" : "查看二维码"}
                  </Button>
                </div>
              </div>

              {showWechatQr && (
                <div className="flex flex-col items-center rounded-2xl border border-green-200 bg-green-50/40 p-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/contact/wechat-cs-qr.png"
                    alt="微信客服二维码"
                    className="h-44 w-44 rounded-xl border border-neutral-200 bg-white object-contain p-2 shadow-xs"
                  />
                  <p className="mt-2 text-xs text-neutral-600">
                    微信扫一扫添加官方客服，备注「反馈建议」或「领会员」优先处理
                  </p>
                </div>
              )}

              {/* Feedback Submission Form */}
              <form
                onSubmit={handleSubmitFeedback}
                className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-700">
                      反馈类型
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-10 w-full rounded-xl bg-white text-xs">
                        <SelectValue placeholder="选择反馈类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">💡 功能建议</SelectItem>
                        <SelectItem value="template">🎨 模板需求</SelectItem>
                        <SelectItem value="ux">✨ 体验优化</SelectItem>
                        <SelectItem value="bug">🐞 问题 / Bug 反馈</SelectItem>
                        <SelectItem value="other">🤝 商务与其他合作</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-neutral-700">
                      您的联系邮箱 / 微信（用于发放会员奖励）
                    </Label>
                    <Input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="请输入注册邮箱或微信号"
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-neutral-700">
                    建议或反馈内容
                  </Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="请详细描述您的产品建议、想要的模板风格或遇到的问题（建议一旦采纳即送 1 个月 PRO 会员）..."
                    rows={4}
                    className="rounded-xl text-xs leading-relaxed"
                  />
                </div>

                {feedbackError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                    {feedbackError}
                  </p>
                )}
                {feedbackNotice && (
                  <p className="rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    {feedbackNotice}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-neutral-400">
                    {userEmail
                      ? `当前绑定账号：${userEmail}`
                      : "未登录也可提交，建议填写注册邮箱以便自动发放会员"}
                  </span>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-10 rounded-xl bg-green-600 px-5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    {submitting ? "正在提交..." : "提交建议（采纳送月卡）"}
                  </Button>
                </div>
              </form>

              {/* My Submitted Feedbacks */}
              {data?.feedbacks && data.feedbacks.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4">
                  <h4 className="mb-2.5 text-xs font-bold text-neutral-700">
                    我提交过的建议 ({data.feedbacks.length})
                  </h4>
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {data.feedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-xl border border-neutral-200/80 bg-white p-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-neutral-800">
                            [{CATEGORY_LABELS[fb.category] || "反馈"}]{" "}
                            {fb.content.slice(0, 60)}
                            {fb.content.length > 60 ? "..." : ""}
                          </span>
                          <Badge
                            variant="secondary"
                            className={
                              fb.status === "adopted"
                                ? "shrink-0 border-0 bg-green-100 text-[11px] font-semibold text-green-800"
                                : "shrink-0 border-0 bg-neutral-100 text-[11px] text-neutral-600"
                            }
                          >
                            {fb.status === "adopted"
                              ? `🎉 已采纳 · 已赠 ${fb.rewardedDays || 30} 天会员`
                              : "评估中"}
                          </Badge>
                        </div>
                        {fb.adminNote && (
                          <p className="mt-1.5 rounded-lg bg-green-50/70 px-2.5 py-1.5 text-[11px] text-green-800">
                            官方回复：{fb.adminNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
