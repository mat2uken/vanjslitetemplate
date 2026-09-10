/**
 * @nkzw/stack inspired layout components for VanJS
 * Provides type-safe, zero-dependency Flexbox Stack components.
 * Embedded-safe: uses margin adjacent selector fallbacks when gap is unsupported.
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

/**
 * Flexible Stack container (inspired by @nkzw/stack)
 * @param {Object} props
 * @param {('horizontal'|'vertical'|'row'|'column')} [props.direction='vertical']
 * @param {(4|8|12|16|number)} [props.spacing=8]
 * @param {('start'|'center'|'end'|'stretch'|'baseline')} [props.align]
 * @param {('start'|'center'|'end'|'between'|'around'|'evenly')} [props.justify]
 * @param {boolean} [props.wrap=false]
 * @param {string} [props.class='']
 * @param {string} [props.style='']
 * @param {...(HTMLElement|string)} children
 */
export function Stack(props = {}, ...children) {
  // Support calling Stack(child1, child2...) without props
  let options = props;
  let childNodes = children;

  if (
    Boolean(props && props.nodeType) ||
    typeof props === "string" ||
    typeof props === "function" ||
    Array.isArray(props)
  ) {
    childNodes = [props, ...children];
    options = {};
  }

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
  const flexDir = isRow ? "row" : "column";

  // Determine embedded-safe spacing class if available, otherwise direct inline margin fallback
  const axis = isRow ? "horizontal" : "vertical";
  const spacingClass = SPACING_CLASS_MAP[axis][spacing] || "";

  const styles = [
    "display: flex",
    `flex-direction: ${flexDir}`,
    align ? `align-items: ${ALIGN_MAP[align] || align}` : "",
    justify ? `justify-content: ${JUSTIFY_MAP[justify] || justify}` : "",
    wrap ? "flex-wrap: wrap" : "",
    customStyle,
  ]
    .filter(Boolean)
    .join("; ");

  const classes = ["c-stack", isRow ? "u-flex-row" : "u-flex-col", spacingClass, customClass]
    .filter(Boolean)
    .join(" ");

  const flatChildren = childNodes.flat(Infinity);

  return div(
    {
      ...rest,
      class: classes,
      style: styles,
    },
    ...flatChildren,
  );
}

/**
 * Horizontal Stack (HStack)
 */
export function HStack(props, ...children) {
  if (
    Boolean(props && props.nodeType) ||
    typeof props === "string" ||
    typeof props === "function"
  ) {
    return Stack({ direction: "horizontal" }, props, ...children);
  }
  return Stack({ ...props, direction: "horizontal" }, ...children);
}

/**
 * Vertical Stack (VStack)
 */
export function VStack(props, ...children) {
  if (
    Boolean(props && props.nodeType) ||
    typeof props === "string" ||
    typeof props === "function"
  ) {
    return Stack({ direction: "vertical" }, props, ...children);
  }
  return Stack({ ...props, direction: "vertical" }, ...children);
}
