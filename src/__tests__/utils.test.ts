import { describe, it, expect } from "vitest";
import {
    getLuminance,
    getContrastTextColor,
    getPositionLabel,
    getSizeLabel,
    validateImportedRules,
} from "../utils";
import { Rule } from "../types";

// ─── getLuminance ────────────────────────────────────────────────────────────

describe("getLuminance", () => {
    it("retourne 0 pour le noir (#000000)", () => {
        expect(getLuminance("#000000")).toBeCloseTo(0, 5);
    });

    it("retourne ~1 pour le blanc (#ffffff)", () => {
        expect(getLuminance("#ffffff")).toBeCloseTo(1, 5);
    });

    it("fonctionne sans le # en préfixe", () => {
        expect(getLuminance("ffffff")).toBeCloseTo(1, 5);
        expect(getLuminance("000000")).toBeCloseTo(0, 5);
    });

    it("retourne la luminance correcte pour le rouge pur", () => {
        expect(getLuminance("#ff0000")).toBeCloseTo(0.2126, 3);
    });

    it("retourne la luminance correcte pour le vert pur", () => {
        expect(getLuminance("#00ff00")).toBeCloseTo(0.7152, 3);
    });

    it("retourne la luminance correcte pour le bleu pur", () => {
        expect(getLuminance("#0000ff")).toBeCloseTo(0.0722, 3);
    });

    it("retourne une valeur strictement entre 0 et 1 pour un gris moyen", () => {
        const luminance = getLuminance("#808080");
        expect(luminance).toBeGreaterThan(0);
        expect(luminance).toBeLessThan(1);
    });

    it("la somme R+G+B donne bien 1 pour le blanc", () => {
        const r = getLuminance("#ff0000");
        const g = getLuminance("#00ff00");
        const b = getLuminance("#0000ff");
        expect(r + g + b).toBeCloseTo(1, 4);
    });
});

// ─── getContrastTextColor ────────────────────────────────────────────────────

describe("getContrastTextColor", () => {
    it("retourne 'white' pour le noir", () => {
        expect(getContrastTextColor("#000000")).toBe("white");
    });

    it("retourne 'black' pour le blanc", () => {
        expect(getContrastTextColor("#ffffff")).toBe("black");
    });

    it("retourne 'white' pour un rouge vif (#e53935)", () => {
        expect(getContrastTextColor("#e53935")).toBe("white");
    });

    it("retourne 'white' pour un bleu foncé (#1a237e)", () => {
        expect(getContrastTextColor("#1a237e")).toBe("white");
    });

    it("retourne 'black' pour un jaune vif (#ffeb3b)", () => {
        expect(getContrastTextColor("#ffeb3b")).toBe("black");
    });

    it("retourne 'black' pour un vert pâle (#b2dfdb)", () => {
        expect(getContrastTextColor("#b2dfdb")).toBe("black");
    });

    it("retourne 'black' pour un orange clair (#ffcc80)", () => {
        expect(getContrastTextColor("#ffcc80")).toBe("black");
    });

    it("retourne 'white' pour un violet foncé (#4a148c)", () => {
        expect(getContrastTextColor("#4a148c")).toBe("white");
    });
});

// ─── getPositionLabel ────────────────────────────────────────────────────────

describe("getPositionLabel", () => {
    it("retourne 'Haut' pour 'top'", () => {
        expect(getPositionLabel("top")).toBe("Haut");
    });

    it("retourne 'Bas' pour 'bottom'", () => {
        expect(getPositionLabel("bottom")).toBe("Bas");
    });

    it("retourne 'Coin haut gauche' pour 'top-left'", () => {
        expect(getPositionLabel("top-left")).toBe("Coin haut gauche");
    });

    it("retourne 'Coin haut droite' pour 'top-right'", () => {
        expect(getPositionLabel("top-right")).toBe("Coin haut droite");
    });

    it("retourne 'Coin bas gauche' pour 'bottom-left'", () => {
        expect(getPositionLabel("bottom-left")).toBe("Coin bas gauche");
    });

    it("retourne 'Coin bas droite' pour 'bottom-right'", () => {
        expect(getPositionLabel("bottom-right")).toBe("Coin bas droite");
    });

    it("couvre toutes les positions sans exception", () => {
        const positions = ["top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"] as const;
        for (const pos of positions) {
            expect(getPositionLabel(pos)).toBeTruthy();
        }
    });
});

// ─── getSizeLabel ────────────────────────────────────────────────────────────

describe("getSizeLabel", () => {
    it("retourne 'Petite' pour 'small'", () => {
        expect(getSizeLabel("small")).toBe("Petite");
    });

    it("retourne 'Moyenne' pour 'medium'", () => {
        expect(getSizeLabel("medium")).toBe("Moyenne");
    });

    it("retourne 'Grande' pour 'large'", () => {
        expect(getSizeLabel("large")).toBe("Grande");
    });

    it("retourne 'Personnalisée' pour 'custom'", () => {
        expect(getSizeLabel("custom")).toBe("Personnalisée");
    });
});

// ─── validateImportedRules ───────────────────────────────────────────────────

