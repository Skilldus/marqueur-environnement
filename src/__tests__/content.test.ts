import { describe, it, expect, beforeEach } from "vitest";
import { injectBanner } from "../content";
import { Rule } from "../types";
import {waitFor} from "@testing-library/dom";

const baseRule: Rule = {
    pattern: ".*",
    label: "TEST",
    color: "#e53935",
    position: "top",
    size: "medium",
};

describe("injectBanner", () => {
    beforeEach(() => {
        // Réinitialiser le DOM avant chaque test
        document.body.innerHTML = '<div id="app">Contenu existant</div>';
    });

    // ─── Structure du bandeau ─────────────────────────────────────────────────

    it("crée un élément wrapper avec la classe 'env-ribbon-wrapper'", () => {
        injectBanner(baseRule);
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper).not.toBeNull();
    });

    it("crée un élément banner avec la classe 'env-banner'", () => {
        injectBanner(baseRule);
        const banner = document.querySelector(".env-banner");
        expect(banner).not.toBeNull();
    });

    it("affiche le bon label dans un <span>", async () => {
        injectBanner({ ...baseRule, label: "PRODUCTION" });
        await waitFor(() => {
            const span = document.querySelector(".env-banner span");
            expect(span?.textContent).toBe("PRODUCTION");
        });
    });

    it("applique la couleur de fond sur le wrapper", () => {
        injectBanner({ ...baseRule, color: "#e53935" });
        const wrapper = document.querySelector(".env-ribbon-wrapper") as HTMLElement;
        // jsdom convertit le hex en rgb
        expect(wrapper.style.backgroundColor).toBe("rgb(229, 57, 53)");
    });

    // ─── Classes de position ──────────────────────────────────────────────────

    it("applique la classe 'top' pour position 'top'", () => {
        injectBanner({ ...baseRule, position: "top" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("top")).toBe(true);
    });

    it("applique la classe 'bottom' pour position 'bottom'", () => {
        injectBanner({ ...baseRule, position: "bottom" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("bottom")).toBe(true);
    });

    it("applique la classe 'top-left' pour position 'top-left'", () => {
        injectBanner({ ...baseRule, position: "top-left" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("top-left")).toBe(true);
    });

    it("applique la classe 'top-right' pour position 'top-right'", () => {
        injectBanner({ ...baseRule, position: "top-right" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("top-right")).toBe(true);
    });

    it("applique la classe 'bottom-left' pour position 'bottom-left'", () => {
        injectBanner({ ...baseRule, position: "bottom-left" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("bottom-left")).toBe(true);
    });

    it("applique la classe 'bottom-right' pour position 'bottom-right'", () => {
        injectBanner({ ...baseRule, position: "bottom-right" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("bottom-right")).toBe(true);
    });

    // ─── Classes de taille ────────────────────────────────────────────────────

    it("applique la classe 'small' pour taille 'small'", () => {
        injectBanner({ ...baseRule, size: "small" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("small")).toBe(true);
    });

    it("applique la classe 'medium' pour taille 'medium'", () => {
        injectBanner({ ...baseRule, size: "medium" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("medium")).toBe(true);
    });

    it("applique la classe 'large' pour taille 'large'", () => {
        injectBanner({ ...baseRule, size: "large" });
        const wrapper = document.querySelector(".env-ribbon-wrapper");
        expect(wrapper?.classList.contains("large")).toBe(true);
    });

    // ─── Contraste du texte ───────────────────────────────────────────────────

    it("applique la couleur de texte 'white' pour un fond sombre (#000000)", () => {
        injectBanner({ ...baseRule, color: "#000000" });
        const banner = document.querySelector(".env-banner") as HTMLElement;
        expect(banner.style.color).toBe("white");
    });

    it("applique la couleur de texte 'black' pour un fond clair (#ffffff)", () => {
        injectBanner({ ...baseRule, color: "#ffffff" });
        const banner = document.querySelector(".env-banner") as HTMLElement;
        expect(banner.style.color).toBe("black");
    });

    it("applique la couleur de texte 'white' pour le rouge (#e53935)", () => {
        injectBanner({ ...baseRule, color: "#e53935" });
        const banner = document.querySelector(".env-banner") as HTMLElement;
        expect(banner.style.color).toBe("white");
    });

    it("applique la couleur de texte 'black' pour un jaune clair (#ffeb3b)", () => {
        injectBanner({ ...baseRule, color: "#ffeb3b" });
        const banner = document.querySelector(".env-banner") as HTMLElement;
        expect(banner.style.color).toBe("black");
    });

    // ─── Positionnement dans le DOM ───────────────────────────────────────────

    it("insère le bandeau 'top' comme premier enfant du body", () => {
        injectBanner({ ...baseRule, position: "top" });
        const firstChild = document.body.firstChild as HTMLElement;
        expect(firstChild.classList.contains("env-ribbon-wrapper")).toBe(true);
        expect(firstChild.classList.contains("top")).toBe(true);
    });

    it("insère le bandeau 'bottom' comme dernier enfant du body", () => {
        injectBanner({ ...baseRule, position: "bottom" });
        const lastChild = document.body.lastChild as HTMLElement;
        expect(lastChild.classList.contains("env-ribbon-wrapper")).toBe(true);
        expect(lastChild.classList.contains("bottom")).toBe(true);
    });

    it("insère un coin en dernier dans le body (non-horizontal)", () => {
        injectBanner({ ...baseRule, position: "top-right" });
        const lastChild = document.body.lastChild as HTMLElement;
        expect(lastChild.classList.contains("env-ribbon-wrapper")).toBe(true);
    });

    it("le contenu existant du body reste intègre après injection top", () => {
        injectBanner({ ...baseRule, position: "top" });
        const appDiv = document.getElementById("app");
        expect(appDiv).not.toBeNull();
    });

    it("le contenu existant du body reste intègre après injection bottom", () => {
        injectBanner({ ...baseRule, position: "bottom" });
        const appDiv = document.getElementById("app");
        expect(appDiv).not.toBeNull();
    });

    // ─── Style de positionnement ─────────────────────────────────────────────

    it("applique position: relative pour les bandeaux horizontaux (top)", () => {
        injectBanner({ ...baseRule, position: "top" });
        const wrapper = document.querySelector(".env-ribbon-wrapper") as HTMLElement;
        expect(wrapper.style.position).toBe("relative");
    });

    it("applique width: 100% pour les bandeaux horizontaux (bottom)", () => {
        injectBanner({ ...baseRule, position: "bottom" });
        const wrapper = document.querySelector(".env-ribbon-wrapper") as HTMLElement;
        expect(wrapper.style.width).toBe("100%");
    });
});
