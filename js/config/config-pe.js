// ================================================================
// PRIVATE ENDPOINT CONFIGURATION MODULE
// Handles PE-specific configurations including NICs
// ================================================================

/**
 * Build Private Endpoint configuration from Azure inventory properties
 * @param {Object} props - Azure resource properties
 * @param {Object} config - Base configuration object
 * @returns {Object} Updated configuration
 */
export function buildPeConfig(props, config) {
  // Private Link Service Connections
  if (props.privateLinkServiceConnections?.[0]) {
    const connection = props.privateLinkServiceConnections[0];
    if (connection.properties?.privateLinkServiceId) {
      config.targetResourceId = connection.properties.privateLinkServiceId;
      // Extract service type from resource ID
      const match = connection.properties.privateLinkServiceId.match(/providers\/([^/]+)\/([^/]+)/);
      if (match && match[2]) {
        const serviceType = match[2].toLowerCase();
        if (serviceType.includes('storage')) config.target = 'Storage';
        else if (serviceType.includes('sql')) config.target = 'SQL';
        else if (serviceType.includes('cosmos')) config.target = 'Cosmos';
        else if (serviceType.includes('keyvault')) config.target = 'KeyVault';
      }
    }
    if (connection.properties?.groupIds?.[0]) {
      config.groupId = connection.properties.groupIds[0];
      config.subResource = connection.properties.groupIds[0];
    }
    if (connection.name) config.connectionName = connection.name;
  }
  
  // Network Interfaces configuration for PE
  if (props.networkInterfaces && Array.isArray(props.networkInterfaces)) {
    config.nics = props.networkInterfaces.map(nicRef => {
      const nic = nicRef.properties || {};
      return {
        name: nicRef.id ? nicRef.id.split('/').pop() : '',
        enableAcceleratedNetworking: String(nic.enableAcceleratedNetworking || false),
        enableIPForwarding: String(nic.enableIPForwarding || false),
        privateIPAllocationMethod: nic.ipConfigurations?.[0]?.properties?.privateIPAllocationMethod || 'Dynamic',
        privateIPAddress: nic.ipConfigurations?.[0]?.properties?.privateIPAddress || ''
      };
    });
  }
  
  return config;
}

/**
 * Generate PowerShell script for PE NICs
 * @param {Object} res - Resource object
 * @param {Object} rg - Resource group
 * @param {string} varN - VNet variable name
 * @param {Object} sn - Subnet object
 * @returns {Array<string>} PowerShell commands
 */
export function generatePeNicsPowerShell(res, rg, varN, sn) {
  const lines = [];
  const c = res.config || {};
  const nics = c.nics || [];
  
  const peConnectionName = c.connectionName || `${res.name}-connection`;
  const peGroupId = c.groupId || c.subResource || c.target || 'blob';
  const targetInfo = c.targetResourceName ? `(${c.targetResourceName})` : '';
  
  lines.push(`# Private Endpoint: ${res.name} ${targetInfo}`);
  lines.push(`# NOTE: Replace "<target-resource-id>" with actual resource ID. Target should be: ${c.targetResourceId ? 'Selected' : 'NOT SELECTED'}`);
  
  if (nics.length > 0) {
    // Custom NIC configuration for PE
    lines.push(`# Custom NIC configuration for Private Endpoint`);
    nics.forEach((nic, idx) => {
      const nicName = nic.name || `${res.name}-nic${idx > 0 ? idx + 1 : ''}`;
      lines.push(`# NIC ${idx + 1}: ${nicName}, Private IP: ${nic.privateIPAddress || 'Dynamic'}`);
    });
  }
  
  lines.push(`$privateEndpointConnection = New-AzPrivateLinkServiceConnection -Name "${peConnectionName}" -PrivateLinkServiceId "<target-resource-id>" -GroupId "${peGroupId}"`);
  lines.push(`New-AzPrivateEndpoint -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Subnet (Get-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -VirtualNetwork ${varN}) -PrivateLinkServiceConnection $privateEndpointConnection`);
  
  if (c.privateDnsZoneId) {
    lines.push(`$privateDnsZoneConfig = New-AzPrivateDnsZoneConfig -Name "default" -PrivateDnsZoneId "${c.privateDnsZoneId}"`);
    lines.push(`New-AzPrivateDnsZoneGroup -Name "${res.name}-dns-group" -ResourceGroupName "${rg.name}" -PrivateEndpointName "${res.name}" -PrivateDnsZoneConfig $privateDnsZoneConfig`);
  }
  
  return lines;
}

/**
 * Generate Bicep configuration for PE NICs
 * @param {Object} res - Resource object
 * @param {string} subnetRef - Subnet reference
 * @returns {Array<string>} Bicep configuration lines
 */
export function generatePeNicsBicep(res, subnetRef) {
  const lines = [];
  const c = res.config || {};
  const nics = c.nics || [];
  const peGroupId = c.groupId || c.subResource || c.target || 'blob';
  const peConnectionName = c.connectionName || `${res.name}-connection`;
  const targetInfo = c.targetResourceName ? ` (${c.targetResourceName})` : '';
  
  lines.push(`// Private Endpoint: ${res.name}${targetInfo}`);
  lines.push(`// NOTE: Replace '<target-resource-id>' with actual resource ID. Target should be: ${c.targetResourceId ? 'Selected' : 'NOT SELECTED'}`);
  
  if (nics.length > 0) {
    lines.push(`// Custom NIC configuration for Private Endpoint`);
    nics.forEach((nic, idx) => {
      const nicName = nic.name || `${res.name}-nic${idx > 0 ? idx + 1 : ''}`;
      lines.push(`// NIC ${idx + 1}: ${nicName}, Private IP: ${nic.privateIPAddress || 'Dynamic'}`);
    });
  }
  
  lines.push(`    subnetResourceId: ${subnetRef}`);
  lines.push(`    privateLinkServiceConnections: [{ name: '${peConnectionName}', privateLinkServiceId: '<target-resource-id>', groupIds: ['${peGroupId}'] }]`);
  
  if (c.privateDnsZoneId) {
    lines.push(`    privateDnsZoneGroup: { privateDnsZoneGroupConfigs: [{ privateDnsZoneResourceId: '${c.privateDnsZoneId}' }] }`);
  }
  
  return lines;
}

/**
 * Migrate old PE config format to new nested format
 * @param {Object} config - Old configuration object
 * @returns {Object} Migrated configuration
 */
export function migratePeConfig(config) {
  const migrated = { ...config };
  
  // Add NICs array if not present
  if (!config.nics) {
    migrated.nics = [{
      name: '',
      enableAcceleratedNetworking: 'false',
      enableIPForwarding: 'false',
      privateIPAllocationMethod: 'Dynamic',
      privateIPAddress: ''
    }];
  }
  
  return migrated;
}
