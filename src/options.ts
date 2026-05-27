import { Rule, RulePosition, RuleSize } from "./types";
import { validateImportedRules, getContrastTextColor } from "./utils";

const form = document.getElementById("ruleForm") as HTMLFormElement;
const formSection = document.querySelector(".form-section") as HTMLElement;
const formTitle = document.getElementById("formTitle") as HTMLElement;
const rulesList = document.getElementById("rules") as HTMLUListElement;
const rulesCount = document.getElementById("rulesCount") as HTMLSpanElement;
const emptyState = document.getElementById("emptyState") as HTMLParagraphElement;
const submitRuleBtn = document.getElementById("submitRule") as HTMLButtonElement;
const cancelEditBtn = document.getElementById("cancelEdit") as HTMLButtonElement;
const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;
const importBtn = document.getElementById("importBtn") as HTMLButtonElement;
const importFile = document.getElementById("importFile") as HTMLInputElement;
const importFeedback = document.getElementById("importFeedback") as HTMLSpanElement;
const themeToggle = document.getElementById("themeToggle") as HTMLButtonElement;
const customSizePanel = document.getElementById("customSizePanel") as HTMLElement;
const previewPanel = document.getElementById("previewPanel") as HTMLElement;
const customTextColorEnabled = document.getElementById("customTextColorEnabled") as HTMLInputElement;
const borderColorEnabled = document.getElementById("borderColorEnabled") as HTMLInputElement;
const textColorInput = document.getElementById("textColor") as HTMLInputElement;
const borderColorInput = document.getElementById("borderColor") as HTMLInputElement;

// ─── Theme ───────────────────────────────────────────────────────────────────

const applyTheme = (theme: "light" | "dark") => {
    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
};

const savedTheme = (localStorage.getItem("theme") as "light" | "dark" | null) ?? "light";
applyTheme(savedTheme);

themeToggle?.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
});

// ─── i18n ────────────────────────────────────────────────────────────────────

const t = (key: string, substitutions?: string | string[]): string =>
    chrome.i18n.getMessage(key, substitutions) || key;

const createSvgIcon = (shapes: { tag: string; attrs: Record<string, string> }[]): SVGElement => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    for (const { tag, attrs } of shapes) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        svg.appendChild(el);
    }
    return svg;
};

const POSITION_KEYS: Record<RulePosition, string> = {
    top:           "positionTop",
    bottom:        "positionBottom",
    "top-left":    "positionTopLeft",
    "top-right":   "positionTopRight",
    "bottom-left": "positionBottomLeft",
    "bottom-right":"positionBottomRight",
};

const SIZE_KEYS: Record<RuleSize, string> = {
    small:  "sizeSmall",
    medium: "sizeMedium",
    large:  "sizeLarge",
    custom: "sizeCustom",
};

const applyTranslations = () => {
    document.title = t("pageTitle");

    if (themeToggle) {
        themeToggle.title = t("themeToggleTitle");
        themeToggle.setAttribute("aria-label", t("themeToggleAriaLabel"));
    }

    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
        const msg = t(el.getAttribute("data-i18n")!);
        if (msg) el.textContent = msg;
    });
};

// ─── Preview ──────────────────────────────────────────────────────────────────

const SIZE_DIMENSIONS: Record<string, { height: number; fontSize: number }> = {
    small:  { height: 24, fontSize: 13 },
    medium: { height: 28, fontSize: 16 },
    large:  { height: 36, fontSize: 19 },
};

const syncAutoTextColor = () => {
    if (!customTextColorEnabled.checked) {
        const color = (document.getElementById("color") as HTMLInputElement).value;
        textColorInput.value = getContrastTextColor(color) === "white" ? "#ffffff" : "#000000";
    }
};

const updatePreview = () => {
    const color = (document.getElementById("color") as HTMLInputElement).value;
    const rawLabel = (document.getElementById("label") as HTMLInputElement).value;
    const size = (document.getElementById("size") as HTMLSelectElement).value;

    let height: number, fontSize: number;
    if (size === "custom") {
        height = Math.max(10, parseInt((document.getElementById("customHeight") as HTMLInputElement).value, 10) || 28);
        fontSize = Math.max(8, parseInt((document.getElementById("customFontSize") as HTMLInputElement).value, 10) || 16);
    } else {
        ({ height, fontSize } = SIZE_DIMENSIONS[size] ?? SIZE_DIMENSIONS.medium);
    }

    const banner = document.getElementById("previewBanner") as HTMLElement;
    const text = document.getElementById("previewText") as HTMLElement;
    banner.style.backgroundColor = color;
    banner.style.color = customTextColorEnabled.checked ? textColorInput.value : getContrastTextColor(color);
    banner.style.setProperty("-webkit-text-stroke", borderColorEnabled.checked ? `1px ${borderColorInput.value}` : "");
    banner.style.minHeight = `${height}px`;
    banner.style.lineHeight = `${height}px`;
    banner.style.fontSize = `${fontSize}px`;
    text.textContent = rawLabel.trim() || "LABEL";
};

