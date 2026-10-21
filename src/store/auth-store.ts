import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { DatabaseAdapter } from "@/db/adapter/types";
import { AccountSyncService } from "@/features/cuentas/sync-service";
import { CloudSyncStatus, UserProfile } from "@/features/cuentas/types";

interface AuthState {
  isInitialized: boolean;
  session: Session | null;
  user: UserProfile | null;
  syncStatus: CloudSyncStatus;
  lastSyncedAt: string | null;
  error: string | null;

  initAuth: () => Promise<void>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<void>;
  signOut: () => Promise<void>;
  syncProgress: (userDb: DatabaseAdapter) => Promise<boolean>;
  deleteAccount: (userDb: DatabaseAdapter) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isInitialized: false,
  session: null,
  user: null,
  syncStatus: "idle",
  lastSyncedAt: null,
  error: null,

  initAuth: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;

      let user: UserProfile | null = null;
      if (session?.user) {
        user = {
          id: session.user.id,
          email: session.user.email,
          displayName:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email ||
            "Ciudadano SIBIC",
          avatarUrl: session.user.user_metadata?.avatar_url ?? null,
          provider: session.user.app_metadata?.provider ?? null,
        };
      }

      set({
        isInitialized: true,
        session,
        user,
      });

      // escuchar cambios en el estado de autenticacion
      supabase.auth.onAuthStateChange((_event, newSession) => {
        let updatedUser: UserProfile | null = null;
        if (newSession?.user) {
          updatedUser = {
            id: newSession.user.id,
            email: newSession.user.email,
            displayName:
              newSession.user.user_metadata?.full_name ||
              newSession.user.user_metadata?.name ||
              newSession.user.email ||
              "Ciudadano SIBIC",
            avatarUrl: newSession.user.user_metadata?.avatar_url ?? null,
            provider: newSession.user.app_metadata?.provider ?? null,
          };
        }
        set({
          session: newSession,
          user: updatedUser,
        });
      });
    } catch (err: unknown) {
      console.warn("[useAuthStore] initAuth fallback:", err);
      set({ isInitialized: true });
    }
  },

  signInWithOAuth: async (provider: "google" | "apple") => {
    set({ syncStatus: "syncing", error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "sibic://auth/callback",
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      set({ syncStatus: "error", error: message });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      syncStatus: "idle",
      error: null,
    });
  },

  syncProgress: async (userDb: DatabaseAdapter) => {
    const user = get().user;
    if (!user) {
      set({ syncStatus: "error", error: "Debes iniciar sesión para respaldar tu progreso en la nube." });
      return false;
    }

    set({ syncStatus: "syncing", error: null });
    const res = await AccountSyncService.syncWithSupabase(supabase, userDb, user.id);

    if (res.success) {
      set({
        syncStatus: "synced",
        lastSyncedAt: res.snapshot.syncedAt,
        error: null,
      });
      return true;
    } else {
      set({
        syncStatus: "error",
        error: res.error ?? "Error al sincronizar con la nube",
      });
      return false;
    }
  },

  deleteAccount: async (userDb: DatabaseAdapter) => {
    set({ syncStatus: "syncing", error: null });
    const res = await AccountSyncService.deleteAccount(supabase);

    if (res.success) {
      set({
        session: null,
        user: null,
        syncStatus: "idle",
        lastSyncedAt: null,
        error: null,
      });
      return true;
    } else {
      set({
        syncStatus: "error",
        error: res.error ?? "No se pudo eliminar la cuenta",
      });
      return false;
    }
  },
}));
