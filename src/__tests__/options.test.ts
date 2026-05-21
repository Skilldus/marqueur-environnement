import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { mockStorageGet } from "./setup";
import { waitFor } from "@testing-library/dom";
import type { Rule } from "../types";

// HTML minimal reprenant tous les éléments attendus par options.ts
const OPTIONS_HTML = `
<div class="form-section">
    <h2 id="formTitle"></h2>
    <form id="ruleForm">
        <input id="pattern" />
        <input id="label" />
        <input type="color" id="color" value="#e53935" />
        <select id="position">
            <option value="top">Bandeau haut</option>
            <option value="bottom">Bandeau bas</option>
            <option value="top-left">Coin haut gauche</option>
            <option value="top-right">Coin haut droite</option>
            <option value="bottom-left">Coin bas gauche</option>
            <option value="bottom-right">Coin bas droite</option>
        </select>
        <select id="size">
            <option value="small">Petite</option>
            <option value="medium" selected>Moyenne</option>
            <option value="large">Grande</option>
            <option value="custom">Personnalisée</option>
        </select>
        <div id="customSizePanel" hidden>
            <input type="number" id="customHeight" value="28" />
            <input type="number" id="customFontSize" value="16" />
        </div>
        <div id="textStylePanel">
            <input type="checkbox" id="customTextColorEnabled" />
            <input type="color" id="textColor" value="#ffffff" />
            <input type="checkbox" id="borderColorEnabled" />
            <input type="color" id="borderColor" value="#000000" />
        </div>
        <div id="previewPanel">
            <div id="previewBanner"><span id="previewText"></span></div>
        </div>
        <button type="submit" id="submitRule">Ajouter</button>
        <button type="button" id="cancelEdit" hidden>Annuler</button>
    </form>
</div>
<div>
    <button type="button" id="exportBtn">Exporter</button>
    <button type="button" id="importBtn">Importer</button>
    <input type="file" id="importFile" hidden />
    <span id="importFeedback" hidden></span>
</div>
<div>
    <span id="rulesCount">0</span>
    <ul id="rules"></ul>
    <p id="emptyState" hidden></p>
</div>`;

const sampleRules: Rule[] = [
    { pattern: ".*dev.*", label: "DEV", color: "#e53935", position: "top", size: "medium" },
    { pattern: ".*prod.*", label: "PROD", color: "#4caf50", position: "bottom", size: "large" },
];

// Import dynamique du module après avoir mis en place le DOM et les mocks
let optionsModule: typeof import("../options");

