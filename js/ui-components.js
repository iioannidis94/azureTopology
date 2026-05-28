import { state, esc, uid, fullUpdate, saveState, getVnetsInRg, getRgResources, RES_TYPES, RES_CATEGORIES, AZURE_ICON_BASE, VNET_COLORS, SUB_COLORS, isValidCidr, checkCidrOverlap, nextAvailableVnetCidr, nextAvailableSubnetCidr, nextAvailableSubnetCidrFromParsed, parseCidr } from './state-management.js';
import { selectNode } from './canvas-engine.js';

// ================================================================
// SECURITY POSTURE ANALYSIS
// ================================================================
function analyzeSecurityPosture() {
  const findings = [];
  const allVnets = [state.hub, ...state.spokes];

  function vnetResources(vnet) { return vnet.subnets.flatMap(sn => sn.resources); }
  function subnetHasType(sn, type) { return sn.resources.some(r => r.type === type); }
  function vnetHasType(vnet, type) { return vnet.subnets.some(sn => subnetHasType(sn, type)); }

  // 1. SQL without Private Endpoint
  allVnets.forEach(vnet => {
    vnet.subnets.forEach(sn => {
      sn.resources.filter(r => r.type === 'sql' || r.type === 'cosmos').forEach(r => {
        const vnetHasPe = vnetHasType(vnet, 'pe');
        if (!vnetHasPe) {
          findings.push({ severity: 'warning', icon: '⚠️', message: `${r.name} has no Private Endpoint in ${vnet.name}. Data may be exposed over public internet.`, resId: r.id });
        }
      });
    });
  });

  // 2. VM without NSG
  allVnets.forEach(vnet => {
    vnet.subnets.forEach(sn => {
      const vms = sn.resources.filter(r => r.type === 'vm' || r.type === 'vmss');
      const hasNsg = subnetHasType(sn, 'nsg');
      if (vms.length > 0 && !hasNsg) {
        findings.push({ severity: 'warning', icon: '⚠️', message: `Subnet "${sn.name}" has VMs without a Network Security Group. Traffic is unrestricted.`, resId: vms[0].id });
      }
    });
  });

  // 3. Public App without WAF/Front Door
  allVnets.forEach(vnet => {
    const hasApp = vnetHasType(vnet, 'app');
    const hasWaf = vnetHasType(vnet, 'agw') || vnetHasType(vnet, 'afd');
    if (hasApp && !hasWaf) {
      const firstApp = vnetResources(vnet).find(r => r.type === 'app');
      findings.push({ severity: 'suggestion', icon: '💡', message: `App Service in ${vnet.name} has no WAF (App Gateway) or Front Door. Consider adding one for DDoS and OWASP protection.`, resId: firstApp?.id });
    }
  });

  // 4. Key Vault without Private Endpoint
  allVnets.forEach(vnet => {
    const hasKv = vnetHasType(vnet, 'kv');
    const hasPe = vnetHasType(vnet, 'pe');
    if (hasKv && !hasPe) {
      const firstKv = vnetResources(vnet).find(r => r.type === 'kv');
      findings.push({ severity: 'recommendation', icon: '🔐', message: `Key Vault in ${vnet.name} has no Private Endpoint. Restrict access to private network for better security.`, resId: firstKv?.id });
    }
  });

  // 5. Hub without Firewall
  if (!vnetHasType(state.hub, 'fw') && !vnetHasType(state.hub, 'nva')) {
    findings.push({ severity: 'recommendation', icon: '🛡️', message: `Hub VNet "${state.hub.name}" has no Azure Firewall or NVA. All traffic between spokes is unfiltered.`, resId: state.hub.id });
  }

  // 6. Storage Account without Private Endpoint
  allVnets.forEach(vnet => {
    vnetResources(vnet).filter(r => r.type === 'sa' || r.type === 'adls').forEach(r => {
      const vnetHasPe = vnetHasType(vnet, 'pe');
      if (!vnetHasPe) {
        findings.push({ severity: 'suggestion', icon: '💡', message: `Storage Account "${r.name}" has no Private Endpoint in ${vnet.name}. Consider adding private connectivity.`, resId: r.id });
      }
    });
  });

  // 7. AKS without Key Vault
  const allResources = [state.hub, ...state.spokes].flatMap(v => v.subnets.flatMap(sn => sn.resources));
  const aksResource = allResources.find(r => r.type === 'aks');
  const hasKvAnywhere = allResources.some(r => r.type === 'kv');
  if (aksResource && !hasKvAnywhere) {
    findings.push({ severity: 'suggestion', icon: '💡', message: `AKS Cluster "${aksResource.name}" detected without Key Vault in the architecture. Consider adding Key Vault for secrets management.`, resId: aksResource.id });
  }

  return findings;
}

