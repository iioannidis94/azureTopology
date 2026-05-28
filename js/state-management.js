// ================================================================
// RESOURCE TYPES (With Monthly Cost Estimates)
// ================================================================
export const AZURE_ICON_BASE = 'https://cdn.jsdelivr.net/gh/benc-uk/icon-collection@master/azure-icons/';

export const RES_CATEGORIES={compute:'Compute',network:'Networking',data:'Data & Storage',security:'Security',integration:'Integration',ai:'AI & Analytics',management:'Management'};
export const RES_TYPES={
  vm:{icon:'💻', img:'virtual-machines.svg', color:'#00BCF2',label:'Virtual Machine',cat:'compute', cost: 85, config:{size:'Standard_D2s_v3',os:'Ubuntu 22.04',diskType:'Premium_LRS',osDiskSizeGB:'128',dataDisks:'0',dataDiskSizeGB:'256',dataDiskType:'Premium_LRS',authType:'SSH Key',availabilityZone:'None',acceleratedNetworking:'true',publicIp:'false',bootDiagnostics:'true',managedIdentity:'SystemAssigned',backupEnabled:'false',patchMode:'AutomaticByPlatform',securityType:'TrustedLaunch',vTpmEnabled:'true',secureBootEnabled:'true'}},
  vmss:{icon:'🖥️', img:'virtual-machine-scale-sets.svg', color:'#00A4EF',label:'VM Scale Set',cat:'compute', cost: 250, config:{size:'Standard_D2s_v3',instances:'2',minInstances:'2',maxInstances:'10',upgradePolicy:'Rolling',zones:'1,2,3',healthProbe:'TCP/80',os:'Ubuntu 22.04'}},
  aks:{icon:'☸️', img:'kubernetes-services.svg', color:'#0078D4',label:'AKS Cluster',cat:'compute', cost: 150, config:{nodes:'3',version:'1.29',nodeSize:'Standard_D2s_v3',networkPlugin:'azure',podCidr:'10.244.0.0/16',serviceCidr:'10.0.0.0/16',dnsServiceIp:'10.0.0.10',privateCluster:'false',tier:'Standard'}},
  fa:{icon:'⚡', img:'function-apps.svg', color:'#8764B8',label:'Function App',cat:'compute', cost: 20, config:{plan:'Consumption',runtime:'node',runtimeVersion:'20',osType:'Linux',alwaysOn:'false'}},
  aca:{icon:'📦', img:'container-instances.svg', color:'#8764B8',label:'Container Apps',cat:'compute', cost: 40, config:{replicas:'10',minReplicas:'1',cpu:'0.5',memory:'1.0Gi',image:'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest',ingress:'external',targetPort:'80'}},
  fw:{icon:'🛡️', img:'firewalls.svg', color:'#E81123',label:'Azure Firewall',cat:'network', cost: 900, config:{sku:'Premium'}},
  nva:{icon:'🧱', img:'network-appliances.svg', color:'#E81123',label:'FortiGate NVA',cat:'network', cost: 600, config:{mode:'Active/Passive'}},
  agw:{icon:'🌍', img:'application-gateways.svg', color:'#FF8C00',label:'App Gateway',cat:'network', cost: 350, config:{sku:'WAF_v2'}},
  lb:{icon:'⚖️', img:'load-balancers.svg', color:'#00BCF2',label:'Load Balancer',cat:'network', cost: 25, config:{sku:'Standard'}},
  gw:{icon:'🔀', img:'virtual-network-gateways.svg', color:'#0078D4',label:'VPN Gateway',cat:'network', cost: 140, config:{sku:'VpnGw2AZ'}},
  ergw:{icon:'🚄', img:'expressroute-circuits.svg', color:'#003A5C',label:'ExpressRoute GW',cat:'network', cost: 450, config:{sku:'ErGw2AZ'}},
  bas:{icon:'🔒', img:'bastions.svg', color:'#0078D4',label:'Azure Bastion',cat:'network', cost: 190, config:{sku:'Standard'}},
  afd:{icon:'⚡', img:'front-doors.svg', color:'#FF8C00',label:'Azure Front Door',cat:'network', cost: 330, config:{sku:'Premium'}},
  pe:{icon:'🔌', img:'private-endpoint.svg', color:'#8764B8',label:'Private Endpoint',cat:'network', cost: 10, config:{target:'Storage'}},
  dns:{icon:'🌐', img:'dns-zones.svg', color:'#00B294',label:'Private DNS Zone',cat:'network', cost: 5, config:{zone:'privatelink.blob.core.windows.net'}, rgLevel:true, dnsType:'private'},
  publicDns:{icon:'🌍', img:'dns-zones.svg', color:'#00BCF2',label:'Public DNS Zone',cat:'network', cost: 5, config:{zone:'example.com'}, rgLevel:true, dnsType:'public'},
  nsg:{icon:'📋', img:'network-security-groups.svg', color:'#E81123',label:'Network Sec Group',cat:'network', cost: 0, config:{rules:'5'}},
  sql:{icon:'🗄️', img:'sql-databases.svg', color:'#00B294',label:'Azure SQL',cat:'data', cost: 380, config:{vcores:'4'}},
  cosmos:{icon:'🌌', img:'azure-cosmos-db.svg', color:'#00B294',label:'Cosmos DB',cat:'data', cost: 400, config:{api:'NoSQL'}},
  sa:{icon:'💾', img:'storage-accounts.svg', color:'#00B294',label:'Storage Account',cat:'data', cost: 25, config:{replication:'ZRS'}},
  redis:{icon:'⚡', img:'azure-cache-for-redis.svg', color:'#E81123',label:'Azure Cache Redis',cat:'data', cost: 120, config:{sku:'Premium P1'}},
  adls:{icon:'🗃️', img:'storage-accounts.svg', color:'#0078D4',label:'Data Lake',cat:'data', cost: 50, config:{tier:'Standard'}},
  kv:{icon:'🔑', img:'key-vaults.svg', color:'#FF8C00',label:'Key Vault',cat:'security', cost: 5, config:{sku:'Premium'}},
  app:{icon:'📱', img:'app-services.svg', color:'#00BCF2',label:'App Service',cat:'integration', cost: 220, config:{sku:'P1v3'}},
  apim:{icon:'🔌', img:'api-management.svg', color:'#FF8C00',label:'API Management',cat:'integration', cost: 700, config:{tier:'Developer'}},
  sb:{icon:'📨', img:'service-bus.svg', color:'#8764B8',label:'Service Bus',cat:'integration', cost: 50, config:{tier:'Premium'}},
  evh:{icon:'📤', img:'event-hubs.svg', color:'#8764B8',label:'Event Hub',cat:'integration', cost: 30, config:{tier:'Standard'}},
  logic:{icon:'🔄', img:'logic-apps.svg', color:'#8764B8',label:'Logic App',cat:'integration', cost: 15, config:{plan:'Standard'}},
  foundry:{icon:'🤖', img:'cognitive-services.svg', color:'#0078D4',label:'AI Foundry',cat:'ai', cost: 100, config:{sku:'S0'}},
  openai:{icon:'🧠', img:'cognitive-services.svg', color:'#50E6FF',label:'Azure OpenAI',cat:'ai', cost: 150, config:{model:'gpt-4o'}},
  monitor:{icon:'📈', img:'monitor.svg', color:'#00B294',label:'Azure Monitor',cat:'management', cost: 15, config:{retentionDays:'90'}},
};

