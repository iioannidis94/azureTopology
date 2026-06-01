# 📦 JS File Distribution & Refactoring Plan

Full review and modular split plan for the Azure Architecture Builder JS codebase.

---

## 📊 Current State — File Size Overview

| File | Lines | Status |
|------|-------|--------|
| `js/export-logic.js` | 7 | ✅ Done — barrel re-export only |
| `js/exports/export-bicep.js` | 659 | ✅ Done |
| `js/exports/export-inventory.js` | 586 | ✅ Done |
| `js/exports/export-json.js` | 253 | ✅ Done |
| `js/exports/export-png.js` | 15 | ✅ Done |
| `js/exports/export-powershell.js` | 446 | ✅ Done |
| `js/exports/export-utils.js` | 38 | ✅ Done |
| `js/ui-components.js` | 1 289 | 🔴 Critical — needs immediate split |
| `js/canvas-engine.js` | 978 | 🟡 High — split recommended |
| `js/state-management.js` | 617 | 🟡 Medium — split when convenient |
| `js/template-gallery.js` | 468 | 🟢 Acceptable — low priority |
| `js/main.js` | 269 | ✅ OK — entry point wiring only |

---

## 🗺️ Proposed Module Map

```
js/
├── main.js                     (entry point — unchanged structure)
│
├── state/                      [Step 4 — pending]
│   ├── resource-types.js       (RES_TYPES, icons, pricing slugs)
│   ├── state-core.js           (state object, save/load, reset, undo/redo)
│   ├── state-cost.js           (calculateDynamicCost, updateCost)
│   └── state-cidr.js           (parseCidr, cidrToString, autoSubnet, nextAvailable*)
│
├── canvas/                     [Step 3 — pending]
│   ├── canvas-layout.js        (getRenderNodes, getSubBounds, getRgBounds, getMgBounds)
│   ├── canvas-render.js        (draw, drawSubnet, drawNode, resize, safeRR)
│   ├── canvas-interaction.js   (mouse events, drag/drop, inline rename, pan/zoom)
│   └── canvas-minimap.js       (drawMinimap, toggleMinimap, minimap click/drag)
│
├── ui/                         [Step 2 — pending]
│   ├── ui-security.js          (analyzeSecurityPosture, renderSecurityPanel, toggle*)
│   ├── ui-sidebar.js           (renderSidebar, renderRgBlocksHtml, management groups)
│   ├── ui-editor.js            (renderEditor, full properties editor logic)
│   ├── ui-topology.js          (addSub/deleteSub, addRg/deleteRg, VNet/subnet/resource CRUD, DNS, tags)
│   └── ui-mobile.js            (toggleMobileMenu, showMobilePanel, setActiveTab)
│
├── exports/                    ✅ DONE — Step 1 complete
│   ├── export-utils.js         (closeModal, copyText, downloadText, toggleExportPanel, _uid, _iacSafe)
│   ├── export-png.js           (exportPng)
│   ├── export-powershell.js    (generatePowerShellResource, generatePowerShell, openPsModal)
│   ├── export-bicep.js         (generateBicepResource, generateBicep, openBicepModal)
│   ├── export-json.js          (exportJson, openJsonImportModal, handleJsonFile, confirmJsonImport, merge logic)
│   └── export-inventory.js     (openAzureInventoryModal, handleInventoryFile, previewInventory, confirmInventoryImport, all _extract* helpers)
│
└── templates/                  [Step 5 — low priority, pending]
    ├── template-data.js        (TEMPLATES array, all generate*Template() functions)
    └── template-gallery.js     (openTemplateGallery, closeTemplateGallery, applyTemplate, renderTemplateThumbnail)
```

> **Convention:** All new subdirectories keep relative imports (e.g., `import { state } from '../state/state-core.js'`). The `main.js` entry point updates its imports to the new paths. No build tool is required — ES modules work natively.

---

## ✅ Step 1 — Split `export-logic.js` — DONE

`js/export-logic.js` (1 930 lines) has been split into 6 focused modules under `js/exports/`. The original file is now a 7-line barrel that re-exports everything for backward compatibility. `js/main.js` imports directly from the new modules.

