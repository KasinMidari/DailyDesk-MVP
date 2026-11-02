import LoginButton from "@/components/login-button";
import LogoutButton from "@/components/logout";
import Profile from "@/components/profile";
import { useAuth0 } from "@/lib/auth";
export default function SignInPage() {
  const { isAuthenticated } = useAuth0();
  return (
    <div>
      {!isAuthenticated ? (
        <LoginButton />
      ) : (
        <div>
          <LogoutButton />
          <Profile />
        </div>
      )}
    </div>
  );
}
