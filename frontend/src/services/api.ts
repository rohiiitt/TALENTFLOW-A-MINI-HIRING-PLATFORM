import { AgentSession, AgentActionLog, Order, Product, User, AdminMetrics } from '../types/index.js';

const API_BASE = '/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('talentflow_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface CreateSessionResponse {
  success: boolean;
  data: {
    session: AgentSession;
    actions: AgentActionLog[];
  };
  error?: string;
}

export interface SessionDetailsResponse {
  success: boolean;
  data: {
    session: AgentSession;
    actions: AgentActionLog[];
    order: Order | null;
  };
  error?: string;
}

export interface PurchaseResponse {
  success: boolean;
  data: {
    session: AgentSession;
    order: Order;
    actions: AgentActionLog[];
  };
  error?: string;
}

export const api = {
  // Auth API
  auth: {
    async signup(payload: { email: string; name: string; password: string; company?: string; role?: string }): Promise<{ success: boolean; data: { user: User; token: string }; error?: string }> {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async login(payload: { email: string; password: string }): Promise<{ success: boolean; data: { user: User; token: string }; error?: string }> {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getMe(): Promise<{ success: boolean; data: User; error?: string }> {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() }
      });
      return res.json();
    },

    async getDemoAccounts(): Promise<{ success: boolean; data: any[] }> {
      const res = await fetch(`${API_BASE}/auth/demo-accounts`);
      return res.json();
    }
  },

  // Admin API
  admin: {
    async getMetrics(): Promise<{ success: boolean; data: AdminMetrics }> {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: { ...getAuthHeader() }
      });
      return res.json();
    },

    async getUsers(): Promise<{ success: boolean; data: User[] }> {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { ...getAuthHeader() }
      });
      return res.json();
    },

    async createProduct(product: Partial<Product>): Promise<{ success: boolean; data: Product; error?: string }> {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(product)
      });
      return res.json();
    },

    async updateProduct(id: string, updates: Partial<Product>): Promise<{ success: boolean; data: Product; error?: string }> {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updates)
      });
      return res.json();
    },

    async deleteProduct(id: string): Promise<{ success: boolean; message: string; error?: string }> {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
      return res.json();
    },

    async updateOrderStatus(id: string, payload: { status?: string; deliveryStatus?: string; paymentStatus?: string }): Promise<{ success: boolean; data: Order; error?: string }> {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload)
      });
      return res.json();
    },

    async getSessions(): Promise<{ success: boolean; data: AgentSession[] }> {
      const res = await fetch(`${API_BASE}/admin/sessions`, {
        headers: { ...getAuthHeader() }
      });
      return res.json();
    }
  },

  // Agent Session API
  async createAndRunSession(prompt: string, userId?: string): Promise<CreateSessionResponse> {
    const res = await fetch(`${API_BASE}/agent/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ prompt, userId })
    });
    return res.json();
  },

  async getSession(sessionId: string): Promise<SessionDetailsResponse> {
    const res = await fetch(`${API_BASE}/agent/session/${sessionId}`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async getActions(sessionId: string): Promise<{ success: boolean; data: AgentActionLog[] }> {
    const res = await fetch(`${API_BASE}/agent/session/${sessionId}/actions`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  async confirmPurchase(
    sessionId: string,
    deliveryAddress?: string,
    simulateFailure?: boolean
  ): Promise<PurchaseResponse> {
    const res = await fetch(`${API_BASE}/agent/session/${sessionId}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ deliveryAddress, simulateFailure })
    });
    return res.json();
  },

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/agent/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
    });
    return res.json();
  },

  async getProducts(): Promise<{ success: boolean; data: Product[] }> {
    const res = await fetch(`${API_BASE}/products`);
    return res.json();
  },

  async importProducts(payload: { csv?: string; products?: any[] } | any[]): Promise<{ success: boolean; message: string; report: any; error?: string }> {
    const res = await fetch(`${API_BASE}/products/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getCatalogHealth(): Promise<{ success: boolean; health: any }> {
    const res = await fetch(`${API_BASE}/products/health`);
    return res.json();
  },

  async getOrders(): Promise<{ success: boolean; data: Order[] }> {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};
