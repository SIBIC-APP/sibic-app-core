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

  // mapear puntajes de menos 100 a mas 100 a porcentaje dentro del contenedor
  // eje economico de menos 100 izquierda a mas 100 derecha
  // eje social de menos 100 arriba a mas 100 abajo
  const dotXPercent = Math.max(5, Math.min(95, (result.scores.economic + 100) / 2));
  const dotYPercent = Math.max(5, Math.min(95, (result.scores.social + 100) / 2));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {/* titulo */}
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

      {/* grafico 2d de la brujula */}
      <View className="items-center my-4">
        {/* etiqueta superior */}
        <Text className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
          ↑ Más Libertades y Garantías
        </Text>

        <View className="flex-row items-center">
          {/* etiqueta izquierda */}
          <Text className="text-[10px] font-bold text-muted-foreground uppercase mr-1 w-12 text-right">
            ← Rol Social
          </Text>

          {/* caja de la brujula */}
          <View className="w-64 h-64 border-2 border-foreground/30 rounded-2xl relative overflow-hidden bg-card shadow-sm">
            {/* cuadrante 1 solidario y garanticista superior izquierdo */}
            <View className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#FDE2E4] opacity-80 border-r border-b border-foreground/10 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Solidario y Garanticista</Text>
            </View>

            {/* cuadrante 2 comunitario y tradicional inferior izquierdo */}
            <View className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#DBE7FF] opacity-80 border-r border-foreground/10 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Comunitario y Tradicional</Text>
            </View>

            {/* cuadrante 3 libre mercado y garanticista superior derecho */}
            <View className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#D9F3E1] opacity-80 border-b border-foreground/10 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Libre Mercado y Garanticista</Text>
            </View>

            {/* cuadrante 4 libre mercado e institucional inferior derecho */}
            <View className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#FFF1C2] opacity-80 items-center justify-center p-1">
              <Text className="text-[9px] font-bold text-foreground/80 text-center">Libre Mercado e Institucional</Text>
            </View>

            {/* lineas de los ejes */}
            <View className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-foreground/30 -ml-[0.75px]" />
            <View className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-foreground/30 -mt-[0.75px]" />

            {/* marcador de posicion */}
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

          {/* etiqueta derecha */}
          <Text className="text-[10px] font-bold text-muted-foreground uppercase ml-1 w-12 text-left">
            Libre Mercado →
          </Text>
        </View>

        {/* etiqueta inferior */}
        <Text className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
          ↓ Más Orden Institucional
        </Text>
      </View>

      {/* tarjeta de puntajes numericos */}
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

      {/* caja de explicacion */}
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

      {/* acciones */}
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
