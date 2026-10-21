/* 复制原始代码；仅初始化成功的代码块显示按钮，资源失败时保持可读。 */
(function () {
  "use strict";
  document.querySelectorAll("[data-wf-code]").forEach(function (block) {
    var button = block.querySelector("[data-wf-copy]");
    var source = block.querySelector("[data-wf-source]");
    var status = block.querySelector("[data-wf-copy-status]");
    if (!button || !source || !status) {
      return;
    }
    button.hidden = false;
    button.addEventListener("click", async function () {
      status.textContent = "";
      button.disabled = true;
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
          throw new Error("Clipboard unavailable");
        }
        await navigator.clipboard.writeText(source.value);
        status.textContent = button.getAttribute("data-success");
      } catch (error) {
        // 权限拒绝时选中可见代码，用户可用系统复制命令继续。
        var code = block.querySelector("code");
        var selection = window.getSelection();
        if (code && selection) {
          var range = document.createRange();
          range.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        status.textContent = button.getAttribute("data-error");
      } finally {
        button.disabled = false;
      }
    });
  });
})();
