# 📋 GitHub Issues — Resource Configuration Gaps

Αυτό το αρχείο περιέχει issues που πρέπει να δημιουργηθούν στο GitHub για βελτίωση των configuration properties κάθε Azure resource.

> **Οδηγίες:** Κάνε copy-paste κάθε section ως νέο Issue στο GitHub (Title + Body).

---

## Issue 4: Ελλιπείς ρυθμίσεις — Security, Integration, AI & Management Resources

**Labels:** `enhancement`, `configuration`  
**Priority:** Medium

### Περιγραφή

Τα υπόλοιπα resource categories χρειάζονται επίσης πιο πλούσια configuration.

### Τρέχουσα κατάσταση vs Τι λείπει

| Resource | Τώρα | Λείπουν |
|----------|------|---------|
| Key Vault (`kv`) | `{sku: 'Premium'}` | `softDeleteDays`, `purgeProtection`, `enableRbacAuth`, `networkAcls` |
| App Service (`app`) | `{sku: 'P1v3'}` | `runtime`, `runtimeVersion`, `alwaysOn`, `httpsOnly`, `minTlsVersion`, `managedIdentity` |
| API Management (`apim`) | `{tier: 'Developer'}` | `capacity`, `publisherName`, `publisherEmail`, `vnetType` (None/External/Internal) |
| Service Bus (`sb`) | `{tier: 'Premium'}` | `messagingUnits`, `capacity`, `zoneRedundant` |
| Event Hub (`evh`) | `{tier: 'Standard'}` | `throughputUnits`, `partitions`, `retentionDays`, `captureEnabled` |
| Logic App (`logic`) | `{plan: 'Standard'}` | `state`, `triggerType`, `connectors` |
| AI Foundry (`foundry`) | `{sku: 'S0'}` | `kind`, `customSubdomain`, `networkRules` |
| Azure OpenAI (`openai`) | `{model: 'gpt-4o'}` | `deploymentName`, `capacity`, `modelVersion`, `contentFilter` |
| Azure Monitor (`monitor`) | `{retentionDays: '90'}` | `workspaceSku` (PerGB2018/Free), `dailyCapGB`, `solutions` |

### Acceptance Criteria
- [ ] Config objects updated με default values
- [ ] Properties Editor εμφανίζει τα νέα fields
- [ ] IaC generators τα αξιοποιούν

---

## Issue 5: PowerShell Export — Δεν παράγει πραγματικά deployment commands για resources

**Labels:** `enhancement`, `IaC`  
**Priority:** High

### Περιγραφή

