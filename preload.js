const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: (clave) => ipcRenderer.invoke('get-config', clave),
  setConfig: (clave, valor) => ipcRenderer.invoke('set-config', clave, valor),
  getClientes: (search) => ipcRenderer.invoke('get-clientes', search),
  getCliente: (id) => ipcRenderer.invoke('get-cliente', id),
  saveCliente: (datos) => ipcRenderer.invoke('save-cliente', datos),
  deleteCliente: (id) => ipcRenderer.invoke('delete-cliente', id),
  getTrabajos: (clienteId) => ipcRenderer.invoke('get-trabajos', clienteId),
  saveTrabajo: (datos) => ipcRenderer.invoke('save-trabajo', datos),
  deleteTrabajo: (id) => ipcRenderer.invoke('delete-trabajo', id),
  getStats: () => ipcRenderer.invoke('get-stats'),
});