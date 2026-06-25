# Default Homepage 3D Assets

The default homepage hero uses local glTF binary (`.glb`) assets rendered by
Three.js.

## Runtime

- Renderer: `three` with `GLTFLoader`
- Consumer: `web/default/src/features/home/components/sections/landing-model-scene.tsx`
- Model configuration:
  `web/default/src/features/home/components/sections/landing-model-config.ts`
- Assets are served from `web/default/public/models/landing/` and referenced by
  root-relative URLs.

## Models

| File | Source | Animation Used | License |
| --- | --- | --- | --- |
| `web/default/public/models/landing/robot-expressive.glb` | Three.js `RobotExpressive` example model by Tomas Laulhe, modified by Don McCurdy | `Wave` | CC0 1.0 |
| `web/default/public/models/landing/fox.glb` | Khronos glTF Sample Models `Fox` | `Survey` | CC0 model; CC-BY 4.0 rigging and animation attribution |

Credit notes live next to the model files:

- `web/default/public/models/landing/RobotExpressive.CREDITS.md`
- `web/default/public/models/landing/Fox.CREDITS.md`

## Replacement Notes

- Keep replacement files under `web/default/public/models/landing/` so the
  compiled frontend can serve them without a runtime network dependency.
- Check available animation names before changing `animationName` in
  `landing-model-scene.tsx`.
- Update `THIRD-PARTY-LICENSES.md` when replacing either model or changing the
  renderer dependency.
