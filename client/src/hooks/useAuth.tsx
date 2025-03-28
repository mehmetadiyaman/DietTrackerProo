import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // If token is invalid, clear it
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error fetching user", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data: LoginResponse = await res.json();
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      
      toast({
        title: "Giriş Başarılı",
        description: "Hoş geldiniz, " + data.user.fullName,
      });
      
      setLocation("/");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      const data: LoginResponse = await res.json();
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      
      toast({
        title: "Kayıt Başarılı",
        description: "Hoş geldiniz, " + data.user.fullName,
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    
    // Clear all query cache
    queryClient.clear();
    
    setLocation("/login");
    
    toast({
      title: "Çıkış Yapıldı",
      description: "Güvenli bir şekilde çıkış yaptınız.",
    });
  };
  
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};