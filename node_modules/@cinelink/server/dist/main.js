"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_app_1 = require("@rootsdk/server-app");
const cineLinkService_1 = require("./cineLinkService");
const mediaPipeline_1 = require("./mediaPipeline");
async function onStarting(state) {
    (0, mediaPipeline_1.startMediaPipelineServer)({
        testHooks: {
            testBootstrapRoom: (input) => cineLinkService_1.cineLinkService.testBootstrapRoom(input),
            testApplyRoomActions: (input) => cineLinkService_1.cineLinkService.testApplyRoomActions(input),
            getTestRoomState: (roomId) => cineLinkService_1.cineLinkService.getTestRoomState(roomId),
            testRefreshRoomState: (roomId) => cineLinkService_1.cineLinkService.testRefreshRoomState(roomId),
            clearAllTestRooms: () => cineLinkService_1.cineLinkService.clearAllTestRooms()
        }
    });
    server_app_1.rootServer.lifecycle.addService(cineLinkService_1.cineLinkService);
    server_app_1.rootServer.clients.on(server_app_1.ClientEvent.UserDetached, (event) => {
        cineLinkService_1.cineLinkService.onUserDetached(event.userId);
    });
}
(async () => {
    await server_app_1.rootServer.lifecycle.start(onStarting);
})();
