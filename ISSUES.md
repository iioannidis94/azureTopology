# 📋 GitHub Issues — Resource Configuration Gaps

Αυτό το αρχείο περιέχει issues που πρέπει να δημιουργηθούν στο GitHub για βελτίωση των configuration properties κάθε Azure resource.

> **Οδηγίες:** Κάνε copy-paste κάθε section ως νέο Issue στο GitHub (Title + Body).

---

## Issue 1: Ελλιπείς ρυθμίσεις — Compute Resources (VM, VMSS, AKS, Functions, Container Apps)

**Labels:** `enhancement`, `configuration`  
**Priority:** High

### Περιγραφή

Τα Compute resources (VM, VMSS, AKS, Function App, Container Apps) έχουν ελάχιστες configuration properties στο `config` object (`js/state-management.js`). Αυτό σημαίνει ότι:
1. Ο Properties Editor δεν δείχνει αρκετές ρυθμίσεις
2. Τα generated IaC scripts (PowerShell/Bicep) δεν μπορούν να παράξουν πλήρη deployable κώδικα
3. Ο Cost Estimator δεν μπορεί να υπολογίσει κόστος με βάση τις πραγματικές ρυθμίσεις

### Τρέχουσα κατάσταση vs Τι λείπει

#### Virtual Machine (`vm`)
**Τώρα:** `{size: 'Standard_D2s_v3', os: 'Ubuntu 22.04'}`  
**Λείπουν:**
- [ ] `diskType` (Premium_LRS, StandardSSD_LRS, Standard_LRS)
- [ ] `diskSizeGB` (128, 256, 512, 1024)
- [ ] `authType` (SSH Key, Password)
- [ ] `availabilityZone` (1, 2, 3, None)
- [ ] `acceleratedNetworking` (true/false)
- [ ] `publicIp` (true/false)

#### VM Scale Set (`vmss`)
**Τώρα:** `{size: 'Standard_D2s_v3', instances: '2'}`  
**Λείπουν:**
- [ ] `minInstances` / `maxInstances` (autoscale range)
- [ ] `upgradePolicy` (Manual, Rolling, Automatic)
- [ ] `zones` (1,2,3)
- [ ] `healthProbe` (HTTP/TCP port)
- [ ] `os` (Ubuntu, Windows Server)

#### AKS Cluster (`aks`)
**Τώρα:** `{nodes: '3', version: '1.29'}`  
**Λείπουν:**
- [ ] `nodeSize` (VM SKU for nodes)
- [ ] `networkPlugin` (azure, kubenet, none)
- [ ] `podCidr` (e.g. 10.244.0.0/16)
- [ ] `serviceCidr` (e.g. 10.0.0.0/16)
- [ ] `dnsServiceIp`
- [ ] `privateCluster` (true/false)
- [ ] `tier` (Free, Standard, Premium)

#### Function App (`fa`)
**Τώρα:** `{plan: 'Consumption'}`  
**Λείπουν:**
- [ ] `runtime` (dotnet, node, python, java)
- [ ] `runtimeVersion` (e.g. 8.0, 20, 3.11)
- [ ] `osType` (Linux, Windows)
- [ ] `alwaysOn` (true/false — for non-Consumption plans)

#### Container Apps (`aca`)
**Τώρα:** `{replicas: '10'}`  
**Λείπουν:**
- [ ] `minReplicas`
- [ ] `cpu` (0.25, 0.5, 1.0, 2.0)
- [ ] `memory` (0.5Gi, 1.0Gi, 2.0Gi, 4.0Gi)
- [ ] `image` (container image reference)
- [ ] `ingress` (external/internal/disabled)
- [ ] `targetPort`

### Acceptance Criteria
- Τα config objects να περιέχουν τις παραπάνω default τιμές
- Ο Properties Editor να τα εμφανίζει (ήδη δουλεύει dynamically)
- Τα νέα fields να αξιοποιούνται στο PowerShell/Bicep generation

---

## Issue 2: Ελλιπείς ρυθμίσεις — Networking Resources (Firewall, Gateway, LB, AGW, Bastion, NSG)

**Labels:** `enhancement`, `configuration`  
**Priority:** High

### Περιγραφή

Τα Networking resources έχουν μόνο 1 config property το καθένα. Για ρεαλιστικό IaC generation και σωστή αρχιτεκτονική αναπαράσταση, χρειάζονται πολλά περισσότερα.

### Τρέχουσα κατάσταση vs Τι λείπει

