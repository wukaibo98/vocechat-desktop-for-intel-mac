import { updateNewMsgMap } from "@/app/slices/data";
import { VocechatServer } from "@/types/common";
import clsx from "clsx";
import { ipcRenderer, WebviewTag } from "electron";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

type Props = {
  activeURL: string;
  servers: VocechatServer[];
  handleReload: () => void;
  setReloading: (_param: boolean) => void;
};

const WebviewList = ({ servers, activeURL, handleReload, setReloading }: Props) => {
  const dispatch = useDispatch();
  // Fix stale closure: keep latest refs for callbacks
  const handleReloadRef = useRef(handleReload);
  const setReloadingRef = useRef(setReloading);
  handleReloadRef.current = handleReload;
  setReloadingRef.current = setReloading;

  useEffect(() => {
    const webviews = [...document.querySelectorAll("webview")] as WebviewTag[];
    const cleanups: (() => void)[] = [];
    webviews.forEach((webview) => {
      const server = webview.getAttribute("data-src") || "default";
      const onThemeColorChanged = (evt: Electron.DidChangeThemeColorEvent) => {
        if (evt.themeColor == "#123456") {
          handleReloadRef.current();
        }
      };
      const onDidFinishLoad = () => {
        if (webview.dataset?.visible == "true") {
          setReloadingRef.current(false);
        }
      };
      const onDidFailLoad = () => {
        if (webview.dataset?.visible == "true") {
          setReloadingRef.current(false);
        }
      };
      const onDomReady = () => {
        webview.executeJavaScript(`
          (function() {
            const OriginalNotification = window.Notification;
            window.Notification = function(title, options) {
              const detail = JSON.stringify({
                channel: title || "",
                sender: "",
                content: (options && options.body) || ""
              });
              console.log("{{NEW_MSG}}" + detail);
            };
            window.Notification.permission = "granted";
            window.Notification.requestPermission = function() {
              return Promise.resolve("granted");
            };
          })();
        `);
      };
      const onConsoleMessage = (e: Electron.ConsoleMessageEvent) => {
        const { level, message, sourceId } = e;
        if (level == 3) {
          ipcRenderer.send("vocechat-logging", { level, message, sourceId });
        }
        if (message.includes("{{NEW_MSG}}")) {
          dispatch(updateNewMsgMap({ server, hasNewMsg: true }));
          let msgDetail = {};
          const jsonStr = message.replace("{{NEW_MSG}}", "").trim();
          if (jsonStr) {
            try {
              msgDetail = JSON.parse(jsonStr);
            } catch {
              // fallback to default notification
            }
          }
          ipcRenderer.send("vocechat-new-msg", msgDetail);
        }
      };

      webview.addEventListener("did-change-theme-color", onThemeColorChanged);
      webview.addEventListener("did-finish-load", onDidFinishLoad);
      webview.addEventListener("did-fail-load", onDidFailLoad);
      webview.addEventListener("dom-ready", onDomReady);
      webview.addEventListener("console-message", onConsoleMessage);

      cleanups.push(() => {
        webview.removeEventListener("did-change-theme-color", onThemeColorChanged);
        webview.removeEventListener("did-finish-load", onDidFinishLoad);
        webview.removeEventListener("did-fail-load", onDidFailLoad);
        webview.removeEventListener("dom-ready", onDomReady);
        webview.removeEventListener("console-message", onConsoleMessage);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [dispatch]);

  return servers.map((server) => {
    const { web_url } = server;
    const isActive = activeURL == web_url;
    return (
      <webview
        //@ts-ignore
        //eslint-disable-next-line react/no-unknown-property
        allowpopups="true"
        //@ts-ignore
        //eslint-disable-next-line react/no-unknown-property
        disablewebsecurity="true"
        key={web_url}
        className={clsx(
          "absolute left-0 top-0 h-full w-full transition-opacity duration-200",
          isActive ? "visible opacity-100" : "invisible opacity-0"
        )}
        useragent={`${navigator.userAgent} ${process.platform}`}
        data-visible={isActive}
        data-src={web_url}
        src={web_url}
      ></webview>
    );
  });
};

export default WebviewList;
