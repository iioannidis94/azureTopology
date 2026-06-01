
# 🚀 Next Steps - Azure Architecture Builder

Unified roadmap of next steps, organized by priority phases.

---

## ✅ Completed

- Undo/Redo (command pattern, history stack, Ctrl+Z/Ctrl+Y, visual buttons)
- JSON Import/Export (architecture export, import with schema validation, file picker/download)
- Azure Resource Inventory Import (az resource list / az graph query, auto-detect hierarchy, preview panel, mapping resource types, graceful handling of unknown types)
- Core Azure hierarchy (Subscription → RG → VNet → Subnet → Resources)
- Hub & Spoke topology visualization
- Dual themes (Light/Dark)
- Grid & Radial layouts
- Freeform Drag & Drop + Group Drag
- Any-to-Any VNet Peering
- On-Premises / Hybrid connectivity
- 35+ Azure resource types
- Live Cost Estimator
- Auto-Save (localStorage)
- Properties Editor (live editing)
- PNG Export (2x resolution)
- PowerShell script generation
- Bicep template generation
- Security Posture Panel
- DNS Zones (Private & Public)
- Responsive layout (basic mobile)
- Official Azure SVG icons
- Inline canvas rename (double-click)
- Pan & Zoom navigation
- Full View toggle (collapse/expand both sidebars for more canvas space)
- Management Groups (hierarchy, parent assignment, sub assignment)
- RG-level resources (DNS Private/Public Zones, resources attached directly to RGs)
- Merge on JSON Import (import without losing existing diagram)
- Merge on Azure Inventory Import

---

## 🔴 Phase 1 — Critical (Must-Have / Immediate Priority)

### 1. Mobile Experience Fix
- [ ] Touch events (pinch-to-zoom, single-finger pan)
- [ ] Long-press + drag to move element
- [ ] Fix dropdowns on mobile (close on tap outside)
- [ ] Touch targets minimum 44x44px
- [ ] Smooth panel transitions

### 2. Terraform Export
- [ ] Terraform HCL code generation
- [ ] Resource Group, VNet, Subnet resources
- [ ] Peering connections + Gateways
- [ ] Modal preview (like PowerShell/Bicep)
- [ ] Download .tf file

### 3. Merge with Existing Diagram on Import
- [x] Merge capability (instead of clean import only) in Azure Resource Import
- [x] Merge option in JSON Import as well
- [x] Preview panel showing what will be imported before confirming

---

## 🟡 Phase 2 — Important (Should-Have)

### 4. Template Gallery
- [x] Template picker modal
- [x] Hub-and-Spoke basic template
- [x] Multi-region DR template
- [x] Web App + Database template
- [x] AKS networking template
- [x] Landing Zone (CAF) template
- [x] Preview thumbnails (SVG canvas rendering per template)

### 5. Keyboard Shortcuts
- [x] Delete/Backspace → delete element
- [x] Escape → deselect / close modal
- [x] Arrow keys → nudge element
- [x] +/- → zoom in/out
- [x] Ctrl+0 → fit to screen
- [x] ? → help panel with shortcuts
- [x] Ctrl+Z / Ctrl+Y → undo/redo

### 6. Minimap / Overview Panel
- [x] Minimap component in the canvas corner
- [x] Real-time preview of the entire diagram
- [x] Viewport indicator rectangle
- [x] Click-to-navigate
- [x] Toggle show/hide
- [x] Touch/drag support on minimap

### 7. ARM Template Import
- [ ] Parse ARM template JSON (resources[], type, properties, dependsOn)
- [ ] Automatic node creation in the diagram
- [ ] Reverse-engineering existing infrastructures into a diagram

### 8. Terraform State Import
- [ ] Import `terraform show -json` output
- [ ] Mapping `azurerm_*` resources to internal types
- [ ] Hierarchy reconstruction

---

## 🟢 Phase 3 — Nice-to-Have

### 9. Collaboration - Shareable URLs
- [ ] Encode state into compressed URL (LZ-string)
- [ ] "Share" button → copy URL
- [ ] Decode state from URL on page load
- [ ] Fallback: JSON copy-paste for large diagrams

### 10. Connection Labels & Annotations
- [ ] Labels on peering connections
- [ ] Double-click on connection to edit
- [ ] Bandwidth / Latency annotations
- [ ] Visible labels in PNG export

### 11. ARM Template Export
- [ ] Azure Resource Manager JSON generation
- [ ] Full resource definitions
- [ ] Parameters & variables support
- [ ] Download .json file

### 12. Sharing Configurations between Users
- [ ] Ability to share JSON configurations

### 13. Bicep File Import
- [ ] Parse resource blocks and param/var declarations
- [ ] Support for modules (reference to other .bicep files)

### 14. CSV / Excel Import
- [ ] CSV format: ResourceGroup, VNet, Subnet, ResourceType, Name, Config...
- [ ] Drag-and-drop or file upload
- [ ] Automatic placement

### 15. Clipboard Smart Paste
- [ ] Ctrl+V on canvas → auto-detect format
- [ ] Parsing ARM JSON, Terraform JSON, Bicep snippet, Azure CLI output

### 16. Draw.io XML Import
- [ ] Parse draw.io XML format
- [ ] Recognition of Azure shapes/stencils
- [ ] Conversion to internal resources

### 17. Pulumi State Import
- [ ] Parse `pulumi stack export` JSON output
- [ ] Map `azure-native:*` resources to internal types

---

## 🏗️ Phase 4 — Technical Debt & Infrastructure (Ongoing)

