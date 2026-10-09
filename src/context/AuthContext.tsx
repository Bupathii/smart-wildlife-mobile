import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useEffect,
    useRef,
    ReactNode,
    useContext,
    useState,
} from "react";
import { Alert, Platform } from "react-native";

import { loginUser } from "@/services/auth.service";
import { getRangerAlerts } from "@/services/tracking.service";
import { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const seenAlertIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem("ranger_token")
      .then((storedToken) => {
        if (!storedToken || !isMounted) return;
        setToken(storedToken);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token || user?.role !== "RANGER" || Platform.OS !== "android") {
      seenAlertIds.current = null;
      return;
    }

    let isMounted = true;
    let isPolling = false;

    const pollAlerts = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const alerts = await getRangerAlerts(token);
        if (!isMounted) return;

        const currentIds = new Set(alerts.map((alert) => alert.alertId));
        if (seenAlertIds.current) {
          const newAlert = alerts.find((alert) => !seenAlertIds.current?.has(alert.alertId));
          if (newAlert) {
            Alert.alert(
              "Wildlife Risk Alert",
              `${newAlert.animalName || newAlert.animalId} entered ${newAlert.zone}. ${newAlert.priority} priority.`
            );
          }
        }
        seenAlertIds.current = currentIds;
      } catch {
        // Retry silently on the next poll.
      } finally {
        isPolling = false;
      }
    };

    void pollAlerts();
    const pollTimer = setInterval(() => void pollAlerts(), 3000);
    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [token, user?.role]);

  async function login(
    email: string,
    password: string
  ): Promise<User> {
    const response = await loginUser(email, password);

    setToken(response.token);
    setUser(response.user);
    await AsyncStorage.setItem("ranger_token", response.token);

    return response.user;
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("ranger_token");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}