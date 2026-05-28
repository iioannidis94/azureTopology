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
            const c=res.config||{};
            lines.push(`\n# Deploying ${t.label}: ${res.name} (Subnet: ${sn.name})`);
            switch(res.type){
              case 'vm':
                lines.push(`New-AzVM -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VirtualNetworkName "${vnet.name}" -SubnetName "${sn.name}" -Size "${c.size||'Standard_D2s_v3'}" -Image "${c.os||'Ubuntu 22.04'}" ${c.publicIp==='true'?'':'-PublicIpAddressName ""'}`);
                break;
              case 'vmss':
                lines.push(`New-AzVmss -ResourceGroupName "${rg.name}" -VMScaleSetName "${res.name}" -Location "${rg.location}" -VirtualNetworkName "${vnet.name}" -SubnetName "${sn.name}" -InstanceCount ${c.instances||'2'} -UpgradePolicyMode "${c.upgradePolicy||'Rolling'}" -ImageName "${c.os||'Ubuntu 22.04'}"`);
                break;
              case 'aks':
                lines.push(`New-AzAksCluster -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -NodeCount ${c.nodes||'3'} -NodeVmSize "${c.nodeSize||'Standard_D4s_v3'}" -KubernetesVersion "${c.version||'1.29'}" -NetworkPlugin "${c.networkPlugin||'azure'}" -VnetSubnetId $vnet_${vnet.name.replace(/[^a-zA-Z0-9]/g,'_')}.Subnets[0].Id -GenerateSshKey`);
                break;
              case 'fa':
                lines.push(`$plan = New-AzFunctionAppPlan -Name "${res.name}-plan" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.plan||'Consumption'}" -Os "${c.osType||'Linux'}"`);
                lines.push(`New-AzFunctionApp -Name "${res.name}" -ResourceGroupName "${rg.name}" -PlanName "${res.name}-plan" -Runtime "${c.runtime||'node'}" -RuntimeVersion "${c.runtimeVersion||'20'}" -OSType "${c.osType||'Linux'}"`);
                break;
              case 'aca':
                lines.push(`New-AzContainerApp -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Image "${c.image||'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'}" -Cpu ${c.cpu||'0.5'} -Memory "${c.memory||'1.0Gi'}" -MinReplicas ${c.minReplicas||'1'} -MaxReplicas ${c.replicas||'10'} -TargetPort ${c.targetPort||'80'} -IngressExternal:$${c.ingress==='external'?'true':'false'}`);
                break;
              case 'fw':
                lines.push(`$fwPolicy = New-AzFirewallPolicy -Name "${c.policyName||'fw-policy-01'}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -ThreatIntelMode "${c.threatIntelMode||'Alert'}"`);
                lines.push(`New-AzFirewall -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VirtualNetworkName "${vnet.name}" -Sku "${c.sku||'Premium'}" -FirewallPolicyId $fwPolicy.Id`);
                break;
              case 'agw':
                lines.push(`New-AzApplicationGateway -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.sku||'WAF_v2'}" -Capacity ${c.capacity||'2'} -Tier "${c.tier||'WAF'}"`);
                break;
              case 'lb':
                lines.push(`New-AzLoadBalancer -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.sku||'Standard'}" -FrontendIpConfiguration (New-AzLoadBalancerFrontendIpConfig -Name "frontend" -SubnetId $vnet_${vnet.name.replace(/[^a-zA-Z0-9]/g,'_')}.Subnets[0].Id)`);
                break;
              case 'gw':
                lines.push(`New-AzVirtualNetworkGateway -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -GatewaySku "${c.sku||'VpnGw2AZ'}" -GatewayType "Vpn" -VpnType "${c.vpnType||'RouteBased'}" -VpnGatewayGeneration "${c.generation||'Generation2'}" -EnableActiveActiveFeature:$${c.activeActive==='true'?'true':'false'}`);
                break;
              case 'ergw':
                lines.push(`New-AzVirtualNetworkGateway -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -GatewaySku "${c.sku||'ErGw2AZ'}" -GatewayType "ExpressRoute"`);
                break;
              case 'bas':
                lines.push(`New-AzBastion -Name "${res.name}" -ResourceGroupName "${rg.name}" -VirtualNetworkName "${vnet.name}" -Sku "${c.sku||'Standard'}" -ScaleUnit ${c.scaleUnits||'2'}`);
                break;
              case 'sql':
                lines.push(`New-AzSqlServer -ServerName "${res.name}-server" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SqlAdministratorCredentials (Get-Credential)`);
                lines.push(`New-AzSqlDatabase -DatabaseName "${res.name}" -ServerName "${res.name}-server" -ResourceGroupName "${rg.name}" -Edition "${c.tier||'GeneralPurpose'}" -VCore ${c.vcores||'4'} -MaxSizeBytes ${(c.maxSizeGB||32)*1073741824} -ZoneRedundant:$${c.zoneRedundant==='true'?'true':'false'}`);
                break;
              case 'cosmos':
                lines.push(`New-AzCosmosDBAccount -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -ApiKind "${c.api||'Sql'}" -DefaultConsistencyLevel "${c.consistencyLevel||'Session'}" ${c.enableFreeTier==='true'?'-EnableFreeTier':''} ${c.serverless==='true'?'-ServerVersion Serverless':''}`);
                break;
              case 'sa':
                lines.push(`New-AzStorageAccount -Name "${res.name.replace(/[^a-z0-9]/g,'')}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "${c.tier||'Standard'}_${c.replication||'ZRS'}" -Kind "${c.kind||'StorageV2'}" -AccessTier "${c.accessTier||'Hot'}" -MinimumTlsVersion "${c.minTlsVersion||'TLS1_2'}" -EnableHttpsTrafficOnly:$${c.httpsOnly!=='false'?'true':'false'}`);
                break;
              case 'redis':
                lines.push(`New-AzRedisCache -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.sku||'Premium'}" -Size "${c.capacity||'1'}" -MinimumTlsVersion "${c.minTlsVersion||'1.2'}" -EnableNonSslPort:$${c.enableNonSslPort==='true'?'true':'false'}`);
                break;
              case 'adls':
                lines.push(`New-AzStorageAccount -Name "${res.name.replace(/[^a-z0-9]/g,'')}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "${c.tier||'Standard'}_${c.replication||'ZRS'}" -Kind "StorageV2" -EnableHierarchicalNamespace:$true`);
                break;
              case 'kv':
                lines.push(`New-AzKeyVault -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.sku||'Premium'}" -SoftDeleteRetentionInDays ${c.softDeleteDays||'90'} -EnablePurgeProtection:$${c.purgeProtection!=='false'?'true':'false'} -EnableRbacAuthorization:$${c.enableRbacAuth!=='false'?'true':'false'}`);
                break;
              case 'app':
                lines.push(`New-AzAppServicePlan -Name "${res.name}-plan" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Tier "${c.sku||'P1v3'}" -Linux`);
                lines.push(`New-AzWebApp -Name "${res.name}" -ResourceGroupName "${rg.name}" -AppServicePlan "${res.name}-plan" -Runtime "${c.runtime||'dotnet'}|${c.runtimeVersion||'8.0'}"`);
                break;
              case 'apim':
                lines.push(`New-AzApiManagement -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Organization "${c.publisherName||'Contoso'}" -AdminEmail "${c.publisherEmail||'admin@contoso.com'}" -Sku "${c.tier||'Developer'}" -Capacity ${c.capacity||'1'}`);
                break;
              case 'sb':
                lines.push(`New-AzServiceBusNamespace -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "${c.tier||'Premium'}" -SkuCapacity ${c.capacity||'1'} -ZoneRedundant:$${c.zoneRedundant!=='false'?'true':'false'}`);
                break;
              case 'evh':
                lines.push(`New-AzEventHubNamespace -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "${c.tier||'Standard'}" -SkuCapacity ${c.throughputUnits||'1'} -MaximumThroughputUnits ${c.throughputUnits||'1'}`);
                lines.push(`New-AzEventHub -Name "${res.name}-hub" -NamespaceName "${res.name}" -ResourceGroupName "${rg.name}" -PartitionCount ${c.partitions||'4'} -MessageRetentionInDays ${c.retentionDays||'7'}`);
                break;
              case 'logic':
                lines.push(`# Logic App: ${res.name} - Deploy via ARM/Bicep (Logic Apps require workflow definition JSON)`);
                break;
              case 'nsg':
                if(Array.isArray(c.rules)){
                  lines.push(`$nsgRules = @()`);
                  c.rules.forEach(rule=>{
                    lines.push(`$nsgRules += New-AzNetworkSecurityRuleConfig -Name "${rule.name}" -Priority ${rule.priority} -Direction "${rule.direction}" -Access "${rule.access}" -Protocol "${rule.protocol}" -SourcePortRange "${rule.srcPort}" -DestinationPortRange "${rule.dstPort}" -SourceAddressPrefix "${rule.srcAddr}" -DestinationAddressPrefix "${rule.dstAddr}"`);
                  });
                  lines.push(`New-AzNetworkSecurityGroup -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SecurityRules $nsgRules`);
                } else {
                  lines.push(`New-AzNetworkSecurityGroup -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}"`);
                }
                break;
              case 'pe':
                lines.push(`New-AzPrivateEndpoint -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SubnetId $vnet_${vnet.name.replace(/[^a-zA-Z0-9]/g,'_')}.Subnets[0].Id -PrivateLinkServiceConnection (New-AzPrivateLinkServiceConnection -Name "${c.connectionName||'pe-connection'}" -PrivateLinkServiceId "<target-resource-id>" -GroupId "${c.groupId||'blob'}")`);
                break;
              case 'afd':
                lines.push(`New-AzFrontDoor -Name "${res.name}" -ResourceGroupName "${rg.name}" -Sku "${c.sku||'Premium'}"`);
                break;
              case 'nva':
                lines.push(`# FortiGate NVA: ${res.name} - Deploy via Marketplace image (${c.vendor||'Fortinet'} ${c.version||'7.4'}, License: ${c.licenseType||'PAYG'})`);
                break;
              case 'foundry':
                lines.push(`New-AzCognitiveServicesAccount -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Kind "${c.kind||'CognitiveServices'}" -SkuName "${c.sku||'S0'}"`);
                break;
              case 'openai':
                lines.push(`New-AzCognitiveServicesAccount -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Kind "OpenAI" -SkuName "S0" -CustomSubdomain "${res.name}"`);
                lines.push(`New-AzCognitiveServicesAccountDeployment -AccountName "${res.name}" -ResourceGroupName "${rg.name}" -Name "${c.deploymentName||'gpt-4o-deployment'}" -ModelFormat "OpenAI" -ModelName "${c.model||'gpt-4o'}" -ModelVersion "${c.modelVersion||'2024-05-13'}" -SkuCapacity ${c.capacity||'10'} -SkuName "Standard"`);
                break;
              case 'monitor':
                lines.push(`New-AzOperationalInsightsWorkspace -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.workspaceSku||'PerGB2018'}" -RetentionInDays ${c.retentionDays||'90'}`);
                break;
              default:
                lines.push(`# ${t.label}: ${res.name} (config: ${JSON.stringify(c)})`);
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
        const vnetSafeName = vnet.name.replace(/[^a-zA-Z0-9]/g,'_');
        lines.push(`// VNet: ${vnet.name}`);
        lines.push(`module ${vnetSafeName} 'br/public:avm/res/network/virtual-network:0.1.6' = {`);
        lines.push(`  name: '${vnet.name}'`);
        lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
        lines.push(`  params: {`);
        lines.push(`    name: '${vnet.name}'`);
        lines.push(`    location: '${rg.location}'`);
        lines.push(`    addressPrefixes: ['${vnet.cidr}']`);
        lines.push(`    subnets: [`);
        vnet.subnets.forEach((sn,i) => {
          lines.push(`      { name: '${sn.name}', addressPrefix: '${sn.cidr}' }${i<vnet.subnets.length-1?',':''}`);
        });
        lines.push(`    ]`);
        lines.push(`  }`);
        lines.push(`}\n`);

        // Peerings
        if (vnet.peerings && vnet.peerings.length > 0) {
          const allVnets = [state.hub, ...state.spokes];
          vnet.peerings.forEach(pId => {
            const target = allVnets.find(v => v.id === pId);
            if (target) {
              const targetSafe = target.name.replace(/[^a-zA-Z0-9]/g,'_');
              lines.push(`resource peering_${vnetSafeName}_to_${targetSafe} 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-05-01' = {`);
              lines.push(`  parent: ${vnetSafeName}`);
              lines.push(`  name: '${vnet.name}-to-${target.name}'`);
              lines.push(`  properties: { remoteVirtualNetwork: { id: ${targetSafe}.outputs.resourceId }, allowForwardedTraffic: true, allowVirtualNetworkAccess: true }`);
              lines.push(`}\n`);
            }
          });
        }

        // Resources in subnets
        vnet.subnets.forEach(sn => {
          sn.resources.forEach(res => {
            const t=RES_TYPES[res.type];
            const c=res.config||{};
            const safeName=res.name.replace(/[^a-zA-Z0-9]/g,'_');
            lines.push(`// ${t?t.label:'Resource'}: ${res.name} (Subnet: ${sn.name})`);
            switch(res.type){
              case 'vm':
                lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine:0.5.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    vmSize: '${c.size||'Standard_D2s_v3'}'`);
                lines.push(`    osType: '${(c.os||'Ubuntu').includes('Windows')?'Windows':'Linux'}'`);
                lines.push(`    osDisk: { diskSizeGB: ${c.diskSizeGB||128}, managedDisk: { storageAccountType: '${c.diskType||'Premium_LRS'}' } }`);
                lines.push(`    zone: ${c.availabilityZone&&c.availabilityZone!=='None'?c.availabilityZone:'0'}`);
                lines.push(`    nicConfigurations: [{ subnetResourceId: ${vnetSafeName}.outputs.subnetResourceIds[0] }]`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'vmss':
                lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine-scale-set:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuName: '${c.size||'Standard_D2s_v3'}'`);
                lines.push(`    skuCapacity: ${c.instances||2}`);
                lines.push(`    upgradePolicyMode: '${c.upgradePolicy||'Rolling'}'`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'aks':
                lines.push(`module ${safeName} 'br/public:avm/res/container-service/managed-cluster:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kubernetesVersion: '${c.version||'1.29'}'`);
                lines.push(`    primaryAgentPoolProfile: [{ name: 'nodepool1', count: ${c.nodes||3}, vmSize: '${c.nodeSize||'Standard_D4s_v3'}' }]`);
                lines.push(`    networkPlugin: '${c.networkPlugin||'azure'}'`);
                lines.push(`    serviceCidr: '${c.serviceCidr||'10.0.0.0/16'}'`);
                lines.push(`    dnsServiceIP: '${c.dnsServiceIp||'10.0.0.10'}'`);
                lines.push(`    enablePrivateCluster: ${c.privateCluster==='true'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'fa':
                lines.push(`module ${safeName} 'br/public:avm/res/web/site:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kind: 'functionapp,${(c.osType||'Linux').toLowerCase()}'`);
                lines.push(`    siteConfig: { linuxFxVersion: '${(c.runtime||'node').toUpperCase()}|${c.runtimeVersion||'20'}' }`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'aca':
                lines.push(`module ${safeName} 'br/public:avm/res/app/container-app:0.4.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    containers: [{ name: '${res.name}', image: '${c.image||'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'}', resources: { cpu: json('${c.cpu||'0.5'}'), memory: '${c.memory||'1.0Gi'}' } }]`);
                lines.push(`    scaleMinReplicas: ${c.minReplicas||1}`);
                lines.push(`    scaleMaxReplicas: ${c.replicas||10}`);
                lines.push(`    ingressTargetPort: ${c.targetPort||80}`);
                lines.push(`    ingressExternal: ${c.ingress==='external'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'fw':
                lines.push(`module ${safeName} 'br/public:avm/res/network/azure-firewall:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuTier: '${c.sku||'Premium'}'`);
                lines.push(`    threatIntelMode: '${c.threatIntelMode||'Alert'}'`);
                lines.push(`    virtualNetworkResourceId: ${vnetSafeName}.outputs.resourceId`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'agw':
                lines.push(`module ${safeName} 'br/public:avm/res/network/application-gateway:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    sku: { name: '${c.sku||'WAF_v2'}', tier: '${c.tier||'WAF'}', capacity: ${c.capacity||2} }`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'lb':
                lines.push(`module ${safeName} 'br/public:avm/res/network/load-balancer:0.2.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuName: '${c.sku||'Standard'}'`);
                lines.push(`    frontendIPConfigurations: [{ name: 'frontend', subnetId: ${vnetSafeName}.outputs.subnetResourceIds[0] }]`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'gw':
                lines.push(`module ${safeName} 'br/public:avm/res/network/virtual-network-gateway:0.2.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    gatewayType: 'Vpn'`);
                lines.push(`    vpnType: '${c.vpnType||'RouteBased'}'`);
                lines.push(`    skuName: '${c.sku||'VpnGw2AZ'}'`);
                lines.push(`    generation: '${c.generation||'Generation2'}'`);
                lines.push(`    activeActive: ${c.activeActive==='true'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'ergw':
                lines.push(`module ${safeName} 'br/public:avm/res/network/virtual-network-gateway:0.2.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    gatewayType: 'ExpressRoute'`);
                lines.push(`    skuName: '${c.sku||'ErGw2AZ'}'`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'bas':
                lines.push(`module ${safeName} 'br/public:avm/res/network/bastion-host:0.2.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuName: '${c.sku||'Standard'}'`);
                lines.push(`    scaleUnits: ${c.scaleUnits||2}`);
                lines.push(`    virtualNetworkResourceId: ${vnetSafeName}.outputs.resourceId`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'sql':
                lines.push(`module ${safeName}_server 'br/public:avm/res/sql/server:0.4.0' = {`);
                lines.push(`  name: '${res.name}-server'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}-server'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    databases: [{ name: '${res.name}', sku: { name: 'GP_Gen5', tier: '${c.tier||'GeneralPurpose'}', capacity: ${c.vcores||4} }, maxSizeBytes: ${(c.maxSizeGB||32)*1073741824}, zoneRedundant: ${c.zoneRedundant==='true'} }]`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'cosmos':
                lines.push(`module ${safeName} 'br/public:avm/res/document-db/database-account:0.5.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    databaseAccountOfferType: 'Standard'`);
                lines.push(`    defaultConsistencyLevel: '${c.consistencyLevel||'Session'}'`);
                lines.push(`    enableFreeTier: ${c.enableFreeTier==='true'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'sa':
                lines.push(`module ${safeName} 'br/public:avm/res/storage/storage-account:0.9.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name.replace(/[^a-z0-9]/g,'')}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kind: '${c.kind||'StorageV2'}'`);
                lines.push(`    skuName: '${c.tier||'Standard'}_${c.replication||'ZRS'}'`);
                lines.push(`    accessTier: '${c.accessTier||'Hot'}'`);
                lines.push(`    minimumTlsVersion: '${c.minTlsVersion||'TLS1_2'}'`);
                lines.push(`    supportsHttpsTrafficOnly: ${c.httpsOnly!=='false'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'redis':
                lines.push(`module ${safeName} 'br/public:avm/res/cache/redis:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuName: '${c.sku||'Premium'}'`);
                lines.push(`    capacity: ${c.capacity||1}`);
                lines.push(`    minimumTlsVersion: '${c.minTlsVersion||'1.2'}'`);
                lines.push(`    enableNonSslPort: ${c.enableNonSslPort==='true'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'adls':
                lines.push(`module ${safeName} 'br/public:avm/res/storage/storage-account:0.9.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name.replace(/[^a-z0-9]/g,'')}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kind: 'StorageV2'`);
                lines.push(`    skuName: '${c.tier||'Standard'}_${c.replication||'ZRS'}'`);
                lines.push(`    isHnsEnabled: true`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'kv':
                lines.push(`module ${safeName} 'br/public:avm/res/key-vault/vault:0.6.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    sku: '${c.sku||'Premium'}'`);
                lines.push(`    softDeleteRetentionInDays: ${c.softDeleteDays||90}`);
                lines.push(`    enablePurgeProtection: ${c.purgeProtection!=='false'}`);
                lines.push(`    enableRbacAuthorization: ${c.enableRbacAuth!=='false'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'app':
                lines.push(`module ${safeName} 'br/public:avm/res/web/site:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kind: 'app,linux'`);
                lines.push(`    siteConfig: { alwaysOn: ${c.alwaysOn!=='false'}, minTlsVersion: '${c.minTlsVersion||'1.2'}', linuxFxVersion: '${(c.runtime||'dotnet').toUpperCase()}|${c.runtimeVersion||'8.0'}' }`);
                lines.push(`    httpsOnly: ${c.httpsOnly!=='false'}`);
                lines.push(`    managedIdentities: { systemAssigned: ${c.managedIdentity==='SystemAssigned'} }`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'apim':
                lines.push(`module ${safeName} 'br/public:avm/res/api-management/service:0.6.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    publisherName: '${c.publisherName||'Contoso'}'`);
                lines.push(`    publisherEmail: '${c.publisherEmail||'admin@contoso.com'}'`);
                lines.push(`    sku: { name: '${c.tier||'Developer'}', capacity: ${c.capacity||1} }`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'sb':
                lines.push(`module ${safeName} 'br/public:avm/res/service-bus/namespace:0.6.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuObject: { name: '${c.tier||'Premium'}', capacity: ${c.capacity||1} }`);
                lines.push(`    zoneRedundant: ${c.zoneRedundant!=='false'}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'evh':
                lines.push(`module ${safeName} 'br/public:avm/res/event-hub/namespace:0.4.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuName: '${c.tier||'Standard'}'`);
                lines.push(`    skuCapacity: ${c.throughputUnits||1}`);
                lines.push(`    eventhubs: [{ name: '${res.name}-hub', partitionCount: ${c.partitions||4}, messageRetentionInDays: ${c.retentionDays||7} }]`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'logic':
                lines.push(`module ${safeName} 'br/public:avm/res/logic/workflow:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    state: '${c.state||'Enabled'}'`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'nsg':
                lines.push(`module ${safeName} 'br/public:avm/res/network/network-security-group:0.3.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                if(Array.isArray(c.rules)&&c.rules.length>0){
                  lines.push(`    securityRules: [`);
                  c.rules.forEach((rule,i)=>{
                    lines.push(`      { name: '${rule.name}', properties: { priority: ${rule.priority}, direction: '${rule.direction}', access: '${rule.access}', protocol: '${rule.protocol}', sourcePortRange: '${rule.srcPort}', destinationPortRange: '${rule.dstPort}', sourceAddressPrefix: '${rule.srcAddr}', destinationAddressPrefix: '${rule.dstAddr}' } }${i<c.rules.length-1?',':''}`);
                  });
                  lines.push(`    ]`);
                }
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'pe':
                lines.push(`module ${safeName} 'br/public:avm/res/network/private-endpoint:0.4.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    subnetResourceId: ${vnetSafeName}.outputs.subnetResourceIds[0]`);
                lines.push(`    groupIds: ['${c.groupId||'blob'}']`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'afd':
                lines.push(`module ${safeName} 'br/public:avm/res/cdn/profile:0.4.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: 'global'`);
                lines.push(`    sku: { name: '${c.sku==='Premium'?'Premium_AzureFrontDoor':'Standard_AzureFrontDoor'}' }`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'nva':
                lines.push(`// FortiGate NVA: ${res.name} - Deploy via Marketplace (${c.vendor||'Fortinet'} ${c.version||'7.4'})\n`);
                break;
              case 'foundry':
                lines.push(`module ${safeName} 'br/public:avm/res/cognitive-services/account:0.5.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kind: '${c.kind||'CognitiveServices'}'`);
                lines.push(`    sku: '${c.sku||'S0'}'`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'openai':
                lines.push(`module ${safeName} 'br/public:avm/res/cognitive-services/account:0.5.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    kind: 'OpenAI'`);
                lines.push(`    sku: 'S0'`);
                lines.push(`    deployments: [{ name: '${c.deploymentName||'gpt-4o-deployment'}', model: { format: 'OpenAI', name: '${c.model||'gpt-4o'}', version: '${c.modelVersion||'2024-05-13'}' }, sku: { name: 'Standard', capacity: ${c.capacity||10} } }]`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              case 'monitor':
                lines.push(`module ${safeName} 'br/public:avm/res/operational-insights/workspace:0.4.0' = {`);
                lines.push(`  name: '${res.name}'`);
                lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
                lines.push(`  params: {`);
                lines.push(`    name: '${res.name}'`);
                lines.push(`    location: '${rg.location}'`);
                lines.push(`    skuName: '${c.workspaceSku||'PerGB2018'}'`);
                lines.push(`    retentionInDays: ${c.retentionDays||90}`);
                lines.push(`  }`);
                lines.push(`}\n`);
                break;
              default:
                lines.push(`// module ${safeName} 'br/public:avm/res/...' (${JSON.stringify(c)})\n`);
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