export const AZURE_PRICING_CALCULATOR_BASE_URL='https://azure.microsoft.com/en-us/pricing/calculator';
export const PRICING_CALCULATOR_PARAM_NAME='service';
export const PRICING_CALCULATOR_SLUGS={
  vm:'virtual-machines',
  vmss:'virtual-machine-scale-sets',
  aks:'kubernetes-service',
  fa:'functions',
  aca:'container-apps',
  fw:'azure-firewall',
  nva:'virtual-machines',
  agw:'application-gateway',
  lb:'load-balancer',
  gw:'vpn-gateway',
  ergw:'expressroute',
  bas:'azure-bastion',
  afd:'front-door',
  pe:'private-link',
  dns:'dns',
  publicDns:'dns',
  nsg:'network-security-groups',
  sql:'sql-database',
  cosmos:'cosmos-db',
  sa:'storage-accounts',
  redis:'azure-cache-for-redis',
  adls:'storage-accounts',
  kv:'key-vault',
  app:'app-service',
  apim:'api-management',
  sb:'service-bus',
  evh:'event-hubs',
  logic:'logic-apps',
  foundry:'azure-ai-foundry',
  openai:'azure-openai',
  monitor:'azure-monitor',
};

// ================================================================
// ICON LOADER
// ================================================================
export const loadedImages = {};
export function loadAzureIcons(callback) {
  let toLoad = Object.keys(RES_TYPES).length;
  let loaded = 0;
  Object.keys(RES_TYPES).forEach(key => {
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    img.onload = () => { loadedImages[key] = img; checkDone(); };
    img.onerror = () => { checkDone(); };
    img.src = AZURE_ICON_BASE + RES_TYPES[key].img;
  });
  function checkDone() { loaded++; if (loaded === toLoad && callback) callback(); }
}

// ================================================================
// STATE
// ================================================================
export const KEY='azureBuilderV11';
export const SUB_COLORS=['#FFB900','#00BCF2','#00B294','#FF8C00','#8764B8'];
export const RG_COLORS=['#8764B8','#0078D4','#00B294','#FF8C00','#E81123'];
export const VNET_COLORS=['#0078D4','#00BCF2','#00B294','#FF8C00','#8764B8','#107C10'];

