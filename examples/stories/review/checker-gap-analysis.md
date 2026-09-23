# Why the rejected slides passed mechanical checks

The user rejected the visual design. Prior machine-clean reports are not artistic acceptance.

- diagnoseVisual only tests top-heavy pixel distribution, not composition quality or thematic distinction.
- CONTENT_CLIPPED compares scroll dimensions with client dimensions. Leading-side transformed decoration can paint outside without increasing scrollWidth.
- paintedBoxesIn excludes boxes without text, including milestone dots, and absolute-positioned elements.
- Shadow DOM text size coverage is restricted to deck-md and deck-code. It does not measure all component-authored labels.
- --steps measures geometry in every state, but the pixel pass still photographs only opening states.
- narrative.status was not-run; no completed narrative review was supplied.

The timeline dot defect is fixed in the component, with endpoint bounds regressions for plain and alternate timelines. The checker itself has not been expanded in this revision.

Visual review must block on floating icons, unintended detached alignment, repetitive generic layouts and missing visual evidence even with zero mechanical errors. The authoring agent is responsible for that pass.