export function renderSecurityPanel() {
  const panel = document.getElementById('security-panel');
  const findings = analyzeSecurityPosture();

  if (findings.length === 0) {
    panel.innerHTML = `<div class="security-score"><div class="security-score-badge good">A+</div><div class="security-score-label">Security Score<br><span style="font-size:9px;font-weight:normal;">No issues detected</span></div></div><div class="security-empty">✅ Architecture follows best practices</div>`;
    return;
  }

  const warnings = findings.filter(f => f.severity === 'warning').length;
  const suggestions = findings.filter(f => f.severity === 'suggestion').length;
  const recommendations = findings.filter(f => f.severity === 'recommendation').length;

  let grade, gradeClass;
  if (warnings >= 3) { grade = 'D'; gradeClass = 'danger'; }
  else if (warnings >= 2) { grade = 'C'; gradeClass = 'danger'; }
  else if (warnings >= 1) { grade = 'B'; gradeClass = 'warning'; }
  else if (suggestions + recommendations > 0) { grade = 'B+'; gradeClass = 'warning'; }
  else { grade = 'A+'; gradeClass = 'good'; }

  const summaryParts = [];
  if (warnings > 0) summaryParts.push(`${warnings} warning${warnings!==1?'s':''}`);
  if (suggestions > 0) summaryParts.push(`${suggestions} suggestion${suggestions!==1?'s':''}`);
  if (recommendations > 0) summaryParts.push(`${recommendations} recommendation${recommendations!==1?'s':''}`);

  let h = `<div class="security-score"><div class="security-score-badge ${gradeClass}">${grade}</div><div class="security-score-label">Security Score<br><span style="font-size:9px;font-weight:normal;">${summaryParts.join(', ')}</span></div></div>`;

  findings.forEach(f => {
    const classes = `security-item ${f.severity}${f.resId ? ' clickable' : ''}`;
    const extraAttrs = f.resId ? ` onclick="window._selectNode('${f.resId}')" title="Click to select resource"` : '';
    h += `<div class="${classes}"${extraAttrs}><span class="sev-icon">${f.icon}</span><div class="sev-text"><span class="sev-label ${f.severity}">${f.severity}</span><br>${esc(f.message)}</div></div>`;
  });

  panel.innerHTML = h;
}

export function toggleSecurityPanel() {
  const panel = document.getElementById('security-panel');
  const toggle = document.getElementById('security-panel-toggle');
  const collapsed = panel.classList.toggle('collapsed');
  toggle.textContent = collapsed ? '▶' : '▼';
}

export function toggleCostPanel() {
  const panel = document.getElementById('cost-panel');
  const toggle = document.getElementById('cost-panel-toggle');
  const collapsed = panel.classList.toggle('collapsed');
  toggle.textContent = collapsed ? '▶' : '▼';
}

// ================================================================
// TOGGLES & ON PREM
// ================================================================
export function toggleTheme(){ state.theme=state.theme==='drawio'?'dark':'drawio'; document.body.classList.toggle('theme-drawio',state.theme==='drawio'); fullUpdate(); }
export function toggleLayout(){ state.layout=state.layout==='grid'?'radial':'grid'; state.offset={x:0,y:0}; state.scale=1; fullUpdate(); }
export function fitToScreen(){state.offset={x:0,y:0};state.scale=1;saveState();window._draw();}
export function toggleOnPrem() { state.onPrem.enabled = !state.onPrem.enabled; fullUpdate(); }
export function updateOnPremName(val) { state.onPrem.name = val; fullUpdate(); }
export function updateOnPremCidr(val) { state.onPrem.cidr = val; fullUpdate(); }

