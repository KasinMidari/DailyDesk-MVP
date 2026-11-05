import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SHOW_COLLABORATION } from "@/lib/features";

export interface UserSearchResult {
  user_id: string;
  email?: string;
  name?: string;
  picture?: string;
  nickname?: string;
}

/**
 * Hook to search for users using Auth0 Management API
 */
export function useUserSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return [];
      }

      const { data, error } = await api.GET("/members/search", {
        params: {
          query: {
            q: query,
            per_page: "10",
            page: "0",
          },
        },
      });

      if (error) {
        throw new Error("Failed to search users");
      }

      return (data || []) as UserSearchResult[];
    },
    // `/members/search` ngoài phạm vi (nhóm C): tắt khi không có cộng tác nhóm.
    enabled: SHOW_COLLABORATION && enabled && query.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
}