| New file | Content |
|----------|---------|
| `js/exports/export-utils.js` | `_iacSafe`, `closeModal`, `copyText`, `downloadText`, `toggleExportPanel`, `_uid`, modal backdrop listener |
| `js/exports/export-png.js` | `exportPng` |
| `js/exports/export-powershell.js` | `generatePowerShellResource`, `generatePowerShell`, `openPsModal` |
| `js/exports/export-bicep.js` | `generateBicepResource`, `generateBicep`, `openBicepModal` |
| `js/exports/export-json.js` | `exportJson`, `openJsonImportModal`, `handleJsonFile`, `confirmJsonImport`, `previewPastedJson` + internals |
| `js/exports/export-inventory.js` | All Azure Inventory import functions + helpers |

---

## 🔴 Step 2 — Split `ui-components.js` (1 289 lines)

### Internal sections
| Lines | Content |
|-------|---------|
| 1–210 | Security posture analysis + panel rendering |
| 211–245 | Theme, fit-to-screen, on-prem toggle, management group CRUD |
| 246–460 | `renderSidebar` + `renderRgBlocksHtml` |
| 461–829 | `renderEditor` (properties panel — massive single function) |
| 830–1 161 | Subscription/RG/VNet/Subnet/Resource/DNS CRUD operations |
| 1 162–1 243 | DNS zone dropdown helpers |
| 1 244–1 289 | Mobile menu |

### Target files
- `js/ui/ui-security.js` — security analysis + panel
- `js/ui/ui-sidebar.js` — sidebar rendering + management group operations + theme/fit helpers
- `js/ui/ui-editor.js` — properties editor
- `js/ui/ui-topology.js` — all topology CRUD (subs, RGs, VNets, subnets, resources, DNS, tags)
- `js/ui/ui-mobile.js` — mobile menu

### 🤖 AI Prompt — Step 2a: Create `ui-security.js`

```
You are refactoring js/ui-components.js of the Azure Architecture Builder.

Task: Extract security posture logic into js/ui/ui-security.js.

Functions to move (approx. lines 1–210):
  - analyzeSecurityPosture()   [internal — returns findings array]
  - renderSecurityPanel()      [exported]
  - toggleSecurityPanel()      [exported]
  - toggleCostPanel()          [exported]

Imports needed:
  import { state, RES_TYPES } from '../state/state-core.js';

1. Create js/ui/ui-security.js with these functions.
2. Export renderSecurityPanel, toggleSecurityPanel, toggleCostPanel.
3. Remove these from ui-components.js and import them.
4. Re-export the three public functions from ui-components.js.
5. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 2b: Create `ui-sidebar.js`

```
You are refactoring js/ui-components.js of the Azure Architecture Builder.

Task: Extract sidebar rendering and management group operations into js/ui/ui-sidebar.js.

Functions to move (approx. lines 211–460):
  - toggleTheme()
  - fitToScreen()
  - toggleOnPrem() / updateOnPremName() / updateOnPremCidr()
  - toggleMgEnabled() / addMg() / deleteMg() / renameMg() / assignSubToMg() / assignMgParent() / addSubToMg()
  - renderRgBlocksHtml(rgs)    [internal helper]
  - renderSidebar()

Imports needed:
  import { state, saveState } from '../state/state-core.js';
  import { fullUpdate } from '../state/state-core.js';

Also imports `uid` which is a local helper — check whether it needs to come from export-utils.js `_uid` or is defined locally in ui-components.js.

1. Create js/ui/ui-sidebar.js.
2. Export all the public functions listed above.
3. Remove from ui-components.js, add import, re-export.
4. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 2c: Create `ui-editor.js`