// ================================================================
// LEFT SIDEBAR (Nested Subnets)
// ================================================================
export function renderSidebar(){
  const el=document.getElementById('sidebar-left');
  
  let h = `<div class="tree-section-title">// Hybrid Connectivity</div>`;
  h += `<div class="onprem-block">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:16px;">🏢</span>
            <div><div style="font-size:11px; font-weight:bold; color:var(--azure-blue)">On-Premises Datacenter</div><div style="font-size:9px; color:var(--muted)">S2S VPN / ExpressRoute</div></div>
          </div>
          <button style="border:none; padding:4px 8px; border-radius:12px; font-weight:bold; font-size:10px; cursor:pointer; background:${state.onPrem.enabled?'var(--success)':'rgba(123,163,192,0.2)'}; color:${state.onPrem.enabled?'#000':'var(--text)'}" onclick="window._toggleOnPrem()">
            ${state.onPrem.enabled?'ON':'OFF'}
          </button>
        </div>`;

  h += `<div class="tree-section-title">// Azure Hierarchy</div>`;

  state.subscriptions.forEach((sub,si)=>{
    const rgs=state.resourceGroups.filter(rg=>rg.subId===sub.id);
    const subColor=SUB_COLORS[si%SUB_COLORS.length];
    h+=`<div class="sub-block">
      <div class="sub-header" style="border-left-color:${subColor}">
        <span class="sub-icon">☁️</span>
        <input class="sub-name-input" value="${esc(sub.name)}" onchange="window._renameSub('${sub.id}',this.value)" onclick="event.stopPropagation()">
        <button class="icon-btn" title="Add Resource Group" onclick="window._addRg('${sub.id}')">📁+</button>
        <button class="icon-btn danger" title="Delete Subscription" onclick="window._deleteSub('${sub.id}')">🗑</button>
      </div>
      <div class="sub-body">`;

    rgs.forEach((rg,ri)=>{
      const rgVnets=getVnetsInRg(rg.id);
      h+=`<div class="rg-block" id="rgblock-${rg.id}">
        <div class="rg-header">
          <span style="font-size:12px;">📁</span>
          <input class="rg-name-input" value="${esc(rg.name)}" onchange="window._renameRg('${rg.id}',this.value)" onclick="event.stopPropagation()">
          <select class="rg-loc-select" onchange="window._setRgLocation('${rg.id}',this.value)" onclick="event.stopPropagation()">
            ${['eastus','westeurope','westus2','northeurope','southeastasia','australiaeast','uksouth'].map(l=>`<option value="${l}"${rg.location===l?' selected':''}>${l}</option>`).join('')}
          </select>
          <button class="icon-btn danger" title="Delete RG" onclick="event.stopPropagation();window._deleteRg('${rg.id}')">🗑</button>
        </div>
        <div class="rg-body">`;

      rgVnets.forEach(vnet=>{
        const isHub=vnet.id==='hub';
        const isSelVnet=state.selectedId===vnet.id;
        h+=`<div class="vnet-card" style="border-left:3px solid ${vnet.color};${isSelVnet?'border-color:var(--azure-blue);box-shadow:0 0 5px rgba(0,120,212,0.3)':''}">
          <div class="vnet-card-header">
            <div class="vnet-dot" style="background:${vnet.color}"></div>
            <input class="vnet-name-input" value="${esc(vnet.name)}" onchange="window._updateVnet('${vnet.id}','name',this.value)" onclick="window._selectNode('${vnet.id}')">
            <input class="vnet-cidr-input" value="${esc(vnet.cidr)}" onchange="window._updateVnet('${vnet.id}','cidr',this.value)" onclick="window._selectNode('${vnet.id}')">
            ${!isHub?`<button class="icon-btn danger" title="Delete Spoke" onclick="window._deleteSpoke('${vnet.id}')">🗑</button>`:''}
          </div>`;

        vnet.subnets.forEach(sn => {
          const isSelSn = state.selectedId === sn.id;
          h += `<div class="subnet-card" style="${isSelSn?'border-color:var(--azure-blue);':''}">
                  <div class="subnet-header">
                    <span style="font-size:10px;color:var(--muted)">⬚</span>
                    <input class="subnet-name-input" value="${esc(sn.name)}" onchange="window._updateSubnet('${vnet.id}','${sn.id}','name',this.value)" onclick="window._selectNode('${sn.id}')">
                    <input class="subnet-cidr-input" value="${esc(sn.cidr)}" onchange="window._updateSubnet('${vnet.id}','${sn.id}','cidr',this.value)" onclick="window._selectNode('${sn.id}')">
                  </div>
                  <div class="resource-chips">`;
          sn.resources.forEach(res=>{
            const rt=RES_TYPES[res.type] || RES_TYPES.vm;
            const isSelRes=state.selectedId===res.id;
            h+=`<div class="chip${isHub?' hub-chip':''}" style="${isSelRes?'background:var(--azure-blue);color:white;border-color:var(--azure-blue);':''}" onclick="window._selectNode('${res.id}')">
              <img src="${AZURE_ICON_BASE}${rt.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
              <span style="display:none; font-size:10px;">${rt.icon}</span>
              <span>${esc(res.name)}</span>
            </div>`;
          });
          h+=`</div>
              <div class="add-res-container">
                <button class="add-btn subnet-level" onclick="window._toggleDropdown('${sn.id}')">➕ Add Resource to Subnet</button>
                <div class="res-dropdown" id="dropdown-${sn.id}">
                  <div class="res-search-container">
                    <input type="text" class="res-search-input" placeholder="Search resources..." onkeyup="window._filterResources(event, '${sn.id}')" onclick="event.stopPropagation()">
                  </div>`;
          const cats={};
          Object.keys(RES_TYPES).forEach(k=>{const t=RES_TYPES[k];if(!cats[t.cat])cats[t.cat]=[];cats[t.cat].push({key:k,...t});});
          Object.keys(cats).forEach(cat=>{
            h+=`<div class="res-dd-section">${RES_CATEGORIES[cat]||cat}</div>`;
            cats[cat].forEach(t=>{
                h+=`<div class="res-option" onclick="window._addResource('${vnet.id}','${sn.id}','${t.key}')">
                  <img src="${AZURE_ICON_BASE}${t.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
                  <span style="display:none">${t.icon}</span> <span class="res-label">${t.label}</span>
                </div>`;
            });
          });
          h+=`</div></div></div>`;
        });

        h+=`<button class="add-btn vnet-level" onclick="window._addSubnet('${vnet.id}')">➕ Add Subnet</button>`;
        h+=`</div>`;
      });

      h+=`<button class="add-btn vnet-level" onclick="window._addSpoke('${rg.id}')">➕ Add Spoke VNet</button>`;

      // RG-level resources (DNS zones etc)
      const rgRes = getRgResources(rg.id);
      if (rgRes.length > 0) {
        h+=`<div class="rg-resources-section"><div class="rg-res-title">RG-Level Resources</div>`;
        rgRes.forEach(res => {
          const rt = RES_TYPES[res.type] || RES_TYPES.dns;
          const isSelRes = state.selectedId === res.id;
          h+=`<div class="chip rg-chip" style="${isSelRes?'background:var(--azure-blue);color:white;border-color:var(--azure-blue);':''}" onclick="window._selectNode('${res.id}')">
            <img src="${AZURE_ICON_BASE}${rt.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span style="display:none; font-size:10px;">${rt.icon}</span>
            <span>${esc(res.name)}</span>
          </div>`;
        });
        h+=`</div>`;
      }
      h+=`<div class="add-res-container">
        <button class="add-btn rg-level" onclick="window._toggleDropdown('rg-${rg.id}')">➕ Add DNS / RG Resource</button>
        <div class="res-dropdown" id="dropdown-rg-${rg.id}">
          <div class="res-search-container">
            <input type="text" class="res-search-input" placeholder="Search..." onkeyup="window._filterResources(event, 'rg-${rg.id}')" onclick="event.stopPropagation()">
          </div>
          <div class="res-dd-section">DNS & RG-Level Resources</div>`;
      Object.keys(RES_TYPES).filter(k => RES_TYPES[k].rgLevel).forEach(k => {
        const t = RES_TYPES[k];
        h+=`<div class="res-option" onclick="window._addRgResource('${rg.id}','${k}')">
          <img src="${AZURE_ICON_BASE}${t.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span style="display:none">${t.icon}</span> <span class="res-label">${t.label}</span>
        </div>`;
      });
      h+=`</div></div>`;

      h+=`</div></div>`;
    });

    h+=`<button class="add-btn rg-level" onclick="window._addRg('${sub.id}')">📁 Add Resource Group</button>`;
    h+=`</div></div>`;
  });

  h+=`<button class="add-btn sub-level" onclick="window._addSub()">☁️ Add Subscription</button>`;
  el.innerHTML=h;
}

