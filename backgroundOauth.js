chrome.runtime.onMessage.addListener((req, sender, callback) => {
  if (req.type == "fetch-token") {
    const code = req.params.code;
    const state = req.params.state;
    if (code && state) {
      axios
        .post(
          "http://localhost:5001/gitti-space-sl/us-central1/api/fetch-user-token",
          {
            code: code,
            state: state,
          }
        )
        .then((resp) => {
          const user = resp.data.user;
          console.log(user);
          chrome.storage.sync.set({ "gitspeedUser": user }, function () {
            console.log("Value is set to " + user);
          });
        })
        .catch((error) => {
          console.log(error.response.data);
        });
    }
    callback();
  }
});

// chrome.browserAction.onClicked.addListener((tab) => {
//   console.log("fired");
//   chrome.storage.local.get(["gitspeedUser"], (data) => {
//     const userData = data["gitspeedUser"];
//     console.log(userData);
//     if (userData && userData.access_token) {
//       chrome.browserAction.setPopup({
//         popup: "home.html",
//       });
//     } else {
//       chrome.browserAction.setPopup({
//         popup: "login.html",
//       });
//     }
//   });
// });
