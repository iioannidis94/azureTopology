import { state, saveState, updateCost, loadAzureIcons, setFullUpdate, resetDiagram, resetPositions } from './state-management.js';
import { draw, resize, selectNode } from './canvas-engine.js';
import { renderSecurityPanel, renderSidebar, renderEditor, toggleTheme, toggleLayout, fitToScreen, toggleOnPrem, updateOnPremName, updateOnPremCidr, toggleMobileMenu, showMobilePanel, addSub, deleteSub, renameSub, addRg, deleteRg, renameRg, setRgLocation, addSpoke, deleteSpoke, updateVnet, togglePeering, addSubnet, deleteSubnet, updateSubnet, toggleDropdown, filterResources, addResource, deleteResource, updateResource, updateResConfig, toggleSecurityPanel } from './ui-components.js';
import { exportPng, openPsModal, openBicepModal, closeModal, copyText, downloadText } from './export-logic.js';

// ================================================================
// WIRE UP fullUpdate
// ================================================================
function fullUpdateImpl(){ saveState(); updateCost(); renderSecurityPanel(); renderSidebar(); renderEditor(); draw(); }
setFullUpdate(fullUpdateImpl);

// ================================================================
// EXPOSE TO GLOBAL SCOPE (for inline onclick handlers)
// ================================================================
window._fullUpdate = fullUpdateImpl;
window._draw = draw;
window._resize = resize;
window._selectNode = selectNode;
window._toggleTheme = toggleTheme;
window._toggleLayout = toggleLayout;
window._fitToScreen = fitToScreen;
window._toggleOnPrem = toggleOnPrem;
window._updateOnPremName = updateOnPremName;
window._updateOnPremCidr = updateOnPremCidr;
window._toggleMobileMenu = toggleMobileMenu;
window._showMobilePanel = showMobilePanel;
window._addSub = addSub;
window._deleteSub = deleteSub;
window._renameSub = renameSub;
window._addRg = addRg;
window._deleteRg = deleteRg;
window._renameRg = renameRg;
window._setRgLocation = setRgLocation;
window._addSpoke = addSpoke;
window._deleteSpoke = deleteSpoke;
window._updateVnet = updateVnet;
window._togglePeering = togglePeering;
window._addSubnet = addSubnet;
window._deleteSubnet = deleteSubnet;
window._updateSubnet = updateSubnet;
window._toggleDropdown = toggleDropdown;
window._filterResources = filterResources;
window._addResource = addResource;
window._deleteResource = deleteResource;
window._updateResource = updateResource;
window._updateResConfig = updateResConfig;
window._exportPng = exportPng;
window._openPsModal = openPsModal;
window._openBicepModal = openBicepModal;
window._closeModal = closeModal;
window._copyText = copyText;
window._downloadText = downloadText;
window._resetDiagram = resetDiagram;
window._resetPositions = resetPositions;
window._toggleSecurityPanel = toggleSecurityPanel;

// ================================================================
// INIT & LOAD REAL ICONS
// ================================================================
loadAzureIcons(() => {
  setTimeout(resize, 100);
  fullUpdateImpl();
});
