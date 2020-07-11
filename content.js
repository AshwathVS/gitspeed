// Content script will run the on the content of the parent page, so will be able to access DOM of parent
chrome.extension.onRequest.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.action == "getSelection") {
    sendResponse({
      selection: document.getSelection(),
    });
  } else sendResponse({});
});

// Injection of script may not be needed for this extension, just keeping it just in case..
var s = document.createElement("script");
s.src = chrome.runtime.getURL("script.js");
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);