// ================================================================
// RIGHT EDITOR
// ================================================================
export function renderEditor(){
  const el=document.getElementById('editor-container');
  if(!state.selectedId){
    el.innerHTML=`<div style="text-align:center;color:var(--muted);font-size:11px;margin-top:20px;line-height:1.9;">← Click a resource, subnet or VNet<br>to edit its properties</div>`;
    return;
  }
  
  if (state.selectedId === 'onprem') {
    el.innerHTML = `
      <div class="editor-panel" style="border-color:#107C10">
        <div class="editor-header" style="color:#107C10">🏢 ${esc(state.onPrem.name)}</div>
        <div class="editor-row"><span class="editor-label">Name</span><input class="input-field" value="${esc(state.onPrem.name)}" onchange="window._updateOnPremName(this.value)"></div>
        <div class="editor-row"><span class="editor-label">Local CIDR</span><input class="input-field" value="${esc(state.onPrem.cidr)}" onchange="window._updateOnPremCidr(this.value)"></div>
      </div>`;
    return;
  }

  let obj=null, parent=null, typeObj='none';
  const allVnets = [state.hub, ...state.spokes];
  
  // Check RG-level resources first
  const rgRes = (state.rgResources||[]).find(r => r.id === state.selectedId);
  if (rgRes) {
    obj = rgRes; typeObj = 'rgResource';
  } else {
    for (let v of allVnets) {
      if (v.id === state.selectedId) { obj=v; typeObj='vnet'; break; }
      for (let sn of v.subnets) {
        if (sn.id === state.selectedId) { obj=sn; parent=v; typeObj='subnet'; break; }
        for (let r of sn.resources) {
          if (r.id === state.selectedId) { obj=r; parent=sn; typeObj='resource'; break; }
        }
        if (obj) break;
      }
      if (obj) break;
    }
  }

  if(!obj){state.selectedId=null;return renderEditor();}

  let h=`<div class="editor-panel">`;

  if(typeObj === 'vnet'){
    const allRgOpts=state.resourceGroups.map(rg=>{
      const sub=state.subscriptions.find(s=>s.id===rg.subId);
      return `<option value="${rg.id}" ${obj.rgId===rg.id?'selected':''}>${sub?sub.name+' / ':''} ${rg.name}</option>`;
    }).join('');

    h+=`<div class="editor-header">🌐 ${esc(obj.name)}</div>
      <div class="editor-row"><span class="editor-label">VNet Name</span><input class="input-field" value="${esc(obj.name)}" onchange="window._updateVnet('${obj.id}','name',this.value)"></div>
      <div class="editor-row"><span class="editor-label">CIDR Block</span><input class="input-field" value="${esc(obj.cidr)}" onchange="window._updateVnet('${obj.id}','cidr',this.value)"></div>
      <div class="editor-row"><span class="editor-label">Resource Group</span><select class="input-field" onchange="window._updateVnet('${obj.id}','rgId',this.value)">${allRgOpts}</select></div>`;
    
    let peerHtml = `<div class="editor-row" style="margin-top:10px;"><span class="editor-label">VNet Peerings</span><div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">`;
    allVnets.forEach(v => {
      if (v.id === obj.id) return;
      const actuallyPeered = (obj.peerings || []).includes(v.id) || (v.peerings || []).includes(obj.id);
      peerHtml += `<button style="width:100%;padding:8px;border-radius:4px;cursor:pointer;font-family:JetBrains Mono;font-size:10px;font-weight:bold;border:1px solid ${actuallyPeered ? 'var(--azure-blue)' : 'var(--border)'};background:${actuallyPeered ? 'rgba(0,120,212,.1)' : 'transparent'};color:${actuallyPeered ? 'var(--azure-blue)' : 'var(--text)'};transition:0.2s;" onclick="window._togglePeering('${obj.id}', '${v.id}')">${actuallyPeered ? '🔗 ' : '🔌 '}${esc(v.name)}</button>`;
    });
    peerHtml += `</div></div>`;
    h += peerHtml;

    if(obj.id!=='hub'){
      h+=`<button style="width:100%;padding:8px;border-radius:4px;cursor:pointer;font-size:10px;border:1px dashed var(--danger);background:transparent;color:var(--danger);font-family:JetBrains Mono;margin-top:10px;transition:0.2s;" onmouseover="this.style.background='var(--danger)';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='var(--danger)'" onclick="window._deleteSpoke('${obj.id}')">🗑 Delete Spoke</button>`;
    }

  } else if (typeObj === 'subnet') {
    h+=`<div class="editor-header">⬚ Subnet</div>
      <div class="editor-row"><span class="editor-label">Subnet Name</span><input class="input-field" value="${esc(obj.name)}" onchange="window._updateSubnet('${parent.id}','${obj.id}','name',this.value)"></div>
      <div class="editor-row"><span class="editor-label">CIDR Block</span><input class="input-field" value="${esc(obj.cidr)}" onchange="window._updateSubnet('${parent.id}','${obj.id}','cidr',this.value)"></div>
      <button style="width:100%;padding:8px;border-radius:4px;cursor:pointer;font-size:10px;border:1px dashed var(--danger);background:transparent;color:var(--danger);font-family:JetBrains Mono;margin-top:10px;transition:0.2s;" onmouseover="this.style.background='var(--danger)';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='var(--danger)'" onclick="window._deleteSubnet('${parent.id}','${obj.id}')">🗑 Delete Subnet</button>`;
  } else if (typeObj === 'resource') {
    const rt=RES_TYPES[obj.type]||{color:'#888',label:'Resource', icon:'❓'};
    h+=`<div class="editor-header">
          <img src="${AZURE_ICON_BASE}${rt.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span style="display:none">${rt.icon}</span> 
          ${rt.label}
        </div>
      <div class="editor-row"><span class="editor-label">Name</span><input class="input-field" value="${esc(obj.name)}" onchange="window._updateResource('${obj.id}','name',this.value)"></div>`;
    
    if(obj.type === 'vm'){
      // VM: Structured sections for full configuration
      const cfg = obj.config;
      const vmSections = [
        { title:'💻 Compute', keys:['size','os','availabilityZone'] },
        { title:'💾 OS Disk', keys:['diskType','osDiskSizeGB'] },
        { title:'📀 Data Disks', keys:['dataDisks','dataDiskSizeGB','dataDiskType'] },
        { title:'🌐 Networking', keys:['acceleratedNetworking','publicIp'] },
        { title:'🔐 Security', keys:['authType','securityType','vTpmEnabled','secureBootEnabled','managedIdentity'] },
        { title:'⚙️ Management', keys:['bootDiagnostics','backupEnabled','patchMode'] },
      ];
      vmSections.forEach(section => {
        const sectionKeys = section.keys.filter(k => k in cfg);
        if(sectionKeys.length === 0) return;
        h+=`<div style="margin-top:10px;padding:4px 0;border-top:1px solid var(--border);"><span style="font-size:10px;font-weight:bold;color:var(--muted);font-family:JetBrains Mono;">${section.title}</span></div>`;
        sectionKeys.forEach(k => {
          const label = k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
          if(cfg[k]==='true'||cfg[k]==='false'){
            h+=`<div class="editor-row"><span class="editor-label">${label}</span><select class="input-field" onchange="window._updateResConfig('${obj.id}','${k}',this.value)"><option value="true"${cfg[k]==='true'?' selected':''}>Yes</option><option value="false"${cfg[k]==='false'?' selected':''}>No</option></select></div>`;
          } else {
            h+=`<div class="editor-row"><span class="editor-label">${label}</span><input class="input-field" value="${esc(cfg[k])}" onchange="window._updateResConfig('${obj.id}','${k}',this.value)"></div>`;
          }
        });
      });
      // Show any remaining keys not in sections
      const allSectionKeys = vmSections.flatMap(s=>s.keys);
      Object.keys(cfg).filter(k=>!allSectionKeys.includes(k)).forEach(k=>{
        h+=`<div class="editor-row"><span class="editor-label">${k}</span><input class="input-field" value="${esc(cfg[k])}" onchange="window._updateResConfig('${obj.id}','${k}',this.value)"></div>`;
      });
    } else {
      Object.keys(obj.config).forEach(k=>{
        h+=`<div class="editor-row"><span class="editor-label">${k}</span><input class="input-field" value="${esc(obj.config[k])}" onchange="window._updateResConfig('${obj.id}','${k}',this.value)"></div>`;
      });
    }
    h+=`<button style="width:100%;padding:8px;border-radius:4px;cursor:pointer;font-size:10px;border:1px dashed var(--danger);background:transparent;color:var(--danger);font-family:JetBrains Mono;margin-top:10px;transition:0.2s;" onmouseover="this.style.background='var(--danger)';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='var(--danger)'" onclick="window._deleteResource('${obj.id}')">🗑 Delete Resource</button>`;
  } else if (typeObj === 'rgResource') {
    const rt = RES_TYPES[obj.type]||{color:'#888',label:'Resource', icon:'❓', img:''};
    h+=`<div class="editor-header">
          <img src="${AZURE_ICON_BASE}${rt.img}" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
          <span style="display:none">${rt.icon}</span> 
          ${rt.label}
        </div>
      <div class="editor-row"><span class="editor-label">Name</span><input class="input-field" value="${esc(obj.name)}" onchange="window._updateRgResource('${obj.id}','name',this.value)"></div>
      <div class="editor-row"><span class="editor-label">Zone</span><input class="input-field" value="${esc(obj.config.zone||'')}" onchange="window._updateResConfig('${obj.id}','zone',this.value)"></div>`;
    
    // DNS Records
    if(obj.config.records) {
      h+=`<div class="editor-row" style="margin-top:10px;"><span class="editor-label" style="font-weight:bold;">DNS Records</span></div>`;
      obj.config.records.forEach((rec, idx) => {
        h+=`<div class="editor-row dns-record-row" style="gap:4px;flex-wrap:wrap;border:1px solid var(--border);border-radius:4px;padding:6px;margin-bottom:4px;">
          <input class="input-field" style="flex:1;min-width:60px;" placeholder="Name" value="${esc(rec.name)}" onchange="window._updateDnsRecord('${obj.id}',${idx},'name',this.value)">
          <select class="input-field" style="width:60px;" onchange="window._updateDnsRecord('${obj.id}',${idx},'type',this.value)">
            ${['A','AAAA','CNAME','MX','TXT','NS','SOA','SRV','PTR'].map(t=>`<option${rec.type===t?' selected':''}>${t}</option>`).join('')}
          </select>
          <input class="input-field" style="flex:2;min-width:80px;" placeholder="Value" value="${esc(rec.value)}" onchange="window._updateDnsRecord('${obj.id}',${idx},'value',this.value)">
          <input class="input-field" style="width:50px;" placeholder="TTL" value="${esc(rec.ttl)}" onchange="window._updateDnsRecord('${obj.id}',${idx},'ttl',this.value)">
          <button class="icon-btn danger" onclick="window._deleteDnsRecord('${obj.id}',${idx})">🗑</button>
        </div>`;
      });
      h+=`<button style="width:100%;padding:6px;border-radius:4px;cursor:pointer;font-size:10px;border:1px dashed var(--azure-blue);background:transparent;color:var(--azure-blue);font-family:JetBrains Mono;margin-top:4px;" onclick="window._addDnsRecord('${obj.id}')">➕ Add Record</button>`;
    }
    
    // VNet Links (for Private DNS)
    if(obj.type === 'dns' && obj.config.vnetLinks !== undefined) {
      h+=`<div class="editor-row" style="margin-top:10px;"><span class="editor-label" style="font-weight:bold;">VNet Links</span></div>`;
      (obj.config.vnetLinks||[]).forEach((link, idx) => {
        h+=`<div class="editor-row" style="gap:4px;border:1px solid var(--border);border-radius:4px;padding:6px;margin-bottom:4px;">
          <span style="flex:1;font-size:10px;">🔗 ${esc(link.vnetName)}</span>
          <button class="icon-btn danger" onclick="window._deleteVnetLink('${obj.id}',${idx})">🗑</button>
        </div>`;
      });
      h+=`<button style="width:100%;padding:6px;border-radius:4px;cursor:pointer;font-size:10px;border:1px dashed var(--azure-blue);background:transparent;color:var(--azure-blue);font-family:JetBrains Mono;margin-top:4px;" onclick="window._addVnetLink('${obj.id}')">🔗 Link VNet</button>`;
    }
    
    h+=`<button style="width:100%;padding:8px;border-radius:4px;cursor:pointer;font-size:10px;border:1px dashed var(--danger);background:transparent;color:var(--danger);font-family:JetBrains Mono;margin-top:10px;transition:0.2s;" onmouseover="this.style.background='var(--danger)';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='var(--danger)'" onclick="window._deleteRgResource('${obj.id}')">🗑 Delete Resource</button>`;
  }
  h+=`</div>`;
  el.innerHTML=h;
}

