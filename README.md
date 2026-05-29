# ☁️ Azure Architecture Builder 

Ένα δυναμικό, διαδραστικό web εργαλείο (Single-Page Application) για τον σχεδιασμό, την οπτικοποίηση και την εξαγωγή αρχιτεκτονικών **Microsoft Azure** (Hub & Spoke / Enterprise Scale). Φτιαγμένο εξ ολοκλήρου με **Vanilla JavaScript, HTML5 Canvas και CSS3**, χωρίς εξωτερικές βιβλιοθήκες.

Το εργαλείο επιτρέπει στους Cloud Architects και τους DevOps Engineers να στήνουν γρήγορα πολύπλοκα δίκτυα, να παραμετροποιούν πόρους και να παράγουν αυτόματα κώδικα υποδομής (Infrastructure as Code - IaC).

---

## 📋 Τρέχουσες Λειτουργίες (Current Features)

### 🏗️ Σχεδιασμός Αρχιτεκτονικής
| Λειτουργία | Περιγραφή |
|------------|-----------|
| Πλήρης Ιεραρχία Azure | Subscriptions → Resource Groups → VNets → Subnets → Resources |
| Hub & Spoke Topology | Κεντρικό Hub VNet με πολλαπλά Spoke VNets |
| On-Premises / Hybrid | Σύνδεση με τοπικό Datacenter μέσω VPN/ExpressRoute |
| Any-to-Any VNet Peering | Σύνδεση οποιουδήποτε VNet με οποιοδήποτε άλλο |
| 35+ Azure Resource Types | VMs, AKS, SQL, Cosmos DB, Firewall, App Gateway, OpenAI κ.ά. |
| DNS Zones (Private & Public) | Διαχείριση DNS records και VNet links |

### 🎨 Οπτικοποίηση & Interaction
| Λειτουργία | Περιγραφή |
|------------|-----------|
| Dual Themes | Light (Draw.io style) & Dark (Cyberpunk) θέματα |
| Grid Layout | Αρχιτεκτονική διάταξη σε "κουτιά" (Enterprise Landing Zones) |
| Radial Layout | Hub στο κέντρο, Spokes κυκλικά |
| Freeform Drag & Drop | Ελεύθερη μετακίνηση στοιχείων στον καμβά |
| Group Drag | Drag RG/Subscription/VNet → μετακινούνται όλα τα παιδιά μαζί |
| Pan & Zoom | Scroll zoom + drag πλοήγηση στον canvas |
| Inline Rename | Διπλό κλικ για μετονομασία στον καμβά |
| Επίσημα Azure SVG Icons | Microsoft official icons μέσω CDN |

### 💰 Εκτίμηση Κόστους
| Λειτουργία | Περιγραφή |
|------------|-----------|
| Live Cost Estimator | Αυτόματος υπολογισμός μηνιαίου κόστους |
| Per-Resource Pricing | Κάθε resource έχει estimated monthly cost |
| Azure Pricing Calculator Link | Direct link στο επίσημο calculator |

### 🔒 Security
| Λειτουργία | Περιγραφή |
|------------|-----------|
| Security Posture Panel | Ανίχνευση βασικών security issues |
| NSG Rules Editor | Παραμετροποίηση Network Security Groups |
| Private Endpoints | Υποστήριξη Private Link connectivity |

### 💾 Αποθήκευση & Εξαγωγή
| Λειτουργία | Περιγραφή |
|------------|-----------|
| Auto-Save (localStorage) | Αυτόματη αποθήκευση κάθε αλλαγής |
| Export PNG | Εικόνα υψηλής ανάλυσης (2x scale) |
| PowerShell Script Generation | Πλήρες .ps1 deployment script |
| Bicep Template Generation | IaC template σε Bicep format |

### ⚙️ Properties Editor
| Λειτουργία | Περιγραφή |
|------------|-----------|
| Live Editing | Αλλαγές εφαρμόζονται αμέσως στον καμβά |
| VNet Configuration | CIDR, subnets, peerings, resource group |
| Resource Configuration | Size, SKU, tier, networking options κ.ά. |
| Tags Management | Προσθήκη/επεξεργασία tags σε resources |

---

