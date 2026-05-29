# 📝 To Be Updated - Μελλοντικές Αναβαθμίσεις

Αυτό το αρχείο περιέχει τις μελλοντικές αναβαθμίσεις και βελτιώσεις που πρέπει να γίνουν στο Azure Architecture Builder, οργανωμένες σε βήματα προτεραιότητας.

---

## 🔴 Φάση 1 - Κρίσιμα (Must-Have)

### 1.1 Undo/Redo Functionality
- [ ] Υλοποίηση command pattern για undo/redo
- [ ] History stack (τουλάχιστον 50 ενέργειες)
- [ ] Keyboard shortcuts: Ctrl+Z / Ctrl+Y
- [ ] Υποστήριξη για: add/remove, move, rename, peering
- [ ] Visual buttons στο header

### 1.2 JSON Import/Export
- [ ] Export τρέχουσας αρχιτεκτονικής σε JSON αρχείο
- [ ] Import αρχιτεκτονικής από JSON
- [ ] Schema validation κατά το import
- [ ] File picker dialog + download trigger
- [ ] Δυνατότητα sharing configurations μεταξύ χρηστών

### 1.3 Mobile Experience Fix
- [ ] Touch events (pinch-to-zoom, single-finger pan)
- [ ] Long-press + drag για move element
- [ ] Fix dropdowns σε mobile (κλείσιμο με tap outside)
- [ ] Touch targets minimum 44x44px
- [ ] Smooth panel transitions

---

## 🟡 Φάση 2 - Σημαντικά (Should-Have)

### 2.1 Terraform Export
- [ ] Terraform HCL code generation
- [ ] Resource Group, VNet, Subnet resources
- [ ] Peering connections + Gateways
- [ ] Modal preview (όπως PowerShell/Bicep)
- [ ] Download .tf αρχείο

### 2.2 Template Gallery
- [ ] Template picker modal
- [ ] Hub-and-Spoke basic template
- [ ] Multi-region DR template
- [ ] Web App + Database template
- [ ] AKS networking template
- [ ] Landing Zone (CAF) template
- [ ] Preview thumbnails

### 2.3 Keyboard Shortcuts
- [ ] Delete/Backspace → διαγραφή στοιχείου
- [ ] Escape → deselect / close modal
- [ ] Arrow keys → nudge element
- [ ] +/- → zoom
- [ ] Ctrl+0 → fit to screen
- [ ] ? → help panel με shortcuts

### 2.4 Minimap / Overview Panel
- [ ] Minimap component στη γωνία του canvas
- [ ] Real-time preview ολόκληρου του diagram
- [ ] Viewport indicator rectangle
- [ ] Click-to-navigate
- [ ] Toggle show/hide

---

## 🟢 Φάση 3 - Βελτιώσεις (Nice-to-Have)

### 3.1 Collaboration - Shareable URLs
- [ ] Encode state σε compressed URL (LZ-string)
- [ ] "Share" button → copy URL
- [ ] Decode state από URL κατά page load
- [ ] Fallback: JSON copy-paste για μεγάλα diagrams

### 3.2 Connection Labels & Annotations
- [ ] Labels στα peering connections
- [ ] Double-click σε connection για edit
- [ ] Bandwidth / Latency annotations
- [ ] Labels visible στο PNG export

### 3.3 ARM Template Export
- [ ] Azure Resource Manager JSON generation
- [ ] Full resource definitions
- [ ] Parameters & variables support
- [ ] Download .json αρχείο

---

## 🏗️ Φάση 4 - Technical Debt & Infrastructure

### 4.1 Automated Testing
- [ ] Test framework setup (Vitest ή Node test runner)
- [ ] Unit tests: IaC generation (PowerShell, Bicep)
- [ ] Unit tests: Cost calculator
- [ ] Unit tests: State management
- [ ] E2E tests: Critical user flows (Playwright)
- [ ] CI pipeline (GitHub Actions)

### 4.2 Performance Optimization
- [ ] Canvas: dirty region redrawing only
- [ ] Off-screen element culling
- [ ] Throttle/debounce resize & scroll
- [ ] Web Workers για layout calculations
- [ ] Lazy icon loading
- [ ] Benchmarks για 50+ resources

### 4.3 Code Quality
- [ ] ESLint configuration
- [ ] Code formatting (Prettier)
- [ ] JSDoc documentation
- [ ] Type annotations (JSDoc types ή TypeScript migration)

### 4.4 Documentation
- [ ] CONTRIBUTING.md
- [ ] Architecture Decision Records (ADRs)
- [ ] Canvas rendering pipeline docs
- [ ] "How to add a new resource type" guide
- [ ] "How to add a new export format" guide

---

## 📅 Προτεινόμενη Σειρά Υλοποίησης

```
Φάση 1 (Εβδομάδες 1-4):
  → Undo/Redo → JSON Import/Export → Mobile Fix

Φάση 2 (Εβδομάδες 5-10):
  → Terraform Export → Keyboard Shortcuts → Templates → Minimap

Φάση 3 (Εβδομάδες 11-14):
  → Shareable URLs → Connection Labels → ARM Export

Φάση 4 (Παράλληλα / Ongoing):
  → Testing → Performance → Code Quality → Docs
```

---

## ✅ Ολοκληρωμένα (Completed)

- [x] Core Azure hierarchy (Subscription → RG → VNet → Resources)
- [x] Hub & Spoke topology visualization
- [x] Dual themes (Light/Dark)
- [x] Grid & Radial layouts
- [x] Freeform Drag & Drop
- [x] Group Drag (RG, Subscription, VNet level)
- [x] Any-to-Any VNet Peering
- [x] On-Premises / Hybrid connectivity
- [x] 35+ Azure resource types
- [x] Live Cost Estimator
- [x] Auto-Save (localStorage)
- [x] Properties Editor (live editing)
- [x] PNG Export (2x resolution)
- [x] PowerShell script generation
- [x] Bicep template generation
- [x] Security Posture Panel
- [x] DNS Zones (Private & Public)
- [x] Responsive layout (basic mobile support)
- [x] Official Azure SVG icons
- [x] Inline canvas rename (double-click)
- [x] Pan & Zoom navigation

---

## 📊 Σημειώσεις

- Το project είναι **zero-dependency** — κάθε νέο feature πρέπει να παραμείνει σε vanilla JS εκτός αν υπάρχει πολύ καλός λόγος
- Η αρχιτεκτονική είναι modular (5 JS modules) — νέα features πρέπει να ακολουθούν αυτό το pattern
- Η backward compatibility με υπάρχοντα localStorage data είναι κρίσιμη σε κάθε αλλαγή
- Prioritize desktop experience — η πλειοψηφία των χρηστών είναι architects σε desktop