// ================================================================
// STATE MUTATIONS
// ================================================================
export function addSub(){ const n=state.subscriptions.length; const id='sub-'+uid(); state.subscriptions.push({id,name:`Subscription ${n+1}`}); state.resourceGroups.push({id:'rg-'+uid(),name:'rg-new',location:'eastus',subId:id}); fullUpdate(); }
export function deleteSub(id){ if(state.subscriptions.length<=1){alert('Need at least one subscription.');return;} if(!confirm('Delete subscription? VNets will be moved.')) return; const fallbackRg=state.resourceGroups.find(r=>r.subId!==id); if(!fallbackRg){alert('Cannot delete.');return;} const subRgIds=state.resourceGroups.filter(r=>r.subId===id).map(r=>r.id); if(state.hub.rgId&&subRgIds.includes(state.hub.rgId)) state.hub.rgId=fallbackRg.id; state.spokes.forEach(s=>{if(subRgIds.includes(s.rgId))s.rgId=fallbackRg.id;}); state.resourceGroups=state.resourceGroups.filter(r=>r.subId!==id); state.subscriptions=state.subscriptions.filter(s=>s.id!==id); fullUpdate(); }
export function renameSub(id,val){const s=state.subscriptions.find(s=>s.id===id);if(s){s.name=val;saveState();window._draw();}}

