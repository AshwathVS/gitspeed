chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "init-commit") {
    console.log("init-commit");
    if (
      !request.params.repo ||
      !request.params.file ||
      !request.params.commitMessage
    ) {
      // do nothing
      console.error("Invalid params for init commit event call");
    } else {
      sendResponse({
        selection: document.getSelection().toString(),
        repo: request.params.repo,
        file: request.params.file,
        commitMessage: request.params.commitMessage,
      });
    }
  } else sendResponse({});
});
