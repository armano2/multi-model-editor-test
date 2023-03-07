import React from "react";
import { PanelResizeHandle } from "react-resizable-panels";

import styles from "./ResizeHandle.module.css";

export interface ResizeHandleProps {
  collapsed?: boolean;
  id?: string;
}

function ResizeHandle({ collapsed = false, id }: ResizeHandleProps) {
  return (
    <PanelResizeHandle className={styles.ResizeHandleOuter} id={id}>
      <div
        className={styles.ResizeHandleInner}
        data-collapsed={collapsed || undefined}
      ></div>
    </PanelResizeHandle>
  );
}

export default ResizeHandle;
