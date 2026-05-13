import { Rule, RulePosition, RuleSize } from "./types";
import { validateImportedRules } from "./utils";

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

const createSvgIcon = (innerHtml: string): SVGElement => {
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
    svg.innerHTML = innerHtml;
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
    setFormMode("create");
};

const fillForm = (rule: Rule, index: number) => {
    (document.getElementById("pattern") as HTMLInputElement).value = rule.pattern;
    (document.getElementById("label") as HTMLInputElement).value = rule.label;
    (document.getElementById("color") as HTMLInputElement).value = rule.color;
    (document.getElementById("position") as HTMLSelectElement).value = rule.position;
    (document.getElementById("size") as HTMLSelectElement).value = rule.size;
    editingIndex = index;
    setFormMode("edit");
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ─── Rules ───────────────────────────────────────────────────────────────────

export const loadRules = () => {
    chrome.storage.sync.get({ rules: [] }, (data) => {
        const rules: Rule[] = data.rules as Rule[];
        rulesList.innerHTML = "";

        rulesCount.textContent = rules.length.toString();
        emptyState.hidden = rules.length > 0;

        rules.forEach((rule, index) => {
            const li = document.createElement("li");

            const colorBadge = document.createElement("div");
            colorBadge.className = "rule-color-badge";
            colorBadge.style.backgroundColor = rule.color;

            const infoDiv = document.createElement("div");
            infoDiv.className = "rule-info";

            const labelSpan = document.createElement("div");
            labelSpan.className = "rule-label";
            labelSpan.textContent = rule.label;

            const detailsSpan = document.createElement("div");
            detailsSpan.className = "rule-details";
            detailsSpan.textContent = rule.pattern;

            const metaDiv = document.createElement("div");
            metaDiv.className = "rule-meta";

            const positionTag = document.createElement("span");
            positionTag.className = "rule-tag";
            positionTag.textContent = t(POSITION_KEYS[rule.position]);

            const sizeTag = document.createElement("span");
            sizeTag.className = "rule-tag";
            sizeTag.textContent = t(SIZE_KEYS[rule.size]);

            metaDiv.appendChild(positionTag);
            metaDiv.appendChild(sizeTag);
            infoDiv.appendChild(labelSpan);
            infoDiv.appendChild(detailsSpan);
            infoDiv.appendChild(metaDiv);

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn btn-outline";
            editBtn.appendChild(createSvgIcon(
                '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
                '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
            ));
            editBtn.append(t("btnEdit"));
            editBtn.onclick = () => fillForm(rule, index);

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "btn btn-danger";
            deleteBtn.appendChild(createSvgIcon(
                '<polyline points="3 6 5 6 21 6"/>' +
                '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'
            ));
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

    chrome.storage.sync.get({ rules: [] }, (data) => {
        const rules: Rule[] = data.rules as Rule[];
        const nextRule: Rule = { pattern, label, color, position, size };

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

// ─── Init ────────────────────────────────────────────────────────────────────

applyTranslations();
setFormMode("create");
loadRules();
