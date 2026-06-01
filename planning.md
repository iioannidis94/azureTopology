# 🎯 Detailed Planning & Implementation Guide

**Azure Architecture Builder — Actionable Roadmap with AI Prompts and Cost Optimization**

---

## 📌 Overview

This document consolidates `nextsteps.md` and `distributions.md` into a **unified, executable plan**. Each task includes:

- **Description** — what needs to be done
- **Complexity** — estimated effort level
- **Recommended AI Model** — optimized for cost vs. quality
- **Suggested Prompt** — copy-paste ready
- **Estimated Tokens** — rough token budget per task

---

## 🎓 AI Model Selection Guide

### Model Recommendations by Complexity

| Model | Best For | Cost | Speed | Context |
|-------|----------|------|-------|---------|
| **Claude Haiku** | Simple tasks, syntax fixes, documentation tweaks | 💰 Lowest | ⚡ Fastest | 100K |
| **Claude Sonnet** | Medium complexity, modular refactoring, feature implementation | 💰💰 Medium | ⚡⚡ Fast | 200K |
| **Claude Opus** | Complex architecture, large refactors, multi-file dependencies | 💰💰💰 Highest | ⚡ Slower | 200K |

---

## ✅ Completed Phases

### Phase 1-3: Modularization (100% Complete)

- ✅ **export-logic.js** split into 6 modules (`exports/` directory)
- ✅ **ui-components.js** split into 5 modules (`ui/` directory)
- ✅ **canvas-engine.js** split into 4 modules (`canvas/` directory)

**Status:** App is fully functional with modular architecture.

---

## 🔴 Phase 4 — Critical Tasks (High Priority)

### Task 1: Complete State-Management.js Split

**Status:** 🟡 Pending  
**Complexity:** Medium  
**Recommended Model:** Claude Sonnet  
**Estimated Tokens:** 3,000–4,000 per sub-task × 4 = 12,000–16,000 total

#### Background

`state-management.js` (617 lines) contains four distinct layers:
1. Resource type definitions & icons
2. Core state object & undo/redo
3. Cost calculation functions
4. CIDR utilities (networking)

Each layer should be extracted into a separate file under `js/state/`.

---

### Task 1a: Extract resource-types.js

**Description:** Move all resource type definitions, categories, pricing data, and icon loading into a standalone module.

**Complexity:** Low  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Suggested Prompt:**

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract resource type definitions into js/state/resource-types.js.

Constants/functions to move (approx. lines 1–92 in current file):
  - AZURE_ICON_BASE
  - RES_CATEGORIES
  - RES_TYPES (large object with all resource definitions)
  - AZURE_PRICING_CALCULATOR_BASE_URL
  - PRICING_CALCULATOR_PARAM_NAME
  - PRICING_CALCULATOR_SLUGS
  - loadedImages (object)
  - loadAzureIcons(callback)

Instructions:
1. Create js/state/resource-types.js.
2. Move all the above constants and the loadAzureIcons function.
3. Export all constants and the loadAzureIcons function.
4. No imports needed — pure data + DOM Image constructor.
5. After moving, update js/state-management.js to import and re-export these items for backward compatibility.
6. Verify the new file with `node -c js/state/resource-types.js`.
```

---

### Task 1b: Extract state-cidr.js

**Description:** Move all CIDR/networking utility functions into a dedicated module.

**Complexity:** Low  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Suggested Prompt:**

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract CIDR utilities into js/state/state-cidr.js.

Functions to move (approx. lines 394–487 in current file):
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

Instructions:
1. Create js/state/state-cidr.js.
2. Move all functions listed above.
3. Export all functions.
4. For functions that reference state (getAllVnetCidrs, checkCidrOverlap, nextAvailable*), 
   import state: import { state } from './state-core.js';
5. After moving, update js/state-management.js to import and re-export for backward compatibility.
6. Verify with `node -c js/state/state-cidr.js`.
```

---

### Task 1c: Extract state-cost.js

**Description:** Move cost calculation and pricing functions into a dedicated module.

**Complexity:** Low  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Suggested Prompt:**

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract cost calculation into js/state/state-cost.js.

Functions to move (approx. lines 256–379 in current file):
  - getPricingCalculatorUrl(resourceTypes)
  - calculateDynamicCost(res)
  - updateCost()

