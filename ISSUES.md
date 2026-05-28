# 📋 GitHub Issues — Resource Configuration Gaps

Αυτό το αρχείο περιέχει issues που πρέπει να δημιουργηθούν στο GitHub για βελτίωση των configuration properties κάθε Azure resource.

> **Οδηγίες:** Κάνε copy-paste κάθε section ως νέο Issue στο GitHub (Title + Body).

---

## ✅ Completed Issues

- ~~Issue 1: Compute Resources Config~~ — ✅ Done
- ~~Issue 2: Networking Resources Config~~ — ✅ Done
- ~~Issue 3: Data & Storage Config~~ — ✅ Done
- ~~Issue 4: Security/Integration/AI Config~~ — ✅ Done
- ~~Issue 5: PowerShell Export — Real Commands~~ — ✅ Done
- ~~Issue 6: Bicep Export — Real Definitions~~ — ✅ Done
- ~~Issue 7: Dynamic Cost Estimation~~ — ✅ Done

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

## 📋 Σύνοψη — Remaining Priority Matrix

| # | Issue | Priority | Category |
|---|-------|----------|----------|
| 8 | Subscription/RG Properties | 🟢 Low | Configuration |
| 9 | VNet/Subnet Advanced Props | 🟡 Medium | Networking |
