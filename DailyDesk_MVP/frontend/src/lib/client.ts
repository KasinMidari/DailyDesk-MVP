import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import store from "@/stores/store";
import getConfig from "@/lib/config";
import axios from "axios";

const httpClient = axios.create({
  baseURL: getConfig().backendUrl,
});

httpClient.interceptors.request.use((request) => {
  const token = store.get(accessTokenAtom);

  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const refresher = store.get(getAccessTokenFnAtom);
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (refresher) {
        const accessToken = await refresher();
        store.set(accessTokenAtom, accessToken);
        axios.defaults.headers.common["Authorization"] =
          "Bearer " + accessToken;
        return httpClient(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);

export default httpClient;
