// ================================================================
// CONFIGURATION MIGRATION MODULE
// Handles migration from old config format to new nested format
// ================================================================

import { migrateVmConfig } from '../config/config-vm.js';
import { migratePeConfig } from '../config/config-pe.js';

/**
 * Migrate a resource configuration to the new nested format
 * @param {Object} resource - Resource object with config
 * @returns {Object} Migrated resource
 */
export function migrateResourceConfig(resource) {
  if (!resource || !resource.config) return resource;
  
  const migrated = { ...resource };
  
  switch (resource.type) {
    case 'vm':
      migrated.config = migrateVmConfig(resource.config);
      break;
    case 'pe':
      migrated.config = migratePeConfig(resource.config);
      break;
    default:
      // No migration needed for other types
      break;
  }
  
  return migrated;
}

/**
 * Migrate all resources in a state object
 * @param {Object} stateObj - State object with resources
 * @returns {Object} Migrated state object
 */
export function migrateState(stateObj) {
  if (!stateObj) return stateObj;
  
  const migrated = JSON.parse(JSON.stringify(stateObj));
  
  // Migrate hub resources
  if (migrated.hub?.subnets) {
    migrated.hub.subnets.forEach(subnet => {
      if (subnet.resources) {
        subnet.resources = subnet.resources.map(migrateResourceConfig);
      }
    });
  }
  
  // Migrate spoke resources
  if (migrated.spokes) {
    migrated.spokes.forEach(spoke => {
      if (spoke.subnets) {
        spoke.subnets.forEach(subnet => {
          if (subnet.resources) {
            subnet.resources = subnet.resources.map(migrateResourceConfig);
          }
        });
      }
    });
  }
  
  // Migrate resource group resources
  if (migrated.rgResources) {
    migrated.rgResources = migrated.rgResources.map(migrateResourceConfig);
  }
  
  // Migrate resource groups
  if (migrated.resourceGroups) {
    migrated.resourceGroups.forEach(rg => {
      if (rg.vnets) {
        rg.vnets.forEach(vnet => {
          if (vnet.subnets) {
            vnet.subnets.forEach(subnet => {
              if (subnet.resources) {
                subnet.resources = subnet.resources.map(migrateResourceConfig);
              }
            });
          }
        });
      }
    });
  }
  
  return migrated;
}

/**
 * Check if a VM config is in old format
 * @param {Object} config - VM configuration
 * @returns {boolean} True if old format
 */
export function isOldVmFormat(config) {
  return config && (
    'osDiskType' in config || 
    'osDiskSizeGB' in config || 
    'acceleratedNetworking' in config ||
    (typeof config.dataDisks === 'string')
  );
}

/**
 * Check if a PE config is in old format
 * @param {Object} config - PE configuration
 * @returns {boolean} True if old format
 */
export function isOldPeFormat(config) {
  return config && !('nics' in config);
}
