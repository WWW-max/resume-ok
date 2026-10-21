import { createHash } from "node:crypto";
import { requireUser } from "@/lib/server/auth";
import { ApiError, withApiErrors } from "@/lib/server/http";
import { fulfillMembershipOrder } from "@/lib/server/membership";

export const runtime = "nodejs";

/**
 * POST /api/membership/webhook
 * 统一支付异步回调 & 本地沙盒模拟扫码完成接口：
 * 1. 当 `PAYMENT_PROVIDER_MODE=sandbox`（默认开发模式）时，允许当前登录用户一键模拟扫码支付完成；
 * 2. 当配置了生产网关密钥（`PAYMENT_APP_SECRET`）时，自动校验回调签名（MD5/HMAC），验签通过后幂等发货。
 */
export const POST = withApiErrors(async (request) => {
  const providerMode = (
    process.env.PAYMENT_PROVIDER_MODE || "sandbox"
  ).toLowerCase();
  const contentType = request.headers.get("content-type") || "";

  const payload: Record<string, string> = {};
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    params.forEach((v, k) => {
      payload[k] = v;
    });
  } else {
    const json = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === "string" || typeof v === "number") {
        payload[k] = String(v);
      }
    }
  }

  // 沙盒测试模式：校验当前登录态后直接完成订单发货
  if (providerMode === "sandbox" && payload.sandbox === "true") {
    await requireUser();
    const orderNo = payload.orderNo || "";
    const membership = await fulfillMembershipOrder(
      orderNo,
      `SANDBOX_${Date.now()}`,
    );
    return Response.json({ ok: true, membership });
  }

  // 生产环境第三方网关回调验签（支持虎皮椒 / PayJS / 通用签名格式）
  const secret = process.env.PAYMENT_APP_SECRET || "";
  if (!secret) {
    throw new ApiError(403, "webhook_disabled", "未配置生产支付网关密钥。");
  }

  const receivedHash = payload.hash || payload.sign || "";
  const sortedKeys = Object.keys(payload)
    .filter((k) => k !== "hash" && k !== "sign" && payload[k] !== "")
    .sort();
  const stringA = sortedKeys.map((k) => `${k}=${payload[k]}`).join("&");
  const expectedHash = createHash("md5")
    .update(`${stringA}${secret}`)
    .digest("hex");

  if (!receivedHash || receivedHash.toLowerCase() !== expectedHash.toLowerCase()) {
    throw new ApiError(403, "invalid_signature", "支付回调签名校验失败。");
  }

  const orderNo =
    payload.trade_order_id || payload.out_trade_no || payload.orderNo || "";
  const transactionId =
    payload.transaction_id || payload.open_order_id || payload.trade_no || "";

  await fulfillMembershipOrder(orderNo, transactionId);
  return new Response("success", { status: 200 });
});
