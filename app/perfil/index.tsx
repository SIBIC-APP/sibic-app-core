import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { getUserDatabase } from "@/db";
import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";

export default function PerfilScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const syncStatus = useAuthStore((state) => state.syncStatus);
  const lastSyncedAt = useAuthStore((state) => state.lastSyncedAt);
  const authError = useAuthStore((state) => state.error);

  const signInWithOAuth = useAuthStore((state) => state.signInWithOAuth);
  const signOut = useAuthStore((state) => state.signOut);
  const syncProgress = useAuthStore((state) => state.syncProgress);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);

  const progress = useUserStore((state) => state.progress);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const userDb = await getUserDatabase();
      const success = await syncProgress(userDb);
      if (success) {
        // actualizar almacen local
        await useUserStore.getState().loadState(userDb);
        setStatusMessage("¡Progreso respaldado con éxito en la nube!");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar Cuenta",
      "¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Se borrarán todos tus respaldos en la nube. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, eliminar cuenta",
          style: "destructive",
          onPress: async () => {
            const userDb = await getUserDatabase();
            await deleteAccount(userDb);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* tarjeta de usuario */}
        <View className="items-center bg-card border border-border rounded-3xl p-6 mb-6 shadow-sm">
          <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-3 border border-border">
            <Text className="text-4xl">{user ? "👤" : "🐱"}</Text>
          </View>
          <Text className="text-xl font-bold text-foreground text-center">
            {user ? user.displayName : "Ciudadano Anónimo"}
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {user?.email ?? "Modo local sin conexión a cuenta"}
          </Text>

          {user?.provider && (
            <View className="mt-2 bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-[11px] font-bold text-primary uppercase">
                Conectado con {user.provider}
              </Text>
            </View>
          )}
        </View>

        {/* resumen de progreso local */}
        <View className="bg-secondary/60 border border-border rounded-2xl p-4 mb-6">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Progreso en este dispositivo
          </Text>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm font-medium text-foreground">Experiencia Total</Text>
            <Text className="text-sm font-bold text-primary">{progress.totalXp} XP</Text>
          </View>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm font-medium text-foreground">Nivel Cívico</Text>
            <Text className="text-sm font-bold text-foreground">{progress.level.title}</Text>
          </View>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm font-medium text-foreground">Lecciones completadas</Text>
            <Text className="text-sm font-bold text-foreground">{progress.completedLessonIds.length}</Text>
          </View>
          <View className="flex-row justify-between items-center py-1">
            <Text className="text-sm font-medium text-foreground">Sibi Cats desbloqueados</Text>
            <Text className="text-sm font-bold text-foreground">{progress.unlockedCatIds.length}</Text>
          </View>
        </View>

        {/* seccion de sincronizacion en la nube */}
        {user ? (
          <View className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
            <Text className="text-base font-bold text-foreground mb-1">
              Sincronización en la Nube
            </Text>
            <Text className="text-xs text-muted-foreground mb-3 leading-5">
              Tus lecciones, XP y Sibi Cats se combinan inteligentemente entre tus dispositivos.
            </Text>

            {lastSyncedAt && (
              <Text className="text-[11px] text-muted-foreground mb-3">
                Última sincronización: {new Date(lastSyncedAt).toLocaleString()}
              </Text>
            )}

            {statusMessage && (
              <View className="bg-success/15 p-3 rounded-xl mb-3">
                <Text className="text-xs text-success font-semibold text-center">{statusMessage}</Text>
              </View>
            )}

            {authError && (
              <View className="bg-destructive/15 p-3 rounded-xl mb-3">
                <Text className="text-xs text-destructive font-semibold text-center">{authError}</Text>
              </View>
            )}

            <TouchableOpacity
              disabled={isSyncing}
              className="bg-primary py-3.5 rounded-xl items-center shadow-sm active:opacity-90 flex-row justify-center"
              onPress={handleSync}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-xs uppercase tracking-wide">
                  Sincronizar ahora
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-3 bg-secondary py-3 rounded-xl items-center border border-border active:opacity-80"
              onPress={() => signOut()}
            >
              <Text className="text-foreground font-semibold text-xs">Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
            <Text className="text-base font-bold text-foreground mb-1">
              Respaldar en la Nube
            </Text>
            <Text className="text-xs text-muted-foreground mb-4 leading-5">
              Inicia sesión con OAuth para recuperar tu progreso y coleccionables si cambias de teléfono.
            </Text>

            <TouchableOpacity
              className="bg-secondary border border-border py-3.5 rounded-xl items-center mb-2.5 flex-row justify-center active:opacity-80"
              onPress={() => signInWithOAuth("google")}
            >
              <Text className="text-sm mr-2">🌐</Text>
              <Text className="text-xs font-bold text-foreground">Continuar con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-foreground py-3.5 rounded-xl items-center flex-row justify-center active:opacity-80"
              onPress={() => signInWithOAuth("apple")}
            >
              <Text className="text-sm mr-2 text-white">🍎</Text>
              <Text className="text-xs font-bold text-white">Continuar con Apple</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* aviso de privacidad por diseno */}
        <View className="bg-secondary/40 border border-border p-4 rounded-2xl mb-6">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm mr-2">🛡️</Text>
            <Text className="text-xs font-bold text-foreground">Aviso de Privacidad y Neutralidad</Text>
          </View>
          <Text className="text-[11px] text-muted-foreground leading-4">
            SIBIC nunca sube las respuestas ni los resultados de Mi Brújula a la nube. Los servidores de Supabase únicamente reciben métricas de aprendizaje (XP acumulado, lecciones leídas y Sibi Cats).
          </Text>
        </View>

        {/* zona de peligro eliminacion de cuenta segun requisitos de tiendas */}
        {user && (
          <View className="border-t border-border pt-4">
            <Text className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">
              Zona de Peligro
            </Text>
            <TouchableOpacity
              className="border border-destructive/50 bg-destructive/10 py-3 rounded-xl items-center active:opacity-80"
              onPress={handleDeleteAccount}
            >
              <Text className="text-xs font-bold text-destructive">Eliminar mi cuenta y respaldos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