```
You are refactoring js/ui-components.js of the Azure Architecture Builder.

Task: Extract the Properties Editor into js/ui/ui-editor.js.

Functions to move (approx. lines 461–829):
  - renderEditor()   [single large exported function — do NOT break its internal logic]

Imports needed:
  import { state, RES_TYPES } from '../state/state-core.js';
  import { saveState, getAllDiagramResources } from '../state/state-core.js';

1. Create js/ui/ui-editor.js.
2. Export renderEditor.
3. Remove from ui-components.js, add import, re-export.
4. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 2d: Create `ui-topology.js`

```
You are refactoring js/ui-components.js of the Azure Architecture Builder.

Task: Extract topology CRUD operations into js/ui/ui-topology.js.

Functions to move (approx. lines 830–1 289):
  addSub, deleteSub, renameSub,
  addRg, deleteRg, renameRg, setRgLocation,
  updateSubProp, updateRgProp,
  addTag, updateTag, renameTag, deleteTag,
  addSpoke, addVnetToRg, deleteSpoke,
  updateVnet, updateVnetProp, updateSubnetProp,
  togglePeering, updatePeeringConfig, selectPeering,
  addSubnet, deleteSubnet, updateSubnet,
  toggleDropdown, filterResources, addResource, deleteResource, updateResource, updateResConfig,
  addRgResource, deleteRgResource, updateRgResource,
  addDnsRecord, deleteDnsRecord, updateDnsRecord,
  addVnetLink, deleteVnetLink, toggleVnetLink, selectVnetLink, updateVnetLinkConfig,
  showDnsZoneDropdown, filterDnsZones, selectDnsZone, addAnotherDnsZone,
  toggleMobileMenu, showMobilePanel   [or move these to ui-mobile.js]

Imports needed:
  import { state, saveState, RES_TYPES } from '../state/state-core.js';
  import { fullUpdate } from '../state/state-core.js';
  import { autoSubnet, nextAvailableVnetCidr, nextAvailableSubnetCidr } from '../state/state-cidr.js';

1. Create js/ui/ui-topology.js.
2. Export all public functions.
3. Remove from ui-components.js, add import, re-export all.
4. Move toggleMobileMenu and showMobilePanel to js/ui/ui-mobile.js if desired.
5. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 2e: Update `main.js` imports after ui split

```
You are updating the entry point of the Azure Architecture Builder after splitting ui-components.js into multiple files.

The following new files now exist:
  js/ui/ui-security.js
  js/ui/ui-sidebar.js
  js/ui/ui-editor.js
  js/ui/ui-topology.js
  js/ui/ui-mobile.js (if created)

Task:
1. Open js/main.js.
2. Replace the single long import from './ui-components.js' with separate imports from each new file.
   Keep the same imported names; only change the module path.
3. If ui-components.js is now a barrel file (re-exports only), it can remain for backward compat or be removed.
4. Verify syntax of main.js with `node -c js/main.js`.
5. Open the app in a browser and confirm all panels render correctly.
```

---

## 🟡 Step 3 — Split `canvas-engine.js` (978 lines)

### Internal sections
| Lines | Content |
|-------|---------|
| 1–24 | Utility helpers (`safeRR`, `pointToSegmentDist`) |
| 25–41 | `resize` |
| 42–337 | `getRenderNodes` (layout engine — positions all nodes) |
| 338–591 | `draw`, `drawSubnet`, `drawNode` (rendering) |
| 592–847 | Canvas interactions (mousedown, dblclick, mousemove, mouseup, wheel, inline rename) |
| 848–978 | Minimap |

### Target files
- `js/canvas/canvas-layout.js` — `getRenderNodes`, `getSubBounds`, `getRgBounds`, `getMgBounds`, `resize`
- `js/canvas/canvas-render.js` — `draw`, `drawSubnet`, `drawNode`, `safeRR`, `pointToSegmentDist`
- `js/canvas/canvas-interaction.js` — all mouse/touch event listeners, inline rename
- `js/canvas/canvas-minimap.js` — minimap drawing + interactions

### 🤖 AI Prompt — Step 3a: Create `canvas-layout.js`