export function addRg(subId){ const n=state.resourceGroups.filter(r=>r.subId===subId).length; state.resourceGroups.push({id:'rg-'+uid(),name:`rg-new-${n+1}`,location:'eastus',subId}); fullUpdate(); }
export function deleteRg(id){ if(state.resourceGroups.length<=1){alert('Need at least one resource group.');return;} const fallback=state.resourceGroups.find(r=>r.id!==id); if(!fallback){alert('No fallback.');return;} if(!confirm('Delete resource group?')) return; if(state.hub.rgId===id) state.hub.rgId=fallback.id; state.spokes.forEach(s=>{if(s.rgId===id)s.rgId=fallback.id;}); state.rgResources=(state.rgResources||[]).filter(r=>r.rgId!==id); state.resourceGroups=state.resourceGroups.filter(r=>r.id!==id); fullUpdate(); }
export function renameRg(id,val){const rg=state.resourceGroups.find(r=>r.id===id);if(rg){rg.name=val;saveState();window._draw();}}
export function setRgLocation(id,val){const rg=state.resourceGroups.find(r=>r.id===id);if(rg){rg.location=val;saveState();}}

export function addSpoke(rgId){
  const n=state.spokes.length;
  const cidr = nextAvailableVnetCidr();
  const spokeId = uid();
  // Temporarily create the spoke to calculate subnet CIDR using the same logic
  const p = parseCidr(cidr);
  const subnetCidr = p ? nextAvailableSubnetCidrFromParsed(p, []) : `10.${n+1}.1.0/24`;
  state.spokes.push({ id:spokeId,name:`spoke-${n+1}-vnet`,cidr, color:VNET_COLORS[n%VNET_COLORS.length],peerings:['hub'], rgId:rgId||state.resourceGroups[0]?.id,
    subnets: [{id:uid(), name:'default', cidr:subnetCidr, resources:[]}]
  });
  fullUpdate();
}
export function deleteSpoke(id){
  state.spokes=state.spokes.filter(s=>s.id!==id);
  [state.hub, ...state.spokes].forEach(v => { if (v.peerings) v.peerings = v.peerings.filter(pId => pId !== id); });
  state.selectedId=null; fullUpdate();
}
export function updateVnet(id,key,val){
  const v=[state.hub,...state.spokes].find(v=>v.id===id);
  if(!v) return;
  if(key==='cidr'){
    if(!isValidCidr(val)){ alert('Invalid CIDR format. Use format like 10.0.0.0/16'); return; }
    const overlap = checkCidrOverlap(val, id);
    if(overlap){ alert(`CIDR ${val} overlaps with VNet "${overlap.name}" (${overlap.cidr})`); return; }
  }
  v[key]=val; fullUpdate();
}
export function togglePeering(id1, id2) {
  const v1 = [state.hub,...state.spokes].find(s => s.id === id1);
  const v2 = [state.hub,...state.spokes].find(s => s.id === id2);
  if (!v1 || !v2) return;
  v1.peerings = v1.peerings || []; v2.peerings = v2.peerings || [];
  const hasPeering = v1.peerings.includes(id2) || v2.peerings.includes(id1);
  if (hasPeering) { v1.peerings = v1.peerings.filter(p => p !== id2); v2.peerings = v2.peerings.filter(p => p !== id1); } 
  else { v1.peerings.push(id2); }
  fullUpdate();
}

