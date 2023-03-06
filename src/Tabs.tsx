import React from "react";

interface TabsProps<T extends string> {
  readonly tabs: T[];
  readonly active: T;
  readonly setActive: (name: T) => void;
}

function Tabs<T extends string>(props: TabsProps<T>) {
  return (
    <>
      {props.tabs.map((item) => (
        <button
          key={item}
          disabled={props.active === item}
          onClick={() => props.setActive(item)}
        >
          {item}
        </button>
      ))}
    </>
  );
}

export default Tabs;
