import { vi } from "vitest";

// Mocks exportés pour être réutilisés dans les tests
export const mockStorageGet = vi.fn(
    (_: unknown, callback: (data: Record<string, unknown>) => void) => {
        callback({ rules: [] });
    }
);

export const mockStorageSet = vi.fn(
    (_: unknown, callback?: () => void) => {
        if (callback) callback();
    }
);

// Mock global de l'API Chrome
vi.stubGlobal("chrome", {
    storage: {
        sync: {
            get: mockStorageGet,
            set: mockStorageSet,
        },
    },
    runtime: {
        lastError: undefined as chrome.runtime.LastError | undefined,
    },
});

// Mock de URL.createObjectURL / revokeObjectURL (non dispo dans jsdom)
vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
});

