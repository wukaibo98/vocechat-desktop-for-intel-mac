// import React from "react";

import clsx from "clsx";
// import { hideAll } from "tippy.js";

export type MenuItem = {
  text: string;
  clickHandler?: () => void;
  danger?: boolean;
};
type Props = {
  items: MenuItem[];
  hideMenu: () => void;
};

const ContextMenu = ({ items, hideMenu }: Props) => {
  return (
    <ul className="z-20 min-w-[120px] rounded-lg bg-white p-1 shadow-lg ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10">
      {items.map((item) => {
        const { text, clickHandler, danger } = item;
        const clickHandlerWrapper = () => {
          clickHandler && clickHandler();
          hideMenu();
        };
        return (
          <li
            onClick={clickHandlerWrapper}
            key={text}
            role="button"
            className={clsx(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors",
              danger
                ? "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {text}
          </li>
        );
      })}
    </ul>
  );
};

export default ContextMenu;
