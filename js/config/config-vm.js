// ================================================================
// VM CONFIGURATION MODULE
// Handles VM-specific configurations including NICs and Disks
// ================================================================

/**
 * Build VM configuration from Azure inventory properties
 * @param {Object} props - Azure resource properties
 * @param {Object} config - Base configuration object
 * @returns {Object} Updated configuration
 */
export function buildVmConfig(props, config) {
  // Hardware profile
  if (props.hardwareProfile?.vmSize) config.size = props.hardwareProfile.vmSize;
  
  // OS Disk configuration
  if (props.storageProfile?.osDisk) {
    const osDisk = props.storageProfile.osDisk;
    config.osDisk = {
      type: osDisk.managedDisk?.storageAccountType || 'Premium_LRS',
      sizeGB: String(osDisk.diskSizeGB || '128'),
      caching: osDisk.caching || 'ReadWrite',
      createOption: osDisk.createOption || 'FromImage'
    };
  }
  
  // Data Disks configuration
  if (props.storageProfile?.dataDisks && Array.isArray(props.storageProfile.dataDisks)) {
    config.dataDisks = props.storageProfile.dataDisks.map(disk => ({
      name: disk.name || '',
      lun: String(disk.lun || '0'),
      sizeGB: String(disk.diskSizeGB || '256'),
      type: disk.managedDisk?.storageAccountType || 'Premium_LRS',
      caching: disk.caching || 'None',
      createOption: disk.createOption || 'Empty'
    }));
  }
  
  // OS Profile
  if (props.osProfile) {
    config.os = props.osProfile.windowsConfiguration ? 'Windows Server 2022' : 'Ubuntu 22.04';
    if (props.osProfile.linuxConfiguration?.ssh) config.authType = 'SSH Key';
    else if (props.osProfile.adminPassword) config.authType = 'Password';
  }
  
  // Network Interfaces configuration
  if (props.networkProfile?.networkInterfaces && Array.isArray(props.networkProfile.networkInterfaces)) {
    config.nics = props.networkProfile.networkInterfaces.map((nicRef, index) => {
      const nic = nicRef.properties || {};
      return {
        name: nicRef.id ? nicRef.id.split('/').pop() : '',
        enableAcceleratedNetworking: String(nic.enableAcceleratedNetworking || false),
        enableIPForwarding: String(nic.enableIPForwarding || false),
        primary: String(nicRef.properties?.primary !== undefined ? nicRef.properties.primary : (index === 0)),
        privateIPAllocationMethod: nic.ipConfigurations?.[0]?.properties?.privateIPAllocationMethod || 'Dynamic',
        privateIPAddress: nic.ipConfigurations?.[0]?.properties?.privateIPAddress || '',
        publicIp: String(nic.ipConfigurations?.[0]?.properties?.publicIPAddress !== undefined ? true : false)
      };
    });
  }
  
  // Diagnostics
  if (props.diagnosticsProfile?.bootDiagnostics?.enabled !== undefined) {
    config.bootDiagnostics = String(props.diagnosticsProfile.bootDiagnostics.enabled);
  }
  
  // Identity
  if (props.identity?.type) config.managedIdentity = props.identity.type;
  
  // Security Profile
  if (props.securityProfile?.securityType) config.securityType = props.securityProfile.securityType;
  if (props.securityProfile?.uefiSettings?.vTpmEnabled !== undefined) {
    config.vTpmEnabled = String(props.securityProfile.uefiSettings.vTpmEnabled);
  }
  if (props.securityProfile?.uefiSettings?.secureBootEnabled !== undefined) {
    config.secureBootEnabled = String(props.securityProfile.uefiSettings.secureBootEnabled);
  }
  
  return config;
}

/**
 * Generate PowerShell script for VM NICs
 * @param {Object} res - Resource object
 * @param {Object} rg - Resource group
 * @param {string} varN - VNet variable name
 * @param {Object} sn - Subnet object
 * @returns {Array<string>} PowerShell commands
 */
