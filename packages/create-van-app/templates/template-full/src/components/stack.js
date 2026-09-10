/**
 * @nkzw/stack inspired layout components for VanJS
 * Provides type-safe, zero-dependency Flexbox Stack components.
 * Embedded-safe: uses margin adjacent selector fallbacks when gap is unsupported.
 * Zero-copy: passes child nodes directly to VanJS dom-builder without redundant array flattening.
 */
import van from "../core/van.js";

const { div } = van.tags;

const ALIGN_MAP = {
  baseline: "baseline",
  center: "center",
  end: "flex-end",
  start: "flex-start",
  stretch: "stretch",
};

const JUSTIFY_MAP = {
  around: "space-around",
  between: "space-between",
  center: "center",
  end: "flex-end",
  evenly: "space-evenly",
  start: "flex-start",
};

const SPACING_CLASS_MAP = {
  horizontal: {
    4: "u-space-x-xs",
    8: "u-space-x",
    16: "u-space-x-lg",
  },
  vertical: {
    4: "u-space-y-xs",
    8: "u-space-y-sm",
    12: "u-space-y",
    16: "u-space-y-lg",
  },
};

function isChild(val) {
  return (
    Boolean(val && val.nodeType) ||
    typeof val === "string" ||
    typeof val === "function" ||
    Array.isArray(val)
  );
}

/**
 * Flexible Stack container (inspired by @nkzw/stack)
 */
export function Stack(props = {}, ...children) {
  const isFirstChild = isChild(props);
  const options = isFirstChild ? {} : props;
  const childNodes = isFirstChild ? [props, ...children] : children;

  const {
    align,
    class: customClass = "",
    direction = "vertical",
    justify,
    spacing = 8,
    style: customStyle = "",
    wrap = false,
    ...rest
  } = options;

  const isRow = direction === "horizontal" || direction === "row";
  const axis = isRow ? "horizontal" : "vertical";
  const spacingClass = SPACING_CLASS_MAP[axis][spacing] || "";

  let styles = `display: flex; flex-direction: ${isRow ? "row" : "column"};`;
  if (align) {
    styles += ` align-items: ${ALIGN_MAP[align] || align};`;
  }
  if (justify) {
    styles += ` justify-content: ${JUSTIFY_MAP[justify] || justify};`;
  }
  if (wrap) {
    styles += " flex-wrap: wrap;";
  }
  if (customStyle) {
    styles += ` ${customStyle};`;
  }

  const classes = `c-stack ${isRow ? "u-flex-row" : "u-flex-col"}${spacingClass ? ` ${spacingClass}` : ""}${customClass ? ` ${customClass}` : ""}`;

  // Zero-copy: childNodes are passed directly into VanJS div() without intermediate .flat(Infinity) copy
  return div(
    {
      ...rest,
      class: classes,
      style: styles,
    },
    ...childNodes,
  );
}

function createStack(defaultDirection) {
  return (props, ...children) => {
    if (isChild(props)) {
      return Stack({ direction: defaultDirection }, props, ...children);
    }
    return Stack({ ...props, direction: defaultDirection }, ...children);
  };
}

/**
 * Horizontal Stack (HStack)
 */
export const HStack = createStack("horizontal");

/**
 * Vertical Stack (VStack)
 */
export const VStack = createStack("vertical");
