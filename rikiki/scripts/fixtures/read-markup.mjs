// A tree of elements from markup · tags, quoted attributes, bare attributes. Enough for
// the diagrams of a skill or a recipe, and no more: the point is to read them as an
// author wrote them, with no browser. Shared by the tests that parse written diagrams.

/** The first element of a piece of markup, as a tree the diagram model reads. */
export function readMarkup(html) {
  const root = { localName: '#root', attrs: {}, children: [] };
  const stack = [root];
  for (const match of html
    .replace(/<!--[\s\S]*?-->/g, '')
    .matchAll(/<(\/?)([a-z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*(\/?)>/g)) {
    const [, closing, name, rest, selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    const attrs = {};
    for (const a of rest.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = a[2] ?? '';
    const element = {
      localName: name,
      attrs,
      children: [],
      getAttribute: (n) => (n in attrs ? attrs[n] : null),
      hasAttribute: (n) => n in attrs,
      getAttributeNames: () => Object.keys(attrs),
    };
    stack.at(-1).children.push(element);
    if (!selfClosing) stack.push(element);
  }
  return root.children[0];
}
