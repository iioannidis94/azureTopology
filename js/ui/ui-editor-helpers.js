// ================================================================
// UI EDITOR HELPERS FOR NESTED CONFIGURATIONS
// Handles rendering and editing of nested NICs and Disks
// ================================================================

/**
 * Render VM NICs section
 * @param {string} resId - Resource ID
 * @param {Array} nics - NICs array
 * @returns {string} HTML string
 */
export function renderVmNics(resId, nics = []) {
  let h = '';
  
  h += `<div style="margin-top:10px;padding:4px 0;border-top:1px solid var(--border);">
          <span style="font-size:10px;font-weight:bold;color:var(--muted);font-family:JetBrains Mono;">🌐 Network Interfaces</span>
        </div>`;
  
  nics.forEach((nic, idx) => {
    h += `<div style="margin:8px 0;padding:8px;background:rgba(0,120,212,0.05);border-radius:4px;border-left:3px solid var(--azure-blue);">`;
    h += `<div style="font-size:9px;font-weight:bold;color:var(--azure-blue);margin-bottom:6px;">NIC ${idx + 1}${nic.primary === 'true' ? ' (Primary)' : ''}</div>`;
    
    h += `<div class="editor-row">
            <span class="editor-label" style="font-size:10px;">Name</span>
            <input class="input-field" style="font-size:10px;" value="${esc(nic.name)}" 
              onchange="window._updateResConfigNic('${resId}',${idx},'name',this.value)" placeholder="auto-generated">
          </div>`;
    
    h += `<div class="editor-row">
            <span class="editor-label" style="font-size:10px;">Accelerated Networking</span>
            <select class="input-field" style="font-size:10px;" 
              onchange="window._updateResConfigNic('${resId}',${idx},'enableAcceleratedNetworking',this.value)">
              <option value="true"${nic.enableAcceleratedNetworking === 'true' ? ' selected' : ''}>Yes</option>
              <option value="false"${nic.enableAcceleratedNetworking === 'false' ? ' selected' : ''}>No</option>
            </select>
          </div>`;
    
    h += `<div class="editor-row">
            <span class="editor-label" style="font-size:10px;">IP Forwarding</span>
            <select class="input-field" style="font-size:10px;" 
              onchange="window._updateResConfigNic('${resId}',${idx},'enableIPForwarding',this.value)">
              <option value="true"${nic.enableIPForwarding === 'true' ? ' selected' : ''}>Yes</option>
              <option value="false"${nic.enableIPForwarding === 'false' ? ' selected' : ''}>No</option>
            </select>
          </div>`;
    
    h += `<div class="editor-row">
            <span class="editor-label" style="font-size:10px;">Public IP</span>
            <select class="input-field" style="font-size:10px;" 
              onchange="window._updateResConfigNic('${resId}',${idx},'publicIp',this.value)">
              <option value="true"${nic.publicIp === 'true' ? ' selected' : ''}>Yes</option>
              <option value="false"${nic.publicIp === 'false' ? ' selected' : ''}>No</option>
            </select>
          </div>`;
    
    if (idx > 0) {
      h += `<button style="width:100%;padding:4px;font-size:9px;margin-top:6px;border:1px dashed var(--danger);background:transparent;color:var(--danger);border-radius:3px;cursor:pointer;" 
              onclick="window._deleteResConfigNic('${resId}',${idx})">Remove NIC</button>`;
    }
    
    h += `</div>`;
  });
  
  h += `<button style="width:100%;padding:6px;font-size:10px;margin-top:6px;border:1px dashed var(--azure-blue);background:transparent;color:var(--azure-blue);border-radius:4px;cursor:pointer;font-family:JetBrains Mono;" 
          onclick="window._addResConfigNic('${resId}')">+ Add NIC</button>`;
  
  return h;
}

/**
 * Render VM OS Disk section
 * @param {string} resId - Resource ID
 * @param {Object} osDisk - OS Disk object
 * @returns {string} HTML string
 */
