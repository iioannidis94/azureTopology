# Private Endpoint Dependency & DNS Zone Management Guide

## Overview

The Azure Architecture Builder now includes comprehensive management of Private Endpoints (PEs) with automated dependency tracking, DNS zone recommendations, and VNET link configuration.

## Key Features

### 1. **Private Endpoint Target Resource Linking**

Each Private Endpoint now maintains a reference to the resource it protects:

- **Target Resource Selection**: When editing a PE, select the target resource from a dropdown
- **Supported Targets**: Storage Accounts, SQL, Key Vault, Cosmos DB, Redis, App Service, API Management, Service Bus, Event Hub, AKS, Function Apps, Azure Monitor
- **Validation**: Security checks ensure target resources exist and are valid

**PE Configuration Fields:**
- `targetResourceId`: ID of the protected resource
- `targetResourceName`: Display name of the protected resource

### 2. **Automatic DNS Zone Recommendations**

Based on the PE target, recommended private DNS zones are automatically suggested:

| Target Type | Recommended DNS Zones |
|---|---|
| Storage Account | privatelink.blob.core.windows.net, privatelink.file.core.windows.net, etc. |
| SQL | privatelink.database.windows.net |
| Key Vault | privatelink.vaultcore.azure.net |
| Cosmos DB | privatelink.documents.azure.com, privatelink.mongo.cosmos.azure.com, etc. |
| Redis | privatelink.redis.cache.windows.net |
| App Service | privatelink.azurewebsites.net |
| Service Bus | privatelink.servicebus.windows.net |
| Event Hub | privatelink.eventhubs.azure.net |

**How to use:**
1. Select a target resource for your PE
2. The editor displays required DNS zones in a highlighted section
3. Create the recommended DNS zones in your resource group

### 3. **VNET Link Management**

Private DNS zones can now show which VNET links should be configured:

**Recommended Links:**
- The system analyzes all PEs in your diagram
- It identifies which VNets contain PEs targeting resources that need each DNS zone
- Recommended VNET links are shown with a ⚡ indicator in the DNS zone editor

**VNET Link Configuration:**
- Linked VNets show with a 🔗 icon and green highlighting
- Unlinked VNets show with a 🔌 icon
- Recommended (but not yet linked) VNets show with an orange ⚡ indicator
- One-click linking: click any VNET button to add/remove the link

### 4. **Security Posture Analysis**

The security panel now includes PE-specific checks:

**Error-Level Issues:**
- PE without target resource selected
- PE targeting non-existent resource

**Warning-Level Issues:**
- PE without required DNS zones
- Private DNS zone without recommended VNET links

**Example Warnings:**
```
🚫 Private Endpoint "app-storage-pe" has no target resource selected. 
   Link it to a resource (Storage, SQL, Key Vault, etc.).

⚠️ Private Endpoint "sql-pe" requires DNS zones (privatelink.database.windows.net). 
   Create them for proper name resolution.

⚠️ Private DNS Zone "privatelink.blob.core.windows.net" is missing VNET links to 
   production-vnet, staging-vnet. Add them for DNS resolution in those VNets.
```

## Workflow Examples

### Example 1: Basic Private Endpoint Setup

1. **Create Storage Account Resource**
   - Add a Storage Account to your subnet
   - Name it "app-storage"

2. **Create Private Endpoint**
   - Add a PE to the same subnet
   - Name it "app-storage-pe"
   - Set Target to "Select target resource" → Choose "app-storage"
   - The UI now shows: "Required DNS Zones: privatelink.blob.core.windows.net"

3. **Create Private DNS Zone**
   - Add a Private DNS Zone to your resource group
   - Set Zone to "privatelink.blob.core.windows.net"
   - In VNET Links section, you see recommendations
   - Link the VNet containing the PE

4. **Validation**
   - Security panel confirms proper setup with no PE-related errors

### Example 2: Multi-PE Setup with Different Targets

1. **Create Multiple Protected Resources:**
   - Storage Account: "data-storage"
   - SQL Database: "production-sql"
   - Key Vault: "prod-kv"

2. **Create Private Endpoints:**
   - PE 1: Target = "data-storage" → Auto-recommends privatelink.blob.core.windows.net
   - PE 2: Target = "production-sql" → Auto-recommends privatelink.database.windows.net
   - PE 3: Target = "prod-kv" → Auto-recommends privatelink.vaultcore.azure.net

3. **Create DNS Zones:**
   - All recommended zones are shown in one place via "Recommended (based on Private Endpoints)"
   - Create all three zones
   - Each zone auto-shows recommended VNET links

4. **Configure VNET Links:**
   - For each DNS zone, connect VNets that contain PEs
   - The system highlights which VNets have PEs that need each zone

## API Reference

### New State Helper Functions

All functions are exposed via `window._state`:

#### `getPeTargetableResources()`
Returns all resources that can be PE targets (Storage, SQL, Key Vault, etc.)

```javascript
const targetResources = window._state.getPeTargetableResources();
// Returns: [{ id, name, type, rgId }, ...]
```

#### `getPeTargetResource(peId)`
Returns the target resource for a given PE

```javascript
const target = window._state.getPeTargetResource(peId);
// Returns: { id, name, type, rgId, config, ... }
```

#### `getAllPrivateEndpoints()`
Returns all PEs in the diagram

```javascript
const allPes = window._state.getAllPrivateEndpoints();
// Returns: [{ id, name, type, config: { targetResourceId, target, ... } }, ...]
```

