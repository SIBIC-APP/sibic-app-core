import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

class UniversalAuthStorage {
  private memoryStore = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }

    try {
      const { AsyncStorage } = await import("expo-sqlite/kv-store");
      return await AsyncStorage.getItem(key);
    } catch {
      return this.memoryStore.get(key) ?? null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }

    try {
      const { AsyncStorage } = await import("expo-sqlite/kv-store");
      await AsyncStorage.setItem(key, value);
    } catch {
      this.memoryStore.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }

    try {
      const { AsyncStorage } = await import("expo-sqlite/kv-store");
      await AsyncStorage.removeItem(key);
    } catch {
      this.memoryStore.delete(key);
    }
  }
}

export const authStorage = new UniversalAuthStorage();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://sibic-gt.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