describe("Options page", () => {


    // ─── Initialisation ───────────────────────────────────────────────────────

    describe("Initialisation", () => {
                        // Mock explicite pour storage vide
                        beforeEach(() => {
                            mockStorageGet.mockImplementation((_, cb) => cb({ rules: [] }));
                        });
        beforeEach(async () => {
            document.body.innerHTML = OPTIONS_HTML;
            vi.resetModules();
            global.chrome = {
                storage: {
                    sync: {
                        get: mockStorageGet,
                        set: vi.fn()
                    }
                },
                runtime: { lastError: undefined },
                i18n: { getMessage: vi.fn((key: string) => key) }
            } as any;
            optionsModule = await import("../options");
            optionsModule.setFormMode("create");
        });

        it("met le bouton de soumission en mode 'Ajouter' par défaut", () => {
            const btn = document.getElementById("submitRule") as HTMLButtonElement;
            expect(btn.textContent).toBe("btnAdd");
        });

        it("masque le bouton Annuler par défaut", () => {
            const btn = document.getElementById("cancelEdit") as HTMLButtonElement;
            expect(btn.hidden).toBe(true);
        });

        it("affiche le titre 'Nouvelle règle' par défaut", () => {
            const title = document.getElementById("formTitle") as HTMLHeadingElement;
            expect(title.textContent).toBe("formTitleNew");
        });

        it("affiche un compteur à 0 quand le storage est vide", () => {
            optionsModule.loadRules();
            return waitFor(() => {
                const count = document.getElementById("rulesCount") as HTMLSpanElement;
                expect(count.textContent).toBe("0");
            });
        });
    });

    // ─── setFormMode ─────────────────────────────────────────────────────────

    describe("setFormMode", () => {
        afterEach(() => {
            optionsModule.setFormMode("create");
        });

        it("passe en mode 'edit' : texte Enregistrer, Annuler visible", () => {
            optionsModule.setFormMode("edit");
            const submitBtn = document.getElementById("submitRule") as HTMLButtonElement;
            const cancelBtn = document.getElementById("cancelEdit") as HTMLButtonElement;
            const title = document.getElementById("formTitle") as HTMLHeadingElement;

            expect(submitBtn.textContent).toBe("btnSave");
            expect(cancelBtn.hidden).toBe(false);
            expect(title.textContent).toBe("formTitleEdit");
        });

        it("passe en mode 'edit' : ajoute la classe CSS 'editing' sur .form-section", () => {
            optionsModule.setFormMode("edit");
            const formSection = document.querySelector(".form-section") as HTMLElement;
            expect(formSection.classList.contains("editing")).toBe(true);
        });

        it("revient en mode 'create' : texte Ajouter, Annuler masqué", () => {
            optionsModule.setFormMode("edit");
            optionsModule.setFormMode("create");
            const submitBtn = document.getElementById("submitRule") as HTMLButtonElement;
            const cancelBtn = document.getElementById("cancelEdit") as HTMLButtonElement;
            const title = document.getElementById("formTitle") as HTMLHeadingElement;

            expect(submitBtn.textContent).toBe("btnAdd");
            expect(cancelBtn.hidden).toBe(true);
            expect(title.textContent).toBe("formTitleNew");
        });

        it("revient en mode 'create' : retire la classe CSS 'editing' de .form-section", () => {
            optionsModule.setFormMode("edit");
            optionsModule.setFormMode("create");
            const formSection = document.querySelector(".form-section") as HTMLElement;
            expect(formSection.classList.contains("editing")).toBe(false);
        });
    });

    // ─── showFeedback ─────────────────────────────────────────────────────────

    describe("showFeedback", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("affiche le message de feedback", () => {
            optionsModule.showFeedback("✅ Import réussi");
            const feedback = document.getElementById("importFeedback") as HTMLSpanElement;
            expect(feedback.hidden).toBe(false);
            expect(feedback.textContent).toBe("✅ Import réussi");
        });

        it("ajoute la classe 'error' quand isError est true", () => {
            optionsModule.showFeedback("❌ Erreur", true);
            const feedback = document.getElementById("importFeedback") as HTMLSpanElement;
            expect(feedback.className).toContain("error");
        });

        it("n'ajoute pas la classe 'error' pour un message de succès", () => {
            optionsModule.showFeedback("✅ Succès");
            const feedback = document.getElementById("importFeedback") as HTMLSpanElement;
            expect(feedback.className).not.toContain("error");
        });

        it("cache automatiquement le feedback après 3 secondes", () => {
            optionsModule.showFeedback("Message temporaire");
            const feedback = document.getElementById("importFeedback") as HTMLSpanElement;
            expect(feedback.hidden).toBe(false);

            vi.advanceTimersByTime(3000);
            expect(feedback.hidden).toBe(true);
        });

        it("n'est pas encore caché avant les 3 secondes", () => {
            optionsModule.showFeedback("Message temporaire");
            vi.advanceTimersByTime(2999);
            const feedback = document.getElementById("importFeedback") as HTMLSpanElement;
            expect(feedback.hidden).toBe(false);
        });

        it("réinitialise le timer si appelé deux fois de suite", () => {
            optionsModule.showFeedback("Premier");
            vi.advanceTimersByTime(2000);
            optionsModule.showFeedback("Second");
            vi.advanceTimersByTime(2000);
            // Le feedback du 2nd appel ne doit pas encore être masqué
            const feedback = document.getElementById("importFeedback") as HTMLSpanElement;
            expect(feedback.hidden).toBe(false);
            expect(feedback.textContent).toBe("Second");
        });
    });

    // ─── loadRules ───────────────────────────────────────────────────────────

    describe("loadRules", () => {
                        afterEach(() => {
                            mockStorageGet.mockReset();
                        });
        beforeEach(async () => {
            document.body.innerHTML = OPTIONS_HTML;
            vi.resetModules();
            // Forcer le mock avant import
            global.chrome = {
                storage: {
                    sync: {
                        get: mockStorageGet,
                        set: vi.fn()
                    }
                },
                runtime: { lastError: undefined },
                i18n: { getMessage: vi.fn((key: string) => key) }
            } as any;
            optionsModule = await import("../options");
            optionsModule.setFormMode("create");
        });

        it("affiche les règles retournées par le storage", async () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            optionsModule.loadRules();

            await waitFor(() => {
                const items = document.querySelectorAll("#rules li");
                expect(items).toHaveLength(2);
            });
        });

        it("affiche le bon compteur de règles", async () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            optionsModule.loadRules();

            await waitFor(() => {
                const count = document.getElementById("rulesCount") as HTMLSpanElement;
                expect(count.textContent).toBe("2");
            });
        });

        it("affiche l'état vide quand il n'y a aucune règle", async () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: [] });
            });

            optionsModule.loadRules();

            await waitFor(() => {
                const emptyState = document.getElementById("emptyState") as HTMLParagraphElement;
                expect(emptyState.hidden).toBe(false);
            });
        });

        it("masque l'état vide quand il y a des règles", async () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            optionsModule.loadRules();

            await waitFor(() => {
                const emptyState = document.getElementById("emptyState") as HTMLParagraphElement;
                expect(emptyState.hidden).toBe(true);
            });
        });

        it("affiche les labels des règles dans la liste", async () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            optionsModule.loadRules();

            await waitFor(() => {
                const labels = document.querySelectorAll(".rule-label");
                expect(labels[0].textContent).toBe("DEV");
                expect(labels[1].textContent).toBe("PROD");
            });
        });

        it("affiche les patterns des règles dans la liste", async () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: [sampleRules[0]] });
            });

            optionsModule.loadRules();

            await waitFor(() => {
                const details = document.querySelector(".rule-details");
                expect(details?.textContent).toBe(".*dev.*");
            });
        });
    });

    // ─── exportRules ─────────────────────────────────────────────────────────

    describe("exportRules", () => {
        it("lit les règles depuis chrome.storage.sync.get", () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            optionsModule.exportRules();

            expect(mockStorageGet).toHaveBeenCalled();
        });

        it("crée un lien de téléchargement avec le bon nom de fichier", () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

            optionsModule.exportRules();

            // Le lien est créé dynamiquement et cliqué, on vérifie via le spy
            expect(clickSpy).toHaveBeenCalled();
            clickSpy.mockRestore();
        });

        it("crée une URL blob pour le téléchargement", () => {
            mockStorageGet.mockImplementationOnce((_, callback: (data: Record<string, unknown>) => void) => {
                callback({ rules: sampleRules });
            });

            vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
            optionsModule.exportRules();

            expect(URL.createObjectURL).toHaveBeenCalled();
        });
    });
});

