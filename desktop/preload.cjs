const {contextBridge} = require('electron');

contextBridge.exposeInMainWorld('checkin360', {
  desktop: true,
});
