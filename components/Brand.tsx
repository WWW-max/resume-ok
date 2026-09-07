import { ui } from "@/lib/ui-styles";
import { Clover } from "lucide-react";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`${ui["brand"]} ${small ? ui["brand-small"] : ""}`}>
      <Clover
        aria-hidden="true"
        className={ui["brand-clover"]}
        strokeWidth={1.5}
      />
      <span>
        Resume<span className={ui["brand-ok"]}>OK</span>
      </span>
    </span>
  );
}
