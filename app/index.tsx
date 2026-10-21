import React from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useUserStore } from "@/store/user-store";

export default function HomeScreen() {
  const router = useRouter();
  const progress = useUserStore((state) => state.progress);
  const brujulaResult = useUserStore((state) => state.brujulaResult);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Brand Header */}
        <View className="mb-6 pt-2">
          <View className="flex-row items-center space-x-2">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3 shadow-sm">
              <Text className="text-white font-extrabold text-xl">S</Text>
            </View>
            <View>
              <Text className="text-3xl font-extrabold text-foreground tracking-tight">SIBIC</Text>
              <Text className="text-xs font-semibold text-primary uppercase tracking-widest">
                Conoce. Compara. Decide.
              </Text>
            </View>
          </View>
          <Text className="text-muted-foreground text-sm mt-3 leading-5">
            Información cívica, aprendizaje y contexto político para Guatemala.
          </Text>
        </View>

        {/* User Progress Banner (Gamification) */}
        <View className="bg-secondary rounded-2xl p-4 mb-6 border border-border">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">🐱</Text>
              <View>
                <Text className="text-xs font-bold text-primary uppercase">Nivel {progress.level.level}</Text>
                <Text className="text-base font-bold text-foreground">{progress.level.title}</Text>
              </View>
            </View>
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-primary">{progress.totalXp} XP</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="w-full bg-border h-2 rounded-full mt-2 overflow-hidden">
            <View
              className="bg-primary h-full rounded-full"
              style={{ width: `${progress.level.progressPercent}%` }}
            />
          </View>
          <Text className="text-[11px] text-muted-foreground mt-1.5 text-right">
            {progress.completedLessonIds.length} lecciones completadas • {progress.unlockedCatIds.length} Sibi Cats
          </Text>
        </View>

        {/* Feature Cards Grid */}
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Funcionalidades activas
        </Text>

        {/* 1. Aprende Card */}
        <TouchableOpacity
          className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm active:opacity-90"
          onPress={() => router.push("/aprende")}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg mr-2">🎓</Text>
                <Text className="text-lg font-bold text-foreground">Aprende</Text>
              </View>
              <Text className="text-muted-foreground text-sm leading-5">
                Misiones cívicas breves: el Estado, elecciones y cómo verificar propuestas.
              </Text>
            </View>
            <View className="bg-primary px-3 py-1.5 rounded-xl">
              <Text className="text-white text-xs font-bold">Explorar</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. Mi Brújula Card */}
        <TouchableOpacity
          className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm active:opacity-90"
          onPress={() => router.push("/brujula")}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center mb-1">
                <Text className="text-lg mr-2">🧭</Text>
                <Text className="text-lg font-bold text-foreground">Mi Brújula</Text>
                {brujulaResult && (
                  <View className="ml-2 bg-success/15 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-success">Completada</Text>
                  </View>
                )}
              </View>
              <Text className="text-muted-foreground text-sm leading-5">
                Explora tu posicionamiento en ejes cívicos de forma 100% privada y local.
              </Text>
            </View>
            <View className="bg-primary px-3 py-1.5 rounded-xl">
              <Text className="text-white text-xs font-bold">
                {brujulaResult ? "Ver resultado" : "Iniciar"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Local-first & Privacy Footer Notice */}
        <View className="mt-4 p-4 rounded-xl bg-secondary/60 border border-border/80">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm mr-2">🔒</Text>
            <Text className="text-xs font-bold text-foreground">Privacidad por diseño</Text>
          </View>
          <Text className="text-[11px] text-muted-foreground leading-4">
            Tus respuestas y resultados políticos se calculan y guardan exclusivamente en la memoria local de tu dispositivo. Jamás son enviados a servidores externos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