export function generateVmNicsPowerShell(res, rg, varN, sn) {
  const lines = [];
  const nics = res.config.nics || [];
  
  if (nics.length === 0) {
    // Fallback to default NIC
    const accelNet = res.config.acceleratedNetworking === 'true' ? ' -EnableAcceleratedNetworking' : '';
    lines.push(`$nic = New-AzNetworkInterface -Name "${res.name}-nic" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SubnetId (Get-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -VirtualNetwork ${varN}).Id${accelNet}`);
    if (res.config.publicIp === 'true') {
      lines.push(`$pip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
    }
  } else {
    nics.forEach((nic, idx) => {
      const nicName = nic.name || `${res.name}-nic${idx > 0 ? idx + 1 : ''}`;
      const accelNet = nic.enableAcceleratedNetworking === 'true' ? ' -EnableAcceleratedNetworking' : '';
      const ipForward = nic.enableIPForwarding === 'true' ? ' -EnableIPForwarding' : '';
      const primary = nic.primary === 'true' ? ' -Primary' : '';
      lines.push(`$nic${idx} = New-AzNetworkInterface -Name "${nicName}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SubnetId (Get-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -VirtualNetwork ${varN}).Id${accelNet}${ipForward}${primary}`);
      if (nic.publicIp === 'true') {
        lines.push(`$pip${idx} = New-AzPublicIpAddress -Name "${nicName}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
      }
    });
  }
  
  return lines;
}

/**
 * Generate Bicep configuration for VM NICs
 * @param {Object} res - Resource object
 * @returns {Array<string>} Bicep configuration lines
 */
export function generateVmNicsBicep(res) {
  const lines = [];
  const nics = res.config.nics || [];
  
  if (nics.length === 0) {
    // Fallback
    lines.push(`    nicConfigurations: [{ enableAcceleratedNetworking: ${res.config.acceleratedNetworking || 'true'} }]`);
  } else {
    lines.push(`    nicConfigurations: [`);
    nics.forEach((nic, idx) => {
      const comma = idx < nics.length - 1 ? ',' : '';
      lines.push(`      {`);
      lines.push(`        enableAcceleratedNetworking: ${nic.enableAcceleratedNetworking || 'true'}`);
      lines.push(`        enableIPForwarding: ${nic.enableIPForwarding || 'false'}`);
      if (nic.primary === 'true') lines.push(`        primary: true`);
      lines.push(`      }${comma}`);
    });
    lines.push(`    ]`);
  }
  
  return lines;
}

/**
 * Generate PowerShell script for VM disks
 * @param {Object} res - Resource object
 * @returns {Array<string>} PowerShell commands
 */
export function generateVmDisksPowerShell(res) {
  const lines = [];
  const c = res.config;
  
  // OS Disk
  const osDisk = c.osDisk || { type: 'Premium_LRS', sizeGB: '128', caching: 'ReadWrite' };
  lines.push(`$vmConfig = Set-AzVMOSDisk -VM $vmConfig -DiskSizeInGB ${osDisk.sizeGB} -CreateOption ${osDisk.createOption || 'FromImage'} -StorageAccountType "${osDisk.type}" -Caching ${osDisk.caching || 'ReadWrite'}`);
  
  // Data Disks
  const dataDisks = c.dataDisks || [];
  dataDisks.forEach((disk, idx) => {
    lines.push(`$vmConfig = Add-AzVMDataDisk -VM $vmConfig -Name "${disk.name || res.name + '-data-' + idx}" -DiskSizeInGB ${disk.sizeGB} -Lun ${disk.lun || idx} -CreateOption ${disk.createOption || 'Empty'} -StorageAccountType "${disk.type}" -Caching ${disk.caching || 'None'}`);
  });
  
  return lines;
}

/**
 * Generate Bicep configuration for VM disks
 * @param {Object} res - Resource object
 * @returns {Array<string>} Bicep configuration lines
 */
export function generateVmDisksBicep(res) {
  const lines = [];
  const c = res.config;
  
  // OS Disk
  const osDisk = c.osDisk || { type: 'Premium_LRS', sizeGB: '128', caching: 'ReadWrite' };
  lines.push(`    osDisk: {`);
  lines.push(`      diskSizeGB: ${osDisk.sizeGB}`);
  lines.push(`      caching: '${osDisk.caching || 'ReadWrite'}'`);
  lines.push(`      createOption: '${osDisk.createOption || 'FromImage'}'`);
  lines.push(`      managedDisk: { storageAccountType: '${osDisk.type}' }`);
  lines.push(`    }`);
  
  // Data Disks
  const dataDisks = c.dataDisks || [];
  if (dataDisks.length > 0) {
    lines.push(`    dataDisks: [`);
    dataDisks.forEach((disk, idx) => {
      const comma = idx < dataDisks.length - 1 ? ',' : '';
      lines.push(`      {`);
      lines.push(`        name: '${disk.name || res.name + '-data-' + idx}'`);
      lines.push(`        diskSizeGB: ${disk.sizeGB}`);
      lines.push(`        lun: ${disk.lun || idx}`);
      lines.push(`        caching: '${disk.caching || 'None'}'`);
      lines.push(`        createOption: '${disk.createOption || 'Empty'}'`);
      lines.push(`        managedDisk: { storageAccountType: '${disk.type}' }`);
      lines.push(`      }${comma}`);
    });
    lines.push(`    ]`);
  }
  
  return lines;
}

/**
 * Migrate old VM config format to new nested format
 * @param {Object} config - Old configuration object
 * @returns {Object} Migrated configuration
 */
export function migrateVmConfig(config) {
  const migrated = { ...config };
  
  // Migrate OS Disk
  if (config.osDiskType || config.osDiskSizeGB) {
    migrated.osDisk = {
      type: config.osDiskType || 'Premium_LRS',
      sizeGB: config.osDiskSizeGB || '128',
      caching: config.osDiskCaching || 'ReadWrite',
      createOption: 'FromImage'
    };
    delete migrated.osDiskType;
    delete migrated.osDiskSizeGB;
    delete migrated.osDiskCaching;
  }
  
  // Migrate Data Disks
  if (config.dataDisks && typeof config.dataDisks === 'string') {
    const count = parseInt(config.dataDisks) || 0;
    migrated.dataDisks = [];
    for (let i = 0; i < count; i++) {
      migrated.dataDisks.push({
        name: '',
        lun: String(i),
        sizeGB: config.dataDiskSizeGB || '256',
        type: config.dataDiskType || 'Premium_LRS',
        caching: 'None',
        createOption: 'Empty'
      });
    }
    delete migrated.dataDiskSizeGB;
    delete migrated.dataDiskType;
  }
  
  // Migrate NICs
  if (!config.nics) {
    migrated.nics = [{
      name: '',
      enableAcceleratedNetworking: config.acceleratedNetworking || 'true',
      enableIPForwarding: 'false',
      primary: 'true',
      privateIPAllocationMethod: 'Dynamic',
      privateIPAddress: '',
      publicIp: config.publicIp || 'false'
    }];
    delete migrated.acceleratedNetworking;
    delete migrated.publicIp;
  }
  
  return migrated;
}
