import type { Ref } from "react";

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): (instance: T | null) => void {
  return (instance) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(instance);
      } else {
        ref.current = instance;
      }
    }
  };
}