export function addSubnet(vnetId){
  const vnet=[state.hub,...state.spokes].find(v=>v.id===vnetId);
  if(vnet) { const cidr = nextAvailableSubnetCidr(vnetId); vnet.subnets.push({id:uid(), name:`subnet-${vnet.subnets.length+1}`, cidr, resources:[]}); fullUpdate(); }
}
export function deleteSubnet(vnetId, snId){
  const vnet=[state.hub,...state.spokes].find(v=>v.id===vnetId);
  if(vnet) { vnet.subnets = vnet.subnets.filter(s => s.id !== snId); state.selectedId=null; fullUpdate(); }
}
export function updateSubnet(vnetId, snId, key, val) {
  const vnet=[state.hub,...state.spokes].find(v=>v.id===vnetId);
  const sn = vnet?.subnets.find(s=>s.id===snId);
  if(!sn) return;
  if(key==='cidr'){
    if(!isValidCidr(val)){ alert('Invalid CIDR format. Use format like 10.0.1.0/24'); return; }
    const vnetParsed = parseCidr(vnet.cidr);
    const snParsed = parseCidr(val);
    if(vnetParsed && snParsed && (snParsed.network < vnetParsed.network || snParsed.broadcast > vnetParsed.broadcast)){
      alert(`Subnet CIDR ${val} is outside VNet address space ${vnet.cidr}`); return;
    }
  }
  sn[key]=val; fullUpdate();
}

export function toggleDropdown(id){ 
  document.querySelectorAll('.res-dropdown').forEach(d => {
    if(d.id !== `dropdown-${id}`) d.classList.remove('show');
  }); 
  const dd=document.getElementById(`dropdown-${id}`);
  if(dd){
    dd.classList.toggle('show');
    if(dd.classList.contains('show')){
      const searchInput = dd.querySelector('.res-search-input');
      if(searchInput) {
        searchInput.value = '';
        filterResources({target: searchInput}, id);
        setTimeout(() => searchInput.focus(), 50);
      }
    }
  } 
}

export function filterResources(event, snId) {
  const searchTerm = event.target.value.toLowerCase();
  const dropdown = document.getElementById(`dropdown-${snId}`);
  if (!dropdown) return;

  const options = dropdown.querySelectorAll('.res-option');
  const sections = dropdown.querySelectorAll('.res-dd-section');

  options.forEach(opt => {
    const label = opt.textContent.toLowerCase();
    if (label.includes(searchTerm)) {
      opt.style.display = 'flex';
    } else {
      opt.style.display = 'none';
    }
  });

  sections.forEach(sec => {
    let hasVisibleOptions = false;
    let next = sec.nextElementSibling;
    while (next && next.classList.contains('res-option')) {
      if (next.style.display !== 'none') {
        hasVisibleOptions = true;
        break;
      }
      next = next.nextElementSibling;
    }
    sec.style.display = hasVisibleOptions ? 'block' : 'none';
  });
}

export function addResource(vnetId, snId, resType){
  const vnet=[state.hub,...state.spokes].find(v=>v.id===vnetId);
  const sn = vnet?.subnets.find(s=>s.id===snId);
  const rT=RES_TYPES[resType];
  if(sn && rT) {
    const nr={id:uid(),type:resType,name:`${sn.name.split('-')[0]}-${resType}`,config:{...rT.config}};
    sn.resources.push(nr); document.querySelectorAll('.res-dropdown').forEach(d=>d.classList.remove('show')); selectNode(nr.id);
  }
}
export function deleteResource(resId){
  [state.hub,...state.spokes].forEach(v => v.subnets.forEach(sn => { sn.resources = sn.resources.filter(r => r.id !== resId); }));
  if(state.rgResources) state.rgResources = state.rgResources.filter(r => r.id !== resId);
  state.selectedId=null; fullUpdate();
}
export function updateResource(resId,key,val){
  [state.hub,...state.spokes].forEach(v => v.subnets.forEach(sn => { const r=sn.resources.find(r=>r.id===resId); if(r)r[key]=val; }));
  const rgR = (state.rgResources||[]).find(r => r.id === resId); if(rgR) rgR[key] = val;
  fullUpdate();
}
export function updateResConfig(resId,configKey,val){
  [state.hub,...state.spokes].forEach(v => v.subnets.forEach(sn => { const r=sn.resources.find(r=>r.id===resId); if(r)r.config[configKey]=val; }));
  // Also check RG-level resources
  const rgRes = (state.rgResources||[]).find(r => r.id === resId);
  if(rgRes) rgRes.config[configKey] = val;
  saveState(); renderEditor(); 
}