export function renderVmOsDisk(resId, osDisk = {}) {
  const disk = osDisk || { type: 'Premium_LRS', sizeGB: '128', caching: 'ReadWrite', createOption: 'FromImage' };
  let h = '';
  
  h += `<div style="margin-top:10px;padding:4px 0;border-top:1px solid var(--border);">
          <span style="font-size:10px;font-weight:bold;color:var(--muted);font-family:JetBrains Mono;">💾 OS Disk</span>
        </div>`;
  
  h += `<div class="editor-row">
          <span class="editor-label">Storage Type</span>
          <select class="input-field" onchange="window._updateResConfigOsDisk('${resId}','type',this.value)">
            <option value="Premium_LRS"${disk.type === 'Premium_LRS' ? ' selected' : ''}>Premium SSD</option>
            <option value="StandardSSD_LRS"${disk.type === 'StandardSSD_LRS' ? ' selected' : ''}>Standard SSD</option>
            <option value="Standard_LRS"${disk.type === 'Standard_LRS' ? ' selected' : ''}>Standard HDD</option>
          </select>
        </div>`;
  
  h += `<div class="editor-row">
          <span class="editor-label">Size (GB)</span>
          <input class="input-field" type="number" value="${disk.sizeGB}" 
            onchange="window._updateResConfigOsDisk('${resId}','sizeGB',this.value)">
        </div>`;
  
  h += `<div class="editor-row">
          <span class="editor-label">Caching</span>
          <select class="input-field" onchange="window._updateResConfigOsDisk('${resId}','caching',this.value)">
            <option value="ReadWrite"${disk.caching === 'ReadWrite' ? ' selected' : ''}>Read/Write</option>
            <option value="ReadOnly"${disk.caching === 'ReadOnly' ? ' selected' : ''}>Read Only</option>
            <option value="None"${disk.caching === 'None' ? ' selected' : ''}>None</option>
          </select>
        </div>`;
  
  return h;
}

/**
 * Render VM Data Disks section
 * @param {string} resId - Resource ID
 * @param {Array} dataDisks - Data disks array
 * @returns {string} HTML string
 */
export function renderVmDataDisks(resId, dataDisks = []) {
  let h = '';
  
  h += `<div style="margin-top:10px;padding:4px 0;border-top:1px solid var(--border);">
          <span style="font-size:10px;font-weight:bold;color:var(--muted);font-family:JetBrains Mono;">📀 Data Disks</span>
        </div>`;
  
  if (dataDisks.length === 0) {
    h += `<div style="font-size:10px;color:var(--muted);padding:8px 0;">No data disks configured</div>`;
  } else {
    dataDisks.forEach((disk, idx) => {
      h += `<div style="margin:8px 0;padding:8px;background:rgba(0,176,148,0.05);border-radius:4px;border-left:3px solid var(--azure-green);">`;
      h += `<div style="font-size:9px;font-weight:bold;color:var(--azure-green);margin-bottom:6px;">Data Disk ${idx + 1} (LUN ${disk.lun || idx})</div>`;
      
      h += `<div class="editor-row">
              <span class="editor-label" style="font-size:10px;">Name</span>
              <input class="input-field" style="font-size:10px;" value="${esc(disk.name)}" 
                onchange="window._updateResConfigDataDisk('${resId}',${idx},'name',this.value)" placeholder="auto-generated">
            </div>`;
      
      h += `<div class="editor-row">
              <span class="editor-label" style="font-size:10px;">Size (GB)</span>
              <input class="input-field" style="font-size:10px;" type="number" value="${disk.sizeGB}" 
                onchange="window._updateResConfigDataDisk('${resId}',${idx},'sizeGB',this.value)">
            </div>`;
      
      h += `<div class="editor-row">
              <span class="editor-label" style="font-size:10px;">Storage Type</span>
              <select class="input-field" style="font-size:10px;" 
                onchange="window._updateResConfigDataDisk('${resId}',${idx},'type',this.value)">
                <option value="Premium_LRS"${disk.type === 'Premium_LRS' ? ' selected' : ''}>Premium SSD</option>
                <option value="StandardSSD_LRS"${disk.type === 'StandardSSD_LRS' ? ' selected' : ''}>Standard SSD</option>
                <option value="Standard_LRS"${disk.type === 'Standard_LRS' ? ' selected' : ''}>Standard HDD</option>
              </select>
            </div>`;
      
      h += `<div class="editor-row">
              <span class="editor-label" style="font-size:10px;">Caching</span>
              <select class="input-field" style="font-size:10px;" 
                onchange="window._updateResConfigDataDisk('${resId}',${idx},'caching',this.value)">
                <option value="None"${disk.caching === 'None' ? ' selected' : ''}>None</option>
                <option value="ReadOnly"${disk.caching === 'ReadOnly' ? ' selected' : ''}>Read Only</option>
                <option value="ReadWrite"${disk.caching === 'ReadWrite' ? ' selected' : ''}>Read/Write</option>
              </select>
            </div>`;
      
      h += `<button style="width:100%;padding:4px;font-size:9px;margin-top:6px;border:1px dashed var(--danger);background:transparent;color:var(--danger);border-radius:3px;cursor:pointer;" 
              onclick="window._deleteResConfigDataDisk('${resId}',${idx})">Remove Disk</button>`;
      
      h += `</div>`;
    });
  }
  
  h += `<button style="width:100%;padding:6px;font-size:10px;margin-top:6px;border:1px dashed var(--azure-green);background:transparent;color:var(--azure-green);border-radius:4px;cursor:pointer;font-family:JetBrains Mono;" 
          onclick="window._addResConfigDataDisk('${resId}')">+ Add Data Disk</button>`;
  
  return h;
}

