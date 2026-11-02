import { useAuth0 } from "@/lib/auth";
import Home from "./Home";
import SignInScreen from "./components/sign-in-screen";

interface AppProps {
  children?: React.ReactNode;
}

function App({ children }: AppProps) {
  const { isAuthenticated } = useAuth0();
  return (
    <>
      {!isAuthenticated ? (
        <SignInScreen />
      ) : (
        <div className="h-full w-full">
          <Home />
        </div>
      )}
    </>
  );
}

export default App;