```
You are refactoring js/canvas-engine.js of the Azure Architecture Builder.

Task: Extract the layout/positioning engine into js/canvas/canvas-layout.js.

Functions to move (approx. lines 25–337):
  - resize()
  - getRenderNodes()      [exported — the main layout engine]
  - getSubBounds(subId, nodes)      [internal]
  - getRgBounds(rgId, nodes)        [internal]
  - getMgBounds(mgId, nodes)        [internal]

Also keep here: the `canvas` element reference (obtained from document.getElementById).

Imports needed:
  import { state, RES_TYPES, SUB_COLORS, RG_COLORS, VNET_COLORS } from '../state/state-core.js';

1. Create js/canvas/canvas-layout.js.
2. Export resize and getRenderNodes.
3. The canvas variable is obtained as: const canvas = document.getElementById('diagram-canvas');
   Ensure canvas-render.js and canvas-interaction.js also get this reference independently
   (or export it from a shared canvas-context.js mini-module).
4. Remove from canvas-engine.js, add import, re-export.
5. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 3b: Create `canvas-render.js`

```
You are refactoring js/canvas-engine.js of the Azure Architecture Builder.

Task: Extract the rendering functions into js/canvas/canvas-render.js.

Functions to move (approx. lines 338–591):
  - safeRR(c, x, y, w, h, r)   [internal utility]
  - pointToSegmentDist(...)     [internal utility — also needed by interaction layer]
  - draw()                      [exported main render function]
  - drawSubnet(n, dw)           [internal]
  - drawNode(n, dw)             [internal]

Imports needed:
  import { state, RES_TYPES, loadedImages } from '../state/state-core.js';
  import { getRenderNodes } from './canvas-layout.js';
  import { drawMinimap } from './canvas-minimap.js';

Export: draw, pointToSegmentDist (needed by interaction layer).
Export safeRR only if needed elsewhere.

1. Create js/canvas/canvas-render.js.
2. Remove from canvas-engine.js, add import, re-export draw.
3. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 3c: Create `canvas-interaction.js`

```
You are refactoring js/canvas-engine.js of the Azure Architecture Builder.

Task: Extract all canvas event listeners and inline rename logic into js/canvas/canvas-interaction.js.

Code to move (approx. lines 592–847):
  - export function selectNode(id)
  - canvas.addEventListener('mousedown', ...)
  - canvas.addEventListener('dblclick', ...)
  - canvas.addEventListener('mousemove', ...)
  - canvas.addEventListener('mouseup', ...)
  - canvas.addEventListener('mouseleave', ...)
  - canvas.addEventListener('wheel', ...)
  - function startInlineRename(node, cx, cy)
  - rename input event listeners

Imports needed:
  import { state, saveState } from '../state/state-core.js';
  import { fullUpdate } from '../state/state-core.js';
  import { getRenderNodes, getSubBounds, getRgBounds, getMgBounds } from './canvas-layout.js';
  import { draw, pointToSegmentDist } from './canvas-render.js';

Important: the canvas variable must be obtained from document.getElementById('diagram-canvas')
at module load time — same as in canvas-layout.js. 

1. Create js/canvas/canvas-interaction.js.
2. Export selectNode.
3. The event listeners register themselves at module load (side effects) — this is expected.
4. Remove from canvas-engine.js, add import, re-export selectNode.
5. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 3d: Create `canvas-minimap.js`

```
You are refactoring js/canvas-engine.js of the Azure Architecture Builder.

Task: Extract minimap logic into js/canvas/canvas-minimap.js.

Code to move (approx. lines 848–978):
  - constants: MM_W, MM_H, MM_PAD, _minimapVisible
  - _getMinimapTransform(nodes)
  - _worldToMM(wx, wy, t)
  - export function drawMinimap()
  - export function toggleMinimap()
  - IIFE: setupMinimapInteraction()

Imports needed:
  import { state } from '../state/state-core.js';
  import { getRenderNodes } from './canvas-layout.js';

Note: drawMinimap is called inside draw() in canvas-render.js.
Ensure the import cycle is: canvas-render → canvas-minimap → canvas-layout (no cycles).

