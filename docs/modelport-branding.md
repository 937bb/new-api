# ModelPort Global console

The shared console uses a navy primary color (#173B65), slate text (#1C2D41),
white content surfaces, and a pale sidebar (#F3F6FA). Dark mode uses slate
surfaces with a light blue primary color. Existing explicit theme preferences
remain supported. The default sidebar has a divider instead of an inset frame.

The bundled mark is `web/public/modelport-mark.svg`; `logo.png` and
`favicon.ico` are raster exports. The SVG is the default UI logo and build-time
favicon. Production branding options must set `SystemName` to `ModelPort
Global` and `Logo` to `/modelport-mark.svg`. Custom administrator branding
continues to override the bundled defaults. Upstream attribution is retained
and the footer links to the customized source branch.

Shared changes cover the app header, navigation, page headings, content and
pagination spacing, auth layout, and footer. Overview panels use flat surfaces
and compact radii. Authentication, channel routing, billing, and registration
policies are unchanged.

## Verification

Run affected Vitest suites, `bun check -b`, oxlint and oxfmt for changed files,
and `bun run build` from `web/`. Inspect the console at desktop and mobile
widths, in light and dark modes, including sidebar collapse and page scrolling.
Deploy the embedded frontend with the matching Go binary. Keep the preceding
container and save branding options before switching for a reversible rollback.
