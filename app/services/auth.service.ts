const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      phone?: string;
      email?: string;
      accountType: string;
    };
    profile?: any;
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  error?: string;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  photoUrl?: string;
}

class AuthService {
  // Enviar código OTP al teléfono
  async sendPhoneOTP(phone: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/customer/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return {
        success: false,
        error: "Error al enviar el código OTP",
      };
    }
  }

  // Verificar código OTP y hacer login
  async verifyPhoneOTP(phone: string, token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/customer/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, token }),
      });

      const data = await response.json();

      // Guardar token en localStorage
      if (data.success && data.data?.session?.access_token) {
        localStorage.setItem(
          "xquisito_access_token",
          data.data.session.access_token
        );
        localStorage.setItem(
          "xquisito_refresh_token",
          data.data.session.refresh_token
        );
        localStorage.setItem("xquisito_user", JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        error: "Error al verificar el código OTP",
      };
    }
  }

  // Crear o actualizar perfil del usuario
  async createOrUpdateProfile(profileData: ProfileData): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("xquisito_access_token");

      if (!token) {
        return {
          success: false,
          error: "No estás autenticado",
        };
      }

      const response = await fetch(`${API_URL}/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      return {
        success: false,
        error: "Error al crear/actualizar el perfil",
      };
    }
  }

  // Obtener perfil del usuario autenticado
  async getMyProfile(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("xquisito_access_token");

      if (!token) {
        return {
          success: false,
          error: "No estás autenticado",
        };
      }

      const response = await fetch(`${API_URL}/profiles/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting profile:", error);
      return {
        success: false,
        error: "Error al obtener el perfil",
      };
    }
  }

  // Actualizar perfil del usuario autenticado
  async updateMyProfile(updates: Partial<ProfileData>): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem("xquisito_access_token");

      if (!token) {
        return {
          success: false,
          error: "No estás autenticado",
        };
      }

      const response = await fetch(`${API_URL}/profiles/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: "Error al actualizar el perfil",
      };
    }
  }

  // Refrescar el access token
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem("xquisito_refresh_token");

      if (!refreshToken) {
        return {
          success: false,
          error: "No hay refresh token",
        };
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (data.success && data.data?.session?.access_token) {
        localStorage.setItem(
          "xquisito_access_token",
          data.data.session.access_token
        );
        localStorage.setItem(
          "xquisito_refresh_token",
          data.data.session.refresh_token
        );
      }

      return data;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return {
        success: false,
        error: "Error al refrescar el token",
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem("xquisito_access_token");

      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Limpiar localStorage
      localStorage.removeItem("xquisito_access_token");
      localStorage.removeItem("xquisito_refresh_token");
      localStorage.removeItem("xquisito_user");
    } catch (error) {
      console.error("Error logging out:", error);
      // Limpiar localStorage de todos modos
      localStorage.removeItem("xquisito_access_token");
      localStorage.removeItem("xquisito_refresh_token");
      localStorage.removeItem("xquisito_user");
    }
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem("xquisito_access_token");
  }

  // Obtener usuario actual del localStorage
  getCurrentUser(): any | null {
    const userStr = localStorage.getItem("xquisito_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Obtener token actual
  getAccessToken(): string | null {
    return localStorage.getItem("xquisito_access_token");
  }
}

export const authService = new AuthService();
