/**
 * Bật backend giả: thay window.fetch để trả lời các request tới backend
 * và giả lập việc tải ảnh lên Cloudinary.
 * Phải được import đầu tiên trong main.tsx.
 */
import getConfig from "@/lib/config";

/** Mặc định dùng backend thật; backend giả chỉ bật khi xin rõ (demo offline). */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const LATENCY_MS = 250;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

if (USE_MOCK && typeof window !== "undefined") {
  const realFetch = window.fetch.bind(window);
  const backend = getConfig().backendUrl.replace(/\/+$/, "");

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : undefined;
    const href = request ? request.url : input instanceof URL ? input.href : String(input);

    if (href.includes("api.cloudinary.com")) {
      const form = init?.body;
      const file = form instanceof FormData ? form.get("file") : null;
      if (!(file instanceof Blob)) return json({ error: { message: "Thiếu tệp" } }, 400);
      await wait(LATENCY_MS);
      return json(
        { secure_url: await fileToDataUrl(file), public_id: `mock/${crypto.randomUUID()}` },
        200,
      );
    }

    if (!href.startsWith(backend)) return realFetch(input, init);

    const { handleMockRequest } = await import("./server");
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers ?? request?.headers);
    let text: string | undefined;
    if (typeof init?.body === "string") text = init.body;
    else if (request && method !== "GET" && method !== "HEAD") text = await request.clone().text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = undefined;
    }

    await wait(LATENCY_MS);
    const result = await handleMockRequest(
      method,
      new URL(href),
      body,
      headers.get("Authorization"),
    );
    return json(result.body, result.status);
  };

  console.info("[DailyDesk] Đang chạy với dữ liệu mock (bỏ VITE_USE_MOCK=true để dùng backend thật).");
}