| Resource | Τώρα | Λείπουν |
|----------|------|---------|
| Azure Firewall (`fw`) | `{sku: 'Premium'}` | `threatIntelMode`, `dnsProxy`, `policyName`, `availabilityZones` |
| FortiGate NVA (`nva`) | `{mode: 'Active/Passive'}` | `vendor`, `version`, `licenseType` |
| App Gateway (`agw`) | `{sku: 'WAF_v2'}` | `capacity`, `tier` (Standard/WAF), `sslPolicy`, `httpListeners` |
| Load Balancer (`lb`) | `{sku: 'Standard'}` | `type` (Public/Internal), `frontendIp`, `healthProbe`, `lbRules` |
| VPN Gateway (`gw`) | `{sku: 'VpnGw2AZ'}` | `generation`, `vpnType` (RouteBased/PolicyBased), `activeActive`, `bgpAsn` |
| ExpressRoute GW (`ergw`) | `{sku: 'ErGw2AZ'}` | `gatewayType`, `expressRouteCircuitId` |
| Bastion (`bas`) | `{sku: 'Standard'}` | `scaleUnits`, `shareableLink`, `ipConnect`, `tunneling` |
| Front Door (`afd`) | `{sku: 'Premium'}` | `endpoints`, `originGroups`, `wafPolicy`, `routingRules` |
| Private Endpoint (`pe`) | `{target: 'Storage'}` | `groupId`, `privateDnsZoneId`, `connectionName`, `subResource` |
| Private DNS Zone (`dns`) | `{zone: 'privatelink'}` | `fullZoneName`, `vnetLinks`, `autoRegistration` |
| NSG (`nsg`) | `{rules: '5'}` | Actual rules array: `[{name, priority, direction, access, protocol, srcPort, dstPort, srcAddr, dstAddr}]` |

### Tasks
- [ ] Προσθήκη default config values σε κάθε resource type
- [ ] Ο Properties Editor ήδη τα εμφανίζει dynamically — απλά χρειάζονται τα νέα keys
- [ ] Update PowerShell generation με τα νέα config fields
- [ ] Update Bicep generation με τα νέα config fields

---

## Issue 3: Ελλιπείς ρυθμίσεις — Data & Storage Resources (SQL, Cosmos, Storage, Redis, Data Lake)

**Labels:** `enhancement`, `configuration`  
**Priority:** Medium

### Περιγραφή

Τα Data resources χρειάζονται περισσότερες ρυθμίσεις για ρεαλιστική αναπαράσταση performance tiers, redundancy, και security settings.

### Τρέχουσα κατάσταση vs Τι λείπει

| Resource | Τώρα | Λείπουν |
|----------|------|---------|
| Azure SQL (`sql`) | `{vcores: '4'}` | `tier` (GeneralPurpose/BusinessCritical), `maxSizeGB`, `collation`, `backupRetentionDays`, `zoneRedundant` |
| Cosmos DB (`cosmos`) | `{api: 'NoSQL'}` | `consistencyLevel`, `geoReplication`, `maxRU`, `enableFreeTier`, `serverless` |
| Storage Account (`sa`) | `{replication: 'ZRS'}` | `kind` (StorageV2/BlobStorage), `tier` (Standard/Premium), `accessTier` (Hot/Cool), `httpsOnly`, `minTlsVersion` |
| Azure Cache Redis (`redis`) | `{sku: 'Premium P1'}` | `capacity`, `enableNonSslPort`, `minTlsVersion`, `zones`, `replicasPerPrimary` |
| Data Lake (`adls`) | `{tier: 'Standard'}` | `hierarchicalNamespace`, `replication`, `enableSoftDelete` |

### Acceptance Criteria
- [ ] Τα config objects να ενημερωθούν με sensible defaults
- [ ] Τα νέα fields να εμφανίζονται στον Properties Editor
- [ ] PowerShell/Bicep generation να τα χρησιμοποιεί

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
| 1 | Compute Resources Config | 🔴 High | Configuration |
| 2 | Networking Resources Config | 🔴 High | Configuration |
| 3 | Data & Storage Config | 🟡 Medium | Configuration |
| 4 | Security/Integration/AI Config | 🟡 Medium | Configuration |
| 5 | PowerShell Export — Real Commands | 🔴 High | IaC |
| 6 | Bicep Export — Real Definitions | 🔴 High | IaC |
| 7 | Dynamic Cost Estimation | 🟡 Medium | Cost |
| 8 | Subscription/RG Properties | 🟢 Low | Configuration |
| 9 | VNet/Subnet Advanced Props | 🟡 Medium | Networking |

---

## 🎯 Προτεινόμενη σειρά υλοποίησης

1. **Phase 1 — Config Enrichment:** Issues 1, 2, 3, 4 (προσθήκη properties στα config objects)
2. **Phase 2 — IaC Generation:** Issues 5, 6 (PowerShell & Bicep με τα νέα config values)
3. **Phase 3 — Smart Features:** Issues 7, 9 (dynamic pricing, advanced networking)
4. **Phase 4 — Governance:** Issue 8 (tags, locks, policies)
