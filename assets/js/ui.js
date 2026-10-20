/* 移动菜单与焦点管理（D7 / task 4.3）：
 * - 桌面与手机共用一个面板；≤800px 时面板铺满视口（纸色），关闭按钮钉在框架内；
 * - aria-expanded 同步、Escape 关闭并把焦点还给 MENU 按钮；
 * - 无 JS 时 CSS 不隐藏面板，导航链接直接可见。 */
(function () {
  "use strict";

  function init() {
    var trigger = document.querySelector("[data-wf-menu-trigger]");
    var panel = document.getElementById("wf-menu-panel");
    if (!trigger || !panel) {
      return;
    }
    var close = panel.querySelector("[data-wf-menu-close]");

    function isOpen() {
      return panel.hasAttribute("data-open");
    }

    function setOpen(open, restoreFocus) {
      if (open) {
        panel.setAttribute("data-open", "");
        trigger.setAttribute("aria-expanded", "true");
        var first = panel.querySelector("a, button");
        if (first) {
          first.focus();
        }
      } else {
        panel.removeAttribute("data-open");
        trigger.setAttribute("aria-expanded", "false");
        if (restoreFocus !== false) {
          trigger.focus();
        }
      }
    }

    trigger.addEventListener("click", function () {
      setOpen(!isOpen());
    });

    if (close) {
      close.addEventListener("click", function () {
        setOpen(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        event.preventDefault();
        setOpen(false);
      }
    });

    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        setOpen(false, false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
