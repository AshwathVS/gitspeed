document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btn-login").addEventListener("click", function () {
    initOAuthFlow();
  });

  chrome.runtime.onMessage.addListener((message, callback) => {
    console.log("Message received", message);
  });
});

function initOAuthFlow() {
  const queryparams = {
    client_id: "42b0ccb78039f4c09ede", // GITHUB CLIENT ID
    redirect_uri: "http://localhost:5001/gitti-space-sl/us-central1/api/oauth",
    scope: "repo user",
    state: getRandomState(),
  };

  // actual code
  const githubAuthorize = "https://github.com/login/oauth/authorize";
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
