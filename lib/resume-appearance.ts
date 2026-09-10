export interface ResumeAppearance {
  template: "classic" | "minimal" | "modern";
  accent: "none" | "green" | "fresh" | "forest";
  fontSize: number;
  spacing: "comfortable" | "compact";
  showBrand: boolean;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  dividerColor: string;
  showIcons: boolean;
  personalInfoLayout: "left" | "center" | "split";
}
export const defaultAppearance: ResumeAppearance = {
  template: "classic",
  accent: "green",
  fontSize: 12,
  spacing: "comfortable",
  showBrand: false,
  paddingTop: 44,
  paddingRight: 44,
  paddingBottom: 44,
  paddingLeft: 44,
  dividerColor: "#d3f0dd",
  showIcons: true,
  personalInfoLayout: "split",
};
export const accentColors = {
  none: "#171717",
  green: "#15934b",
  fresh: "#16a34a",
  forest: "#166534",
};
