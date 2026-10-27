// ════════════════════════════════════════════════════════════════
// RIKIKI · the path of an element, the one way
//
// A finding names the element it is about by a path a human can paste and an
// agent can search for · and a deck's policy (`rikiki.config.json`, an exception
// written on an element) finds the findings under an element by that same path.
// So there is one path, computed by one function, in the inspector and in the
// bridge the check plugins run in.
//
// `pathOf` runs in the page, so it is serialized (`ELEMENT_PATH_READER`) and must
// stay self-contained: no import, no closure. `isWithin` runs in Node.
// ════════════════════════════════════════════════════════════════

/** A selector a human can paste · ids where there are some, positions among
 *  siblings of the same tag otherwise, `::shadow` where a component's tree starts. */
function pathOf(el) {
  const parts = [];
  let node = el;
  while (node && node !== document.body) {
    const tag = node.tagName?.toLowerCase();
    if (!tag) break;
    const host = node.getRootNode()?.host;
    if (node.id) {
      parts.unshift(`${tag}#${node.id}`);
    } else if (host) {
      // Inside a component's shadow tree · say so rather than pretend the
      // element is reachable from the document.
      parts.unshift(tag);
      parts.unshift('::shadow');
      node = host;
      continue;
    } else {
      const siblings = Array.from(node.parentElement?.children ?? []).filter(
        (s) => s.tagName === node.tagName,
      );
      parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(node) + 1})` : tag);
    }
    node = node.parentElement ?? node.getRootNode()?.host ?? null;
  }
  return parts.join(' > ').replace(/ > ::shadow > /g, ' ::shadow ');
}

/** The function, as source, for `page.evaluate` · the inspector and the plugin
 *  bridge rebuild it with `new Function('return ' + ELEMENT_PATH_READER)()`. */
export const ELEMENT_PATH_READER = `${pathOf}`;

/** Whether the element at `path` is the one at `ancestor` or lies inside it, its
 *  shadow tree included · by path, so `div:nth-of-type(1)` never holds
 *  `div:nth-of-type(10)`. */
export function isWithin(path, ancestor) {
  if (!path || !ancestor) return false;
  return path === ancestor || path.startsWith(`${ancestor} > `) || path.startsWith(`${ancestor} ::shadow `);
}
