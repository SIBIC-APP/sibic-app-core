import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getContentDatabase, getUserDatabase } from "@/db";
import { BrujulaRepository } from "@/features/brujula/repository";
import { calculateBrujulaScore } from "@/features/brujula/calculator";
import { BRUJULA_OPTIONS } from "@/features/brujula/types";
import { BrujulaQuestionType } from "@content-schema";
import { useUserStore } from "@/store/user-store";

export default function BrujulaTestScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<BrujulaQuestionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const [contentDb, userDb] = await Promise.all([
          getContentDatabase(),
          getUserDatabase(),
        ]);
        const repo = new BrujulaRepository(userDb, contentDb);
        const data = await repo.getQuestions();
        setQuestions(data);

        // precargar respuestas previas si el usuario ya tomo el cuestionario
        const existing = await repo.getLatestResult();
        if (existing?.answers) {
          setAnswers(existing.answers);
        }
      } catch (err) {
        console.error("[BrujulaTest] Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6C3BFF" />
        <Text className="text-muted-foreground text-sm mt-3">Cargando preguntas...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-destructive font-bold text-base">No hay preguntas disponibles</Text>
        <TouchableOpacity className="mt-4 bg-primary px-4 py-2 rounded-xl" onPress={() => router.back()}>
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;
  const currentSelectedValue = answers[currentQ.id];

  const handleSelectOption = (val: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const handleNext = async () => {
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // enviar y calcular
    setIsSubmitting(true);
    try {
      const calculation = calculateBrujulaScore(questions, answers);
      const userDb = await getUserDatabase();
      await useUserStore.getState().saveBrujulaResult(userDb, answers, calculation);
      router.replace("/brujula/resultado");
    } catch (err) {
      console.error("[BrujulaTest] Error saving result:", err);
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <View className="flex-1 bg-background">
      {/* encabezado de progreso */}
      <View className="px-6 pt-4 pb-2 border-b border-border/80">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold text-primary uppercase">
            Pregunta {currentIndex + 1} de {questions.length}
          </Text>
          <Text className="text-xs font-bold text-muted-foreground">{progressPercent}%</Text>
        </View>
        <View className="w-full bg-border h-2 rounded-full overflow-hidden">
          <View className="bg-primary h-full rounded-full" style={{ width: `${progressPercent}%` }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* etiqueta de tema */}
        <View className="self-start bg-secondary px-3 py-1 rounded-full mb-3 border border-border">
          <Text className="text-xs font-bold text-primary">{currentQ.topic}</Text>
        </View>

        {/* texto de la pregunta */}
        <Text className="text-xl font-bold text-foreground leading-7 mb-3">
          {currentQ.text}
        </Text>

        {/* caja de contexto */}
        <View className="bg-muted/30 border border-border/80 p-3.5 rounded-xl mb-6">
          <Text className="text-[11px] font-bold text-foreground mb-1">Contexto nacional:</Text>
          <Text className="text-xs text-muted-foreground leading-5">{currentQ.context}</Text>
        </View>

        {/* opciones de escala */}
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Selecciona tu posición:
        </Text>

        {BRUJULA_OPTIONS.map((opt) => {
          const isSelected = currentSelectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              className={`p-3.5 rounded-2xl border mb-2.5 flex-row items-center justify-between active:opacity-90 ${
                isSelected
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border"
              }`}
              onPress={() => handleSelectOption(opt.value)}
            >
              <Text className={`text-sm font-semibold flex-1 ${isSelected ? "text-primary font-bold" : "text-foreground"}`}>
                {opt.label}
              </Text>
              <View
                className={`w-6 h-6 rounded-full border items-center justify-center ${
                  isSelected ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* pie de navegacion */}
      <View className="absolute bottom-0 left-0 right-0 bg-background/95 border-t border-border p-4 flex-row items-center justify-between">
        <TouchableOpacity
          disabled={isFirst}
          className={`px-5 py-3 rounded-xl border border-border ${isFirst ? "opacity-30" : "active:bg-secondary"}`}
          onPress={handlePrevious}
        >
          <Text className="text-xs font-bold text-foreground">Anterior</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={typeof currentSelectedValue === "undefined" || isSubmitting}
          className={`flex-1 ml-3 py-3.5 rounded-xl items-center shadow-sm ${
            typeof currentSelectedValue !== "undefined" && !isSubmitting
              ? "bg-primary active:opacity-90"
              : "bg-border opacity-50"
          }`}
          onPress={handleNext}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-xs uppercase tracking-wide">
              {isLast ? "Ver balance cívico" : "Siguiente pregunta"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
