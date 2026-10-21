import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getContentDatabase, getUserDatabase } from "@/db";
import { AprendeRepository } from "@/features/aprende/repository";
import { LessonType } from "@content-schema";
import { useUserStore } from "@/store/user-store";

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  const completedLessonIds = useUserStore((state) => state.progress.completedLessonIds);

  useEffect(() => {
    async function loadLesson() {
      if (!id) return;
      try {
        const [contentDb, userDb] = await Promise.all([
          getContentDatabase(),
          getUserDatabase(),
        ]);
        const repo = new AprendeRepository(userDb, contentDb);
        const data = await repo.getLessonById(id);
        setLesson(data);
      } catch (err) {
        console.error("[LessonDetail] Error loading lesson:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6C3BFF" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-destructive font-bold text-base">Lección no encontrada</Text>
        <TouchableOpacity className="mt-4 bg-primary px-4 py-2 rounded-xl" onPress={() => router.back()}>
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const alreadyFinished = completedLessonIds.includes(lesson.id);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleFinishLesson = async () => {
    try {
      const [contentDb, userDb] = await Promise.all([
        getContentDatabase(),
        getUserDatabase(),
      ]);

      const res = await useUserStore
        .getState()
        .completeLesson(userDb, contentDb, lesson.id, lesson.xpReward);

      setEarnedXp(res.xpEarned);
      setIsCompleted(true);
    } catch (err) {
      console.error("[LessonDetail] Error completing lesson:", err);
    }
  };

  const allQuizzesAnswered = lesson.quiz.every((q) => !!selectedAnswers[q.id]);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      {/* encabezado de leccion */}
      <View className="mb-5">
        <Text className="text-2xl font-extrabold text-foreground">{lesson.title}</Text>
        <Text className="text-muted-foreground text-sm mt-1">{lesson.summary}</Text>
        <View className="flex-row items-center mt-3">
          <View className="bg-primary/10 px-2.5 py-1 rounded-full mr-2">
            <Text className="text-xs font-bold text-primary">+{lesson.xpReward} XP</Text>
          </View>
          <Text className="text-xs text-muted-foreground">⏱️ {lesson.estimatedMinutes} min lectura</Text>
        </View>
      </View>

      {/* bloques de contenido */}
      <View className="mb-8 space-y-4">
        {lesson.blocks.map((block, idx) => {
          if (block.type === "callout") {
            return (
              <View key={idx} className="bg-secondary/80 border-l-4 border-primary p-4 rounded-r-xl my-2">
                {block.title && <Text className="font-bold text-foreground text-xs uppercase mb-1">{block.title}</Text>}
                <Text className="text-foreground text-sm leading-5">{block.content}</Text>
              </View>
            );
          }
          if (block.type === "quote") {
            return (
              <View key={idx} className="bg-muted/40 border border-border p-4 rounded-xl my-2 italic">
                {block.title && <Text className="font-semibold text-primary text-xs mb-1 not-italic">{block.title}</Text>}
                <Text className="text-muted-foreground text-sm leading-5">"{block.content}"</Text>
              </View>
            );
          }
          return (
            <View key={idx} className="my-2">
              {block.title && <Text className="font-bold text-foreground text-base mb-1">{block.title}</Text>}
              <Text className="text-foreground/90 text-sm leading-6">{block.content}</Text>
            </View>
          );
        })}
      </View>

      {/* seccion de cuestionario */}
      {lesson.quiz.length > 0 && (
        <View className="border-t border-border pt-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-4">Comprobación de Conocimiento</Text>

          {lesson.quiz.map((q) => (
            <View key={q.id} className="mb-6 bg-card border border-border rounded-2xl p-4 shadow-sm">
              <Text className="text-sm font-semibold text-foreground mb-3">{q.prompt}</Text>

              {q.options.map((opt) => {
                const isSelected = selectedAnswers[q.id] === opt.id;
                let bgClass = "bg-secondary/40 border-border";
                if (isSelected) {
                  bgClass = opt.isCorrect
                    ? "bg-success/15 border-success"
                    : "bg-destructive/15 border-destructive";
                }

                return (
                  <View key={opt.id} className="mb-2">
                    <TouchableOpacity
                      className={`p-3 rounded-xl border ${bgClass} active:opacity-80`}
                      onPress={() => handleSelectOption(q.id, opt.id)}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-medium text-foreground flex-1 pr-2">{opt.text}</Text>
                        {isSelected && (
                          <Text className="text-sm">{opt.isCorrect ? "✅" : "❌"}</Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {isSelected && (
                      <View className="mt-1.5 px-2">
                        <Text className={`text-[11px] leading-4 ${opt.isCorrect ? "text-success font-medium" : "text-destructive font-medium"}`}>
                          {opt.explanation}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

      {/* boton de finalizar */}
      {isCompleted ? (
        <View className="bg-success/15 border border-success/30 rounded-2xl p-4 items-center">
          <Text className="text-2xl mb-1">🎉</Text>
          <Text className="text-base font-bold text-success">¡Lección completada!</Text>
          <Text className="text-xs text-foreground mt-0.5">
            {earnedXp && earnedXp > 0 ? `Ganaste +${earnedXp} XP` : "Ya habías obtenido el XP de esta lección"}
          </Text>
          <TouchableOpacity
            className="mt-3 bg-primary px-6 py-2.5 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-xs">Continuar aprendiendo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          disabled={!allQuizzesAnswered && lesson.quiz.length > 0}
          className={`py-3.5 rounded-xl items-center shadow-sm ${
            allQuizzesAnswered || lesson.quiz.length === 0
              ? "bg-primary active:opacity-90"
              : "bg-border opacity-60"
          }`}
          onPress={handleFinishLesson}
        >
          <Text className="text-white font-bold text-sm">
            {alreadyFinished ? "Finalizar repaso" : "Finalizar y reclamar XP"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
