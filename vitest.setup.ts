// define la variable dev en el entorno global
(globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;

import { vi } from "vitest";

// simulaciones comunes de expo y react native para vitest
vi.mock("expo-crypto", () => {
  const crypto = require("crypto");
  return {
    digestStringAsync: vi.fn(async (_algo: string, str: string) => {
      return crypto.createHash("sha256").update(str).digest("hex");
    }),
    CryptoDigestAlgorithm: {
      SHA256: "SHA-256",
    },
  };
});

vi.mock("expo-sqlite", () => ({
  openDatabaseSync: vi.fn(() => ({
    execSync: vi.fn(),
    runSync: vi.fn(),
    getFirstSync: vi.fn(),
    getAllSync: vi.fn(),
    withTransactionSync: vi.fn((fn: () => void) => fn()),
  })),
  openDatabaseAsync: vi.fn(async () => ({
    execAsync: vi.fn(async () => {}),
    runAsync: vi.fn(async () => ({ changes: 0, lastInsertRowId: 0 })),
    getFirstAsync: vi.fn(async () => null),
    getAllAsync: vi.fn(async () => []),
    withTransactionAsync: vi.fn(async (fn: () => Promise<void>) => await fn()),
  })),
}));

vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: "Link",
  Slot: "Slot",
  Stack: Object.assign(
    () => null,
    {
      Screen: () => null,
    }
  ),
  Tabs: Object.assign(
    () => null,
    {
      Screen: () => null,
    }
  ),
}));

vi.mock("react-native-reanimated", () => {
  const Reanimated = {
    default: {
      createAnimatedComponent: (c: unknown) => c,
    },
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (toValue: unknown) => toValue,
    withSpring: (toValue: unknown) => toValue,
    withSequence: (...values: unknown[]) => values[0],
    useReducedMotion: () => false,
  };
  return Reanimated;
});
