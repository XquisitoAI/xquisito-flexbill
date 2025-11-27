// Authentication service for connecting with backend API

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface SendOTPRequest {
  phone: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
    messageId?: string;
  };
  error?: string;
}

interface VerifyOTPRequest {
  phone: string;
  token: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      phone: string;
      accountType: string;
    };
    profile: any;
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  error?: string;
}

class AuthService {
  /**
   * Send SMS OTP code to phone number
   */
  async sendOTPCode(phone: string): Promise<SendOTPResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/customer/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar código SMS");
      }

      return data;
    } catch (error) {
      console.error("❌ Error in sendOTPCode:", error);
      throw error;
    }
  }

  /**
   * Verify SMS OTP code
   */
  async verifyOTPCode(phone: string, token: string): Promise<VerifyOTPResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/customer/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Código incorrecto. Inténtalo de nuevo.");
      }

      return data;
    } catch (error) {
      console.error("❌ Error in verifyOTPCode:", error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<any> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        throw new Error("No access token found");
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error getting user");
      }

      return data;
    } catch (error) {
      console.error("❌ Error in getCurrentUser:", error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<any> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error refreshing token");
      }

      // Store new tokens
      this.storeSession(data.data.session);

      return data;
    } catch (error) {
      console.error("❌ Error in refreshAccessToken:", error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("❌ Error in logout:", error);
    } finally {
      // Always clear local session data
      this.clearSession();
    }
  }

  /**
   * Store session data in localStorage
   */
  storeSession(session: { access_token: string; refresh_token: string; expires_at: number }): void {
    localStorage.setItem("xquisito_access_token", session.access_token);
    localStorage.setItem("xquisito_refresh_token", session.refresh_token);
    localStorage.setItem("xquisito_expires_at", session.expires_at.toString());
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem("xquisito_access_token");
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem("xquisito_refresh_token");
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const expiresAt = localStorage.getItem("xquisito_expires_at");

    if (!token || !expiresAt) {
      return false;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const expiration = parseInt(expiresAt);

    return now < expiration;
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    localStorage.removeItem("xquisito_access_token");
    localStorage.removeItem("xquisito_refresh_token");
    localStorage.removeItem("xquisito_expires_at");
  }
}

export const authService = new AuthService();