import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /*
       * Mặc định của React Query là staleTime 0: mọi lần đổi trang hay quay lại
       * tab đều gọi lại API và màn hình nhấp nháy chờ. Dữ liệu của app này đổi
       * do chính người dùng, mà mỗi lần sửa đều đã invalidate đúng khoá rồi,
       * nên giữ 30 giây là đủ tươi và điều hướng trở nên tức thì.
       */
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
