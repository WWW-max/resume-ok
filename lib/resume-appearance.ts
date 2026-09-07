export interface ResumeAppearance { template: "classic" | "minimal" | "modern"; accent: "green" | "blue" | "slate"; fontSize: number; spacing: "comfortable" | "compact"; showBrand: boolean }
export const defaultAppearance: ResumeAppearance = { template:"classic",accent:"green",fontSize:12,spacing:"comfortable",showBrand:true };
export const accentColors = {green:"#15934b",blue:"#285ec0",slate:"#37465b"};