Instructions:
1. Create js/state/state-cost.js.
2. Move the three functions above.
3. Export all three functions.
4. Import needed items from state-core.js: import { state } from './state-core.js';
5. If PRICING_CALCULATOR_* constants are still in state-management.js, import them:
   import { PRICING_CALCULATOR_PARAM_NAME, PRICING_CALCULATOR_SLUGS } from './resource-types.js';
6. After moving, update js/state-management.js to import and re-export for backward compatibility.
7. Verify with `node -c js/state/state-cost.js`.
```

---

### Task 1d: Extract state-helpers.js

**Description:** Move all helper functions for querying state into a dedicated module.

**Complexity:** Low  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Suggested Prompt:**

```
You are refactoring js/state-management.js of the Azure Architecture Builder.

Task: Extract state helper functions into js/state/state-helpers.js.

Functions to move (approx. lines 488–617 in current file):
  - getAllDiagramResources()
  - getAllDiagramResourcesIncludingRg()
  - getRgResources(rgId)
  - getVnetsInRg(rgId)
  - getRecommendedDnsZones()
  - Any other utility functions for querying state

Instructions:
1. Create js/state/state-helpers.js.
2. Move all helper functions listed above.
3. Export all functions.
4. Import state: import { state } from './state-core.js';
5. After moving, update js/state-management.js to import and re-export for backward compatibility.
6. Verify with `node -c js/state/state-helpers.js`.
```

---

### Task 2: Mobile Experience Improvements

**Status:** 🟡 Pending  
**Complexity:** Medium–High  
**Recommended Model:** Claude Sonnet  
**Estimated Tokens:** 3,500–4,500

**What Needs to Be Done:**

- [ ] Add touch event support (pinch-to-zoom, single-finger pan)
- [ ] Implement long-press + drag for element movement on touch
- [ ] Fix dropdowns on mobile (close on tap outside)
- [ ] Ensure touch targets meet 44×44px minimum
- [ ] Add smooth panel transitions

**Suggested Prompt:**

```
You are enhancing the Azure Architecture Builder for mobile devices.

Current Situation:
- The app already has responsive layout and mobile panel navigation.
- Canvas interactions use mouse events (mousedown, mousemove, mouseup, wheel).
- Dropdowns sometimes stay open on mobile.

Task: Add comprehensive touch support to the canvas and UI.

Requirements:
1. Touch Events:
   - Add touchstart, touchmove, touchend listeners to the canvas.
   - Detect pinch-to-zoom (two-finger touch) and convert to wheel zoom.
   - Single-finger pan for canvas navigation.
   - Long-press (500ms) + drag to move elements.

2. UI Improvements:
   - Add click-outside listeners to close dropdowns on mobile.
   - Ensure all touch targets (buttons, UI elements) are at least 44×44px.
   - Add smooth transitions to mobile panel slides.

3. Code Organization:
   - Add touch event logic to js/canvas/canvas-interaction.js.
   - Add UI touch handlers to js/ui/ui-mobile.js.
   - Keep existing mouse events functional for desktop users.

4. Testing:
   - Open the app on a mobile device or browser DevTools (Device Toolbar).
   - Test pinch-to-zoom, pan, dragging elements.
   - Test dropdown closing behavior.

Provide the modified or new code sections needed to implement these features.
```

---

### Task 3: Terraform Export

**Status:** 🟡 Pending  
**Complexity:** Medium–High  
**Recommended Model:** Claude Sonnet  
**Estimated Tokens:** 3,500–4,500

**What Needs to Be Done:**

- [ ] Generate Terraform HCL code from the diagram
- [ ] Support Resource Group, VNet, Subnet, Peering, and Gateway resources
- [ ] Create a modal preview (like PowerShell/Bicep export)
- [ ] Enable download of `.tf` file

**Suggested Prompt:**

```
You are adding Terraform export functionality to the Azure Architecture Builder.

Current Situation:
- The app already exports PowerShell scripts and Bicep templates.
- Export modals are implemented in js/exports/export-powershell.js and export-bicep.js.
- The modal structure includes: modal backdrop, code preview, copy button, download button.

Task: Create js/exports/export-terraform.js to generate Terraform HCL code.

