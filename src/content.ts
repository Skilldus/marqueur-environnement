import { Rule } from "./types";

/**
 * Calcule la luminosité relative d'une couleur selon WCAG 2.0
 * @param hex Couleur au format #RRGGBB
 * @returns Luminosité entre 0 (noir) et 1 (blanc)
 */
const getLuminance = (hex: string): number => {
    // Retirer le # si présent
    hex = hex.replace('#', '');

    // Convertir en RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Appliquer la correction gamma
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculer la luminosité relative
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
};

/**
 * Détermine si le texte doit être noir ou blanc selon le fond
 * @param backgroundColor Couleur de fond au format #RRGGBB
 * @returns "white" ou "black"
 */
const getContrastTextColor = (backgroundColor: string): string => {
    const luminance = getLuminance(backgroundColor);
    // Seuil de luminosité : au-dessus de 0.5 → texte noir, en dessous → texte blanc
    return luminance > 0.5 ? "black" : "white";
};

export const injectBanner = (rule: Rule) => {
    const isHorizontal = rule.position === "top" || rule.position === "bottom";

    const wrapper = document.createElement("div");
    wrapper.className = `env-ribbon-wrapper ${rule.position} ${rule.size}`;
    wrapper.style.backgroundColor = rule.color;

    const banner = document.createElement("div");
    banner.className = "env-banner";
    banner.style.color = getContrastTextColor(rule.color);

    const label = document.createElement("span");
    label.textContent = rule.label;
    banner.appendChild(label);
    wrapper.appendChild(banner);

    if (isHorizontal) {
        // Forcer le positionnement relatif et bloquer les overrides CSS
        wrapper.style.position = "relative";
        wrapper.style.width = "100%";
        wrapper.style.left = "0";
        wrapper.style.right = "auto";
        wrapper.style.transform = "none";
        wrapper.style.zIndex = "999999";
        wrapper.style.pointerEvents = "auto";

        // Insérer au début ou à la fin du body
        if (rule.position === "top") {
            if (document.body.firstChild) {
                document.body.insertBefore(wrapper, document.body.firstChild);
            } else {
                document.body.appendChild(wrapper);
            }
        } else {
            document.body.appendChild(wrapper);
        }
    } else {
        // Pour les coins, garder position fixed
        document.body.appendChild(wrapper);
    }
};

chrome.storage.sync.get({ rules: [] }, (data) => {
    const rules: Rule[] = data.rules as Rule[];
    const url = window.location.href;

    for (const rule of rules) {
        let regex: RegExp;
        try {
            regex = new RegExp(rule.pattern);
        } catch {
            continue;
        }
        if (regex.test(url)) {
            injectBanner(rule);
            break;
        }
    }
});