1. Create js/canvas/canvas-minimap.js.
2. Export drawMinimap and toggleMinimap.
3. Remove from canvas-engine.js, add import, re-export.
4. Update canvas-engine.js to just re-export everything for backward compat, or update main.js imports directly.
5. Verify syntax with `node -c`.
```

---

## 🟡 Step 4 — Split `state-management.js` (617 lines)

### Internal sections
| Lines | Content |
|-------|---------|
| 1–76 | Resource types (`RES_TYPES`, `RES_CATEGORIES`, pricing constants, `AZURE_ICON_BASE`) |
| 77–137 | Icon loader (`loadedImages`, `loadAzureIcons`) |
| 138–238 | State object + undo/redo stack |
| 240–393 | `saveState`, `getAllDiagramResources`, `updateCost`, `calculateDynamicCost`, `resetDiagram`, `resetPositions` |
| 394–487 | CIDR utilities (`parseCidr`, `cidrToString`, `isValidCidr`, `cidrsOverlap`, `autoSubnet`, `nextAvailable*`) |
| 488–617 | RG resource helpers, DNS zone utilities, `getRecommendedDnsZones` |

### Target files
- `js/state/resource-types.js` — RES_TYPES, RES_CATEGORIES, pricing URLs/slugs, icon loading
- `js/state/state-core.js` — state object definition, save/load, undo/redo, reset, fullUpdate/setFullUpdate wiring
- `js/state/state-cost.js` — `calculateDynamicCost`, `updateCost`, `getPricingCalculatorUrl`
- `js/state/state-cidr.js` — all CIDR utilities
- `js/state/state-helpers.js` — `getAllDiagramResources`, `getAllDiagramResourcesIncludingRg`, `getRgResources`, `getVnetsInRg`, `getRecommendedDnsZones`

### 🤖 AI Prompt — Step 4a: Create `resource-types.js`

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract resource type definitions into js/state/resource-types.js.

Constants/functions to move (approx. lines 1–92):
  - AZURE_ICON_BASE
  - RES_CATEGORIES
  - RES_TYPES
  - AZURE_PRICING_CALCULATOR_BASE_URL
  - PRICING_CALCULATOR_PARAM_NAME
  - PRICING_CALCULATOR_SLUGS
  - loadedImages (object)
  - loadAzureIcons(callback)

No imports needed (pure data + DOM Image constructor).

1. Create js/state/resource-types.js.
2. Export all constants and functions.
3. Remove from state-management.js, add import.
4. Re-export from state-management.js for backward compat.
5. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 4b: Create `state-cidr.js`

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract CIDR utilities into js/state/state-cidr.js.

Functions to move (approx. lines 394–487):
  - parseCidr(cidr)
  - cidrToString(network, prefix)
  - isValidCidr(cidr)
  - cidrsOverlap(cidr1, cidr2)
  - getAllVnetCidrs()
  - checkCidrOverlap(newCidr, excludeVnetId)
  - autoSubnet(vnetCidr, numSubnets)
  - nextAvailableVnetCidr()
  - nextAvailableSubnetCidr(vnetId)
  - nextAvailableSubnetCidrFromParsed(vnetParsed, existingSubnets)

Imports needed:
  import { state } from './state-core.js';   (only for getAllVnetCidrs, checkCidrOverlap, nextAvailable*)

1. Create js/state/state-cidr.js.
2. Export all functions.
3. Remove from state-management.js, add import, re-export.
4. Verify syntax with `node -c`.
```

### 🤖 AI Prompt — Step 4c: Create `state-cost.js`

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract cost calculation into js/state/state-cost.js.

Functions to move (approx. lines 256–379):
  - getPricingCalculatorUrl(resourceTypes)
  - calculateDynamicCost(res)
  - updateCost()

Imports needed:
  import { state, RES_TYPES, AZURE_PRICING_CALCULATOR_BASE_URL, PRICING_CALCULATOR_PARAM_NAME, PRICING_CALCULATOR_SLUGS } from './state-core.js';
  (or from resource-types.js if that has already been split)