#### `getPesForResource(resourceId)`
Returns all PEs targeting a specific resource

```javascript
const pesList = window._state.getPesForResource(storageId);
// Returns: [PE1, PE2, ...]
```

#### `getRecommendedVnetLinksForDnsZone(dnsZoneId)`
Returns recommended VNET links for a DNS zone based on PE placement

```javascript
const recommended = window._state.getRecommendedVnetLinksForDnsZone(zoneId);
// Returns: [{ vnetId, vnetName, peCount }, ...]
```

#### `getRecommendedDnsZones()`
Returns all DNS zones recommended based on PEs in the diagram

```javascript
const zones = window._state.getRecommendedDnsZones();
// Returns: ['privatelink.blob.core.windows.net', ...]
```

#### `PE_TARGET_DNS_RECOMMENDATIONS`
Lookup table mapping PE target types to recommended DNS zones

```javascript
const zones = window._state.PE_TARGET_DNS_RECOMMENDATIONS['Storage'];
// Returns: ['privatelink.blob.core.windows.net', 'privatelink.file.core.windows.net', ...]
```

## Configuration & Data Structure

### Private Endpoint Config

```javascript
{
  name: "app-storage-pe",
  type: "pe",
  id: "pe-xyz",
  rgId: "rg-123",
  config: {
    target: "Storage",                    // PE target type
    groupId: "blob",                       // Sub-resource type
    subResource: "blob",                   // Alternative for groupId
    connectionName: "app-storage-conn",   // Connection name
    privateDnsZoneId: "zone-123",         // Linked DNS zone (optional)
    targetResourceId: "sa-storage-id",    // NEW: ID of protected resource
    targetResourceName: "app-storage"     // NEW: Name of protected resource
  }
}
```

### Private DNS Zone Config

```javascript
{
  name: "blob-dns",
  type: "dns",
  id: "dns-123",
  rgId: "rg-123",
  config: {
    zone: "privatelink.blob.core.windows.net",
    fullZoneName: "privatelink.blob.core.windows.net",
    vnetLinks: [
      { vnetId: "hub-vnet-id", vnetName: "hub" },
      { vnetId: "spoke1-id", vnetName: "spoke1" }
    ],
    autoRegistration: false
  }
}
```

## PowerShell & Bicep Export

When exporting to PowerShell or Bicep, PE target information is now included:

### PowerShell Output Example

```powershell
# Private Endpoint: app-storage-pe (app-storage)
# NOTE: Replace "<target-resource-id>" with actual resource ID. Target should be: Selected
$privateEndpointConnection = New-AzPrivateLinkServiceConnection -Name "app-storage-conn" -PrivateLinkServiceId "<target-resource-id>" -GroupId "blob"
New-AzPrivateEndpoint -Name "app-storage-pe" -ResourceGroupName "my-rg" ...
```

### Bicep Output Example

```bicep
// Private Endpoint: app-storage-pe (app-storage)
// NOTE: Replace '<target-resource-id>' with actual resource ID. Target should be: Selected
module appStoragePe 'br/public:avm/res/network/private-endpoint:0.4.0' = {
  ...
  privateLinkServiceConnections: [{ 
    name: 'app-storage-conn', 
    privateLinkServiceId: '<target-resource-id>', 
    groupIds: ['blob'] 
  }]
  ...
}
```

## Troubleshooting

### Issue: "PE has no target resource selected"

**Solution:**
1. Click on the PE to select it
2. In the right editor panel, find "Target Resource" section
3. Select a resource from the dropdown
4. The editor should update to show recommended DNS zones

### Issue: "PE without required DNS zones"

**Solution:**
1. Check the PE editor for recommended DNS zones
2. Create each recommended DNS zone in your resource group
3. Copy the zone name exactly as shown
4. The security panel will clear this warning once all zones exist

### Issue: "DNS zone without VNET links"

**Solution:**
1. Click on the DNS zone to select it
2. Scroll to "VNet Links" section
3. Click on VNets that contain PEs (marked with ⚡ icon)
4. Links should turn green with 🔗 icon

### Issue: "Target resource does not exist"

**Solution:**
1. Ensure the target resource (Storage, SQL, etc.) is created in the same resource group
2. If it was deleted, update the PE to point to a valid resource
3. Re-select the target from the dropdown

## Best Practices

1. **Create Resources First**: Create the protected resource before creating its PE
2. **Select Targets Early**: Link PEs to their target resources immediately
3. **Follow DNS Recommendations**: Create all recommended DNS zones
4. **Complete VNET Links**: Link all recommended VNets to DNS zones
5. **Validate Security Panel**: Check for PE-related warnings and errors
6. **Review Exports**: Before deployment, verify PowerShell/Bicep exports mention required manual steps

## Migration from Old Setup

If you have existing PEs without target resources:

1. Open each PE in the editor
2. Select the target resource from the dropdown
3. The system will start recommending DNS zones
4. Create recommended zones and configure VNET links
5. Run security analysis to verify setup

## Limitations & Future Enhancements

**Current Limitations:**
- PE targets must be in the same resource group
- Manual DNS zone creation (not auto-created)
- No automatic VNET link creation (recommended links shown, but must be added manually)

**Planned Enhancements:**
- Support for cross-RG PE targets
- Automatic DNS zone creation based on recommendations
- Automatic VNET link creation for recommended links
- PE connection status validation
- DNS record management in private DNS zones