/**
 * Render PE NICs section
 * @param {string} resId - Resource ID
 * @param {Array} nics - NICs array
 * @returns {string} HTML string
 */
export function renderPeNics(resId, nics = []) {
  let h = '';
  
  h += `<div style="margin-top:10px;padding:4px 0;border-top:1px solid var(--border);">
          <span style="font-size:10px;font-weight:bold;color:var(--muted);font-family:JetBrains Mono;">🌐 Network Interface</span>
        </div>`;
  
  const nic = nics[0] || { name: '', enableAcceleratedNetworking: 'false', enableIPForwarding: 'false', privateIPAllocationMethod: 'Dynamic', privateIPAddress: '' };
  
  h += `<div style="margin:8px 0;padding:8px;background:rgba(135,100,184,0.05);border-radius:4px;">`;
  
  h += `<div class="editor-row">
          <span class="editor-label" style="font-size:10px;">Name</span>
          <input class="input-field" style="font-size:10px;" value="${esc(nic.name)}" 
            onchange="window._updateResConfigNic('${resId}',0,'name',this.value)" placeholder="auto-generated">
        </div>`;
  
  h += `<div class="editor-row">
          <span class="editor-label" style="font-size:10px;">IP Allocation</span>
          <select class="input-field" style="font-size:10px;" 
            onchange="window._updateResConfigNic('${resId}',0,'privateIPAllocationMethod',this.value)">
            <option value="Dynamic"${nic.privateIPAllocationMethod === 'Dynamic' ? ' selected' : ''}>Dynamic</option>
            <option value="Static"${nic.privateIPAllocationMethod === 'Static' ? ' selected' : ''}>Static</option>
          </select>
        </div>`;
  
  if (nic.privateIPAllocationMethod === 'Static') {
    h += `<div class="editor-row">
            <span class="editor-label" style="font-size:10px;">Private IP</span>
            <input class="input-field" style="font-size:10px;" value="${esc(nic.privateIPAddress)}" 
              onchange="window._updateResConfigNic('${resId}',0,'privateIPAddress',this.value)" placeholder="10.0.1.4">
          </div>`;
  }
  
  h += `</div>`;
  
  return h;
}

// Helper function to escape HTML
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
