import {Rule, RulePosition, RuleSize} from "./types";

const form = document.getElementById("ruleForm") as HTMLFormElement;
const formSection = document.querySelector(".form-section") as HTMLElement;
const formTitle = document.getElementById("formTitle") as HTMLHeadingElement;
const rulesList = document.getElementById("rules") as HTMLUListElement;
const rulesCount = document.getElementById("rulesCount") as HTMLSpanElement;
const emptyState = document.getElementById("emptyState") as HTMLParagraphElement;
const submitRuleBtn = document.getElementById("submitRule") as HTMLButtonElement;
const cancelEditBtn = document.getElementById("cancelEdit") as HTMLButtonElement;
const exportBtn = document.getElementById("exportBtn") as HTMLButtonElement;
const importFile = document.getElementById("importFile") as HTMLInputElement;
const importFeedback = document.getElementById("importFeedback") as HTMLSpanElement;

let editingIndex: number | null = null;

const setFormMode = (mode: "create" | "edit") => {
    const isEdit = mode === "edit";
    submitRuleBtn.innerText = isEdit ? "Enregistrer" : "Ajouter";
    cancelEditBtn.hidden = !isEdit;
    formTitle.innerText = isEdit ? "Modifier la règle" : "Ajouter une règle";

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

    // Scroll vers le formulaire
    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
};

const getPositionLabel = (position: RulePosition): string => {
    const labels: Record<RulePosition, string> = {
        "top": "Haut",
        "bottom": "Bas",
        "top-left": "Coin haut gauche",
        "top-right": "Coin haut droite",
        "bottom-left": "Coin bas gauche",
        "bottom-right": "Coin bas droite"
    };
    return labels[position];
};

const getSizeLabel = (size: RuleSize): string => {
    const labels: Record<RuleSize, string> = {
        "small": "Petite",
        "medium": "Moyenne",
        "large": "Grande"
    };
    return labels[size];
};

const loadRules = () => {
    chrome.storage.sync.get({ rules: [] }, (data) => {
        const rules: Rule[] = data.rules as Rule[];
        rulesList.innerHTML = "";

        rulesCount.innerText = rules.length.toString();
        emptyState.hidden = rules.length > 0;

        rules.forEach((rule, index) => {
            const li = document.createElement("li");

            // Badge de couleur
            const colorBadge = document.createElement("div");
            colorBadge.className = "rule-color-badge";
            colorBadge.style.backgroundColor = rule.color;

            // Infos de la règle
            const infoDiv = document.createElement("div");
            infoDiv.className = "rule-info";

            const labelSpan = document.createElement("div");
            labelSpan.className = "rule-label";
            labelSpan.innerText = rule.label;

            const detailsSpan = document.createElement("div");
            detailsSpan.className = "rule-details";
            detailsSpan.innerText = rule.pattern;

            const metaDiv = document.createElement("div");
            metaDiv.className = "rule-meta";

            const positionTag = document.createElement("span");
            positionTag.className = "rule-tag";
            positionTag.innerText = getPositionLabel(rule.position);

            const sizeTag = document.createElement("span");
            sizeTag.className = "rule-tag";
            sizeTag.innerText = getSizeLabel(rule.size);

            metaDiv.appendChild(positionTag);
            metaDiv.appendChild(sizeTag);

            infoDiv.appendChild(labelSpan);
            infoDiv.appendChild(detailsSpan);
            infoDiv.appendChild(metaDiv);

            // Boutons
            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.innerText = "Modifier";
            editBtn.onclick = () => fillForm(rule, index);

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.innerText = "Supprimer";
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

const showFeedback = (message: string, isError = false) => {
    importFeedback.textContent = message;
    importFeedback.className = "import-feedback" + (isError ? " error" : "");
    importFeedback.hidden = false;
    setTimeout(() => { importFeedback.hidden = true; }, 3000);
};

const exportRules = () => {
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

const importRules = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsed = JSON.parse(e.target?.result as string);
            if (!Array.isArray(parsed)) throw new Error("Format invalide");

            // Validation basique de chaque règle
            const validPositions: RulePosition[] = ["top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"];
            const validSizes: RuleSize[] = ["small", "medium", "large"];
            const rules: Rule[] = parsed.map((r: unknown) => {
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
                return rule as unknown as Rule;
            });

            chrome.storage.sync.set({ rules }, () => {
                showFeedback(`✅ ${rules.length} règle(s) importée(s) avec succès`);
                loadRules();
            });
        } catch (err) {
            showFeedback(`❌ Erreur : ${(err as Error).message}`, true);
        }
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

importFile.addEventListener("change", () => {
    const file = importFile.files?.[0];
    if (file) {
        importRules(file);
        importFile.value = ""; // reset pour permettre re-import du même fichier
    }
});

setFormMode("create");
loadRules();
