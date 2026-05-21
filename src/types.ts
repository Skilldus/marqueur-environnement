export type RulePosition =
    | "top"
    | "bottom"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

export type RuleSize = "small" | "medium" | "large" | "custom";

export interface Rule {
    pattern: string;  // regex en string
    label: string;    // ex : DEV, PROD
    color: string;    // #hex
    position: RulePosition;
    size: RuleSize;
    customSize?: { height: number; fontSize: number };
    textColor?: string;   // undefined = auto WCAG contrast, #hex = custom
    borderColor?: string; // undefined = no stroke, #hex = text stroke color
}
