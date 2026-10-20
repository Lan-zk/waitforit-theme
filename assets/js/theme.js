/* 主题三态切换（D6）：auto → day → night，写 localStorage["wf-theme"]，改 documentElement[data-theme]。
 * 启动时的一次性设置由 head 内联脚本完成（避免首帧闪烁），本文件只负责切换与标签。
 * 无 JS 时按钮由 CSS 隐藏，页面按系统偏好显示。 */
(function () {
  "use strict";

  var KEY = "wf-theme";
  var MODES = ["auto", "day", "night"];

  function read() {
    try {
      var stored = window.localStorage.getItem(KEY);
      return MODES.indexOf(stored) > -1 ? stored : "auto";
    } catch (error) {
      return "auto";
    }
  }

  function apply(mode) {
    var root = document.documentElement;
    if (mode === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
  }

  function setLabel(button, mode) {
    var target = button.querySelector("[data-wf-theme-label]");
    var label = button.getAttribute("data-label-" + mode);
    if (target && label) {
      target.textContent = label;
    }
  }

  function init() {
    var button = document.querySelector("[data-wf-theme-toggle]");
    if (!button) {
      return;
    }
    var mode = read();
    apply(mode);
    setLabel(button, mode);
    button.addEventListener("click", function () {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      try {
        if (mode === "auto") {
          window.localStorage.removeItem(KEY);
        } else {
          window.localStorage.setItem(KEY, mode);
        }
      } catch (error) {
        /* 存储被禁用时仍然允许本次切换，只是不记忆。 */
      }
      apply(mode);
      setLabel(button, mode);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
