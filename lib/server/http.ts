import "server-only";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json({ error: { code, message } }, { status });
}

export function withApiErrors(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError)
        return errorResponse(error.status, error.code, error.message);
      console.error("Route handler failed", error);
      return errorResponse(500, "internal_error", "服务器暂时不可用，请稍后重试。");
    }
  };
}

export function isSameOriginRequest(
  requestUrl: string,
  origin: string | null,
  host?: string | null,
  forwardedProtocol?: string | null,
) {
  if (!origin) return true;
  try {
    const request = new URL(requestUrl);
    const source = new URL(origin);
    const expectedHost = host?.split(",", 1)[0]?.trim() || request.host;
    const expectedProtocol =
      forwardedProtocol?.split(",", 1)[0]?.trim() ||
      request.protocol.replace(/:$/, "");
    return (
      source.host === expectedHost &&
      source.protocol === `${expectedProtocol.toLowerCase()}:`
    );
  } catch {
    return false;
  }
}

export function requireSameOrigin(request: Request) {
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (
    !isSameOriginRequest(
      request.url,
      request.headers.get("origin"),
      host,
      request.headers.get("x-forwarded-proto"),
    )
  )
    throw new ApiError(403, "forbidden_origin", "请求来源无效。");
}

export async function readJsonObject(
  request: Request,
  maxBytes: number,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0];
  if (contentType?.trim().toLowerCase() !== "application/json")
    throw new ApiError(415, "unsupported_media_type", "请求必须使用 JSON 格式。");
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new ApiError(413, "payload_too_large", "请求内容过大。");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes)
    throw new ApiError(413, "payload_too_large", "请求内容过大。");
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("not an object");
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "invalid_json", "JSON 请求内容无效。");
  }
}
