import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getContentDatabase, getUserDatabase } from "@/db";
import { BrujulaRepository } from "@/features/brujula/repository";
import { StoredBrujulaRecord } from "@/features/brujula/types";
import { BrujulaQuadrantType } from "@content-schema";
import { useUserStore } from "@/store/user-store";

export default function BrujulaResultadoScreen() {
  const router = useRouter();
  const [result, setResult] = useState<StoredBrujulaRecord | null>(null);
  const [quadrants, setQuadrants] = useState<BrujulaQuadrantType[]>([]);
  const [loading, setLoading] = useState(true);

  const storedResult = useUserStore((state) => state.brujulaResult);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentDb, userDb] = await Promise.all([
          getContentDatabase(),
          getUserDatabase(),
        ]);
        const repo = new BrujulaRepository(userDb, contentDb);
        const [res, quads] = await Promise.all([
          repo.getLatestResult(),
          repo.getQuadrants(),
        ]);
        setResult(res);
        setQuadrants(quads);
      } catch (err) {
        console.error("[BrujulaResultado] Error loading result:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [storedResult]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6C3BFF" />
      </View>
    );
  }

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-foreground font-bold text-base">Aún no has realizado el cuestionario</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.replace("/brujula/test")}
        >
          <Text className="text-white font-bold text-xs uppercase">Iniciar Brújula</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeQuadrant = quadrants.find((q) => q.id === result.quadrantId);

  // Map scores (-100 to 100) to percentage within container (0% to 100%)
  // Economic: -100 (left) to +100 (right) -> (economic + 100) / 2
  // Social: -100 (top, more liberal/civil) to +100 (bottom, more traditional/order) -> (social + 100) / 2
  const dotXPercent = Math.max(5, Math.min(95, (result.scores.economic + 100) / 2));
  const dotYPercent = Math.max(5, Math.min(95, (result.scores.social + 100) / 2));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {/* Title */}
      <View className="mb-4 items-center">
        <Text className="text-xs font-bold text-primary uppercase tracking-widest">
          Balance Cívico Personal
        </Text>
        <Text className="text-2xl font-black text-foreground text-center mt-1">
          {activeQuadrant ? activeQuadrant.title : "Tu Posicionamiento"}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          Calculado el {new Date(result.takenAt).toLocaleDateString()} • Privado
        </Text>
      </View>

      {/* 2D Compass Chart */}
      <View className="items-center my-4">
        {/* Top Label */}
        <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
          ↑ Más Libertades y Garantías
        </Text>

        <View className="flex-row items-center">
          {/* Left Label */}
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mr-1 w-12 text-right">
            ← Rol Social
          </Text>

          {/* Compass Box */}
          <View className="w-64 h-64 border-2 border-foreground/30 rounded-2xl relative overflow-hidden bg-card shadow-sm">
            {/* Quadrant 1: Solidario y Garanticista (Top-Left) */}
            <View className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#FDE2E4] opacity-80 border-r border-b border-foreground/10 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Solidario y Garanticista</Text>
            </View>

            {/* Quadrant 2: Comunitario y Tradicional (Bottom-Left) */}
            <View className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#DBE7FF] opacity-80 border-r border-foreground/10 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Comunitario y Tradicional</Text>
            </View>

            {/* Quadrant 3: Libre Mercado y Garanticista (Top-Right) */}
            <View className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#D9F3E1] opacity-80 border-b border-foreground/10 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Libre Mercado y Garanticista</Text>
            </View>

            {/* Quadrant 4: Libre Mercado e Institucional (Bottom-Right) */}
            <View className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#FFF1C2] opacity-80 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Libre Mercado e Institucional</Text>
            </View>

            {/* Axes Lines */}
            <View className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-foreground/30 -ml-[0.75px]" />
            <View className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-foreground/30 -mt-[0.75px]" />

            {/* Position Marker */}
            <View
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-primary border-2 border-white shadow-md items-center justify-center"
              style={{
                left: `${dotXPercent}%`,
                top: `${dotYPercent}%`,
              }}
            >
              <View className="w-1.5 h-1.5 rounded-full bg-white" />
            </View>
          </View>

          {/* Right Label */}
          <Text className="text-[10px] font-bold text-muted-foreground uppercase ml-1 w-12 text-left">
            Libre Mercado →
          </Text>
        </View>

        {/* Bottom Label */}
        <Text className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
          ↓ Más Orden Institucional
        </Text>
      </View>

      {/* Numerical Scores Card */}
      <View className="flex-row justify-between bg-secondary/80 border border-border p-3.5 rounded-2xl mb-4">
        <View className="items-center flex-1 border-r border-border/80">
          <Text className="text-[11px] font-bold text-muted-foreground uppercase">Eje Económico</Text>
          <Text className="text-base font-extrabold text-foreground mt-0.5">
            {result.scores.economic > 0 ? `+${result.scores.economic}` : result.scores.economic}
          </Text>
          <Text className="text-[10px] text-muted-foreground">
            {result.scores.economic > 0 ? "Libre Mercado" : "Estado Social"}
          </Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-[11px] font-bold text-muted-foreground uppercase">Eje Institucional</Text>
          <Text className="text-base font-extrabold text-foreground mt-0.5">
            {result.scores.social > 0 ? `+${result.scores.social}` : result.scores.social}
          </Text>
          <Text className="text-[10px] text-muted-foreground">
            {result.scores.social > 0 ? "Orden Tradicional" : "Garantías y Libertades"}
          </Text>
        </View>
      </View>

      {/* Explanation Box */}
      {activeQuadrant && (
        <View className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <Text className="text-base font-bold text-foreground mb-1.5">
            ¿Qué significa este resultado?
          </Text>
          <Text className="text-sm font-medium text-primary mb-2">
            {activeQuadrant.shortDescription}
          </Text>
          <Text className="text-xs text-muted-foreground leading-5">
            {activeQuadrant.detailedExplanation}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View className="space-y-2.5">
        <TouchableOpacity
          className="bg-primary py-3.5 rounded-xl items-center shadow-sm active:opacity-90 my-1"
          onPress={() => router.push("/brujula/test")}
        >
          <Text className="text-white font-bold text-xs uppercase">Repetir cuestionario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-secondary py-3 rounded-xl items-center border border-border active:opacity-80 my-1"
          onPress={() => router.push("/")}
        >
          <Text className="text-foreground font-semibold text-xs">Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
