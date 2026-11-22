import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/** Letters as individual spans for the character-rise animations. */
export function Chars({ text }: { text: string }) {
  return (
    <>
      {[...text].map((c, i) => (
        <span className="ch" aria-hidden="true" key={i}>
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

/**
 * Wrap every word in a mask (`.w > span`) while keeping inline elements
 * such as <em>. Usage: <h2>{words(<>Hello <em>world</em></>)}</h2>
 */
export function words(node: ReactNode, keyPrefix = "w"): ReactNode {
  if (typeof node === "string") {
    return node.split(/(\s+)/).map((part, i) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return " ";
      return (
        <span className="w" key={`${keyPrefix}${i}`}>
          <span>{part}</span>
        </span>
      );
    });
  }
  if (Array.isArray(node)) return node.map((n, i) => words(n, `${keyPrefix}${i}-`));
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode }>;
    const kids = Children.toArray(el.props.children);
    return cloneElement(el, undefined, ...kids.map((k, i) => words(k, `${keyPrefix}${i}-`)));
  }
  return node;
}

export const pad = (n: number, w = 2) => String(n).padStart(w, "0");
