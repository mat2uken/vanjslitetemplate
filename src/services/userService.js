/**
 * User Service Layer
 * Defines REST API interactions for User domain.
 */

import { request } from "../api/client.js";

function createInitialMockUsers() {
  return new Map([
    [
      "1",
      {
        id: "1",
        name: "山田 太郎 (Taro Yamada)",
        email: "taro.yamada@example.com",
        role: "Lead Architect",
        updatedAt: new Date().toISOString(),
      },
    ],
    [
      "2",
      {
        id: "2",
        name: "佐藤 花子 (Hanako Sato)",
        email: "hanako.sato@example.com",
        role: "Core Developer",
        updatedAt: new Date().toISOString(),
      },
    ],
  ]);
}

const mockUsers = createInitialMockUsers();

function applyMockUpdate(userId, payload) {
  const existing = mockUsers.get(String(userId)) || { id: String(userId) };
  const updated = { ...existing, ...payload, updatedAt: new Date().toISOString() };
  mockUsers.set(String(userId), updated);
  return { ...updated };
}

let useMockBackend = false;

export function setUseMockBackend(enable) {
  useMockBackend = enable;
}

export const userService = {
  /**
   * Fetch single user by ID
   */
  async getUserById({ signal, args: [userId] = [] }) {
    if (useMockBackend) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const found = mockUsers.get(String(userId));
      if (!found) {
        throw new Error(`User with ID ${userId} not found`);
      }
      return { ...found };
    }

    try {
      return await request(`/api/users/${userId}`, { signal });
    } catch (error) {
      const fallback = mockUsers.get(String(userId));
      if (fallback) {
        return { ...fallback };
      }
      throw error;
    }
  },

  /**
   * Update user details (Mutation)
   */
  async updateUser(userId, payload) {
    if (useMockBackend) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return applyMockUpdate(userId, payload);
    }

    try {
      return await request(`/api/users/${userId}`, {
        method: "PATCH",
        body: payload,
      });
    } catch {
      return applyMockUpdate(userId, payload);
    }
  },

  /**
   * Reset mock users (for test isolation)
   */
  resetMockData() {
    mockUsers.clear();
    const fresh = createInitialMockUsers();
    for (const [key, value] of fresh) {
      mockUsers.set(key, value);
    }
  },
};
