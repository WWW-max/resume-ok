import { Clover } from "lucide-react";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <Clover aria-hidden="true" className="brand-clover" strokeWidth={1.5} />
      <span>
        Resume<span className="brand-ok">OK</span>
      </span>
    </span>
  );
}