const toggleCustomPanel = () => {
    const isCustom = (document.getElementById("size") as HTMLSelectElement).value === "custom";
    customSizePanel.hidden = !isCustom;
    updatePreview();
};

// ─── Form mode ───────────────────────────────────────────────────────────────

let editingIndex: number | null = null;

export const setFormMode = (mode: "create" | "edit") => {
    const isEdit = mode === "edit";
    submitRuleBtn.textContent = t(isEdit ? "btnSave" : "btnAdd");
    cancelEditBtn.hidden = !isEdit;
    formTitle.textContent = t(isEdit ? "formTitleEdit" : "formTitleNew");
    formSection.classList.toggle("editing", isEdit);
};

const resetFormState = () => {
    editingIndex = null;
    form.reset();
    customSizePanel.hidden = true;
    customTextColorEnabled.checked = false;
    textColorInput.disabled = true;
    borderColorEnabled.checked = false;
    borderColorInput.disabled = true;
    syncAutoTextColor();
    updatePreview();
    setFormMode("create");
};

const fillForm = (rule: Rule, index: number) => {
    (document.getElementById("pattern") as HTMLInputElement).value = rule.pattern;
    (document.getElementById("label") as HTMLInputElement).value = rule.label;
    (document.getElementById("color") as HTMLInputElement).value = rule.color;
    (document.getElementById("position") as HTMLSelectElement).value = rule.position;
    (document.getElementById("size") as HTMLSelectElement).value = rule.size;

    if (rule.size === "custom" && rule.customSize) {
        (document.getElementById("customHeight") as HTMLInputElement).value = rule.customSize.height.toString();
        (document.getElementById("customFontSize") as HTMLInputElement).value = rule.customSize.fontSize.toString();
        customSizePanel.hidden = false;
    } else {
        customSizePanel.hidden = true;
    }

    const hasCustomTextColor = !!rule.textColor;
    customTextColorEnabled.checked = hasCustomTextColor;
    textColorInput.disabled = !hasCustomTextColor;
    textColorInput.value = rule.textColor ?? (getContrastTextColor(rule.color) === "white" ? "#ffffff" : "#000000");

    const hasBorderColor = !!rule.borderColor;
    borderColorEnabled.checked = hasBorderColor;
    borderColorInput.disabled = !hasBorderColor;
    if (rule.borderColor) borderColorInput.value = rule.borderColor;

    editingIndex = index;
    setFormMode("edit");
    updatePreview();
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ─── Rules ───────────────────────────────────────────────────────────────────

export const loadRules = () => {
    chrome.storage.sync.get({ rules: [] }, (data) => {
        const rules: Rule[] = data.rules as Rule[];
        rulesList.replaceChildren();

        rulesCount.textContent = rules.length.toString();
        emptyState.hidden = rules.length > 0;

        rules.forEach((rule, index) => {
            const li = document.createElement("li");

            const colorBadge = document.createElement("div");
            colorBadge.className = "rule-color-badge";
            colorBadge.style.backgroundColor = rule.color;
            colorBadge.style.color = rule.textColor ?? getContrastTextColor(rule.color);
            if (rule.borderColor) {
                colorBadge.style.setProperty("-webkit-text-stroke", `1px ${rule.borderColor}`);
            }
            colorBadge.textContent = rule.label;

            const infoDiv = document.createElement("div");
            infoDiv.className = "rule-info";

            const labelSpan = document.createElement("div");
            labelSpan.className = "rule-label";
            labelSpan.textContent = rule.label;

            const detailsSpan = document.createElement("div");
            detailsSpan.className = "rule-details";
            detailsSpan.textContent = rule.pattern;
            detailsSpan.title = rule.pattern;

            const metaDiv = document.createElement("div");
            metaDiv.className = "rule-meta";

            const positionTag = document.createElement("span");
            positionTag.className = "rule-tag";
            positionTag.textContent = t(POSITION_KEYS[rule.position]);

            const sizeTag = document.createElement("span");
            sizeTag.className = "rule-tag";
            if (rule.size === "custom" && rule.customSize) {
                sizeTag.textContent = `${t("sizeCustom")} · ${rule.customSize.height}×${rule.customSize.fontSize}px`;
                sizeTag.title = `${t("fieldCustomHeight")}: ${rule.customSize.height}px — ${t("fieldCustomFontSize")}: ${rule.customSize.fontSize}px`;
            } else {
                sizeTag.textContent = t(SIZE_KEYS[rule.size]);
            }

            metaDiv.appendChild(positionTag);
            metaDiv.appendChild(sizeTag);
            infoDiv.appendChild(labelSpan);
            infoDiv.appendChild(detailsSpan);
            infoDiv.appendChild(metaDiv);

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn btn-outline";
            editBtn.appendChild(createSvgIcon([
                { tag: "path", attrs: { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" } },
                { tag: "path", attrs: { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" } },
            ]));
            editBtn.append(t("btnEdit"));
            editBtn.onclick = () => fillForm(rule, index);

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "btn btn-danger";
            deleteBtn.appendChild(createSvgIcon([
                { tag: "polyline", attrs: { points: "3 6 5 6 21 6" } },
                { tag: "path", attrs: { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" } },
            ]));
            deleteBtn.append(t("btnDelete"));
            deleteBtn.onclick = () => {
                if (confirm(t("confirmDelete", [rule.label]))) {
                    rules.splice(index, 1);
                    if (editingIndex === index) {
                        resetFormState();
                    } else if (editingIndex !== null && editingIndex > index) {
                        editingIndex -= 1;
                    }
                    chrome.storage.sync.set({ rules }, loadRules);
                }
            };

            li.appendChild(colorBadge);
            li.appendChild(infoDiv);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            rulesList.appendChild(li);
        });
    });
};

// ─── Feedback ────────────────────────────────────────────────────────────────

let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

export const showFeedback = (message: string, isError = false) => {
    if (feedbackTimer !== null) {
        clearTimeout(feedbackTimer);
    }
    importFeedback.textContent = message;
    importFeedback.className = "import-feedback" + (isError ? " error" : "");
    importFeedback.hidden = false;
    feedbackTimer = setTimeout(() => {
        importFeedback.hidden = true;
        feedbackTimer = null;
    }, 3000);
};

// ─── Export / Import ─────────────────────────────────────────────────────────

export const exportRules = () => {
    chrome.storage.sync.get({ rules: [] }, (data) => {
        const json = JSON.stringify(data.rules, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "marqueur-environnement-rules.json";
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    });
};

export const importRules = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target?.result as string);
            const rules = validateImportedRules(parsed);

            chrome.storage.sync.set({ rules }, () => {
                if (chrome.runtime.lastError) {
                    showFeedback(t("saveError", [chrome.runtime.lastError.message!]), true);
                    return;
                }
                showFeedback(t("importSuccess", [rules.length.toString()]));
                loadRules();
            });
        } catch (err) {
            showFeedback(t("importError", [(err as Error).message]), true);
        }
    };
    reader.onerror = () => {
        showFeedback(t("importReadError"), true);
    };
    reader.readAsText(file);
};

// ─── Event listeners ─────────────────────────────────────────────────────────

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const pattern = (document.getElementById("pattern") as HTMLInputElement).value;
    const label = (document.getElementById("label") as HTMLInputElement).value;
    const color = (document.getElementById("color") as HTMLInputElement).value;
    const position = (document.getElementById("position") as HTMLSelectElement).value as RulePosition;
    const size = (document.getElementById("size") as HTMLSelectElement).value as RuleSize;

    const customSize = size === "custom" ? {
        height: Math.max(10, parseInt((document.getElementById("customHeight") as HTMLInputElement).value, 10) || 28),
        fontSize: Math.max(8, parseInt((document.getElementById("customFontSize") as HTMLInputElement).value, 10) || 16),
    } : undefined;

    const textColor = customTextColorEnabled.checked ? textColorInput.value : undefined;
    const borderColor = borderColorEnabled.checked ? borderColorInput.value : undefined;

    chrome.storage.sync.get({ rules: [] }, (data) => {
        const rules: Rule[] = data.rules as Rule[];
        const nextRule: Rule = {
            pattern, label, color, position, size,
            ...(customSize ? { customSize } : {}),
            ...(textColor ? { textColor } : {}),
            ...(borderColor ? { borderColor } : {}),
        };

        if (editingIndex !== null && editingIndex >= 0 && editingIndex < rules.length) {
            rules[editingIndex] = nextRule;
        } else {
            rules.push(nextRule);
        }

        chrome.storage.sync.set({ rules }, () => {
            resetFormState();
            loadRules();
        });
    });
});

cancelEditBtn.addEventListener("click", () => {
    resetFormState();
});

exportBtn.addEventListener("click", exportRules);

importBtn.addEventListener("click", () => {
    importFile.click();
});

importFile.addEventListener("change", () => {
    const file = importFile.files?.[0];
    if (file) {
        importRules(file);
        importFile.value = "";
    }
});

(document.getElementById("size") as HTMLSelectElement).addEventListener("change", toggleCustomPanel);
(document.getElementById("customHeight") as HTMLInputElement).addEventListener("input", updatePreview);
(document.getElementById("customFontSize") as HTMLInputElement).addEventListener("input", updatePreview);
(document.getElementById("color") as HTMLInputElement).addEventListener("input", () => {
    syncAutoTextColor();
    updatePreview();
});
(document.getElementById("label") as HTMLInputElement).addEventListener("input", updatePreview);

customTextColorEnabled.addEventListener("change", () => {
    textColorInput.disabled = !customTextColorEnabled.checked;
    updatePreview();
});

borderColorEnabled.addEventListener("change", () => {
    borderColorInput.disabled = !borderColorEnabled.checked;
    updatePreview();
});

textColorInput.addEventListener("input", updatePreview);
borderColorInput.addEventListener("input", updatePreview);

// ─── Init ────────────────────────────────────────────────────────────────────

applyTranslations();
setFormMode("create");
syncAutoTextColor();
updatePreview();
loadRules();
