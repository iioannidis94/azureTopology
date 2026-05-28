import { state, getVnetsInRg, RES_TYPES } from './state-management.js';

// ================================================================
// EXPORTS (PNG, PowerShell, Bicep)
// ================================================================
export function exportPng(){
  const canvas = document.getElementById('diagram-canvas');
  const ec=document.createElement('canvas');ec.width=canvas.width*2;ec.height=canvas.height*2;
  const c=ec.getContext('2d');c.scale(2,2);
  c.fillStyle=state.theme==='drawio'?'#F0F2F5':'#060D18';c.fillRect(0,0,canvas.width,canvas.height);
  
  c.strokeStyle=state.theme==='drawio'?'rgba(0,0,0,0.04)':'rgba(0,120,212,0.04)';c.lineWidth=1;
  for(let x=0;x<canvas.width;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke();}
  for(let y=0;y<canvas.height;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(canvas.width,y);c.stroke();}

  c.drawImage(canvas,0,0,canvas.width,canvas.height);
  const a=document.createElement('a');a.download=`azure-architecture-${Date.now()}.png`;a.href=ec.toDataURL();a.click();
}

export function generatePowerShell(){
  const lines=[`# Azure PowerShell Deployment Script\n# Generated: ${new Date().toISOString()}\n`];
  const allVnets = [state.hub, ...state.spokes];

  state.subscriptions.forEach(sub=>{
    lines.push(`# ============ SUBSCRIPTION: ${sub.name} ============`);
    lines.push(`# Set-AzContext -SubscriptionName "${sub.name}"\n`);
    const subRgs=state.resourceGroups.filter(r=>r.subId===sub.id);
    subRgs.forEach(rg=>{
      lines.push(`# -- Resource Group: ${rg.name} --`);
      lines.push(`New-AzResourceGroup -Name "${rg.name}" -Location "${rg.location}" -ErrorAction SilentlyContinue\n`);
      getVnetsInRg(rg.id).forEach(vnet=>{
        const varN=`$vnet_${vnet.name.replace(/[^a-zA-Z0-9]/g,'_')}`;
        
        lines.push(`$subnets = @()`);
        vnet.subnets.forEach(sn => {
          lines.push(`$subnets += New-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -AddressPrefix "${sn.cidr}"`);
        });

        lines.push(`${varN} = New-AzVirtualNetwork -Name "${vnet.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AddressPrefix "${vnet.cidr}" -Subnet $subnets`);
        
        if (vnet.peerings && vnet.peerings.length > 0) {
            vnet.peerings.forEach(pId => {
                const target = allVnets.find(v => v.id === pId);
                if (target) {
                    lines.push(`Add-AzVirtualNetworkPeering -Name "${vnet.name}-to-${target.name}" -VirtualNetwork ${varN} -RemoteVirtualNetworkId $vnet_${target.name.replace(/[^a-zA-Z0-9]/g,'_')}.Id -ErrorAction SilentlyContinue`);
                }
            });
        }

        vnet.subnets.forEach(sn => {
          sn.resources.forEach(res => {
            const t=RES_TYPES[res.type]||{label:'Resource'};
            lines.push(`# Deploying ${t.label}: ${res.name} (Subnet: ${sn.name})`);
            if (res.type === 'vm') {
              const c = res.config || {};
              lines.push(`# VM Size: ${c.size||'Standard_D2s_v3'}, OS: ${c.os||'Ubuntu 22.04'}`);
              lines.push(`$vmConfig = New-AzVMConfig -VMName "${res.name}" -VMSize "${c.size||'Standard_D2s_v3'}"`);
              if ((c.os||'').toLowerCase().includes('windows')) {
                lines.push(`$vmConfig = Set-AzVMOperatingSystem -VM $vmConfig -Windows -ComputerName "${res.name}" -Credential $cred`);
              } else {
                lines.push(`$vmConfig = Set-AzVMOperatingSystem -VM $vmConfig -Linux -ComputerName "${res.name}" -Credential $cred`);
              }
              lines.push(`$vmConfig = Add-AzVMDataDisk -VM $vmConfig -DiskSizeInGB ${c.diskSizeGB||128} -Lun 0 -CreateOption Empty -StorageAccountType "${c.diskType||'Premium_LRS'}"`);
              if (c.acceleratedNetworking === 'true') {
                lines.push(`$nic = New-AzNetworkInterface -Name "${res.name}-nic" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SubnetId ${varN}.Subnets[0].Id -EnableAcceleratedNetworking`);
              } else {
                lines.push(`$nic = New-AzNetworkInterface -Name "${res.name}-nic" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SubnetId ${varN}.Subnets[0].Id`);
              }
              if (c.publicIp === 'true') {
                lines.push(`$pip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
              }
              if (c.availabilityZone && c.availabilityZone !== 'None') {
                lines.push(`New-AzVM -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VM $vmConfig -Zone "${c.availabilityZone}"`);
              } else {
                lines.push(`New-AzVM -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VM $vmConfig`);
              }
            } else if (res.type === 'vmss') {
              const c = res.config || {};
              lines.push(`$vmssConfig = New-AzVmssConfig -Location "${rg.location}" -SkuCapacity ${c.instances||2} -SkuName "${c.size||'Standard_D2s_v3'}" -UpgradePolicyMode "${c.upgradePolicy||'Rolling'}"`);
              if (c.zones) {
                lines.push(`$vmssConfig.Zones = @(${c.zones.split(',').map(z => `"${z.trim()}"`).join(',')})`);
              }
              if ((c.os||'').toLowerCase().includes('windows')) {
                lines.push(`$vmssConfig = Set-AzVmssOsProfile -VirtualMachineScaleSet $vmssConfig -ComputerNamePrefix "${res.name}" -AdminUsername "azureuser" -AdminPassword $password -Windows`);
              } else {
                lines.push(`$vmssConfig = Set-AzVmssOsProfile -VirtualMachineScaleSet $vmssConfig -ComputerNamePrefix "${res.name}" -AdminUsername "azureuser" -AdminPassword $password -Linux`);
              }
              lines.push(`# Autoscale: Min=${c.minInstances||2}, Max=${c.maxInstances||10}`);
              lines.push(`New-AzVmss -ResourceGroupName "${rg.name}" -VMScaleSetName "${res.name}" -VirtualMachineScaleSet $vmssConfig`);
            } else if (res.type === 'aks') {
              const c = res.config || {};
              let aksCmd = `New-AzAksCluster -ResourceGroupName "${rg.name}" -Name "${res.name}" -NodeCount ${c.nodes||3} -KubernetesVersion "${c.version||'1.29'}" -NodeVmSize "${c.nodeSize||'Standard_D2s_v3'}" -NetworkPlugin "${c.networkPlugin||'azure'}" -Tier "${c.tier||'Standard'}"`;
              if (c.privateCluster === 'true') aksCmd += ' -EnablePrivateCluster';
              if (c.podCidr) aksCmd += ` -PodCidr "${c.podCidr}"`;
              if (c.serviceCidr) aksCmd += ` -ServiceCidr "${c.serviceCidr}"`;
              if (c.dnsServiceIp) aksCmd += ` -DnsServiceIP "${c.dnsServiceIp}"`;
              lines.push(aksCmd);
            } else if (res.type === 'fa') {
              const c = res.config || {};
              lines.push(`New-AzFunctionApp -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -Runtime "${c.runtime||'node'}" -RuntimeVersion "${c.runtimeVersion||'20'}" -FunctionsVersion 4 -OSType "${c.osType||'Linux'}" -StorageAccountName "<storage-account>"`);
              if (c.plan !== 'Consumption' && c.alwaysOn === 'true') {
                lines.push(`# AlwaysOn enabled for ${c.plan} plan`);
              }
            } else if (res.type === 'aca') {
              const c = res.config || {};
              lines.push(`New-AzContainerApp -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -Image "${c.image||'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'}" -Cpu ${c.cpu||'0.5'} -Memory "${c.memory||'1.0Gi'}" -MinReplicas ${c.minReplicas||1} -MaxReplicas ${c.replicas||10} -TargetPort ${c.targetPort||80} -IngressType "${c.ingress||'external'}"`);
            }
          });
        });
        lines.push('');
      });

      // RG-level resources (DNS Zones)
      const rgResources = (state.rgResources||[]).filter(r => r.rgId === rg.id);
      rgResources.forEach(res => {
        if(res.type === 'publicDns') {
          lines.push(`# -- Public DNS Zone: ${res.config.zone} --`);
          lines.push(`$zone = New-AzDnsZone -Name "${res.config.zone}" -ResourceGroupName "${rg.name}"\n`);
          (res.config.records||[]).forEach(rec => {
            if(rec.type === 'A') {
              lines.push(`New-AzDnsRecordSet -Name "${rec.name}" -RecordType A -ZoneName "${res.config.zone}" -ResourceGroupName "${rg.name}" -Ttl ${rec.ttl||3600} -DnsRecords (New-AzDnsRecordConfig -IPv4Address "${rec.value}")`);
            } else if(rec.type === 'CNAME') {
              lines.push(`New-AzDnsRecordSet -Name "${rec.name}" -RecordType CNAME -ZoneName "${res.config.zone}" -ResourceGroupName "${rg.name}" -Ttl ${rec.ttl||3600} -DnsRecords (New-AzDnsRecordConfig -Cname "${rec.value}")`);
            } else if(rec.type === 'MX') {
              lines.push(`New-AzDnsRecordSet -Name "${rec.name}" -RecordType MX -ZoneName "${res.config.zone}" -ResourceGroupName "${rg.name}" -Ttl ${rec.ttl||3600} -DnsRecords (New-AzDnsRecordConfig -Exchange "${rec.value}" -Preference 10)`);
            } else if(rec.type === 'TXT') {
              lines.push(`New-AzDnsRecordSet -Name "${rec.name}" -RecordType TXT -ZoneName "${res.config.zone}" -ResourceGroupName "${rg.name}" -Ttl ${rec.ttl||3600} -DnsRecords (New-AzDnsRecordConfig -Value "${rec.value}")`);
            } else {
              lines.push(`# ${rec.type} Record: ${rec.name} -> ${rec.value}`);
            }
          });
          lines.push('');
        } else if(res.type === 'dns') {
          lines.push(`# -- Private DNS Zone: ${res.config.zone} --`);
          lines.push(`$privateDnsZone = New-AzPrivateDnsZone -Name "${res.config.zone}" -ResourceGroupName "${rg.name}"\n`);
          (res.config.records||[]).forEach(rec => {
            if(rec.type === 'A') {
              lines.push(`New-AzPrivateDnsRecordSet -Name "${rec.name}" -RecordType A -ZoneName "${res.config.zone}" -ResourceGroupName "${rg.name}" -Ttl ${rec.ttl||3600} -PrivateDnsRecords (New-AzPrivateDnsRecordConfig -IPv4Address "${rec.value}")`);
            } else {
              lines.push(`# ${rec.type} Record: ${rec.name} -> ${rec.value}`);
            }
          });
          (res.config.vnetLinks||[]).forEach(link => {
            lines.push(`New-AzPrivateDnsVirtualNetworkLink -Name "link-${link.vnetName}" -ResourceGroupName "${rg.name}" -ZoneName "${res.config.zone}" -VirtualNetworkId $vnet_${link.vnetName.replace(/[^a-zA-Z0-9]/g,'_')}.Id${link.registrationEnabled ? ' -EnableRegistration' : ''}`);
          });
          lines.push('');
        }
      });
    });
  });

  if (state.onPrem.enabled) {
    lines.push(`# ============ HYBRID CONNECTIVITY ============`);
    lines.push(`# On-Premises Local Network Gateway`);
    lines.push(`New-AzLocalNetworkGateway -Name "lng-${state.onPrem.name.replace(/[^a-zA-Z0-9]/g,'')}" -ResourceGroupName "${state.resourceGroups[0].name}" -Location "eastus" -GatewayIpAddress "8.8.8.8" -AddressPrefix @("${state.onPrem.cidr}")`);
  }
  return lines.join('\n');
}

export function generateBicep(){
  const lines=[`// Bicep Template — Azure Architecture Builder\ntargetScope = 'subscription'\n`];
  state.subscriptions.forEach(sub=>{
    lines.push(`// --- Subscription: ${sub.name} ---`);
    const subRgs=state.resourceGroups.filter(r=>r.subId===sub.id);
    subRgs.forEach(rg=>{
      lines.push(`resource ${rg.id.replace(/-/g,'_')} 'Microsoft.Resources/resourceGroups@2021-04-01' = {\n  name: '${rg.name}'\n  location: '${rg.location}'\n}\n`);
      getVnetsInRg(rg.id).forEach(vnet=>{
        lines.push(`// VNet: ${vnet.name}`);
        lines.push(`// Subnets: ` + vnet.subnets.map(s => s.name).join(', '));
        vnet.subnets.forEach(sn => {
          sn.resources.forEach(res => {
            const t=RES_TYPES[res.type];
            const safeName = res.name.replace(/[^a-zA-Z0-9]/g,'_');
            if (res.type === 'vm') {
              const c = res.config || {};
              lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine:0.5.0' = {`);
              lines.push(`  name: '${res.name}'`);
              lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
              lines.push(`  params: {`);
              lines.push(`    name: '${res.name}'`);
              lines.push(`    vmSize: '${c.size||'Standard_D2s_v3'}'`);
              lines.push(`    osType: '${(c.os||'').toLowerCase().includes('windows') ? 'Windows' : 'Linux'}'`);
              lines.push(`    osDisk: { diskSizeGB: ${c.diskSizeGB||128}, managedDisk: { storageAccountType: '${c.diskType||'Premium_LRS'}' } }`);
              lines.push(`    zone: ${c.availabilityZone && c.availabilityZone !== 'None' ? c.availabilityZone : '0'}`);
              lines.push(`    nicConfigurations: [{ enableAcceleratedNetworking: ${c.acceleratedNetworking||'true'} }]`);
              lines.push(`  }`);
              lines.push(`}\n`);
            } else if (res.type === 'vmss') {
              const c = res.config || {};
              lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine-scale-set:0.4.0' = {`);
              lines.push(`  name: '${res.name}'`);
              lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
              lines.push(`  params: {`);
              lines.push(`    name: '${res.name}'`);
              lines.push(`    skuName: '${c.size||'Standard_D2s_v3'}'`);
              lines.push(`    skuCapacity: ${c.instances||2}`);
              lines.push(`    upgradePolicy: '${c.upgradePolicy||'Rolling'}'`);
              lines.push(`    zones: [${(c.zones||'1,2,3').split(',').map(z => `'${z.trim()}'`).join(', ')}]`);
              lines.push(`    autoScaleSettings: { minCount: ${c.minInstances||2}, maxCount: ${c.maxInstances||10} }`);
              lines.push(`  }`);
              lines.push(`}\n`);
            } else if (res.type === 'aks') {
              const c = res.config || {};
              lines.push(`module ${safeName} 'br/public:avm/res/container-service/managed-cluster:0.3.0' = {`);
              lines.push(`  name: '${res.name}'`);
              lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
              lines.push(`  params: {`);
              lines.push(`    name: '${res.name}'`);
              lines.push(`    kubernetesVersion: '${c.version||'1.29'}'`);
              lines.push(`    agentPoolProfiles: [{ count: ${c.nodes||3}, vmSize: '${c.nodeSize||'Standard_D2s_v3'}' }]`);
              lines.push(`    networkPlugin: '${c.networkPlugin||'azure'}'`);
              lines.push(`    podCidr: '${c.podCidr||'10.244.0.0/16'}'`);
              lines.push(`    serviceCidr: '${c.serviceCidr||'10.0.0.0/16'}'`);
              lines.push(`    dnsServiceIP: '${c.dnsServiceIp||'10.0.0.10'}'`);
              lines.push(`    enablePrivateCluster: ${c.privateCluster === 'true'}`);
              lines.push(`    sku: { name: 'Base', tier: '${c.tier||'Standard'}' }`);
              lines.push(`  }`);
              lines.push(`}\n`);
            } else if (res.type === 'fa') {
              const c = res.config || {};
              lines.push(`module ${safeName} 'br/public:avm/res/web/site:0.6.0' = {`);
              lines.push(`  name: '${res.name}'`);
              lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
              lines.push(`  params: {`);
              lines.push(`    name: '${res.name}'`);
              lines.push(`    kind: 'functionapp'`);
              lines.push(`    runtime: '${c.runtime||'node'}'`);
              lines.push(`    runtimeVersion: '${c.runtimeVersion||'20'}'`);
              lines.push(`    osType: '${c.osType||'Linux'}'`);
              lines.push(`    alwaysOn: ${c.alwaysOn === 'true'}`);
              lines.push(`  }`);
              lines.push(`}\n`);
            } else if (res.type === 'aca') {
              const c = res.config || {};
              lines.push(`module ${safeName} 'br/public:avm/res/app/container-app:0.4.0' = {`);
              lines.push(`  name: '${res.name}'`);
              lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
              lines.push(`  params: {`);
              lines.push(`    name: '${res.name}'`);
              lines.push(`    containers: [{ image: '${c.image||'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'}', resources: { cpu: ${c.cpu||'0.5'}, memory: '${c.memory||'1.0Gi'}' } }]`);
              lines.push(`    scale: { minReplicas: ${c.minReplicas||1}, maxReplicas: ${c.replicas||10} }`);
              lines.push(`    ingress: { external: ${c.ingress === 'external'}, targetPort: ${c.targetPort||80} }`);
              lines.push(`  }`);
              lines.push(`}\n`);
            } else {
              lines.push(`// module ${safeName} 'br/public:avm/res/...'`);
            }
          });
        });
        lines.push('');
      });

      // RG-level resources (DNS Zones)
      const rgResources = (state.rgResources||[]).filter(r => r.rgId === rg.id);
      rgResources.forEach(res => {
        if(res.type === 'publicDns') {
          const safeName = res.config.zone.replace(/[^a-zA-Z0-9]/g,'_');
          lines.push(`module dnsZone_${safeName} 'br/public:avm/res/network/dns-zone:0.3.0' = {`);
          lines.push(`  name: '${res.config.zone}'`);
          lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
          lines.push(`  params: { name: '${res.config.zone}' }`);
          lines.push(`}\n`);
          (res.config.records||[]).forEach(rec => {
            lines.push(`// DNS Record: ${rec.name} ${rec.type} ${rec.value}`);
          });
        } else if(res.type === 'dns') {
          const safeName = res.config.zone.replace(/[^a-zA-Z0-9]/g,'_');
          lines.push(`module privateDnsZone_${safeName} 'br/public:avm/res/network/private-dns-zone:0.3.0' = {`);
          lines.push(`  name: '${res.config.zone}'`);
          lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
          lines.push(`  params: {`);
          lines.push(`    name: '${res.config.zone}'`);
          if(res.config.vnetLinks && res.config.vnetLinks.length > 0) {
            lines.push(`    virtualNetworkLinks: [`);
            res.config.vnetLinks.forEach(link => {
              lines.push(`      { virtualNetworkResourceId: ${link.vnetName.replace(/[^a-zA-Z0-9]/g,'_')}.id, registrationEnabled: ${link.registrationEnabled||false} }`);
            });
            lines.push(`    ]`);
          }
          lines.push(`  }`);
          lines.push(`}\n`);
          (res.config.records||[]).forEach(rec => {
            lines.push(`// Private DNS Record: ${rec.name} ${rec.type} ${rec.value}`);
          });
        }
        lines.push('');
      });
    });
  });
  if (state.onPrem.enabled) {
    lines.push(`// --- Hybrid Connectivity: ${state.onPrem.name} ---`);
    lines.push(`// Local Network Gateway for CIDR: ${state.onPrem.cidr}`);
  }
  return lines.join('\n');
}

export function openPsModal(){document.getElementById('ps-output').textContent=generatePowerShell();document.getElementById('ps-modal').classList.add('show');}
export function openBicepModal(){document.getElementById('bicep-output').textContent=generateBicep();document.getElementById('bicep-modal').classList.add('show');}
export function closeModal(id){document.getElementById(id).classList.remove('show');}
export function copyText(id){navigator.clipboard.writeText(document.getElementById(id).textContent).then(()=>alert('Copied successfully!'));}
export function downloadText(id,fn){const b=new Blob([document.getElementById(id).textContent],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fn;a.click();}

// Setup modal close on backdrop click
['ps-modal','bicep-modal'].forEach(id=>document.getElementById(id).addEventListener('click',e=>{if(e.target===document.getElementById(id))closeModal(id);}));
