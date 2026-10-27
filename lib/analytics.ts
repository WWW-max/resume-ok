"use client";

/**
 * 运营埋点事件名称定义：
 * 如需新增埋点事件，只需在此联合类型中追加标识，并在业务组件中调用 `trackEvent("新事件名", { ... })` 即可，无需改动数据库表结构。
 */
export type AnalyticsEventName =
  | "home_view"
  | "editor_open"
  | "export_attempt"
  | "paywall_open"
  | "contact_cs_click"
  | "checkout_create";

const VISITOR_STORAGE_KEY = "rok_visitor_id";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let vid = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return "";
  }
}

/**
 * 异步无阻塞上报运营埋点事件
 */
export function trackEvent(
  eventName: AnalyticsEventName | (string & {}),
  props: Record<string, string | number | boolean | null> = {},
): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      eventName,
      visitorId: getOrCreateVisitorId(),
      pagePath: window.location.pathname,
      props,
    });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 埋点上报失败静默忽略，绝不影响主业务流程
  }
}
