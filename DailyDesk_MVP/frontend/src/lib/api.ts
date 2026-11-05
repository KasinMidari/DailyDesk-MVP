import getConfig from "@/lib/config";
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "@/lib/generated/api-schema";
import store from "@/stores/store";
import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import createQueryClient from "openapi-react-query";
import { apiErrorFrom, ApiError, fallbackMessage } from "@/lib/api-error";

const api = createClient<paths>({
  baseUrl: getConfig().backendUrl,
  // Gọi qua window.fetch tại thời điểm request để backend giả (src/mocks) chặn được.
  fetch: async (request) => {
    try {
      return await globalThis.fetch(request);
    } catch {
      throw new ApiError(0, fallbackMessage(0));
    }
  },
});
const queryApi = createQueryClient(api);

/** Gắn `Authorization: Bearer`, thử lại một lần khi 401, và dịch lỗi sang tiếng Việt. */
const accessTokenInjectMiddleware: Middleware = {
  async onRequest({ request }) {
    const accessToken = store.get(accessTokenAtom);
    if (accessToken) {
      request.headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return request;
  },

  async onResponse({ response, request }) {
    // Token hết hạn: lấy token mới rồi gửi lại. Chỉ thử khi token thực sự khác
    // token vừa dùng, nên không có vòng lặp (và không cần header lạ qua CORS).
    if (response.status === 401) {
      const used = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
      const refresher = store.get(getAccessTokenFnAtom);
      if (refresher) {
        try {
          const newAccessToken = await refresher();
          if (newAccessToken && newAccessToken !== used) {
            store.set(accessTokenAtom, newAccessToken);
            const retry = request.clone();
            retry.headers.set("Authorization", `Bearer ${newAccessToken}`);
            const retryResponse = await globalThis.fetch(retry);
            if (retryResponse.status < 400) return retryResponse;
            throw await apiErrorFrom(retryResponse);
          }
        } catch (refreshError) {
          if (refreshError instanceof ApiError) throw refreshError;
          console.error("Không lấy được token mới", refreshError);
        }
      }
    }

    if (response.status >= 400) throw await apiErrorFrom(response);

    return response;
  },
};

api.use(accessTokenInjectMiddleware);

export default api;
export { api, queryApi };
