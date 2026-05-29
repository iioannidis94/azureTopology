# 🚀 Next Steps - Azure Architecture Builder

Ενοποιημένο πλάνο επόμενων βημάτων, οργανωμένο σε φάσεις προτεραιότητας.

---

## ✅ Τι Έχει Ολοκληρωθεί

- Undo/Redo (command pattern, history stack, Ctrl+Z/Ctrl+Y, visual buttons)
- JSON Import/Export (export αρχιτεκτονικής, import με schema validation, file picker/download)
- Azure Resource Inventory Import (az resource list / az graph query, auto-detect hierarchy, preview panel, mapping resource types, graceful handling unknown types)
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

---

## 🔴 Φάση 1 — Κρίσιμα (Must-Have / Άμεση Προτεραιότητα)

### 1. Mobile Experience Fix
- [ ] Touch events (pinch-to-zoom, single-finger pan)
- [ ] Long-press + drag για move element
- [ ] Fix dropdowns σε mobile (κλείσιμο με tap outside)
- [ ] Touch targets minimum 44x44px
- [ ] Smooth panel transitions

### 2. Terraform Export
- [ ] Terraform HCL code generation
- [ ] Resource Group, VNet, Subnet resources
- [ ] Peering connections + Gateways
- [ ] Modal preview (όπως PowerShell/Bicep)
- [ ] Download .tf αρχείο

### 3. Merge με Υπάρχον Diagram κατά το Import
- [ ] Δυνατότητα merge (αντί για clean import only) στο Azure Resource Import
- [ ] Merge option και στο JSON Import

---

## 🟡 Φάση 2 — Σημαντικά (Should-Have)

### 4. Template Gallery
- [ ] Template picker modal
- [ ] Hub-and-Spoke basic template
- [ ] Multi-region DR template
- [ ] Web App + Database template
- [ ] AKS networking template
- [ ] Landing Zone (CAF) template
- [ ] Preview thumbnails

### 5. Keyboard Shortcuts
- [ ] Delete/Backspace → διαγραφή στοιχείου
- [ ] Escape → deselect / close modal
- [ ] Arrow keys → nudge element
- [ ] +/- → zoom in/out
- [ ] Ctrl+0 → fit to screen
- [ ] ? → help panel με shortcuts

### 6. Minimap / Overview Panel
- [ ] Minimap component στη γωνία του canvas
- [ ] Real-time preview ολόκληρου του diagram
- [ ] Viewport indicator rectangle
- [ ] Click-to-navigate
- [ ] Toggle show/hide

### 7. ARM Template Import
- [ ] Parse ARM template JSON (resources[], type, properties, dependsOn)
- [ ] Αυτόματη δημιουργία κόμβων στο diagram
- [ ] Reverse-engineering υπαρχόντων υποδομών σε diagram

### 8. Terraform State Import
- [ ] Import `terraform show -json` output
- [ ] Mapping `azurerm_*` resources σε εσωτερικά types
- [ ] Αναδημιουργία hierarchy

---

## 🟢 Φάση 3 — Nice-to-Have

### 9. Collaboration - Shareable URLs
- [ ] Encode state σε compressed URL (LZ-string)
- [ ] "Share" button → copy URL
- [ ] Decode state από URL κατά page load
- [ ] Fallback: JSON copy-paste για μεγάλα diagrams

### 10. Connection Labels & Annotations
- [ ] Labels στα peering connections
- [ ] Double-click σε connection για edit
- [ ] Bandwidth / Latency annotations
- [ ] Labels visible στο PNG export

### 11. ARM Template Export
- [ ] Azure Resource Manager JSON generation
- [ ] Full resource definitions
- [ ] Parameters & variables support
- [ ] Download .json αρχείο

### 12. Sharing Configurations μεταξύ Χρηστών
- [ ] Δυνατότητα sharing JSON configurations

### 13. Bicep File Import
- [ ] Parse resource blocks και param/var declarations
- [ ] Υποστήριξη modules (reference σε άλλα .bicep files)

### 14. CSV / Excel Import
- [ ] CSV format: ResourceGroup, VNet, Subnet, ResourceType, Name, Config...
- [ ] Drag-and-drop ή file upload
- [ ] Automatic placement

### 15. Clipboard Smart Paste
- [ ] Ctrl+V στο canvas → auto-detect format
- [ ] Parsing ARM JSON, Terraform JSON, Bicep snippet, Azure CLI output

### 16. Draw.io XML Import
- [ ] Parse XML format του draw.io
- [ ] Αναγνώριση Azure shapes/stencils
- [ ] Μετατροπή σε εσωτερικά resources

### 17. Pulumi State Import
- [ ] Parse `pulumi stack export` JSON output
- [ ] Map `azure-native:*` resources σε εσωτερικά types

---

## 🏗️ Φάση 4 — Technical Debt & Infrastructure (Ongoing)

### 18. Automated Testing
- [ ] Test framework setup (Vitest ή Node test runner)
- [ ] Unit tests: IaC generation (PowerShell, Bicep)
- [ ] Unit tests: Cost calculator
- [ ] Unit tests: State management
- [ ] E2E tests: Critical user flows (Playwright)
- [ ] CI pipeline (GitHub Actions)

### 19. Performance Optimization
- [ ] Canvas: dirty region redrawing
- [ ] Off-screen element culling
- [ ] Throttle/debounce resize & scroll
- [ ] Web Workers για layout calculations
- [ ] Lazy icon loading
- [ ] Benchmarks για 50+ resources

### 20. Code Quality
- [ ] ESLint configuration
- [ ] Code formatting (Prettier)
- [ ] JSDoc documentation
- [ ] Type annotations (JSDoc types ή TypeScript migration)

### 21. Documentation
- [ ] CONTRIBUTING.md
- [ ] Architecture Decision Records (ADRs)
- [ ] Canvas rendering pipeline docs
- [ ] "How to add a new resource type" guide
- [ ] "How to add a new export format" guide

---

## 📋 Γενικές Αρχές

- **Zero-dependency:** Κάθε νέο feature σε vanilla JS εκτός αν υπάρχει πολύ καλός λόγος
- **Modular αρχιτεκτονική:** Νέα features ακολουθούν το υπάρχον module pattern (5 JS modules)
- **Backward compatibility:** Η συμβατότητα με υπάρχοντα localStorage data είναι κρίσιμη
- **Desktop-first:** Η πλειοψηφία των χρηστών είναι architects σε desktop
- **Drag & Drop imports:** Όλα τα imports πρέπει να υποστηρίζουν drag-and-drop
- **Preview πριν import:** Εμφάνιση τι θα εισαχθεί πριν την εκτέλεση
- **Auto-detect format:** Αυτόματη αναγνώριση format χωρίς user selection