Requirements:
1. Export Terraform resources:
   - azurerm_resource_group
   - azurerm_virtual_network
   - azurerm_subnet
   - azurerm_virtual_network_peering
   - azurerm_vpn_gateway, azurerm_express_route_gateway (if present)
   - Other compute/network/data resources already supported by the app.

2. Code Generation:
   - Generate provider block (required_providers.terraform_required_version, azurerm provider block).
   - Generate variables.tf (variable definitions for subscriptions, regions, resource names).
   - Generate main.tf (resource definitions with dependencies via depends_on where needed).
   - Use consistent naming conventions (terraform_name = replace special chars with underscores).

3. UI Integration:
   - Add "Export Terraform" button in the export panel (js/ui/ui-editor.js or a new export menu).
   - Create openTerraformModal() function similar to openBicepModal().
   - Show preview, copy, and download options.

4. Helper Functions Needed:
   - generateTerraformResource(resource) — convert a single resource to azurerm_* block.
   - generateTerraform() — orchestrate the full export.
   - openTerraformModal() — display the modal.

Provide the full implementation of export-terraform.js.
```

---

## 🟡 Phase 5 — Important Tasks (Medium Priority)

### Task 4: Complete Template-Gallery.js Split

**Status:** 🟡 Pending  
**Complexity:** Low  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Description:** Separate template data from gallery UI logic for better maintainability.

**Suggested Prompt:**

```
You are refactoring js/template-gallery.js of the Azure Architecture Builder.

Task: Separate template data from gallery UI.

Current State:
- js/template-gallery.js contains 468 lines combining template metadata, generator functions, and UI logic.

Target Structure:
1. Create js/templates/template-data.js:
   - Move TEMPLATES array (metadata: id, name, description, thumbnail).
   - Move all generator functions (generateHubSpokeTemplate, generateMultiRegionDRTemplate, etc.).
   - Export TEMPLATES and all five generator functions.

2. Keep/refactor js/template-gallery.js:
   - Import templates and generators from template-data.js.
   - Keep UI functions: openTemplateGallery, closeTemplateGallery, renderTemplateThumbnail, applyTemplate.
   - Ensure it works with the new module structure.

Instructions:
1. Create js/templates/template-data.js with all template definitions and generators.
2. Update js/template-gallery.js to import from template-data.js.
3. Update main.js imports if needed.
4. Verify with `node -c js/templates/template-data.js` and `node -c js/template-gallery.js`.
```

---

### Task 5: ARM Template Import

**Status:** 🟡 Pending  
**Complexity:** Medium–High  
**Recommended Model:** Claude Sonnet  
**Estimated Tokens:** 3,500–4,500

**Description:** Parse ARM templates and reverse-engineer them into the visual diagram.

**What Needs to Be Done:**

- [ ] Parse ARM template JSON structure (resources[], type, properties, dependsOn)
- [ ] Map azurerm_* types to internal resource types
- [ ] Auto-reconstruct hierarchy (subscriptions → resource groups → VNets → subnets → resources)
- [ ] Display preview before import (like Azure Inventory import)
- [ ] Support merge mode (add to existing diagram instead of replacing)

**Suggested Prompt:**

```
You are adding ARM template import functionality to the Azure Architecture Builder.

Task: Create arm template import in a new file js/exports/export-arm-import.js.

Current Reference:
- See js/exports/export-inventory.js for the pattern: file picker, preview, merge mode.
- Use the same preview/confirmation flow.

Requirements:
1. Parse ARM Template:
   - Read template.json (resources array).
   - Extract type (e.g., "Microsoft.Compute/virtualMachines").
   - Map type to internal RES_TYPES (e.g., "Microsoft.Compute/virtualMachines" → "VirtualMachine").

2. Hierarchy Reconstruction:
   - Subscription: extract from template metadata or prompt user for subscription ID.
   - Resource Groups: extract from resources[].properties.resourceGroup or resource ID.
   - VNets/Subnets: detect network resources and extract CIDR blocks.
   - Resources: place in the correct subnet or RG based on dependencies.

3. Functions to Implement:
   - parseArmTemplate(armJson) — parse and validate ARM template structure.
   - mapArmTypeToInternal(armType) — convert ARM type to internal type.
   - reconstructArmHierarchy(resources) — build subscription/RG/VNet/subnet hierarchy.
   - previewArmImport(armData) — generate preview HTML.
   - confirmArmImport() — execute import with merge option.

