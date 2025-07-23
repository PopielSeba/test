import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (response.status === 401) {
        return null; // Not authenticated
      }

      if (response.status === 403) {
        // Account pending approval
        const data = await response.json();
        if (data.needsApproval && data.user) {
          return {
            ...data.user,
            needsApproval: true,
          };
        }
        throw new Error("Access forbidden");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
  });

  const needsApproval = user?.needsApproval === true;
  const isAuthenticated = !!user;
  const isApproved = user?.isApproved === true;

  return {
    user,
    isLoading,
    isAuthenticated,
    needsApproval,
    isApproved,
  };
}
