import { createListenerMiddleware } from "@reduxjs/toolkit";
import { ipcRenderer } from "electron";
import { RootState } from "../store";
import { VocechatServer } from "@/types/common";

const operations = ["__rtkq", "data"];

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  predicate: (action) => {
    const { type = "" } = action;
    const [prefix] = type.split("/");
    return operations.includes(prefix);
  },
  effect: async (action) => {
    const { type = "", payload } = action;
    // @ts-ignore
    const [prefix, operation]: [keyof RootState | "__rtkq", string] = type.split("/");
    switch (prefix) {
      case "__rtkq":
        break;
      case "data":
        {
          switch (operation) {
            case "initializeServers":
              {
                const servers = (payload ?? []) as VocechatServer[];
                if (servers.length > 0) {
                  ipcRenderer.send("switch-server", { url: servers[0]?.web_url });
                }
              }
              break;
            case "addServer":
              {
                ipcRenderer.send("add-server", { data: payload });
              }
              break;
            case "removeServer":
              {
                ipcRenderer.send("remove-server", { url: payload });
              }
              break;
            default:
              break;
          }
        }
        break;
      default:
        break;
    }
  }
});

export default listenerMiddleware;