const defaultState={
  theme:'drawio', layout:'grid',
  onPrem: { enabled: false, id: 'onprem', name: 'Corp Datacenter', cidr: '192.168.0.0/16' },
  customPos: {}, 
  subscriptions:[
    {id:'sub-1',name:'Production Subscription'}
  ],
  resourceGroups:[
    {id:'rg-conn', name:'rg-connectivity', location:'eastus', subId:'sub-1'},
    {id:'rg-prod', name:'rg-production', location:'eastus', subId:'sub-1'}
  ],
  rgResources:[],
  hub:{
    id:'hub',name:'hub-vnet',cidr:'10.0.0.0/16',color:'#0078D4',rgId:'rg-conn', peerings: [],
    subnets:[
      {
        id:'sn-hub-fw', name:'AzureFirewallSubnet', cidr:'10.0.1.0/26',
        resources:[{id:'rh1',type:'fw', name:'hub-firewall',config:{...RES_TYPES.fw.config}}]
      },
      {
        id:'sn-hub-gw', name:'GatewaySubnet', cidr:'10.0.2.0/27',
        resources:[{id:'rh2',type:'gw', name:'hub-vpngw',config:{...RES_TYPES.gw.config}}]
      }
    ]
  },
  spokes:[
    {
      id:'sp1',name:'prod-vnet',cidr:'10.1.0.0/16',color:'#00BCF2',peerings:['hub'],rgId:'rg-prod',
      subnets:[
        {
          id:'sn-sp1-web', name:'WebSubnet', cidr:'10.1.1.0/24',
          resources:[{id:'rs1',type:'vm', name:'prod-vm-01', config:{...RES_TYPES.vm.config}}]
        },
        {
          id:'sn-sp1-db', name:'DataSubnet', cidr:'10.1.2.0/24',
          resources:[{id:'rs2',type:'sql', name:'prod-sqldb', config:{...RES_TYPES.sql.config}}]
        }
      ]
    }
  ],
  selectedId:null, offset:{x:0,y:0}, scale:1, dragging:false, dragStart:{x:0,y:0}, offsetStart:{x:0,y:0}, dragNodeId:null, dragGroup:null
};

export let state;
try{
  const s=localStorage.getItem(KEY);
  state=s?JSON.parse(s):JSON.parse(JSON.stringify(defaultState));
  state.dragging=false; state.dragNodeId=null; state.dragGroup=null;
  if(!state.rgResources) state.rgResources=[];
  if(state.theme==='dark') document.body.classList.remove('theme-drawio');
  else document.body.classList.add('theme-drawio');
}catch(e){state=JSON.parse(JSON.stringify(defaultState));}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================
export const uid=()=>'id-'+Math.random().toString(36).substring(2,11);
export const esc=s=>String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export function saveState(){localStorage.setItem(KEY,JSON.stringify(state));}

export function getAllDiagramResources(){
  const vnetRes = [state.hub, ...state.spokes].flatMap(vnet => vnet.subnets.flatMap(sn => sn.resources));
  return [...vnetRes, ...(state.rgResources || [])];
}

export function getPricingCalculatorUrl(resourceTypes){
  const slugs=[...new Set(resourceTypes.map(type=>PRICING_CALCULATOR_SLUGS[type]).filter(Boolean))];
  if(!slugs.length) return '';
  const params=new URLSearchParams();
  slugs.forEach(slug=>params.append(PRICING_CALCULATOR_PARAM_NAME,slug));
  return `${AZURE_PRICING_CALCULATOR_BASE_URL}?${params.toString()}`;
}

export function updateCost() {
  let total = 0;
  const usedResourceTypes = new Set();
  getAllDiagramResources().forEach(r => {
    if(RES_TYPES[r.type] && RES_TYPES[r.type].cost) total += RES_TYPES[r.type].cost;
    if(PRICING_CALCULATOR_SLUGS[r.type]) usedResourceTypes.add(r.type);
  });
  document.getElementById('cost-display').innerText = `$${total.toLocaleString()}`;
  const pricingLink=document.getElementById('pricing-calculator-link');
  const pricingUrl=getPricingCalculatorUrl([...usedResourceTypes]);
  if(pricingUrl){
    pricingLink.href=pricingUrl;
    pricingLink.classList.remove('is-hidden');
  }else{
    pricingLink.href=AZURE_PRICING_CALCULATOR_BASE_URL;
    pricingLink.classList.add('is-hidden');
  }
}

export function getVnetsInRg(rgId){
  const result=[];
  if(state.hub.rgId===rgId) result.push(state.hub);
  state.spokes.forEach(s=>{if(s.rgId===rgId)result.push(s);});
  return result;
}