Στο `js/export-logic.js` (γραμμές 50-55), τα resources μέσα σε subnets παράγουν μόνο σχόλια:
```javascript
lines.push(`# Deploying ${t.label}: ${res.name} (Subnet: ${sn.name})`);
```

Δεν υπάρχει πραγματική PowerShell cmdlet generation.

### Tasks
- [ ] VM: `New-AzVM` με config parameters (size, os, disk, etc.)
- [ ] AKS: `New-AzAksCluster` με node pool config
- [ ] SQL: `New-AzSqlServer` + `New-AzSqlDatabase`
- [ ] Storage: `New-AzStorageAccount` με replication, tier
- [ ] Key Vault: `New-AzKeyVault` με access policies
- [ ] NSG: `New-AzNetworkSecurityGroup` + `New-AzNetworkSecurityRuleConfig`
- [ ] App Service: `New-AzAppServicePlan` + `New-AzWebApp`
- [ ] Load Balancer: `New-AzLoadBalancer` με rules
- [ ] Τα υπόλοιπα resources (Cosmos, Redis, Event Hub, Service Bus, κλπ.)

### Acceptance Criteria
- Κάθε resource type να παράγει functional PowerShell command
- Τα config properties να μεταφράζονται σε parameters
- Το output να είναι copy-paste deployable (με ελάχιστες αλλαγές)

---

## Issue 6: Bicep Export — Παράγει μόνο σχόλια, χωρίς πραγματικά resource definitions

**Labels:** `enhancement`, `IaC`  
**Priority:** High

### Περιγραφή

Στο `js/export-logic.js` (γραμμές 69-94), το Bicep generation παράγει μόνο comments:
```javascript
lines.push(`// module ${res.name.replace(/[^a-zA-Z0-9]/g,'_')} 'br/public:avm/res/...'`);
```

Χρειάζεται πλήρης υλοποίηση Bicep resource definitions.

### Tasks
- [ ] VNet resource definition (πλήρες, με address spaces & subnets)
- [ ] Peering resource definitions
- [ ] Κάθε resource type → σωστό Bicep resource block με API version
- [ ] NSG με inline security rules
- [ ] Output values (resource IDs, endpoints, connection strings)
- [ ] Parameters declaration (location, naming prefix, etc.)
- [ ] Χρήση Azure Verified Modules (AVM) references ή inline resources

### Acceptance Criteria
- Το output να είναι valid Bicep syntax
- Τα config properties να γίνονται resource properties
- `az deployment` ready (ή κοντά σε αυτό)

---

## Issue 7: Cost Estimator — Static pricing, δεν αλλάζει με SKU/tier

**Labels:** `enhancement`, `cost`  
**Priority:** Medium

### Περιγραφή

Κάθε resource έχει ένα σταθερό `cost` field στο `RES_TYPES` object:
```javascript
vm: { cost: 85 },   // Πάντα $85, ανεξάρτητα από size
aks: { cost: 150 }, // Πάντα $150, ανεξάρτητα από nodes
```

Αν ο χρήστης αλλάξει SKU, tier, ή αριθμό instances, το κόστος **δεν αλλάζει**.

### Tasks
- [ ] Pricing lookup table ανά SKU/tier για κάθε resource type
- [ ] Dynamic cost recalculation βασισμένο σε config values
- [ ] VM: cost varies by size (D2s=$85, D4s=$170, D8s=$340)
- [ ] AKS: cost = node_cost × node_count
- [ ] VMSS: cost = instance_cost × instances
- [ ] Storage: cost varies by tier & replication
- [ ] SQL: cost varies by vcores & tier
- [ ] Visual indicator when cost changes (flash/animation)

### Acceptance Criteria
- Αλλαγή SKU/tier/instances → αυτόματη ενημέρωση cost display
- Τουλάχιστον 3 pricing tiers ανά resource type

---

## Issue 8: Subscription & Resource Group — Λείπουν properties (Tags, Policies, Locks)

**Labels:** `enhancement`, `configuration`  
**Priority:** Low

### Περιγραφή

Τα Subscriptions έχουν μόνο `{id, name}`, τα Resource Groups μόνο `{id, name, location, subId}`. Στο Azure υπάρχουν πολλά ακόμα metadata που βοηθούν στο governance.

### Tasks
- [ ] Subscription: `subscriptionId` (GUID format placeholder)
- [ ] Subscription: `tenantId`
- [ ] Subscription: `tags` (key-value pairs)
- [ ] Resource Group: `tags` (key-value pairs)
- [ ] Resource-level `tags` support (common tagging strategy)
- [ ] Resource Group: `locks` (CanNotDelete, ReadOnly)
- [ ] Budget alerts configuration (monthly limit, alert threshold %)
- [ ] Tags editor UI component (dynamic key-value pair management)

### Acceptance Criteria
- Tags να εμφανίζονται στον editor
- Tags να εξάγονται στα IaC scripts
- Lock configuration στον Properties Editor

---

## Issue 9: VNet/Subnet — Λείπουν advanced networking properties

**Labels:** `enhancement`, `networking`  
**Priority:** Medium

### Περιγραφή

Τα VNets και Subnets έχουν μόνο `{name, cidr, color, peerings}` / `{name, cidr, resources}`. Λείπουν σημαντικές networking ρυθμίσεις που επηρεάζουν security και routing.

### VNet — Λείπουν:
- [ ] `dnsServers` (custom DNS IPs, e.g. for Active Directory)
- [ ] `ddosProtectionPlan` (Standard enabled/disabled)
- [ ] `encryption` (enabled/disabled)
- [ ] `flowTimeout` (minutes)

### Subnet — Λείπουν:
- [ ] `nsgId` (linked Network Security Group — reference to NSG resource)
- [ ] `routeTableId` (UDR / Route Table association)
- [ ] `serviceEndpoints` (Microsoft.Storage, Microsoft.Sql, Microsoft.KeyVault, etc.)
- [ ] `delegation` (Microsoft.Web/serverFarms, Microsoft.ContainerInstance/containerGroups, etc.)
- [ ] `privateEndpointNetworkPolicies` (Enabled/Disabled)
- [ ] `privateLinkServiceNetworkPolicies` (Enabled/Disabled)
- [ ] `natGatewayId` (NAT Gateway association)

### Acceptance Criteria
- Properties Editor εμφανίζει αυτά τα fields για VNets και Subnets
- Service Endpoints: multi-select list
- Delegation: dropdown
- NSG linking: reference existing NSG resource in the same subnet
- IaC generation αξιοποιεί αυτά τα properties

---

## 📋 Σύνοψη — Priority Matrix

| # | Issue | Priority | Category |
|---|-------|----------|----------|
| 4 | Security/Integration/AI Config | 🟡 Medium | Configuration |
| 5 | PowerShell Export — Real Commands | 🔴 High | IaC |
| 6 | Bicep Export — Real Definitions | 🔴 High | IaC |
| 7 | Dynamic Cost Estimation | 🟡 Medium | Cost |
| 8 | Subscription/RG Properties | 🟢 Low | Configuration |
| 9 | VNet/Subnet Advanced Props | 🟡 Medium | Networking |

---

## 🎯 Προτεινόμενη σειρά υλοποίησης

1. **Phase 1 — Config Enrichment:** Issue 4 (προσθήκη properties στα config objects)
2. **Phase 2 — IaC Generation:** Issues 5, 6 (PowerShell & Bicep με τα νέα config values)
3. **Phase 3 — Smart Features:** Issues 7, 9 (dynamic pricing, advanced networking)
4. **Phase 4 — Governance:** Issue 8 (tags, locks, policies)
