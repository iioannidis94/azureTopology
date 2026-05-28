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
          });
        });
        lines.push('');
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
            lines.push(`// module ${res.name.replace(/[^a-zA-Z0-9]/g,'_')} 'br/public:avm/res/...'`);
          });
        });
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
