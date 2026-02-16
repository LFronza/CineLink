"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_app_1 = require("@rootsdk/server-app");
const cineLinkService_1 = require("./cineLinkService");
async function onStarting(state) {
    server_app_1.rootServer.lifecycle.addService(cineLinkService_1.cineLinkService);
    server_app_1.rootServer.clients.on(server_app_1.ClientEvent.UserDetached, (event) => {
        cineLinkService_1.cineLinkService.onUserDetached(event.userId);
    });
}
(async () => {
    await server_app_1.rootServer.lifecycle.start(onStarting);
})();
