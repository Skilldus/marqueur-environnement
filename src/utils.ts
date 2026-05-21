import { Rule, RulePosition, RuleSize } from "./types";

/**
 * Calcule la luminosité relative d'une couleur selon WCAG 2.0
 * @param hex Couleur au format #RRGGBB (le # est optionnel)
 * @returns Luminosité entre 0 (noir) et 1 (blanc)
 */
export const getLuminance = (hex: string): number => {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const toLinear = (c: number) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Détermine si le texte doit être noir ou blanc selon le fond
 * @param backgroundColor Couleur de fond au format #RRGGBB
 * @returns "white" ou "black"
 */
export const getContrastTextColor = (backgroundColor: string): string =>
    getLuminance(backgroundColor) > 0.5 ? "black" : "white";

/**
 * Retourne le libellé français d'une position de bandeau
 */
export const getPositionLabel = (position: RulePosition): string => {
    const labels: Record<RulePosition, string> = {
        top: "Haut",
        bottom: "Bas",
        "top-left": "Coin haut gauche",
        "top-right": "Coin haut droite",
        "bottom-left": "Coin bas gauche",
        "bottom-right": "Coin bas droite",
    };
    return labels[position];
};

/**
 * Retourne le libellé français d'une taille de bandeau
 */
export const getSizeLabel = (size: RuleSize): string => {
    const labels: Record<RuleSize, string> = {
        small: "Petite",
        medium: "Moyenne",
        large: "Grande",
        custom: "Personnalisée",
    };
    return labels[size];
};

/**
 * Valide et parse un tableau de règles importées depuis un fichier JSON.
 * Lève une erreur si les données sont invalides.
 */
export const validateImportedRules = (data: unknown): Rule[] => {
    if (!Array.isArray(data)) throw new Error("Format invalide");

    const validPositions: RulePosition[] = [
        "top",
        "bottom",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
    ];
    const validSizes: RuleSize[] = ["small", "medium", "large", "custom"];
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;

    return data.map((r: unknown) => {
        const rule = r as Record<string, unknown>;

        if (
            typeof rule.pattern !== "string" ||
            typeof rule.label !== "string" ||
            typeof rule.color !== "string" ||
            !validPositions.includes(rule.position as RulePosition) ||
            !validSizes.includes(rule.size as RuleSize)
        ) {
            throw new Error("Une ou plusieurs règles sont invalides");
        }

        if (!colorRegex.test(rule.color as string)) {
            throw new Error(
                `Couleur invalide "${rule.color}" : le format attendu est #RRGGBB`
            );
        }

        try {
            new RegExp(rule.pattern as string);
        } catch {
            throw new Error(
                `Expression régulière invalide : "${rule.pattern}"`
            );
        }

        if (rule.size === "custom") {
            const cs = rule.customSize as { height?: unknown; fontSize?: unknown } | undefined;
            if (
                !cs ||
                typeof cs.height !== "number" || cs.height < 10 || cs.height > 200 ||
                typeof cs.fontSize !== "number" || cs.fontSize < 8 || cs.fontSize > 100
            ) {
                throw new Error("Taille personnalisée invalide");
            }
        }

        if (rule.textColor !== undefined) {
            if (typeof rule.textColor !== "string" || !colorRegex.test(rule.textColor as string)) {
                throw new Error(
                    `Couleur de texte invalide "${rule.textColor}" : le format attendu est #RRGGBB`
                );
            }
        }

        if (rule.borderColor !== undefined) {
            if (typeof rule.borderColor !== "string" || !colorRegex.test(rule.borderColor as string)) {
                throw new Error(
                    `Couleur de bordure invalide "${rule.borderColor}" : le format attendu est #RRGGBB`
                );
            }
        }

        return rule as unknown as Rule;
    });
};

