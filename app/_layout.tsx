import "../src/global.css";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { getContentDatabase, getUserDatabase } from "@/db";
import { ensureEmbeddedSeeds } from "@/content/seed";
import { useUserStore } from "@/store/user-store";
import { useAuthStore } from "@/store/auth-store";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        const [contentDb, userDb] = await Promise.all([
          getContentDatabase(),
          getUserDatabase(),
        ]);

        // asegurar que los paquetes embebidos historia brujula y aprende esten cargados
        await ensureEmbeddedSeeds(contentDb);

        // cargar estado del usuario desde user db
        await useUserStore.getState().loadState(userDb);

        // inicializar listener de autenticacion de supabase
        await useAuthStore.getState().initAuth();

        setIsReady(true);
      } catch (err: unknown) {
        console.error("[RootLayout] Initialization error:", err);
        setInitError(err instanceof Error ? err.message : String(err));
      }
    }

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <StatusBar style="auto" />
        {initError ? (
          <View className="items-center">
            <Text className="text-destructive font-bold text-lg mb-2">Error al iniciar SIBIC</Text>
            <Text className="text-muted-foreground text-center text-sm">{initError}</Text>
          </View>
        ) : (
          <View className="items-center">
            <ActivityIndicator size="large" color="#6C3BFF" />
            <Text className="text-foreground font-semibold mt-4 text-base">Iniciando SIBIC...</Text>
            <Text className="text-muted-foreground text-xs mt-1">Cargando base local</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FFFFFF" },
          headerTintColor: "#0B1B45",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "SIBIC", headerShown: false }} />
        <Stack.Screen name="aprende/index" options={{ title: "SIBIC Aprende" }} />
        <Stack.Screen name="aprende/lesson/[id]" options={{ title: "Lección Cívica" }} />
        <Stack.Screen name="brujula/index" options={{ title: "Mi Brújula" }} />
        <Stack.Screen name="brujula/test" options={{ title: "Cuestionario Cívico" }} />
        <Stack.Screen name="brujula/resultado" options={{ title: "Tu Balance Cívico" }} />
        <Stack.Screen name="perfil/index" options={{ title: "Mi Perfil Cívico" }} />
      </Stack>
    </>
  );
}
