import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createContext,
    useEffect,
    useRef,
    ReactNode,
    useContext,
    useState,
} from "react";
import { Alert } from "react-native";

import { loginUser } from "@/services/auth.service";
import { getRangerAlerts } from "@/services/tracking.service";
import { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  ready: boolean;
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
  const [ready, setReady] = useState(false);
  const seenAlertIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet(["ranger_token", "wildsentinel_user"])
      .then((entries) => {
        if (!alive) return;
        const restoredToken = entries[0]?.[1];
        const restoredUser = entries[1]?.[1];
        if (restoredToken && restoredUser) {
          try {
            const parsed = JSON.parse(restoredUser) as User;
            if (parsed && parsed.role && parsed.email) {
              setToken(restoredToken);
              setUser(parsed);
            }
          } catch { /* Stale session: sign in again. */ }
        }
      })
      .catch(() => undefined)
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!token || user?.role !== "RANGER") {
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
    await AsyncStorage.multiSet([["ranger_token", response.token], ["wildsentinel_user", JSON.stringify(response.user)]]);

    return response.user;
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(["ranger_token", "wildsentinel_user"]);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        ready,
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