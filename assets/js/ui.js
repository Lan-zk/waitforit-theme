/* 移动菜单与焦点管理（D7 / task 4.3）：
 * - 桌面与手机共用一个面板；≤800px 时面板铺满视口（纸色），关闭按钮钉在框架内；
 * - aria-expanded 同步、Escape 关闭并把焦点还给 MENU 按钮；
 * - 无 JS 时 CSS 不隐藏面板，导航链接直接可见。 */
(function () {
  "use strict";

  function initReadingEdges() {
    var main = document.querySelector(".wf-main");
    var top = document.querySelector(".wf-reading-edge--top");
    var bottom = document.querySelector(".wf-reading-edge--bottom");
    if (!main || !top || !bottom) {
      return;
    }
    var queued = false;

    function update() {
      queued = false;
      var distance = top.getBoundingClientRect().height || 1;
      var remaining = main.scrollHeight - main.clientHeight - main.scrollTop;
      // 首末边界退去模糊；正文尾部另有留白，最后一行始终能进入清晰区。
      top.style.setProperty("--wf-edge-strength", Math.min(1, Math.max(0, main.scrollTop) / distance).toFixed(3));
      bottom.style.setProperty("--wf-edge-strength", Math.min(1, Math.max(0, remaining) / distance).toFixed(3));
    }

    function schedule() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    }

    main.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    if (typeof ResizeObserver !== "undefined") {
      var observer = new ResizeObserver(schedule);
      Array.from(main.children).forEach(function (node) {
        observer.observe(node);
      });
    }
    // Tab 到边缘链接时，把焦点移入清晰区，避免只看到模糊的焦点目标。
    main.addEventListener("focusin", function (event) {
      if (event.target === main) {
        return;
      }
      var rect = event.target.getBoundingClientRect();
      var edge = top.getBoundingClientRect().height;
      if (rect.top < edge || rect.bottom > main.clientHeight - edge) {
        event.target.scrollIntoView({ block: "center", behavior: "instant" });
      }
    });
    schedule();
  }

  function init() {
    initReadingEdges();
    var trigger = document.querySelector("[data-wf-menu-trigger]");
    var panel = document.getElementById("wf-menu-panel");
    if (!trigger || !panel) {
      return;
    }
    var close = panel.querySelector("[data-wf-menu-close]");
    var mobile = window.matchMedia("(max-width: 800px)");
    var background = Array.from(document.querySelectorAll(".wf-skip, .wf-logo, .wf-main, .wf-footer, [data-wf-menu-trigger]")).map(function (node) {
      return { node: node, inert: node.inert };
    });
    panel.inert = true;

    function isOpen() {
      return panel.hasAttribute("data-open");
    }

    function setModal(modal) {
      document.documentElement.classList.toggle("wf-menu-modal", modal);
      background.forEach(function (item) {
        item.node.inert = modal || item.inert;
      });
      if (modal) {
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-labelledby", trigger.id);
      } else {
        panel.removeAttribute("role");
        panel.removeAttribute("aria-modal");
        panel.removeAttribute("aria-labelledby");
      }
    }

    function setOpen(open, restoreFocus) {
      if (open) {
        panel.inert = false;
        panel.setAttribute("data-open", "");
        trigger.setAttribute("aria-expanded", "true");
        setModal(mobile.matches);
        var first = mobile.matches ? close : panel.querySelector("a[href]");
        if (first) {
          first.focus();
        }
      } else {
        panel.inert = true;
        panel.removeAttribute("data-open");
        trigger.setAttribute("aria-expanded", "false");
        setModal(false);
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
      } else if (event.key === "Tab" && isOpen() && mobile.matches) {
        // 全屏面板拥有焦点；桌面导航保持普通链接的 Tab 顺序。
        var items = Array.from(panel.querySelectorAll("a[href], button:not([disabled])"));
        var first = items[0];
        var last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    mobile.addEventListener("change", function () {
      if (isOpen()) {
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
