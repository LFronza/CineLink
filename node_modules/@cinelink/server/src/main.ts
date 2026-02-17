import { ClientEvent, rootServer, RootAppStartState } from "@rootsdk/server-app";
import { cineLinkService } from "./cineLinkService";
import { startMediaPipelineServer } from "./mediaPipeline";

async function onStarting(state: RootAppStartState) {
  startMediaPipelineServer({
    testHooks: {
      testBootstrapRoom: (input) => cineLinkService.testBootstrapRoom(input),
      testApplyRoomActions: (input) => cineLinkService.testApplyRoomActions(input),
      getTestRoomState: (roomId) => cineLinkService.getTestRoomState(roomId),
      testRefreshRoomState: (roomId) => cineLinkService.testRefreshRoomState(roomId),
      clearAllTestRooms: () => cineLinkService.clearAllTestRooms()
    }
  });
  rootServer.lifecycle.addService(cineLinkService);
  rootServer.clients.on(ClientEvent.UserDetached, (event) => {
    cineLinkService.onUserDetached(event.userId);
  });
}

(async () => {
  await rootServer.lifecycle.start(onStarting);
})();
