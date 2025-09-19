// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tipos para las respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TableInfo {
  id: string;
  table_number: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface UserOrder {
  id: string;
  table_number: number;
  user_name: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    description?: string;
    image?: string;
  }>;
  total_items: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TableStats {
  total_orders: number;
  total_items: number;
  total_amount: number;
  status_breakdown: Record<string, number>;
}

class TableApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Obtener información de una mesa
  async getTableInfo(tableNumber: number): Promise<ApiResponse<TableInfo>> {
    return this.request<TableInfo>(`/tables/${tableNumber}`);
  }

  // Obtener todas las órdenes de una mesa
  async getTableOrders(tableNumber: number): Promise<ApiResponse<UserOrder[]>> {
    return this.request<UserOrder[]>(`/tables/${tableNumber}/orders`);
  }

  // Crear una nueva orden de usuario
  async createUserOrder(
    tableNumber: number, 
    orderData: {
      user_name: string;
      items: Array<{
        id: number;
        name: string;
        price: number;
        quantity: number;
        description?: string;
        image?: string;
      }>;
      total_items: number;
      total_price: number;
    }
  ): Promise<ApiResponse<UserOrder>> {
    return this.request<UserOrder>(`/tables/${tableNumber}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Actualizar el estado de una orden
  async updateOrderStatus(
    orderId: string, 
    status: UserOrder['status']
  ): Promise<ApiResponse<UserOrder>> {
    return this.request<UserOrder>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Obtener estadísticas de una mesa
  async getTableStats(tableNumber: number): Promise<ApiResponse<TableStats>> {
    return this.request<TableStats>(`/tables/${tableNumber}/stats`);
  }

  // Limpiar órdenes de una mesa
  async clearTableOrders(tableNumber: number): Promise<ApiResponse<null>> {
    return this.request<null>(`/tables/${tableNumber}/orders`, {
      method: 'DELETE',
    });
  }

  // Polling para obtener órdenes actualizadas
  startPolling(
    tableNumber: number, 
    callback: (orders: UserOrder[]) => void, 
    intervalMs: number = 5000
  ): NodeJS.Timeout {
    const poll = async () => {
      const response = await this.getTableOrders(tableNumber);
      if (response.success && response.data) {
        callback(response.data);
      }
    };

    // Ejecutar inmediatamente
    poll();
    
    // Configurar polling
    return setInterval(poll, intervalMs);
  }

  // Detener polling
  stopPolling(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }

  // Marcar órdenes como pagadas
  async markOrdersAsPaid(
    tableNumber: number,
    orderIds?: string[]
  ): Promise<ApiResponse<{ updatedOrders: UserOrder[]; count: number }>> {
    return this.request<{ updatedOrders: UserOrder[]; count: number }>(`/tables/${tableNumber}/orders/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ orderIds }),
    });
  }
}

export const tableApi = new TableApiService();