1. Create js/state/state-cost.js.
2. Export getPricingCalculatorUrl, calculateDynamicCost, updateCost.
3. Remove from state-management.js, add import, re-export.
4. Verify syntax with `node -c`.
```

---

## 🟢 Step 5 — Split `template-gallery.js` (468 lines) [Low Priority]

### Internal sections
| Lines | Content |
|-------|---------|
| 1–54 | TEMPLATES array (metadata) |
| 55–338 | Template generators (`generateHubSpokeTemplate`, etc.) |
| 340–463 | Gallery UI (`applyTemplate`, `renderTemplateThumbnail`, `openTemplateGallery`, `closeTemplateGallery`) |

### Target files
- `js/templates/template-data.js` — TEMPLATES array + all generate*Template() functions
- `js/templates/template-gallery.js` — UI rendering + modal interaction

### 🤖 AI Prompt — Step 5: Split template-gallery.js

```
You are refactoring js/template-gallery.js of the Azure Architecture Builder.

Task: Separate template data from gallery UI.

1. Create js/templates/template-data.js:
   - Move the TEMPLATES array (approx. lines 1–54).
   - Move all generateHubSpokeTemplate(), generateMultiRegionDRTemplate(), 
     generateWebAppDatabaseTemplate(), generateAKSNetworkingTemplate(), generateLandingZoneCAFTemplate() functions.
   - Export TEMPLATES and all five generator functions.
   - Imports: import { state } from '../state/state-core.js'; (only if generators reference state)

2. Keep in js/templates/template-gallery.js (or js/template-gallery.js):
   - applyTemplate(templateId)
   - renderTemplateThumbnail(template)
   - openTemplateGallery()
   - closeTemplateGallery()
   - Imports from template-data.js: import { TEMPLATES, generate*Template } from './template-data.js';

3. Update main.js import path if the file is renamed/moved.
4. Verify syntax with `node -c`.
```

---

## 📋 Implementation Order

Follow this order to minimize breakage at each step. After each step, open the app in a browser and verify it works before moving to the next.

1. ~~**Step 1a** — `export-utils.js`~~ ✅
2. ~~**Step 1b** — `export-png.js`~~ ✅
3. ~~**Step 1c** — `export-powershell.js`~~ ✅
4. ~~**Step 1d** — `export-bicep.js`~~ ✅
5. ~~**Step 1e** — `export-json.js`~~ ✅
6. ~~**Step 1f** — `export-inventory.js` + collapse `export-logic.js`~~ ✅
7. **Step 2a** — `ui-security.js`
8. **Step 2b** — `ui-sidebar.js`
9. **Step 2c** — `ui-editor.js`
10. **Step 2d** — `ui-topology.js`
11. **Step 2e** — Update `main.js` imports for UI
12. **Step 3a** — `canvas-layout.js`
13. **Step 3b** — `canvas-render.js`
14. **Step 3c** — `canvas-interaction.js`
15. **Step 3d** — `canvas-minimap.js`
16. **Step 4a** — `resource-types.js`
17. **Step 4b** — `state-cidr.js`
18. **Step 4c** — `state-cost.js`
19. **Step 5** — `template-data.js` (optional, low priority)
20. Final — Clean up barrel files / unused imports; run `node -c` on everything

---

## ⚠️ General Rules for Each Step

1. **One file at a time.** Never move code from two sections in the same prompt/commit.
2. **Always verify with `node -c <file>`** after creating or modifying any JS file.
3. **Keep backward-compat re-exports** in the old file until `main.js` is updated and the app is verified.
4. **Never break the `window._*` globals** — these are set in `main.js` and must still reference the same functions.
5. **Watch for circular imports:** `state-core` → no imports from other project files; everything else imports from `state-core`.
6. **Shared `canvas` reference:** The `canvas` DOM element is obtained at module load time — each canvas sub-module should fetch it independently via `document.getElementById('diagram-canvas')` to avoid a circular dependency on a shared canvas module.
7. **`uid` / `_uid` helper:** This small function is used in both `ui-components.js` and `export-logic.js`. Move it to `export-utils.js` (or a new `utils.js`) and import from there.