## 🛠️ Οδηγός Χρήσης - Βήμα προς Βήμα

### Βήμα 1: Άνοιγμα της Εφαρμογής
Ανοίξτε το `index.html` σε οποιονδήποτε σύγχρονο browser (Chrome, Firefox, Edge). Δεν χρειάζεται server — τρέχει 100% client-side.

### Βήμα 2: Δημιουργία Subscriptions
1. Στην **αριστερή μπάρα**, πατήστε **"+ Add Subscription"**
2. Δώστε όνομα στο subscription (π.χ. "Production", "Development")
3. Επαναλάβετε για κάθε subscription που χρειάζεστε

### Βήμα 3: Δημιουργία Resource Groups
1. Μέσα σε κάθε Subscription, πατήστε **"+ Add Resource Group"**
2. Ονομάστε το RG (π.χ. "rg-networking", "rg-compute")
3. Επιλέξτε location (region)

### Βήμα 4: Προσθήκη VNets
1. Σε κάθε Resource Group, πατήστε **"+ Add VNet"**
2. Ορίστε όνομα και CIDR block (π.χ. 10.0.0.0/16)
3. Το πρώτο VNet γίνεται αυτόματα Hub (ή μπορείτε να αλλάξετε)

### Βήμα 5: Προσθήκη Resources
1. Μέσα σε κάθε VNet, πατήστε **"+ Add Resource"**
2. Επιλέξτε κατηγορία (Compute, Networking, Data, Security, κ.λπ.)
3. Επιλέξτε τον πόρο (VM, AKS, Firewall, SQL, κ.λπ.)
4. Ο πόρος εμφανίζεται αυτόματα στον καμβά

### Βήμα 6: Σύνδεση VNets (Peering)
1. Κάντε κλικ σε ένα VNet στον καμβά
2. Στη **δεξιά μπάρα**, βρείτε την ενότητα Peerings
3. Πατήστε 🔗 δίπλα στο VNet που θέλετε να συνδέσετε
4. Η σύνδεση εμφανίζεται αμέσως στον καμβά

### Βήμα 7: Παραμετροποίηση
1. Κάντε κλικ σε οποιοδήποτε στοιχείο στον καμβά
2. Στη δεξιά μπάρα, τροποποιήστε τις ρυθμίσεις (size, SKU, CIDR κ.λπ.)
3. Οι αλλαγές αποθηκεύονται αυτόματα

### Βήμα 8: Οργάνωση Layout
- **Toggle Layout**: Εναλλαγή μεταξύ Grid / Radial διάταξης
- **Drag & Drop**: Σύρετε στοιχεία ελεύθερα στον καμβά
- **Fit to Screen**: Προσαρμογή zoom για να χωράει όλο το diagram
- **Group Drag**: Σύρετε ένα RG ή Subscription box → μετακινούνται όλα τα περιεχόμενα

### Βήμα 9: Εξαγωγή
1. **Export PNG**: Για documentation ή presentations
2. **Deploy via PowerShell**: Παράγει script για Azure deployment
3. **Generate Bicep**: Παράγει IaC template
4. Κατεβάστε ή αντιγράψτε τον κώδικα

### Βήμα 10: Hybrid Connectivity (Προαιρετικό)
1. Ενεργοποιήστε **"On-Premises"** στην αριστερή μπάρα
2. Ορίστε όνομα και CIDR του τοπικού datacenter
3. Προσθέστε VPN Gateway ή ExpressRoute Gateway σε ένα VNet
4. Η σύνδεση εμφανίζεται αυτόματα στο diagram

---

## ❓ Τι Προβλήματα Λύνει

### 1. Γρήγορος Σχεδιασμός Αρχιτεκτονικής
**Πρόβλημα:** Ο σχεδιασμός Azure αρχιτεκτονικών σε Visio/Draw.io είναι αργός και δεν παράγει κώδικα.  
**Λύση:** Drag & drop builder που παράγει αυτόματα IaC (PowerShell/Bicep).

### 2. Οπτικοποίηση Hub & Spoke
**Πρόβλημα:** Δύσκολο να απεικονίσεις σύνθετα hub-spoke topologies με πολλαπλά subscriptions.  
**Λύση:** Αυτόματη διάταξη (Grid/Radial) με ιεραρχική δομή Subscription → RG → VNet → Resources.