4. UI Integration:
   - Add "Import ARM Template" button in the import panel.
   - Use file picker (like JSON/Inventory import).
   - Show preview with counts: "X resource groups, Y VNets, Z resources found".
   - Provide "Merge into existing diagram" option.

Provide the full implementation of export-arm-import.js.
```

---

### Task 6: Terraform State Import

**Status:** 🟡 Pending  
**Complexity:** Medium  
**Recommended Model:** Claude Sonnet  
**Estimated Tokens:** 3,000–3,500

**Description:** Import Terraform state files and reverse-engineer them into diagrams.

**What Needs to Be Done:**

- [ ] Parse `terraform show -json` output
- [ ] Map azurerm_* resources to internal types
- [ ] Reconstruct hierarchy from state
- [ ] Display preview with merge option

**Suggested Prompt:**

```
You are adding Terraform state import functionality to the Azure Architecture Builder.

Task: Create terraform state import in js/exports/export-terraform-import.js.

Current Reference:
- See export-inventory.js for the import pattern and preview workflow.
- See export-terraform.js for the mapping of azurerm_* types.

Requirements:
1. Parse Terraform State:
   - Accept JSON from `terraform show -json` output.
   - Extract resources array from state.values.root_module.resources.
   - For each resource, extract type (e.g., "azurerm_resource_group") and properties.

2. Hierarchy Reconstruction:
   - Subscription: extract from resource attributes (subscription_id).
   - Resource Groups: map azurerm_resource_group resources.
   - VNets/Subnets: map azurerm_virtual_network and azurerm_subnet.
   - Resources: place in correct location based on resource_group_name and other attributes.

3. Functions to Implement:
   - parseTerraformState(stateJson) — parse and validate.
   - mapTerraformTypeToInternal(tfType) — convert azurerm_* to internal type.
   - reconstructTerraformHierarchy(resources) — build hierarchy.
   - previewTerraformImport(tfData) — generate preview.
   - confirmTerraformImport() — execute with merge.

4. UI Integration:
   - Add "Import Terraform State" button in the import panel.
   - Accept file upload or JSON paste.
   - Show preview: "X resource groups, Y resources found".
   - Provide merge option.

Provide the full implementation.
```

---

## 🟢 Phase 6 — Nice-to-Have Features (Lower Priority)

### Task 7: Shareable URLs with LZ-String Compression

**Status:** 🟡 Pending  
**Complexity:** Medium  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,500–3,000

**Description:** Encode diagram state into a compressed URL for easy sharing.

**Note:** This is the **only allowed runtime dependency** — use `lz-string` library.

**Suggested Prompt:**

```
You are adding shareable URL functionality to the Azure Architecture Builder.

Task: Implement URL-based state sharing using lz-string.

Requirements:
1. Install Dependency:
   - Add lz-string: npm install lz-string
   - Import in main.js: import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

2. On Share Click:
   - Compress JSON state with lz-string.compressToEncodedURIComponent(JSON.stringify(state)).
   - Build URL: window.location.origin + "?state=" + compressedState.
   - Copy to clipboard.

3. On Page Load:
   - Check URL for ?state= parameter.
   - Decompress and parse.
   - Load state if valid; otherwise load from localStorage.

4. UI Integration:
   - Add "Share" button in the sidebar/export panel.
   - Show copied confirmation message.

Provide the implementation for state encoding/decoding and button logic.
```

---

### Task 8: Progressive Web App (PWA) Support

**Status:** 🟡 Pending  
**Complexity:** Low  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Description:** Enable offline usage and installability.

**Suggested Prompt:**

```
You are adding PWA support to the Azure Architecture Builder.

Task: Create service worker and manifest for offline caching.

Requirements:
1. Create manifest.json:
   - name, short_name, description
   - icons (app icon in multiple sizes)
   - theme_color, background_color
   - start_url: /
   - display: standalone or minimal-ui

2. Create service-worker.js:
   - Cache strategy: cache app shell (JS, CSS, HTML).
   - Cache Azure SVG icons from CDN on first load.
   - Serve from cache on offline.

3. Register in index.html:
   - Add manifest link: <link rel="manifest" href="manifest.json">
   - Register SW: navigator.serviceWorker.register('service-worker.js')

