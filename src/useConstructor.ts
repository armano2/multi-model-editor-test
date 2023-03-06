import { useRef } from "react";

function useConstructor(constructor: () => void) {
  const val = useRef(false);
  if (!val.current) {
    constructor();
    val.current = true;
  }
}

export default useConstructor;
