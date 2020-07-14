const env = "prod";

const getAuthEndPoint = function() {
  if(env == "prod") {
    return "https://us-central1-gitti-space-sl.cloudfunctions.net/api/fetch-user-token";
  } else {
    return "http://localhost:5001/gitti-space-sl/us-central1/api/fetch-user-token";
  }
}

chrome.runtime.onMessage.addListener((req, sender, callback) => {
  if (req.type == "fetch-token") {
    const code = req.params.code;
    const state = req.params.state;
    if (code && state) {
      axios
          .post(
              getAuthEndPoint(),
              {
                code: code,
                state: state,
              }
          )
          .then((resp) => {
            const user = resp.data.user;
            chrome.storage.sync.set({"gitspeedUser": user}, () => {
              chrome.storage.sync.get(['gitspeedData'], (data) => {
                  if(!data.gitspeedData) {
                      chrome.storage.sync.set({
                          'gitspeedData': {
                              collection: [],
                              commits: new Map()
                          }
                      });
                  }
              })
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
