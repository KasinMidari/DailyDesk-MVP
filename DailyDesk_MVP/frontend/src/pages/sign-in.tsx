import { Navigate } from "react-router";
import SignInScreen from "@/components/sign-in-screen";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <SignInScreen />;
}