### 18. Automated Testing
- [ ] Test framework setup (Vitest or Node test runner)
- [ ] Unit tests: IaC generation (PowerShell, Bicep)
- [ ] Unit tests: Cost calculator
- [ ] Unit tests: State management
- [ ] E2E tests: Critical user flows (Playwright)
- [ ] CI pipeline (GitHub Actions)

### 19. Performance Optimization
- [ ] Canvas: dirty region redrawing
- [ ] Off-screen element culling
- [ ] Throttle/debounce resize & scroll
- [ ] Web Workers for layout calculations
- [ ] Lazy icon loading
- [ ] Benchmarks for 50+ resources

### 20. Code Quality
- [ ] ESLint configuration
- [ ] Code formatting (Prettier)
- [ ] JSDoc documentation
- [ ] Type annotations (JSDoc types or TypeScript migration)

### 21. Documentation
- [ ] CONTRIBUTING.md
- [ ] Architecture Decision Records (ADRs)
- [ ] Canvas rendering pipeline docs
- [ ] "How to add a new resource type" guide
- [ ] "How to add a new export format" guide

---

## 📋 General Principles

- **Zero-dependency:** Every new feature in vanilla JS unless there is a very good reason
- **Modular architecture:** New features follow the existing module pattern (5 JS modules)
- **Backward compatibility:** Compatibility with existing localStorage data is critical
- **Desktop-first:** The majority of users are architects on desktop
- **Drag & Drop imports:** All imports must support drag-and-drop
- **Preview before import:** Display what will be imported before execution
- **Auto-detect format:** Automatic format recognition without user selection

---

## 🏗️ Phase 5 — Codebase Productivity & DX (New Recommendations)

> These items directly improve developer experience and long-term maintainability.

### 22. JS File Modularization ← **See `distributions.md` for full plan**
- [ ] Split `export-logic.js` (1 930 lines) into 6 focused files under `js/exports/`
- [ ] Split `ui-components.js` (1 289 lines) into 5 focused files under `js/ui/`
- [ ] Split `canvas-engine.js` (978 lines) into 4 focused files under `js/canvas/`
- [ ] Split `state-management.js` (617 lines) into 4 focused files under `js/state/`
- [ ] Split `template-gallery.js` into data and UI layers under `js/templates/`
- Use the step-by-step AI prompts in `distributions.md` to execute each split safely

### 23. Introduce a Lightweight Build Tool (Vite)
- [ ] Add `vite` as dev-only dependency (`npm create vite@latest`)
- [ ] Keep zero runtime dependencies — Vite is dev-only
- [ ] Enable `npm run dev` (HMR dev server) and `npm run build` (bundled output)
- [ ] Add `npm run preview` for local production preview
- [ ] This unblocks: TypeScript migration, proper linting, tree-shaking, source maps
- [ ] No change to the app's zero-dependency runtime promise

### 24. TypeScript Migration (Incremental)
- [ ] Start with `.js` files + JSDoc type annotations (`@param`, `@returns`, `@typedef`)
- [ ] Enable `"checkJs": true` in a `jsconfig.json` (zero install needed)
- [ ] Migrate `state-management.js` types first (most referenced)
- [ ] Gradually rename `.js` → `.ts` after Vite is adopted
- [ ] Priority: `state-core.ts` → `canvas-layout.ts` → `ui-topology.ts`

### 25. Service Worker / PWA Support
- [ ] Register a Service Worker for offline use (cache JS, CSS, icons)
- [ ] Add `manifest.json` (app name, icons, theme color)
- [ ] Users can install the app as a PWA on desktop/mobile
- [ ] Cache Azure SVG icons from CDN on first load

### 26. Custom / User-Defined Resource Types
- [ ] Allow users to define a custom resource type (name, icon URL, cost estimate)
- [ ] Stored in `state.customResourceTypes` array
- [ ] Appears in the "Add Resource" dropdown alongside built-in types
- [ ] Exported/imported as part of the JSON schema

### 27. Diagram Diff / Delta Preview on Import
- [ ] When importing JSON or Inventory, show a diff view (added/removed/changed nodes)
- [ ] Color-coded: green = new, yellow = modified, red = removed
- [ ] User can deselect individual changes before confirming

### 28. Shareable URL (LZ-String Compression)
- [ ] Encode state into a compressed URL query string (use `lz-string` library as the one allowed dependency)
- [ ] "Share" button → copies URL to clipboard
- [ ] On page load, check URL for encoded state and decode it
- [ ] Fallback for large diagrams: paste JSON modal

### 29. In-Canvas Resource Search
- [ ] `Ctrl+F` opens a search bar overlay on the canvas
- [ ] Type resource/VNet/subnet name → matching nodes are highlighted
- [ ] Press Enter to pan/zoom to the first match
- [ ] Escape closes search

### 30. Export to draw.io XML
- [ ] Generate draw.io-compatible XML from the current diagram
- [ ] Map nodes to draw.io Azure stencil shapes
- [ ] Download `.drawio` file
- [ ] This enables integration with existing enterprise diagramming workflows

### 31. Connection / Peering Labels
- [ ] Editable label on each peering connection (double-click)
- [ ] Optional: bandwidth or latency annotation
- [ ] Labels rendered on PNG export
- [ ] Stored in the peering config object

### 32. localStorage → IndexedDB Migration
- [ ] Current `localStorage` limit is ~5 MB per origin (diagrams can approach this)
- [ ] Migrate to IndexedDB for storing diagram state (unlimited)
- [ ] Keep a localStorage key as a pointer/version marker for backward compat
- [ ] Enables storing multiple named diagrams (diagram history / slots)
