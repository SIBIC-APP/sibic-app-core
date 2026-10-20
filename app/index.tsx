import { View, Text } from "react-native";

export default function IndexScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-4">
      <Text className="text-2xl font-bold text-primary">SIBIC</Text>
      <Text className="text-sm text-muted-foreground mt-2">
        Sistema de Información de Balance Cívico
      </Text>
    </View>
  );
}
