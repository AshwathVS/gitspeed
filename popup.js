document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendRequest(tab.id, { action: "getData" }, populateTimestamps);
  });

  // example for event listener, todo remove later
  // document.getElementById("btn-next").addEventListener("click", function () {
  //   navigate("next");
  // });
});
