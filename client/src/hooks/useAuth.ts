import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Check if error is due to pending approval
  const isPendingApproval = error && (error as any).message?.includes("Account pending approval");
  const userStatus = isPendingApproval ? (error as any).status : user?.status;
  const pendingUser = isPendingApproval ? (error as any).user : null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && user.status === 'approved',
    isPendingApproval,
    userStatus,
    pendingUser,
  };
}
