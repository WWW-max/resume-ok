import { requireUser } from "@/lib/server/auth";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";
import {
  createMembershipCheckoutOrder,
  getMembershipOrderStatus,
} from "@/lib/server/membership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/membership/checkout?orderNo=ROK...
 * 前端扫码收银台轮询查询订单支付状态
 */
export const GET = withApiErrors(async (request) => {
  const user = await requireUser();
  const url = new URL(request.url);
  const orderNo = url.searchParams.get("orderNo") || "";
  if (!orderNo) {
    throw new ApiError(400, "missing_order_no", "缺少订单号参数。");
  }
  const result = await getMembershipOrderStatus(user.id, orderNo);
  return Response.json(result);
});

/**
 * POST /api/membership/checkout
 * 创建微信支付 / 支付宝预支付订单并返回二维码信息
 */
export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, 2048);
  const planType = typeof body.planType === "string" ? body.planType : "";
  const payMethod =
    typeof body.payMethod === "string" ? body.payMethod : "wechat";

  const order = await createMembershipCheckoutOrder(
    user.id,
    user.email,
    planType,
    payMethod,
  );
  return Response.json({ order });
});
