/** Tiny DOM helpers: build once, then write only what changed. */

type Attrs = Readonly<Record<string, string | number | boolean | undefined>>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: readonly (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') node.className = String(v);
    else if (k === 'text') node.textContent = String(v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) node.append(c);
  return node;
}

export function setText(node: Node, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

export function setAttr(node: Element, name: string, value: string): void {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

export function setClass(node: Element, className: string): void {
  if (node.className !== className) node.className = className;
}

export function setStyle(node: HTMLElement, prop: string, value: string): void {
  if (node.style.getPropertyValue(prop) !== value) node.style.setProperty(prop, value);
}

/** True while the user is interacting with this control, so updates don't fight their input. */
export function isActive(node: Element): boolean {
  return node.ownerDocument.activeElement === node;
}
