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

// ================================================================
// POWERSHELL RESOURCE GENERATORS
// ================================================================
function generatePowerShellResource(res, rg, varN, sn) {
  const lines = [];
  const c = res.config || {};

  switch (res.type) {
    case 'vm': {
      lines.push(`# VM Size: ${c.size||'Standard_D2s_v3'}, OS: ${c.os||'Ubuntu 22.04'}`);
      lines.push(`$vmConfig = New-AzVMConfig -VMName "${res.name}" -VMSize "${c.size||'Standard_D2s_v3'}"`);
      if ((c.os||'').toLowerCase().includes('windows')) {
        lines.push(`$vmConfig = Set-AzVMOperatingSystem -VM $vmConfig -Windows -ComputerName "${res.name}" -Credential $cred`);
      } else {
        lines.push(`$vmConfig = Set-AzVMOperatingSystem -VM $vmConfig -Linux -ComputerName "${res.name}" -Credential $cred`);
      }
      lines.push(`$vmConfig = Set-AzVMOSDisk -VM $vmConfig -DiskSizeInGB ${c.osDiskSizeGB||128} -CreateOption FromImage -StorageAccountType "${c.osDiskType||'Premium_LRS'}"`);
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
      break;
    }
    case 'vmss': {
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
      break;
    }
    case 'aks': {
      let aksCmd = `New-AzAksCluster -ResourceGroupName "${rg.name}" -Name "${res.name}" -NodeCount ${c.nodes||3} -KubernetesVersion "${c.version||'1.29'}" -NodeVmSize "${c.nodeSize||'Standard_D2s_v3'}" -NetworkPlugin "${c.networkPlugin||'azure'}" -Tier "${c.tier||'Standard'}"`;
      if (c.privateCluster === 'true') aksCmd += ' -EnablePrivateCluster';
      if (c.podCidr) aksCmd += ` -PodCidr "${c.podCidr}"`;
      if (c.serviceCidr) aksCmd += ` -ServiceCidr "${c.serviceCidr}"`;
      if (c.dnsServiceIp) aksCmd += ` -DnsServiceIP "${c.dnsServiceIp}"`;
      lines.push(aksCmd);
      break;
    }
    case 'fa': {
      lines.push(`New-AzFunctionApp -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -Runtime "${c.runtime||'node'}" -RuntimeVersion "${c.runtimeVersion||'20'}" -FunctionsVersion 4 -OSType "${c.osType||'Linux'}" -StorageAccountName "<storage-account>"`);
      if (c.plan !== 'Consumption' && c.alwaysOn === 'true') {
        lines.push(`# AlwaysOn enabled for ${c.plan} plan`);
      }
      break;
    }
    case 'aca': {
      lines.push(`New-AzContainerApp -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -Image "${c.image||'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'}" -Cpu ${c.cpu||'0.5'} -Memory "${c.memory||'1.0Gi'}" -MinReplicas ${c.minReplicas||1} -MaxReplicas ${c.replicas||10} -TargetPort ${c.targetPort||80} -IngressType "${c.ingress||'external'}"`);
      break;
    }
    case 'fw': {
      const fwZones = c.availabilityZones ? c.availabilityZones.split(',').map(z => `"${z.trim()}"`).join(',') : '"1","2","3"';
      lines.push(`$fwPip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard -Zone @(${fwZones})`);
      lines.push(`$fwPolicy = New-AzFirewallPolicy -Name "${c.policyName || res.name + '-policy'}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -ThreatIntelMode "${c.threatIntelMode||'Alert'}" -DnsSetting @{ EnableProxy = $${c.dnsProxy||'true'} }`);
      lines.push(`New-AzFirewall -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VirtualNetwork ${varN} -PublicIpAddress $fwPip -Sku "${c.sku||'Premium'}" -FirewallPolicyId $fwPolicy.Id -Zone @(${fwZones})`);
      break;
    }
    case 'nva': {
      lines.push(`# FortiGate NVA: ${res.name} (Vendor: ${c.vendor||'Fortinet'}, Mode: ${c.mode||'Active/Passive'}, Version: ${c.version||'7.4'}, License: ${c.licenseType||'PAYG'})`);
      lines.push(`# Deploy via Azure Marketplace — use New-AzMarketplaceTerms and New-AzVM with plan`);
      lines.push(`$nvaConfig = New-AzVMConfig -VMName "${res.name}" -VMSize "Standard_F4s_v2"`);
      lines.push(`$nvaConfig = Set-AzVMPlan -VM $nvaConfig -Publisher "${(c.vendor||'fortinet').toLowerCase()}" -Product "fortinet_fortigate-vm_v5" -Name "fortinet_fg-vm"`);
      lines.push(`# License Type: ${c.licenseType||'PAYG'} | Version: ${c.version||'7.4'}`);
      lines.push(`New-AzVM -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VM $nvaConfig`);
      break;
    }
    case 'agw': {
      lines.push(`$agwPip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
      lines.push(`$agwIpConfig = New-AzApplicationGatewayIPConfiguration -Name "appGatewayIpConfig" -Subnet (Get-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -VirtualNetwork ${varN})`);
      lines.push(`$agwFrontendIp = New-AzApplicationGatewayFrontendIPConfig -Name "appGatewayFrontendIp" -PublicIPAddress $agwPip`);
      lines.push(`$agwFrontendPort = New-AzApplicationGatewayFrontendPort -Name "appGatewayFrontendPort" -Port 80`);
      lines.push(`$agwBackendPool = New-AzApplicationGatewayBackendAddressPool -Name "appGatewayBackendPool"`);
      lines.push(`$agwBackendSettings = New-AzApplicationGatewayBackendHttpSetting -Name "appGatewayBackendHttpSettings" -Port 80 -Protocol Http -RequestTimeout 30`);
      lines.push(`$agwListener = New-AzApplicationGatewayHttpListener -Name "appGatewayHttpListener" -Protocol Http -FrontendIPConfiguration $agwFrontendIp -FrontendPort $agwFrontendPort`);
      lines.push(`$agwRule = New-AzApplicationGatewayRequestRoutingRule -Name "rule1" -RuleType Basic -HttpListener $agwListener -BackendAddressPool $agwBackendPool -BackendHttpSettings $agwBackendSettings -Priority 100`);
      lines.push(`$agwSku = New-AzApplicationGatewaySku -Name "${c.sku||'WAF_v2'}" -Tier "${c.tier||c.sku||'WAF_v2'}" -Capacity ${c.capacity||2}`);
      lines.push(`$agwSslPolicy = New-AzApplicationGatewaySslPolicy -PolicyType Predefined -PolicyName "${c.sslPolicy||'AppGwSslPolicy20220101'}"`);
      lines.push(`New-AzApplicationGateway -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku $agwSku -SslPolicy $agwSslPolicy -GatewayIPConfigurations $agwIpConfig -FrontendIPConfigurations $agwFrontendIp -FrontendPorts $agwFrontendPort -BackendAddressPools $agwBackendPool -BackendHttpSettingsCollection $agwBackendSettings -HttpListeners $agwListener -RequestRoutingRules $agwRule`);
      break;
    }
    case 'lb': {
      const lbIsPublic = (c.type||'Internal') === 'Public';
      if (lbIsPublic) {
        lines.push(`$lbPip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
        lines.push(`$lbFrontendIp = New-AzLoadBalancerFrontendIpConfig -Name "${res.name}-frontend" -PublicIpAddress $lbPip`);
      } else {
        lines.push(`$lbFrontendIp = New-AzLoadBalancerFrontendIpConfig -Name "${res.name}-frontend" -SubnetId (Get-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -VirtualNetwork ${varN}).Id`);
      }
      lines.push(`$lbBackendPool = New-AzLoadBalancerBackendAddressPoolConfig -Name "${res.name}-backend"`);
      const probeparts = (c.healthProbe||'TCP/80').split('/');
      lines.push(`$lbProbe = New-AzLoadBalancerProbeConfig -Name "${res.name}-probe" -Protocol ${probeparts[0]||'Tcp'} -Port ${probeparts[1]||80} -IntervalInSeconds 15 -ProbeCount 2`);
      lines.push(`$lbRule = New-AzLoadBalancerRuleConfig -Name "${res.name}-rule" -FrontendIpConfiguration $lbFrontendIp -BackendAddressPool $lbBackendPool -Probe $lbProbe -Protocol Tcp -FrontendPort 80 -BackendPort 80`);
      lines.push(`New-AzLoadBalancer -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.sku||'Standard'}" -FrontendIpConfiguration $lbFrontendIp -BackendAddressPool $lbBackendPool -Probe $lbProbe -LoadBalancingRule $lbRule`);
      break;
    }
    case 'gw': {
      lines.push(`$gwPip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
      lines.push(`$gwSubnet = Get-AzVirtualNetworkSubnetConfig -Name "GatewaySubnet" -VirtualNetwork ${varN}`);
      lines.push(`$gwIpConfig = New-AzVirtualNetworkGatewayIpConfig -Name "${res.name}-ipconfig" -Subnet $gwSubnet -PublicIpAddress $gwPip`);
      const gwActiveActive = c.activeActive === 'true' ? ' -EnableActiveActiveFeature' : '';
      const gwBgp = c.bgpAsn && c.bgpAsn !== '65515' ? ` -EnableBgp $true -Asn ${c.bgpAsn}` : '';
      lines.push(`New-AzVirtualNetworkGateway -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -IpConfigurations $gwIpConfig -GatewayType Vpn -VpnType "${c.vpnType||'RouteBased'}" -VpnGatewayGeneration "${c.generation||'Generation2'}" -GatewaySku "${c.sku||'VpnGw2AZ'}"${gwActiveActive}${gwBgp}`);
      break;
    }
    case 'ergw': {
      lines.push(`$ergwPip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
      lines.push(`$ergwSubnet = Get-AzVirtualNetworkSubnetConfig -Name "GatewaySubnet" -VirtualNetwork ${varN}`);
      lines.push(`$ergwIpConfig = New-AzVirtualNetworkGatewayIpConfig -Name "${res.name}-ipconfig" -Subnet $ergwSubnet -PublicIpAddress $ergwPip`);
      lines.push(`New-AzVirtualNetworkGateway -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -IpConfigurations $ergwIpConfig -GatewayType "${c.gatewayType||'ExpressRoute'}" -GatewaySku "${c.sku||'ErGw2AZ'}"`);
      if (c.expressRouteCircuitId) {
        lines.push(`# Connect to ExpressRoute Circuit: ${c.expressRouteCircuitId}`);
        lines.push(`New-AzVirtualNetworkGatewayConnection -Name "${res.name}-connection" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -VirtualNetworkGateway1 (Get-AzVirtualNetworkGateway -Name "${res.name}" -ResourceGroupName "${rg.name}") -ConnectionType ExpressRoute -PeerId "${c.expressRouteCircuitId}"`);
      }
      break;
    }
    case 'bas': {
      lines.push(`$basPip = New-AzPublicIpAddress -Name "${res.name}-pip" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AllocationMethod Static -Sku Standard`);
      lines.push(`New-AzBastion -Name "${res.name}" -ResourceGroupName "${rg.name}" -VirtualNetworkId ${varN}.Id -PublicIpAddressId $basPip.Id -Sku "${c.sku||'Standard'}" -ScaleUnit ${c.scaleUnits||2}${c.shareableLink==='true' ? ' -EnableShareableLink' : ''}${c.ipConnect==='true' ? ' -EnableIpConnect' : ''}${c.tunneling==='true' ? ' -EnableTunneling' : ''}`);
      break;
    }
    case 'afd': {
      lines.push(`New-AzFrontDoorCdnProfile -ProfileName "${res.name}" -ResourceGroupName "${rg.name}" -Location "Global" -SkuName "${c.sku||'Premium'}_AzureFrontDoor"`);
      lines.push(`$afdEndpoint = New-AzFrontDoorCdnEndpoint -EndpointName "${c.endpoints||res.name+'-endpoint'}" -ProfileName "${res.name}" -ResourceGroupName "${rg.name}" -Location "Global"`);
      lines.push(`$afdOriginGroup = New-AzFrontDoorCdnOriginGroup -OriginGroupName "${c.originGroups||'default-origin-group'}" -ProfileName "${res.name}" -ResourceGroupName "${rg.name}" -LoadBalancingSettingSampleSize 4 -LoadBalancingSettingSuccessfulSamplesRequired 3`);
      if (c.wafPolicy) {
        lines.push(`# WAF Policy: ${c.wafPolicy}`);
        lines.push(`$afdSecurityPolicy = New-AzFrontDoorCdnSecurityPolicy -ProfileName "${res.name}" -ResourceGroupName "${rg.name}" -Name "${c.wafPolicy}" -PolicyType "WebApplicationFirewall"`);
      }
      lines.push(`New-AzFrontDoorCdnRoute -RouteName "${c.routingRules||'default-route'}" -EndpointName "${c.endpoints||res.name+'-endpoint'}" -ProfileName "${res.name}" -ResourceGroupName "${rg.name}" -OriginGroupId $afdOriginGroup.Id -SupportedProtocol @("Http","Https") -PatternsToMatch @("/*")`);
      break;
    }
    case 'pe': {
      const peConnectionName = c.connectionName || `${res.name}-connection`;
      const peGroupId = c.groupId || c.subResource || c.target || 'blob';
      lines.push(`$privateEndpointConnection = New-AzPrivateLinkServiceConnection -Name "${peConnectionName}" -PrivateLinkServiceId "<target-resource-id>" -GroupId "${peGroupId}"`);
      lines.push(`New-AzPrivateEndpoint -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Subnet (Get-AzVirtualNetworkSubnetConfig -Name "${sn.name}" -VirtualNetwork ${varN}) -PrivateLinkServiceConnection $privateEndpointConnection`);
      if (c.privateDnsZoneId) {
        lines.push(`$privateDnsZoneConfig = New-AzPrivateDnsZoneConfig -Name "default" -PrivateDnsZoneId "${c.privateDnsZoneId}"`);
        lines.push(`New-AzPrivateDnsZoneGroup -Name "${res.name}-dns-group" -ResourceGroupName "${rg.name}" -PrivateEndpointName "${res.name}" -PrivateDnsZoneConfig $privateDnsZoneConfig`);
      }
      break;
    }
    case 'nsg': {
      let nsgRules = [];
      try { nsgRules = JSON.parse(c.rules || '[]'); } catch(e) { nsgRules = []; }
      if (nsgRules.length === 0) {
        nsgRules = [
          {name:'Allow-HTTP',priority:'100',direction:'Inbound',access:'Allow',protocol:'Tcp',srcPort:'*',dstPort:'80',srcAddr:'*',dstAddr:'*'},
          {name:'Allow-HTTPS',priority:'110',direction:'Inbound',access:'Allow',protocol:'Tcp',srcPort:'*',dstPort:'443',srcAddr:'*',dstAddr:'*'}
        ];
      }
      lines.push(`$nsgRules = @()`);
      nsgRules.forEach(rule => {
        lines.push(`$nsgRules += New-AzNetworkSecurityRuleConfig -Name "${rule.name}" -Protocol ${rule.protocol||'Tcp'} -Direction ${rule.direction||'Inbound'} -Priority ${rule.priority||100} -SourceAddressPrefix "${rule.srcAddr||'*'}" -SourcePortRange "${rule.srcPort||'*'}" -DestinationAddressPrefix "${rule.dstAddr||'*'}" -DestinationPortRange ${rule.dstPort||80} -Access ${rule.access||'Allow'}`);
      });
      lines.push(`New-AzNetworkSecurityGroup -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SecurityRules $nsgRules`);
      break;
    }
    case 'sql': {
      lines.push(`New-AzSqlServer -ServerName "${res.name}-server" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SqlAdministratorCredentials $cred`);
      lines.push(`New-AzSqlDatabase -DatabaseName "${res.name}" -ServerName "${res.name}-server" -ResourceGroupName "${rg.name}" -Edition "GeneralPurpose" -VCore ${c.vcores||4} -ComputeGeneration "Gen5"`);
      break;
    }
    case 'cosmos': {
      lines.push(`New-AzCosmosDBAccount -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -ApiKind "${c.api||'Sql'}" -DefaultConsistencyLevel "Session"`);
      lines.push(`New-AzCosmosDBSqlDatabase -ResourceGroupName "${rg.name}" -AccountName "${res.name}" -Name "${res.name}-db"`);
      break;
    }
    case 'sa': {
      lines.push(`New-AzStorageAccount -Name "${res.name.replace(/[^a-z0-9]/g,'').substring(0,24)}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "Standard_${c.replication||'ZRS'}" -Kind "StorageV2" -MinimumTlsVersion "TLS1_2" -AllowBlobPublicAccess $false`);
      break;
    }
    case 'redis': {
      lines.push(`New-AzRedisCache -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "Premium" -Size "P1"`);
      break;
    }
    case 'adls': {
      lines.push(`New-AzStorageAccount -Name "${res.name.replace(/[^a-z0-9]/g,'').substring(0,24)}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "Standard_LRS" -Kind "StorageV2" -EnableHierarchicalNamespace $true`);
      break;
    }
    case 'kv': {
      lines.push(`New-AzKeyVault -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Sku "${c.sku||'Premium'}" -EnablePurgeProtection -EnableRbacAuthorization`);
      break;
    }
    case 'app': {
      lines.push(`New-AzAppServicePlan -Name "${res.name}-plan" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Tier "PremiumV3" -WorkerSize "Small" -Linux`);
      lines.push(`New-AzWebApp -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -AppServicePlan "${res.name}-plan"`);
      break;
    }
    case 'apim': {
      lines.push(`New-AzApiManagement -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Organization "MyOrg" -AdminEmail "admin@example.com" -Sku "${c.tier||'Developer'}" -Capacity 1`);
      break;
    }
    case 'sb': {
      lines.push(`New-AzServiceBusNamespace -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "${c.tier||'Premium'}" -SkuCapacity 1`);
      break;
    }
    case 'evh': {
      lines.push(`New-AzEventHubNamespace -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -SkuName "${c.tier||'Standard'}" -SkuCapacity 1`);
      lines.push(`New-AzEventHub -Name "${res.name}-hub" -NamespaceName "${res.name}" -ResourceGroupName "${rg.name}" -PartitionCount 4 -MessageRetentionInDays 7`);
      break;
    }
    case 'logic': {
      lines.push(`# Logic App (Standard): ${res.name}`);
      lines.push(`New-AzLogicApp -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -State "Enabled"`);
      break;
    }
    case 'foundry': {
      lines.push(`New-AzCognitiveServicesAccount -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Kind "AIServices" -SkuName "${c.sku||'S0'}"`);
      break;
    }
    case 'openai': {
      lines.push(`New-AzCognitiveServicesAccount -Name "${res.name}" -ResourceGroupName "${rg.name}" -Location "${rg.location}" -Kind "OpenAI" -SkuName "S0" -CustomSubdomainName "${res.name}"`);
      lines.push(`# Deploy model: ${c.model||'gpt-4o'}`);
      lines.push(`New-AzCognitiveServicesAccountDeployment -ResourceGroupName "${rg.name}" -AccountName "${res.name}" -Name "${c.model||'gpt-4o'}" -Properties @{ model = @{ format = "OpenAI"; name = "${c.model||'gpt-4o'}"; version = "latest" } } -Sku @{ name = "Standard"; capacity = 10 }`);
      break;
    }
    case 'monitor': {
      lines.push(`New-AzOperationalInsightsWorkspace -ResourceGroupName "${rg.name}" -Name "${res.name}" -Location "${rg.location}" -Sku "PerGB2018" -RetentionInDays ${c.retentionDays||90}`);
      break;
    }
    default: {
      lines.push(`# Resource "${res.name}" (type: ${res.type}) — no specific PowerShell generation available`);
      break;
    }
  }
  return lines;
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
            lines.push(...generatePowerShellResource(res, rg, varN, sn));
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
          const zoneName = res.config.fullZoneName || res.config.zone;
          lines.push(`# -- Private DNS Zone: ${zoneName} --`);
          lines.push(`$privateDnsZone = New-AzPrivateDnsZone -Name "${zoneName}" -ResourceGroupName "${rg.name}"\n`);
          (res.config.records||[]).forEach(rec => {
            if(rec.type === 'A') {
              lines.push(`New-AzPrivateDnsRecordSet -Name "${rec.name}" -RecordType A -ZoneName "${zoneName}" -ResourceGroupName "${rg.name}" -Ttl ${rec.ttl||3600} -PrivateDnsRecords (New-AzPrivateDnsRecordConfig -IPv4Address "${rec.value}")`);
            } else {
              lines.push(`# ${rec.type} Record: ${rec.name} -> ${rec.value}`);
            }
          });
          (res.config.vnetLinks||[]).forEach(link => {
            const enableReg = link.registrationEnabled || res.config.autoRegistration === 'true';
            lines.push(`New-AzPrivateDnsVirtualNetworkLink -Name "link-${link.vnetName}" -ResourceGroupName "${rg.name}" -ZoneName "${zoneName}" -VirtualNetworkId $vnet_${link.vnetName.replace(/[^a-zA-Z0-9]/g,'_')}.Id${enableReg ? ' -EnableRegistration' : ''}`);
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

// ================================================================
// BICEP RESOURCE GENERATORS
// ================================================================
function generateBicepResource(res, rg, vnet, sn) {
  const lines = [];
  const c = res.config || {};
  const safeName = res.name.replace(/[^a-zA-Z0-9]/g,'_');
  const rgRef = rg.id.replace(/-/g,'_');

  switch (res.type) {
    case 'vm': {
      lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine:0.5.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    vmSize: '${c.size||'Standard_D2s_v3'}'`);
      lines.push(`    osType: '${(c.os||'').toLowerCase().includes('windows') ? 'Windows' : 'Linux'}'`);
      lines.push(`    osDisk: { diskSizeGB: ${c.osDiskSizeGB||128}, managedDisk: { storageAccountType: '${c.osDiskType||'Premium_LRS'}' } }`);
      lines.push(`    zone: ${c.availabilityZone && c.availabilityZone !== 'None' ? c.availabilityZone : '0'}`);
      lines.push(`    nicConfigurations: [{ enableAcceleratedNetworking: ${c.acceleratedNetworking||'true'} }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'vmss': {
      lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine-scale-set:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    skuName: '${c.size||'Standard_D2s_v3'}'`);
      lines.push(`    skuCapacity: ${c.instances||2}`);
      lines.push(`    upgradePolicy: '${c.upgradePolicy||'Rolling'}'`);
      lines.push(`    zones: [${(c.zones||'1,2,3').split(',').map(z => `'${z.trim()}'`).join(', ')}]`);
      lines.push(`    autoScaleSettings: { minCount: ${c.minInstances||2}, maxCount: ${c.maxInstances||10} }`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'aks': {
      lines.push(`module ${safeName} 'br/public:avm/res/container-service/managed-cluster:0.3.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
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
      break;
    }
    case 'fa': {
      lines.push(`module ${safeName} 'br/public:avm/res/web/site:0.6.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    kind: 'functionapp'`);
      lines.push(`    runtime: '${c.runtime||'node'}'`);
      lines.push(`    runtimeVersion: '${c.runtimeVersion||'20'}'`);
      lines.push(`    osType: '${c.osType||'Linux'}'`);
      lines.push(`    alwaysOn: ${c.alwaysOn === 'true'}`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'aca': {
      lines.push(`module ${safeName} 'br/public:avm/res/app/container-app:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    containers: [{ image: '${c.image||'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'}', resources: { cpu: ${c.cpu||'0.5'}, memory: '${c.memory||'1.0Gi'}' } }]`);
      lines.push(`    scale: { minReplicas: ${c.minReplicas||1}, maxReplicas: ${c.replicas||10} }`);
      lines.push(`    ingress: { external: ${c.ingress === 'external'}, targetPort: ${c.targetPort||80} }`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'fw': {
      const fwZones = c.availabilityZones ? c.availabilityZones.split(',').map(z => z.trim()) : ['1','2','3'];
      lines.push(`module ${safeName} 'br/public:avm/res/network/azure-firewall:0.3.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    skuTier: '${c.sku||'Premium'}'`);
      lines.push(`    threatIntelMode: '${c.threatIntelMode||'Alert'}'`);
      lines.push(`    hubIPAddresses: { publicIPs: { count: 1 } }`);
      lines.push(`    zones: [${fwZones.map(z => `'${z}'`).join(', ')}]`);
      if (c.dnsProxy === 'true') {
        lines.push(`    additionalProperties: { 'Network.DNS.EnableProxy': 'true' }`);
      }
      if (c.policyName) {
        lines.push(`    firewallPolicyId: '${c.policyName}'`);
      }
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'nva': {
      lines.push(`// FortiGate NVA: ${res.name} — Vendor: ${c.vendor||'Fortinet'}, Version: ${c.version||'7.4'}, License: ${c.licenseType||'PAYG'}`);
      lines.push(`module ${safeName} 'br/public:avm/res/compute/virtual-machine:0.5.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    vmSize: 'Standard_F4s_v2'`);
      lines.push(`    plan: { publisher: '${(c.vendor||'fortinet').toLowerCase()}', product: 'fortinet_fortigate-vm_v5', name: 'fortinet_fg-vm' }`);
      lines.push(`    // Mode: ${c.mode||'Active/Passive'} | License: ${c.licenseType||'PAYG'}`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'agw': {
      lines.push(`module ${safeName} 'br/public:avm/res/network/application-gateway:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { name: '${c.sku||'WAF_v2'}', tier: '${c.tier||c.sku||'WAF_v2'}', capacity: ${c.capacity||2} }`);
      lines.push(`    sslPolicy: { policyType: 'Predefined', policyName: '${c.sslPolicy||'AppGwSslPolicy20220101'}' }`);
      lines.push(`    gatewayIPConfigurations: [{ subnetId: '${sn.name}' }]`);
      lines.push(`    frontendIPConfigurations: [{ publicIPAddressId: '${res.name}-pip' }]`);
      lines.push(`    frontendPorts: [{ port: 80 }]`);
      lines.push(`    backendAddressPools: [{ name: 'defaultBackendPool' }]`);
      lines.push(`    backendHttpSettingsCollection: [{ port: 80, protocol: 'Http' }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'lb': {
      const lbIsPublic = (c.type||'Internal') === 'Public';
      lines.push(`module ${safeName} 'br/public:avm/res/network/load-balancer:0.2.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: '${c.sku||'Standard'}'`);
      if (lbIsPublic) {
        lines.push(`    frontendIPConfigurations: [{ name: '${res.name}-frontend', publicIPAddressId: '${res.name}-pip' }]`);
      } else {
        lines.push(`    frontendIPConfigurations: [{ name: '${res.name}-frontend', subnetId: '${sn.name}' }]`);
      }
      const probeparts = (c.healthProbe||'TCP/80').split('/');
      lines.push(`    backendAddressPools: [{ name: '${res.name}-backend' }]`);
      lines.push(`    probes: [{ name: '${res.name}-probe', protocol: '${probeparts[0]||'Tcp'}', port: ${probeparts[1]||80} }]`);
      lines.push(`    loadBalancingRules: [{ name: '${res.name}-rule', frontendPort: 80, backendPort: 80, protocol: 'Tcp' }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'gw': {
      lines.push(`module ${safeName} 'br/public:avm/res/network/virtual-network-gateway:0.2.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    gatewayType: 'Vpn'`);
      lines.push(`    vpnType: '${c.vpnType||'RouteBased'}'`);
      lines.push(`    vpnGatewayGeneration: '${c.generation||'Generation2'}'`);
      lines.push(`    sku: { name: '${c.sku||'VpnGw2AZ'}', tier: '${c.sku||'VpnGw2AZ'}' }`);
      lines.push(`    activeActive: ${c.activeActive||'false'}`);
      if (c.bgpAsn && c.bgpAsn !== '65515') {
        lines.push(`    enableBgp: true`);
        lines.push(`    bgpSettings: { asn: ${c.bgpAsn} }`);
      }
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'ergw': {
      lines.push(`module ${safeName} 'br/public:avm/res/network/virtual-network-gateway:0.2.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    gatewayType: '${c.gatewayType||'ExpressRoute'}'`);
      lines.push(`    sku: { name: '${c.sku||'ErGw2AZ'}', tier: '${c.sku||'ErGw2AZ'}' }`);
      if (c.expressRouteCircuitId) {
        lines.push(`    // ExpressRoute Circuit: ${c.expressRouteCircuitId}`);
      }
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'bas': {
      lines.push(`module ${safeName} 'br/public:avm/res/network/bastion-host:0.2.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: '${c.sku||'Standard'}'`);
      lines.push(`    scaleUnits: ${c.scaleUnits||2}`);
      lines.push(`    virtualNetworkId: '${vnet.name}'`);
      if (c.shareableLink === 'true') lines.push(`    enableShareableLink: true`);
      if (c.ipConnect === 'true') lines.push(`    enableIpConnect: true`);
      if (c.tunneling === 'true') lines.push(`    enableTunneling: true`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'afd': {
      lines.push(`module ${safeName} 'br/public:avm/res/cdn/profile:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { name: '${c.sku||'Premium'}_AzureFrontDoor' }`);
      lines.push(`    originResponseTimeoutSeconds: 60`);
      lines.push(`    endpoints: [{ name: '${c.endpoints||res.name+'-endpoint'}' }]`);
      lines.push(`    originGroups: [{ name: '${c.originGroups||'default-origin-group'}' }]`);
      if (c.wafPolicy) {
        lines.push(`    securityPolicies: [{ name: '${c.wafPolicy}' }]`);
      }
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'pe': {
      const peGroupId = c.groupId || c.subResource || c.target || 'blob';
      const peConnectionName = c.connectionName || `${res.name}-connection`;
      lines.push(`module ${safeName} 'br/public:avm/res/network/private-endpoint:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    subnetResourceId: '${sn.name}'`);
      lines.push(`    privateLinkServiceConnections: [{ name: '${peConnectionName}', privateLinkServiceId: '<target-resource-id>', groupIds: ['${peGroupId}'] }]`);
      if (c.privateDnsZoneId) {
        lines.push(`    privateDnsZoneGroup: { privateDnsZoneGroupConfigs: [{ privateDnsZoneResourceId: '${c.privateDnsZoneId}' }] }`);
      }
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'nsg': {
      let nsgRules = [];
      try { nsgRules = JSON.parse(c.rules || '[]'); } catch(e) { nsgRules = []; }
      if (nsgRules.length === 0) {
        nsgRules = [
          {name:'Allow-HTTP',priority:'100',direction:'Inbound',access:'Allow',protocol:'Tcp',srcPort:'*',dstPort:'80',srcAddr:'*',dstAddr:'*'},
          {name:'Allow-HTTPS',priority:'110',direction:'Inbound',access:'Allow',protocol:'Tcp',srcPort:'*',dstPort:'443',srcAddr:'*',dstAddr:'*'}
        ];
      }
      lines.push(`module ${safeName} 'br/public:avm/res/network/network-security-group:0.3.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    securityRules: [`);
      nsgRules.forEach(rule => {
        lines.push(`      { name: '${rule.name}', priority: ${rule.priority||100}, direction: '${rule.direction||'Inbound'}', access: '${rule.access||'Allow'}', protocol: '${rule.protocol||'Tcp'}', sourceAddressPrefix: '${rule.srcAddr||'*'}', destinationAddressPrefix: '${rule.dstAddr||'*'}', sourcePortRange: '${rule.srcPort||'*'}', destinationPortRange: '${rule.dstPort||'80'}' }`);
      });
      lines.push(`    ]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'sql': {
      lines.push(`module ${safeName}_server 'br/public:avm/res/sql/server:0.4.0' = {`);
      lines.push(`  name: '${res.name}-server'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}-server'`);
      lines.push(`    administratorLogin: 'sqladmin'`);
      lines.push(`    administratorLoginPassword: '<password>'`);
      lines.push(`    databases: [{ name: '${res.name}', sku: { name: 'GP_Gen5', tier: 'GeneralPurpose', capacity: ${c.vcores||4} } }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'cosmos': {
      lines.push(`module ${safeName} 'br/public:avm/res/document-db/database-account:0.6.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    databaseAccountOfferType: 'Standard'`);
      lines.push(`    kind: '${c.api === 'MongoDB' ? 'MongoDB' : 'GlobalDocumentDB'}'`);
      lines.push(`    consistencyPolicy: { defaultConsistencyLevel: 'Session' }`);
      lines.push(`    locations: [{ locationName: '${rg.location}', failoverPriority: 0 }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'sa': {
      lines.push(`module ${safeName} 'br/public:avm/res/storage/storage-account:0.9.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name.replace(/[^a-z0-9]/g,'').substring(0,24)}'`);
      lines.push(`    kind: 'StorageV2'`);
      lines.push(`    skuName: 'Standard_${c.replication||'ZRS'}'`);
      lines.push(`    minimumTlsVersion: 'TLS1_2'`);
      lines.push(`    allowBlobPublicAccess: false`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'redis': {
      lines.push(`module ${safeName} 'br/public:avm/res/cache/redis:0.3.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { name: 'Premium', family: 'P', capacity: 1 }`);
      lines.push(`    minimumTlsVersion: '1.2'`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'adls': {
      lines.push(`module ${safeName} 'br/public:avm/res/storage/storage-account:0.9.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name.replace(/[^a-z0-9]/g,'').substring(0,24)}'`);
      lines.push(`    kind: 'StorageV2'`);
      lines.push(`    skuName: 'Standard_LRS'`);
      lines.push(`    isHnsEnabled: true`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'kv': {
      lines.push(`module ${safeName} 'br/public:avm/res/key-vault/vault:0.6.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { family: 'A', name: '${(c.sku||'premium').toLowerCase()}' }`);
      lines.push(`    enablePurgeProtection: true`);
      lines.push(`    enableRbacAuthorization: true`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'app': {
      lines.push(`module ${safeName} 'br/public:avm/res/web/site:0.6.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    kind: 'app,linux'`);
      lines.push(`    serverFarmResourceId: '${res.name}-plan'`);
      lines.push(`    siteConfig: { alwaysOn: true, httpsOnly: true, minTlsVersion: '1.2' }`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'apim': {
      lines.push(`module ${safeName} 'br/public:avm/res/api-management/service:0.5.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    publisherName: 'MyOrganization'`);
      lines.push(`    publisherEmail: 'admin@example.com'`);
      lines.push(`    sku: { name: '${c.tier||'Developer'}', capacity: 1 }`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'sb': {
      lines.push(`module ${safeName} 'br/public:avm/res/service-bus/namespace:0.6.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { name: '${c.tier||'Premium'}', tier: '${c.tier||'Premium'}', capacity: 1 }`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'evh': {
      lines.push(`module ${safeName} 'br/public:avm/res/event-hub/namespace:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { name: '${c.tier||'Standard'}', tier: '${c.tier||'Standard'}', capacity: 1 }`);
      lines.push(`    eventhubs: [{ name: '${res.name}-hub', partitionCount: 4, messageRetentionInDays: 7 }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'logic': {
      lines.push(`module ${safeName} 'br/public:avm/res/logic/workflow:0.3.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    state: 'Enabled'`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'foundry': {
      lines.push(`module ${safeName} 'br/public:avm/res/cognitive-services/account:0.5.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    kind: 'AIServices'`);
      lines.push(`    sku: { name: '${c.sku||'S0'}' }`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'openai': {
      lines.push(`module ${safeName} 'br/public:avm/res/cognitive-services/account:0.5.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    kind: 'OpenAI'`);
      lines.push(`    sku: { name: 'S0' }`);
      lines.push(`    customSubDomainName: '${res.name}'`);
      lines.push(`    deployments: [{ name: '${c.model||'gpt-4o'}', model: { format: 'OpenAI', name: '${c.model||'gpt-4o'}', version: 'latest' }, sku: { name: 'Standard', capacity: 10 } }]`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    case 'monitor': {
      lines.push(`module ${safeName} 'br/public:avm/res/operational-insights/workspace:0.4.0' = {`);
      lines.push(`  name: '${res.name}'`);
      lines.push(`  scope: ${rgRef}`);
      lines.push(`  params: {`);
      lines.push(`    name: '${res.name}'`);
      lines.push(`    sku: { name: 'PerGB2018' }`);
      lines.push(`    retentionInDays: ${c.retentionDays||90}`);
      lines.push(`  }`);
      lines.push(`}\n`);
      break;
    }
    default: {
      lines.push(`// module ${safeName} 'br/public:avm/res/...' — type ${res.type} not yet supported`);
      break;
    }
  }
  return lines;
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
            lines.push(...generateBicepResource(res, rg, vnet, sn));
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
          const zoneName = res.config.fullZoneName || res.config.zone;
          const safeName = zoneName.replace(/[^a-zA-Z0-9]/g,'_');
          lines.push(`module privateDnsZone_${safeName} 'br/public:avm/res/network/private-dns-zone:0.3.0' = {`);
          lines.push(`  name: '${zoneName}'`);
          lines.push(`  scope: ${rg.id.replace(/-/g,'_')}`);
          lines.push(`  params: {`);
          lines.push(`    name: '${zoneName}'`);
          if(res.config.vnetLinks && res.config.vnetLinks.length > 0) {
            lines.push(`    virtualNetworkLinks: [`);
            res.config.vnetLinks.forEach(link => {
              const enableReg = link.registrationEnabled || res.config.autoRegistration === 'true';
              lines.push(`      { virtualNetworkResourceId: ${link.vnetName.replace(/[^a-zA-Z0-9]/g,'_')}.id, registrationEnabled: ${enableReg} }`);
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