4. Testing:
   - Open DevTools → Application → Manifest; verify manifest is registered.
   - Go offline (DevTools → Network → offline).
   - Reload page; verify it works offline.
   - Desktop/mobile should show "Install app" prompt.

Provide manifest.json and service-worker.js implementations.
```

---

### Task 9: In-Canvas Search / Find Feature

**Status:** 🟡 Pending  
**Complexity:** Low–Medium  
**Recommended Model:** Claude Haiku  
**Estimated Tokens:** 2,000–2,500

**Description:** Add `Ctrl+F` to search for resources by name in the canvas.

**Suggested Prompt:**

```
You are adding a search/find feature to the Azure Architecture Builder canvas.

Task: Implement Ctrl+F search that highlights and navigates to matching resources.

Requirements:
1. UI:
   - Ctrl+F opens a search input overlay (fixed position at top of canvas).
   - User types resource/VNet/subnet name.
   - Matching nodes are highlighted (e.g., semi-transparent overlay).

2. Navigation:
   - Enter key pans/zooms to the first match.
   - Up/Down arrows cycle through matches.
   - Escape closes search.

3. Implementation:
   - Add search input HTML to index.html.
   - Add keyboard event listener in js/canvas/canvas-interaction.js.
   - Implement search logic: filter state.subscriptions/RGs/VNets/resources by name.
   - Highlight by drawing a special border/glow on matching nodes in canvas-render.js.

Provide the HTML, CSS, and JS implementations.
```

---

## 📊 Token Budget Summary

| Task | Model | Estimated Tokens | Time (est.) |
|------|-------|------------------|------------|
| 1a: resource-types.js | Haiku | 2,000–2,500 | 10 min |
| 1b: state-cidr.js | Haiku | 2,000–2,500 | 10 min |
| 1c: state-cost.js | Haiku | 2,000–2,500 | 10 min |
| 1d: state-helpers.js | Haiku | 2,000–2,500 | 10 min |
| **Phase 4 Total** | — | **8,000–10,000** | **40 min** |
| 2: Mobile Experience | Sonnet | 3,500–4,500 | 30 min |
| 3: Terraform Export | Sonnet | 3,500–4,500 | 30 min |
| 4: Template Split | Haiku | 2,000–2,500 | 10 min |
| 5: ARM Import | Sonnet | 3,500–4,500 | 30 min |
| 6: TF State Import | Sonnet | 3,000–3,500 | 25 min |
| 7: Shareable URLs | Haiku | 2,500–3,000 | 20 min |
| 8: PWA Support | Haiku | 2,000–2,500 | 15 min |
| 9: In-Canvas Search | Haiku | 2,000–2,500 | 15 min |
| **Grand Total** | — | **~36,500–44,500** | **~3.5 hours** |

---

## 🔧 Implementation Guidelines

### General Rules

1. **One task at a time.** Never combine unrelated tasks in a single prompt.
2. **Verify syntax after each task:** `node -c <file.js>`
3. **Test in browser after each significant change.**
4. **Keep backward compatibility:** maintain re-exports in barrel files.
5. **Never break `window.*` globals** set in `main.js`.
6. **Watch for circular imports:**
   - `state-core.js` must not import from other project files
   - Everything else can import from `state-core.js`

### Recommended Task Order

1. ✅ Complete Phase 4 state-management split (Tasks 1a–1d) first
2. Tackle Task 2 (Mobile) and Task 3 (Terraform) in parallel
3. Task 4 (Template split) as a quick win
4. Tasks 5–6 (Import features) in sequence
5. Tasks 7–9 as bonus features (lower priority)

---

## 📝 Verification Checklist

After each task:

- [ ] `node -c` passes on all modified/new JS files
- [ ] No console errors when opening the app
- [ ] Previous functionality remains intact
- [ ] New feature works as intended

---

## 🚀 Getting Started

1. Pick **Task 1a** (resource-types.js split) as the warm-up
2. Copy the suggested prompt from above
3. Run it through Claude Haiku (cheapest, fastest)
4. Review the output, make any tweaks, and apply the changes
5. Test in the browser
6. Move to Task 1b

For larger tasks like **Task 5** (ARM import), use **Claude Sonnet** for better reasoning about complex logic.

**Good luck! 🎯**
