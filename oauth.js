var url = new URL(window.location.href);
const code = url.searchParams.get("code");
const state = url.searchParams.get("state");

if (code && state) {
  console.log("fetched code and state");
  chrome.runtime.sendMessage(
    {
      type: "fetch-token",
      params: {
        code: code,
        state: state,
      },
    }, () => {
      setTimeout(window.close, 2000);
    });
}
