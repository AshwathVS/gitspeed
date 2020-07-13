const githubAuthorize = "https://github.com/login/oauth/authorize";

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get(["gitspeedUser"], (user) => {
    if (user && user.gitspeedUser) {
      chrome.browserAction.setPopup({
        popup: "home.html",
      });
      window.location.href = window.location.href.replace(
        "login.html",
        "home.html"
      );
    }
  });
  document.getElementById("btn-login").addEventListener("click", function () {
    initOAuthFlow();
  });
});

function initOAuthFlow() {
  const queryparams = {
    client_id: "42b0ccb78039f4c09ede", // GITHUB CLIENT ID
    redirect_uri: "http://localhost:5001/gitti-space-sl/us-central1/api/oauth",
    scope: "repo user",
    state: getRandomState(),
  };

  window.open(githubAuthorize + "?" + buildFromQueryParams(queryparams));
}

function getRandomState(length) {
  if (!length) length = 20;
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function buildFromQueryParams(data) {
  const ret = [];
  for (let d in data)
    ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
  return ret.join("&");
}
