import { createContext, useContext, useState, ReactNode } from "react";

export type User = {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNo: string;
  role: string;
  isEmailValid?: boolean;
  profile?: {
    id: number;
    profileImageUrl: string | null;
  };
} | null;

type AuthContextType = {
  user: User;
  login: (phone: string, otp: string) => Promise<User>;
  sendOtp: (phone: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showProfileDrawer: boolean;
  setShowProfileDrawer: (show: boolean) => void;
  showBookingsDrawer: boolean;
  setShowBookingsDrawer: (show: boolean) => void;
  showWalletDrawer: boolean;
  setShowWalletDrawer: (show: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showBookingsDrawer, setShowBookingsDrawer] = useState(false);
  const [showWalletDrawer, setShowWalletDrawer] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const sendOtp = async (phone: string) => {
    try {
      const res = await fetch("https://citycare.thynxai.cloud/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNo: phone, role: "customer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
    } catch (error) {
      console.error("Send OTP error:", error);
      throw error;
    }
  };

  const login = async (phone: string, otp: string): Promise<User> => {
    try {
      const res = await fetch("https://citycare.thynxai.cloud/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNo: phone, otp, role: "customer" }),
      });
      const data = await res.json();

      if (!res.ok || !data.data) throw new Error(data.message || "Login failed");

      const userData = data.data.user;
      const authToken = data.data.token;

      setUser(userData);
      setToken(authToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", authToken);

      // IMPORTANT: Do NOT close the modal here automatically.
      // The calling component (Helper) decides whether to close it 
      // or show the "Complete Profile" step.
      // setShowLoginModal(false); 

      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowProfileDrawer(false);
    setShowWalletDrawer(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        sendOtp,
        logout,
        isAuthenticated: !!user,
        showLoginModal,
        setShowLoginModal,
        showProfileDrawer,
        setShowProfileDrawer,
        showBookingsDrawer,
        setShowBookingsDrawer,
        showWalletDrawer,
        setShowWalletDrawer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
