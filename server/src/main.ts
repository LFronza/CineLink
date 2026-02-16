import { ClientEvent, rootServer, RootAppStartState } from "@rootsdk/server-app";
import { cineLinkService } from "./cineLinkService";

async function onStarting(state: RootAppStartState) {
  rootServer.lifecycle.addService(cineLinkService);
  rootServer.clients.on(ClientEvent.UserDetached, (event) => {
    cineLinkService.onUserDetached(event.userId);
  });
}

(async () => {
  await rootServer.lifecycle.start(onStarting);
})();
