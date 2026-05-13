import {Rule, RulePosition, RuleSize} from "./types";
import { getPositionLabel, getSizeLabel, validateImportedRules } from "./utils";

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

let editingIndex: number | null = null;

export const setFormMode = (mode: "create" | "edit") => {
    const isEdit = mode === "edit";
    submitRuleBtn.textContent = isEdit ? "Enregistrer" : "Ajouter";
    cancelEditBtn.hidden = !isEdit;
    formTitle.textContent = isEdit ? "Modifier la règle" : "Nouvelle règle";

    if (isEdit) {
        formSection.classList.add("editing");
    } else {
        formSection.classList.remove("editing");
    }
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
            positionTag.textContent = getPositionLabel(rule.position);

            const sizeTag = document.createElement("span");
            sizeTag.className = "rule-tag";
            sizeTag.textContent = getSizeLabel(rule.size);

            metaDiv.appendChild(positionTag);
            metaDiv.appendChild(sizeTag);
            infoDiv.appendChild(labelSpan);
            infoDiv.appendChild(detailsSpan);
            infoDiv.appendChild(metaDiv);

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn btn-outline";
            editBtn.textContent = "Modifier";
            editBtn.onclick = () => fillForm(rule, index);

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "btn btn-danger";
            deleteBtn.textContent = "Supprimer";
            deleteBtn.onclick = () => {
                if (confirm(`Supprimer la règle "${rule.label}" ?`)) {
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
                    showFeedback(`❌ Erreur lors de la sauvegarde : ${chrome.runtime.lastError.message}`, true);
                    return;
                }
                showFeedback(`✅ ${rules.length} règle(s) importée(s) avec succès`);
                loadRules();
            });
        } catch (err) {
            showFeedback(`❌ Erreur : ${(err as Error).message}`, true);
        }
    };
    reader.onerror = () => {
        showFeedback("❌ Erreur lors de la lecture du fichier d'import.", true);
    };
    reader.readAsText(file);
};

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

setFormMode("create");
loadRules();
