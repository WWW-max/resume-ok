export interface ResumeAppearance {
  template: "classic" | "minimal" | "modern";
  accent: "green" | "fresh" | "forest";
  fontSize: number;
  spacing: "comfortable" | "compact";
  showBrand: boolean;
}
export const defaultAppearance: ResumeAppearance = {
  template: "classic",
  accent: "green",
  fontSize: 12,
  spacing: "comfortable",
  showBrand: false,
};
export const accentColors = {
  green: "#15934b",
  fresh: "#16a34a",
  forest: "#166534",
};
