import { requireSameOrigin, withApiErrors } from "@/lib/server/http";

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  return Response.json(
    { error: { code: "verification_required", message: "注册已合并到登录，请使用邮箱验证码登录，新邮箱验证后会自动注册。" } },
    { status: 410 },
  );
});
