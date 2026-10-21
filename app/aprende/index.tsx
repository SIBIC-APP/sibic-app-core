import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getContentDatabase, getUserDatabase } from "@/db";
import { AprendeRepository, ModuleWithLessons } from "@/features/aprende/repository";
import { SibiCatWithStatus } from "@/features/aprende/types";
import { useUserStore } from "@/store/user-store";

export default function AprendeIndexScreen() {
  const router = useRouter();
  const progress = useUserStore((state) => state.progress);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [sibiCats, setSibiCats] = useState<SibiCatWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [contentDb, userDb] = await Promise.all([
          getContentDatabase(),
          getUserDatabase(),
        ]);
        const repo = new AprendeRepository(userDb, contentDb);
        const [mods, cats] = await Promise.all([
          repo.getModulesWithLessons(),
          repo.getAllSibiCats(),
        ]);
        setModules(mods);
        setSibiCats(cats);
      } catch (err) {
        console.error("[AprendeIndex] Error loading modules:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [progress.totalXp]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6C3BFF" />
        <Text className="text-muted-foreground text-sm mt-3">Cargando lecciones...</Text>
      </View>
    );
  }

  const completedSet = new Set(progress.completedLessonIds);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
      {/* Sibi Cats Showcase */}
      <View className="mb-6">
        <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Vitrina de Sibi Cats Desbloqueables
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {sibiCats.map((cat) => (
            <View
              key={cat.id}
              className={`p-3 mr-3 rounded-2xl border w-36 items-center ${
                cat.isUnlocked
                  ? "bg-secondary/70 border-primary/30"
                  : "bg-card border-border opacity-50"
              }`}
            >
              <Text className="text-3xl mb-1">{cat.badge}</Text>
              <Text className="text-xs font-bold text-foreground text-center" numberOfLines={1}>
                {cat.name}
              </Text>
              <Text className="text-[10px] text-muted-foreground text-center mt-0.5">
                {cat.isUnlocked ? "Desbloqueado" : `${cat.requiredXp} XP`}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Modules & Lessons */}
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Módulos Cívicos
      </Text>

      {modules.map((mod) => (
        <View key={mod.id} className="mb-6 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Module Header */}
          <View className="p-4 bg-secondary/50 border-b border-border/80">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-foreground">{mod.title}</Text>
              <View className="bg-primary/10 px-2 py-0.5 rounded-md">
                <Text className="text-[11px] font-bold text-primary">
                  {mod.completedLessonCount}/{mod.lessons.length}
                </Text>
              </View>
            </View>
            <Text className="text-muted-foreground text-xs">{mod.description}</Text>
          </View>

          {/* Lessons List */}
          <View className="p-2">
            {mod.lessons.map((lesson) => {
              const isCompleted = completedSet.has(lesson.id);
              return (
                <TouchableOpacity
                  key={lesson.id}
                  className="flex-row items-center justify-between p-3 rounded-xl active:bg-secondary/50"
                  onPress={() => router.push(`/aprende/lesson/${lesson.id}`)}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-semibold text-foreground">{lesson.title}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                      {lesson.summary}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-xs font-semibold text-primary mr-2">+{lesson.xpReward} XP</Text>
                    <Text className="text-base">{isCompleted ? "✅" : "➡️"}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