// ================================================================
// RG-LEVEL RESOURCE MUTATIONS
// ================================================================
export function addRgResource(rgId, resType) {
  if(!state.rgResources) state.rgResources = [];
  const rT = RES_TYPES[resType];
  if(!rT) return;
  const rg = state.resourceGroups.find(r => r.id === rgId);
  const baseName = rg ? rg.name.replace('rg-','') : 'res';
  const config = {...rT.config};
  // Add default records for DNS zones
  if(resType === 'dns') {
    config.records = [{name:'vm1', type:'A', value:'10.0.1.4', ttl:'3600'}];
    config.vnetLinks = [];
    // Auto-link VNets in same RG
    const rgVnets = getVnetsInRg(rgId);
    rgVnets.forEach(v => config.vnetLinks.push({vnetId: v.id, vnetName: v.name, registrationEnabled: false}));
  } else if(resType === 'publicDns') {
    config.records = [{name:'www', type:'A', value:'20.0.0.1', ttl:'3600'}, {name:'@', type:'MX', value:'mail.example.com', ttl:'3600'}];
  }
  const nr = {id:uid(), type:resType, name:`${baseName}-${rT.label.toLowerCase().replace(/\s+/g,'-')}`, config, rgId};
  state.rgResources.push(nr);
  document.querySelectorAll('.res-dropdown').forEach(d=>d.classList.remove('show'));
  selectNode(nr.id);
}

export function deleteRgResource(resId) {
  if(!state.rgResources) return;
  state.rgResources = state.rgResources.filter(r => r.id !== resId);
  state.selectedId = null; fullUpdate();
}

export function updateRgResource(resId, key, val) {
  const r = (state.rgResources||[]).find(r => r.id === resId);
  if(r) { r[key] = val; fullUpdate(); }
}

export function addDnsRecord(resId) {
  const r = (state.rgResources||[]).find(r => r.id === resId);
  if(!r || !r.config) return;
  if(!r.config.records) r.config.records = [];
  r.config.records.push({name:'new-record', type:'A', value:'10.0.0.1', ttl:'3600'});
  saveState(); renderEditor();
}

export function deleteDnsRecord(resId, idx) {
  const r = (state.rgResources||[]).find(r => r.id === resId);
  if(!r || !r.config || !r.config.records) return;
  r.config.records.splice(idx, 1);
  saveState(); renderEditor();
}

export function updateDnsRecord(resId, idx, key, val) {
  const r = (state.rgResources||[]).find(r => r.id === resId);
  if(!r || !r.config || !r.config.records || !r.config.records[idx]) return;
  r.config.records[idx][key] = val;
  saveState();
}

export function addVnetLink(resId) {
  const r = (state.rgResources||[]).find(r => r.id === resId);
  if(!r || !r.config) return;
  if(!r.config.vnetLinks) r.config.vnetLinks = [];
  // Find a VNet not already linked
  const allVnets = [state.hub, ...state.spokes];
  const linkedIds = r.config.vnetLinks.map(l => l.vnetId);
  const available = allVnets.find(v => !linkedIds.includes(v.id));
  if(available) {
    r.config.vnetLinks.push({vnetId: available.id, vnetName: available.name, registrationEnabled: false});
    saveState(); renderEditor();
  } else {
    alert('All VNets are already linked.');
  }
}

export function deleteVnetLink(resId, idx) {
  const r = (state.rgResources||[]).find(r => r.id === resId);
  if(!r || !r.config || !r.config.vnetLinks) return;
  r.config.vnetLinks.splice(idx, 1);
  saveState(); renderEditor();
}

// ================================================================
// MOBILE NAVIGATION
// ================================================================
function isMobile() { return window.innerWidth <= 768; }

export function toggleMobileMenu() {
  const left = document.getElementById('sidebar-left');
  const right = document.getElementById('sidebar-right');
  if (left.classList.contains('mobile-visible') || right.classList.contains('mobile-visible')) {
    left.classList.remove('mobile-visible');
    right.classList.remove('mobile-visible');
    setActiveTab('canvas');
  } else {
    showMobilePanel('left');
  }
}

export function showMobilePanel(panel) {
  if (!isMobile()) return;
  const left = document.getElementById('sidebar-left');
  const right = document.getElementById('sidebar-right');
  left.classList.remove('mobile-visible');
  right.classList.remove('mobile-visible');
  if (panel === 'left') left.classList.add('mobile-visible');
  else if (panel === 'right') right.classList.add('mobile-visible');
  setActiveTab(panel);
  setTimeout(window._resize, 50);
}

function setActiveTab(panel) {
  document.querySelectorAll('.mobile-tab-bar button').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('mob-tab-' + panel);
  if (tab) tab.classList.add('active');
}

// Close dropdowns on outside click
document.addEventListener('click',e=>{if(!e.target.closest('.add-res-container'))document.querySelectorAll('.res-dropdown').forEach(d=>d.classList.remove('show'));});

// Close mobile panels on window resize to desktop
window.addEventListener('resize', function() {
  if (!isMobile()) {
    document.getElementById('sidebar-left').classList.remove('mobile-visible');
    document.getElementById('sidebar-right').classList.remove('mobile-visible');
  }
});