describe("validateImportedRules", () => {
    const validRule: Rule = {
        pattern: ".*dev.*",
        label: "DEV",
        color: "#e53935",
        position: "top",
        size: "medium",
    };

    it("accepte un tableau de règles valides", () => {
        const result = validateImportedRules([validRule]);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(validRule);
    });

    it("accepte un tableau vide", () => {
        expect(validateImportedRules([])).toEqual([]);
    });

    it("accepte plusieurs règles valides", () => {
        const rules = [
            validRule,
            { pattern: ".*prod.*", label: "PROD", color: "#4caf50", position: "bottom", size: "large" },
        ];
        const result = validateImportedRules(rules);
        expect(result).toHaveLength(2);
    });

    // --- Format invalide ---

    it("lève une erreur si la donnée n'est pas un tableau (objet)", () => {
        expect(() => validateImportedRules({})).toThrow("Format invalide");
    });

    it("lève une erreur si la donnée n'est pas un tableau (chaîne)", () => {
        expect(() => validateImportedRules("string")).toThrow("Format invalide");
    });

    it("lève une erreur si la donnée est null", () => {
        expect(() => validateImportedRules(null)).toThrow("Format invalide");
    });

    it("lève une erreur si la donnée est un nombre", () => {
        expect(() => validateImportedRules(42)).toThrow("Format invalide");
    });

    // --- Champs manquants / invalides ---

    it("lève une erreur si 'pattern' est absent", () => {
        const { pattern: _p, ...withoutPattern } = validRule;
        expect(() => validateImportedRules([withoutPattern])).toThrow("invalides");
    });

    it("lève une erreur si 'label' est absent", () => {
        const { label: _l, ...withoutLabel } = validRule;
        expect(() => validateImportedRules([withoutLabel])).toThrow("invalides");
    });

    it("lève une erreur si 'color' est absent", () => {
        const { color: _c, ...withoutColor } = validRule;
        expect(() => validateImportedRules([withoutColor])).toThrow("invalides");
    });

    it("lève une erreur si 'position' est invalide", () => {
        expect(() => validateImportedRules([{ ...validRule, position: "center" }])).toThrow("invalides");
    });

    it("lève une erreur si 'size' est invalide", () => {
        expect(() => validateImportedRules([{ ...validRule, size: "huge" }])).toThrow("invalides");
    });

    // --- Couleur invalide ---

    it("lève une erreur pour une couleur nommée (ex: 'red')", () => {
        expect(() => validateImportedRules([{ ...validRule, color: "red" }])).toThrow("Couleur invalide");
    });

    it("lève une erreur pour une couleur hexadécimale courte (#RGB)", () => {
        expect(() => validateImportedRules([{ ...validRule, color: "#e53" }])).toThrow("Couleur invalide");
    });

    it("lève une erreur pour un hex avec 5 chiffres", () => {
        expect(() => validateImportedRules([{ ...validRule, color: "#12345" }])).toThrow("Couleur invalide");
    });

    it("lève une erreur pour un hex avec des caractères invalides (#GGGGGG)", () => {
        expect(() => validateImportedRules([{ ...validRule, color: "#GGGGGG" }])).toThrow("Couleur invalide");
    });

    it("accepte les couleurs en minuscules (#aabbcc)", () => {
        expect(() => validateImportedRules([{ ...validRule, color: "#aabbcc" }])).not.toThrow();
    });

    it("accepte les couleurs en majuscules (#AABBCC)", () => {
        expect(() => validateImportedRules([{ ...validRule, color: "#AABBCC" }])).not.toThrow();
    });

    // --- Regex invalide ---

    it("lève une erreur pour une regex invalide ([invalid()", () => {
        expect(() => validateImportedRules([{ ...validRule, pattern: "[invalid(" }])).toThrow(
            "Expression régulière invalide"
        );
    });

    it("accepte une regex valide complexe", () => {
        expect(() =>
            validateImportedRules([{ ...validRule, pattern: "^https://.*\\.dev\\.example\\.com/.*$" }])
        ).not.toThrow();
    });

    // --- Toutes les valeurs valides ---

    it("accepte toutes les positions valides", () => {
        const positions = ["top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"] as const;
        for (const position of positions) {
            expect(() => validateImportedRules([{ ...validRule, position }])).not.toThrow();
        }
    });

    it("accepte toutes les tailles valides", () => {
        const sizes = ["small", "medium", "large"] as const;
        for (const size of sizes) {
            expect(() => validateImportedRules([{ ...validRule, size }])).not.toThrow();
        }
    });

    it("accepte une règle custom avec customSize valide", () => {
        expect(() =>
            validateImportedRules([{ ...validRule, size: "custom", customSize: { height: 28, fontSize: 16 } }])
        ).not.toThrow();
    });

    it("lève une erreur pour size 'custom' sans customSize", () => {
        expect(() =>
            validateImportedRules([{ ...validRule, size: "custom" }])
        ).toThrow("Taille personnalisée invalide");
    });

    it("lève une erreur pour customSize avec height hors limites", () => {
        expect(() =>
            validateImportedRules([{ ...validRule, size: "custom", customSize: { height: 5, fontSize: 16 } }])
        ).toThrow("Taille personnalisée invalide");
    });

    it("lève une erreur pour customSize avec fontSize hors limites", () => {
        expect(() =>
            validateImportedRules([{ ...validRule, size: "custom", customSize: { height: 28, fontSize: 200 } }])
        ).toThrow("Taille personnalisée invalide");
    });

    it("s'arrête à la première règle invalide dans le tableau", () => {
        const rules = [validRule, { ...validRule, position: "invalid" }];
        expect(() => validateImportedRules(rules)).toThrow("invalides");
    });
});