### 3. Εκτίμηση Κόστους σε Real-Time
**Πρόβλημα:** Δεν ξέρεις πόσο κοστίζει η αρχιτεκτονική σου μέχρι να κάνεις deploy.  
**Λύση:** Live cost estimator που ενημερώνεται καθώς προσθέτεις/αφαιρείς resources.

### 4. Γρήγορο Prototyping
**Πρόβλημα:** Θέλεις να δοκιμάσεις γρήγορα διαφορετικά architecture patterns.  
**Λύση:** Zero-setup εργαλείο (ανοίγεις ένα HTML αρχείο) — δεν χρειάζεται εγκατάσταση.

### 5. Infrastructure as Code Generation
**Πρόβλημα:** Η συγγραφή IaC από το μηδέν είναι χρονοβόρα και error-prone.  
**Λύση:** Αυτόματη δημιουργία PowerShell scripts και Bicep templates από το visual diagram.

### 6. Security Awareness
**Πρόβλημα:** Εύκολα ξεχνάς security best practices κατά τον σχεδιασμό.  
**Λύση:** Security posture panel που εντοπίζει βασικά issues στην αρχιτεκτονική.

---

## 💻 Τεχνολογίες (Tech Stack)

Το project ακολουθεί τη λογική **Zero Dependencies** (δεν απαιτεί NPM, React, Vue, ή Node.js).

| Τεχνολογία | Χρήση |
|------------|-------|
| HTML5 | Σημασιολογική δόμηση, Canvas element |
| CSS3 | CSS Variables, CSS Grid, Responsive Design |
| Vanilla JavaScript (ES6+) | Canvas API, Drag & Drop, LocalStorage, Module system |
| CDN Assets | Επίσημα Microsoft Azure SVG icons |

### Αρχιτεκτονική Κώδικα

```
index.html              → Entry point, HTML structure
js/
├── main.js             → Αρχικοποίηση, wire-up global functions
├── state-management.js → State, resource types, save/load, cost calculation
├── canvas-engine.js    → Canvas rendering, drawing, layout algorithms
├── ui-components.js    → Sidebar, editor, UI interactions
└── export-logic.js     → PNG/PowerShell/Bicep export
styles/
└── main.css            → Styling, themes, responsive layout
```

---

## 🚀 Γρήγορη Εκκίνηση (Quick Start)

```bash
# Δεν χρειάζεται εγκατάσταση! Απλά ανοίξτε:
open index.html
# ή σε Linux:
xdg-open index.html
# ή σερβίρετε τοπικά (για module support):
python -m http.server 8000
# και ανοίξτε http://localhost:8000
```

---

## 📍 Τρέχουσα Κατάσταση (Status)

| Πεδίο | Κατάσταση |
|-------|-----------|
| Core Functionality | ✅ Πλήρως λειτουργικό |
| Desktop Experience | ✅ Εξαιρετική |
| Mobile Experience | ⚠️ Βασικό (χρειάζεται βελτίωση) |
| IaC Export (PowerShell) | ✅ Λειτουργικό |
| IaC Export (Bicep) | ✅ Λειτουργικό |
| IaC Export (Terraform) | ❌ Δεν υπάρχει ακόμα |
| Auto-Save | ✅ localStorage |
| JSON Import/Export | ❌ Δεν υπάρχει ακόμα |
| Undo/Redo | ✅ Λειτουργικό (Ctrl+Z / Ctrl+Y) |
| Automated Tests | ❌ Δεν υπάρχουν |
| CI/CD Pipeline | ❌ Δεν υπάρχει |

---

## 🗺️ Μελλοντικό Πλάνο Βελτίωσης

Δείτε το αρχείο **[tobeupdate.md](./tobeupdate.md)** για αναλυτικό πλάνο μελλοντικών βελτιώσεων και αναβαθμίσεων.

Δείτε επίσης το **[ROADMAP.md](./ROADMAP.md)** για το πλήρες development roadmap με GitHub Issues format.

---

> **Δημιουργήθηκε με μεράκι για την κοινότητα του Cloud & του DevOps!** ☁️
