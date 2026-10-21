import React from "react";
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { useUserStore } from "@/store/user-store";

export default function BrujulaIndexScreen() {
  const router = useRouter();
  const brujulaResult = useUserStore((state) => state.brujulaResult);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
        {/* Hero */}
        <View className="items-center my-4">
          <View className="w-16 h-16 rounded-3xl bg-primary/10 items-center justify-center mb-4">
            <Text className="text-3xl">🧭</Text>
          </View>
          <Text className="text-2xl font-black text-foreground text-center">Mi Brújula Cívica</Text>
          <Text className="text-muted-foreground text-sm text-center mt-2 px-4 leading-5">
            Una herramienta educativa para explorar tus prioridades políticas y comprender los conceptos detrás de ellas.
          </Text>
        </View>

        {/* Existing Result Badge */}
        {brujulaResult && (
          <View className="bg-secondary p-4 rounded-2xl border border-primary/20 my-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-xs font-bold text-primary uppercase">Resultado guardado</Text>
              <Text className="text-[10px] text-muted-foreground">
                {new Date(brujulaResult.takenAt).toLocaleDateString()}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-foreground">
              Balance: Económico ({brujulaResult.scores.economic > 0 ? `+${brujulaResult.scores.economic}` : brujulaResult.scores.economic}) • Social ({brujulaResult.scores.social > 0 ? `+${brujulaResult.scores.social}` : brujulaResult.scores.social})
            </Text>
            <TouchableOpacity
              className="mt-3 bg-primary py-2 rounded-xl items-center"
              onPress={() => router.push("/brujula/resultado")}
            >
              <Text className="text-white font-bold text-xs">Ver gráfico detallado</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guarantees Checklist */}
        <View className="bg-card border border-border rounded-2xl p-4 my-3 space-y-3">
          <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Garantías Institucionales SIBIC
          </Text>
          <View className="flex-row items-start">
            <Text className="text-sm mr-2.5">🔒</Text>
            <View className="flex-1">
              <Text className="text-xs font-bold text-foreground">100% Privado y Local</Text>
              <Text className="text-[11px] text-muted-foreground leading-4">
                El resultado se calcula en tu teléfono. Nunca se sube a internet ni se comparte con nadie.
              </Text>
            </View>
          </View>
          <View className="flex-row items-start">
            <Text className="text-sm mr-2.5">⚖️</Text>
            <View className="flex-1">
              <Text className="text-xs font-bold text-foreground">Neutralidad Verificable</Text>
              <Text className="text-[11px] text-muted-foreground leading-4">
                No recomienda candidatos ni te asocia a ningún partido político de forma automática.
              </Text>
            </View>
          </View>
          <View className="flex-row items-start">
            <Text className="text-sm mr-2.5">🇬🇹</Text>
            <View className="flex-1">
              <Text className="text-xs font-bold text-foreground">Contexto Nacional</Text>
              <Text className="text-[11px] text-muted-foreground leading-4">
                Preguntas adaptadas a los debates reales de salud, educación, orden y desarrollo en Guatemala.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-2xl items-center shadow-sm mt-4 active:opacity-90"
          onPress={() => router.push("/brujula/test")}
        >
          <Text className="text-white font-bold text-sm tracking-wide">
            {brujulaResult ? "Repetir cuestionario" : "Iniciar cuestionario (8 preguntas)"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
