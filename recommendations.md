# 📋 Import Recommendations — Μελλοντικές Υλοποιήσεις

Αυτό το αρχείο περιγράφει μελλοντικά import formats και λειτουργίες που μπορούν να προστεθούν στο Azure Architecture Builder, ώστε οι χρήστες να φέρνουν εύκολα τα δεδομένα τους και να δημιουργούν διαγράμματα αυτόματα.

---

## 1. ARM Template Import (JSON)

**Τι είναι:** Τα Azure Resource Manager (ARM) templates είναι τα native JSON αρχεία που χρησιμοποιεί το Azure για deployments.

**Πώς θα δουλεύει:**
- Ο χρήστης ανεβάζει ένα ARM template JSON
- Ο parser αναγνωρίζει τα `resources[]`, τα `type` τους (π.χ. `Microsoft.Compute/virtualMachines`), τα `properties`, και τα `dependsOn`
- Δημιουργούνται αυτόματα οι κόμβοι στο diagram με τα σωστά resource types και configurations

**Γιατί είναι χρήσιμο:** Κάθε Azure deployment παράγει ARM templates — αυτό θα επέτρεπε reverse-engineering υπαρχόντων υποδομών σε diagram.

---

## 2. Bicep File Import

**Τι είναι:** Το Bicep είναι η DSL γλώσσα του Azure (compiles σε ARM JSON) και είναι πιο ευανάγνωστη.

**Πώς θα δουλεύει:**
- Parse τα `resource` blocks και τα `param`/`var` declarations
- Αντιστοίχιση resource types στα εσωτερικά resource types του builder
- Υποστήριξη modules (αρχεία που κάνουν reference σε άλλα .bicep files)

**Γιατί είναι χρήσιμο:** Πολλές ομάδες χρησιμοποιούν Bicep αντί για ARM JSON — θα αυξήσει τους πιθανούς χρήστες.

---

## 3. Terraform Import (HCL → JSON)

**Τι είναι:** Το Terraform χρησιμοποιεί HCL (HashiCorp Configuration Language). Μπορεί να μετατραπεί σε JSON μέσω `terraform show -json`.

**Πώς θα δουλεύει:**
- Ο χρήστης τρέχει `terraform show -json > state.json` και ανεβάζει το αρχείο
- Ο parser αναγνωρίζει τα `azurerm_*` resources και τα μαπάρει στα εσωτερικά types
- Αντιστοίχιση: `azurerm_virtual_machine` → `vm`, `azurerm_kubernetes_cluster` → `aks`, κλπ.

**Γιατί είναι χρήσιμο:** Μεγάλο μέρος της αγοράς χρησιμοποιεί Terraform — αυτό ανοίγει το εργαλείο σε πολύ περισσότερους χρήστες.

---

## 4. Azure Resource Graph / Azure CLI Import

**Τι είναι:** Το Azure CLI μπορεί να εξάγει πληροφορίες πόρων σε JSON format μέσω `az resource list` ή `az graph query`.

**Πώς θα δουλεύει:**
- Ο χρήστης τρέχει `az resource list --resource-group <name> -o json > resources.json`
- Ο parser ομαδοποιεί τα resources ανά resource group, VNet, subnet
- Αναδημιουργεί τη δομή του diagram αυτόματα

**Γιατί είναι χρήσιμο:** Δίνει τη δυνατότητα σε χρήστες που έχουν ήδη deployed resources στο Azure να δουν την τοπολογία τους χωρίς χειροκίνητη εισαγωγή.

---

## 5. Draw.io / Diagrams.net XML Import

**Τι είναι:** Πολλοί αρχιτέκτονες χρησιμοποιούν ήδη το draw.io για τα διαγράμματά τους.

**Πώς θα δουλεύει:**
- Parse τo XML format του draw.io
- Αναγνώριση Azure shapes/stencils από τα mxCell attributes
- Μετατροπή σε εσωτερικά resources και τοποθέτηση στο canvas

**Γιατί είναι χρήσιμο:** Εύκολη μετάβαση από draw.io στο εργαλείο μας — δεν χάνεται η υπάρχουσα δουλειά.

---

## 6. CSV / Excel Import

**Τι είναι:** Ένα απλό tabular format που μπορεί να χρησιμοποιηθεί για bulk import πόρων.

**Πώς θα δουλεύει:**
- CSV format: `ResourceGroup,VNet,Subnet,ResourceType,Name,Config...`
- Drag-and-drop ή file upload
- Automatic placement στα σωστά VNets/Subnets/RGs

**Γιατί είναι χρήσιμο:** Πολύ εύχρηστο για μη-τεχνικούς χρήστες ή για bulk δημιουργία πόρων. Μπορούν να χρησιμοποιήσουν Excel/Google Sheets.

---

## 7. Pulumi State Import

**Τι είναι:** Το Pulumi αποθηκεύει state σε JSON format, παρόμοιο με Terraform.

**Πώς θα δουλεύει:**
- Parse το `pulumi stack export` JSON output
- Map `azure-native:*` resources στα εσωτερικά types
- Αναδημιουργία hierarchy (subscription → RG → VNet → Subnet → Resources)

**Γιατί είναι χρήσιμο:** Εναλλακτικό IaC tool — αυξάνει την κάλυψη χρηστών.

---

## 8. Clipboard Paste (Smart Paste)

**Τι είναι:** Αντιγραφή JSON/YAML/text από οπουδήποτε και paste απευθείας στο canvas.

**Πώς θα δουλεύει:**
- Ctrl+V στο canvas
- Auto-detect format (ARM JSON, Terraform JSON, Bicep snippet, Azure CLI output)
- Parsing και δημιουργία resources on-the-fly

**Γιατί είναι χρήσιμο:** Πολύ γρήγορο workflow — copy-paste χωρίς file management.

---

## Προτεραιότητες Υλοποίησης

| Προτεραιότητα | Format | Δυσκολία | Impact |
|:---:|---|:---:|:---:|
| 🥇 | ARM Template JSON | Μεσαία | Υψηλό |
| 🥈 | Azure CLI / Resource Graph | Χαμηλή | Υψηλό |
| 🥉 | Terraform JSON State | Μεσαία | Υψηλό |
| 4 | Bicep | Υψηλή | Μεσαίο |
| 5 | CSV / Excel | Χαμηλή | Μεσαίο |
| 6 | Clipboard Smart Paste | Μεσαία | Μεσαίο |
| 7 | Draw.io XML | Υψηλή | Χαμηλό |
| 8 | Pulumi State | Μεσαία | Χαμηλό |

---

## Γενικές Αρχές Σχεδίασης

- **Drag & Drop:** Όλα τα imports πρέπει να υποστηρίζουν drag-and-drop αρχείου στο canvas
- **Validation:** Εμφάνιση preview πριν το import — τι θα εισαχθεί, πόσοι πόροι, τι λείπει
- **Merge vs Replace:** Δυνατότητα merge με υπάρχον diagram ή πλήρης αντικατάσταση
- **Error Handling:** Σαφή μηνύματα σφάλματος με line numbers αν αποτύχει το parsing
- **Format Detection:** Auto-detect format από το περιεχόμενο (δεν χρειάζεται ο χρήστης να επιλέξει format)