export function resetDiagram(){if(confirm('Delete all changes and reset to default?')){localStorage.removeItem(KEY);location.reload();}}
export function resetPositions(){if(confirm('Clear Drag&Drop positions and return to auto-layout?')){state.customPos={};fullUpdate();}}

// fullUpdate will be set by main.js after all modules are loaded
let _fullUpdate = null;
export function setFullUpdate(fn) { _fullUpdate = fn; }
export function fullUpdate() { if (_fullUpdate) _fullUpdate(); }

// ================================================================
// CIDR VALIDATION & DYNAMIC SUBNETTING
// ================================================================
export function parseCidr(cidr) {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec((cidr||'').trim());
  if (!m) return null;
  const octets = [+m[1],+m[2],+m[3],+m[4]];
  const prefix = +m[5];
  if (octets.some(o => o < 0 || o > 255)) return null;
  if (prefix < 0 || prefix > 32) return null;
  const ip = ((octets[0]<<24)|(octets[1]<<16)|(octets[2]<<8)|octets[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  return { ip, mask, prefix, network, broadcast, octets };
}

export function cidrToString(network, prefix) {
  return `${(network>>>24)&255}.${(network>>>16)&255}.${(network>>>8)&255}.${network&255}/${prefix}`;
}

export function isValidCidr(cidr) {
  const p = parseCidr(cidr);
  if (!p) return false;
  return p.ip === p.network;
}

export function cidrsOverlap(cidr1, cidr2) {
  const a = parseCidr(cidr1), b = parseCidr(cidr2);
  if (!a || !b) return false;
  return a.network <= b.broadcast && b.network <= a.broadcast;
}

export function getAllVnetCidrs() {
  return [state.hub, ...state.spokes].map(v => v.cidr).filter(Boolean);
}

export function checkCidrOverlap(newCidr, excludeVnetId) {
  const allVnets = [state.hub, ...state.spokes];
  for (const v of allVnets) {
    if (v.id === excludeVnetId) continue;
    if (cidrsOverlap(newCidr, v.cidr)) return v;
  }
  return null;
}

export function autoSubnet(vnetCidr, numSubnets) {
  const p = parseCidr(vnetCidr);
  if (!p) return [];
  const bitsNeeded = Math.ceil(Math.log2(Math.max(numSubnets, 1)));
  const subnetPrefix = Math.min(p.prefix + bitsNeeded, 28);
  const subnetSize = (1 << (32 - subnetPrefix)) >>> 0;
  const maxSubnets = 1 << (subnetPrefix - p.prefix);
  const results = [];
  for (let i = 0; i < Math.min(numSubnets, maxSubnets); i++) {
    const subnetNetwork = (p.network + i * subnetSize) >>> 0;
    results.push(cidrToString(subnetNetwork, subnetPrefix));
  }
  return results;
}

export function nextAvailableVnetCidr() {
  const existingCidrs = getAllVnetCidrs();
  for (let second = 0; second <= 255; second++) {
    const candidate = `10.${second}.0.0/16`;
    const overlaps = existingCidrs.some(c => cidrsOverlap(candidate, c));
    if (!overlaps) return candidate;
  }
  return '172.16.0.0/16';
}

export function nextAvailableSubnetCidr(vnetId) {
  const vnet = [state.hub, ...state.spokes].find(v => v.id === vnetId);
  if (!vnet) return '10.0.0.0/24';
  const vnetParsed = parseCidr(vnet.cidr);
  if (!vnetParsed) return '10.0.0.0/24';
  const existingSubnets = vnet.subnets.map(sn => sn.cidr).filter(c => parseCidr(c));
  return nextAvailableSubnetCidrFromParsed(vnetParsed, existingSubnets);
}

export function nextAvailableSubnetCidrFromParsed(vnetParsed, existingSubnets) {
  const subnetPrefix = 24;
  const subnetSize = (1 << (32 - subnetPrefix)) >>> 0;
  let candidate = vnetParsed.network;
  while (candidate <= vnetParsed.broadcast) {
    const candidateCidr = cidrToString(candidate, subnetPrefix);
    const overlaps = existingSubnets.some(c => cidrsOverlap(candidateCidr, c));
    if (!overlaps) return candidateCidr;
    candidate = (candidate + subnetSize) >>> 0;
  }
  return cidrToString(vnetParsed.network, subnetPrefix);
}

// ================================================================
// RG-LEVEL RESOURCES
// ================================================================
export function getRgResources(rgId) {
  if (!state.rgResources) state.rgResources = [];
  return state.rgResources.filter(r => r.rgId === rgId);
}

export function getAllDiagramResourcesIncludingRg() {
  const vnetRes = [state.hub, ...state.spokes].flatMap(vnet => vnet.subnets.flatMap(sn => sn.resources));
  return [...vnetRes, ...(state.rgResources || [])];
}
