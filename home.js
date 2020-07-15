const githubCommitEndpoint =
  "https://api.github.com/repos/#username/#repo/contents#file";

const env = "prod";

document.addEventListener("DOMContentLoaded", function () {

  document.getElementById("btn-cancel").addEventListener("click", resetPage);

  document.getElementById("btn-commit").addEventListener("click", initCommit);

  document.getElementById("btn-add-repo").addEventListener("click", addNewPath);

  populatePaths();

  addLogo();

});

const getDeleteEndPoint = function() {
  if(env == "prod") {
    return "https://us-central1-gitti-space-sl.cloudfunctions.net/api/delete-user";
  } else {
    return "http://localhost:5001/gitti-space-sl/us-central1/api/delete-user";
  }
};

function addLogo() {
  chrome.storage.sync.get(['gitspeedUser'], (data) => {
    if(data && data.gitspeedUser) {
      const userData = data.gitspeedUser;
      const userLogo = document.getElementById('user-logo');
      userLogo.src = userData.avatar_url;
      userLogo.title = userData.username;

      userLogo.addEventListener("click", () => {
        var contextElement = document.getElementById("context-menu");
        if (contextElement.classList.contains("active")) {
          contextElement.classList.remove("active");
        } else {
          contextElement.style.top = 50 + "px";
          contextElement.style.right = 10 + "px";
          contextElement.classList.add("active");
          contextElement.focus();
        }
      });

      document.getElementById("go-to-profile").addEventListener("click", () => {
        window.open("https://www.github.com/" + userData.username);
      });

      document.getElementById("logout").addEventListener("click", () => {
        chrome.storage.sync.remove('gitspeedUser');
        chrome.browserAction.setPopup({
          popup: "login.html",
        });
        document.location.href = document.location.href.replace("home.html", "login.html");
      });

      document.getElementById("delete-account").addEventListener("click", initDelete);
    }
  });

  // Ctrl + Enter initiates commit
  window.addEventListener("keyup", (event) => {
    if (event.keyCode == 13 && event.ctrlKey) initCommit();
  })
}

function addNewPath() {
  document.location.href = document.location.href.replace("home.html", "addPath.html");
}

function resetPage() {
  document.location.reload();
}

function initDelete() {

  chrome.storage.sync.get(['gitspeedUser'], (data) => {
    const requestBody = {
      username: data.gitspeedUser.username,
      access_token: data.gitspeedUser.access_token
    };

    axios.delete(getDeleteEndPoint(), {
      data: requestBody
    }).then(() => {
      chrome.storage.sync.clear();

      triggerNotificationBox('success', "All your data has been successfully deleted.");

      chrome.browserAction.setPopup({
        popup: "login.html",
      });

      setTimeout(() => {
        document.location.href = document.location.href.replace("home.html", "login.html");
      }, 2000);
    }).catch((error) => console.error);

  });

}

function populatePaths() {
  chrome.storage.sync.get(['gitspeedData'], (data) => {
    if(data && data.gitspeedData) {
      const collection = data.gitspeedData.collection;
      if (collection && collection.length > 0) {
        const selectPathElement = document.getElementById('select-path');
        collection.sort((a, b) => {
          if(a.repo == b.repo) {
            if(a.folder < b.folder) return 1;
            else if (a.folder > b.folder) return -1;
            else return 0;
          } else {
            if(a.repo < b.repo) return 1;
            else if (a.repo > b.repo) return -1;
            else return 0;
          }
        });

        collection.forEach((ele) => {
          const opt = document.createElement('option');
          opt.value = ele.repo + ":" + ele.folder;
          opt.title = "Repository: " + ele.repo + "\nDirectory: " + ele.folder;
          opt.innerHTML = ele.repo + ":  " + ele.folder;
          selectPathElement.appendChild(opt);
        });
      }
    }
  });
  document.getElementById('select-path').disabled = false;
}

function triggerNotificationBox(type, alertMsg) {
  const box = (type == "alert") ? "alert-box" : "success-box";
  const element = document.getElementById(box);

  element.innerText = alertMsg;
  element.style.display = 'block';

  setTimeout(() => {
    element.innerText = '';
    element.style.display = 'none';
  }, 2000);
}

function initCommit() {
  const option = document.getElementById('select-path').value;
  const filename = document.getElementById('inp-filename').value;
  const fileContent = document.getElementById('inp-file-content').value;
  let commitMessage = document.getElementById('inp-commit-message').value;

  if (!commitMessage) {
    commitMessage = "Commit made using gitspeed chrome extension";
  }

  if (option == "##~~INVALID~~##" || !filename || !fileContent) {
    triggerNotificationBox('alert', "Fill in the mandatory fields and try again");
    return;
  }

  const split = option.split(':');
  const repo = split[0].trim();
  const filePath = split[1].trim();

  let fileNameWithPath;
  if(filePath != "/") {
    fileNameWithPath = filePath + "/" + filename;
  } else {
    fileNameWithPath = filePath + filename;
  }

  chrome.storage.sync.get(['gitspeedData'], (data) => {
    const commits = data.gitspeedData.commits;
    const fileHash = commits[repo + fileNameWithPath];
    if (fileHash) {
      commit({
        repo: repo,
        selection: Base64.encode(fileContent),
        file: fileNameWithPath,
        commitMessage: commitMessage,
        hash: fileHash
      });
    } else {
      commit({repo: repo, selection: Base64.encode(fileContent), file: fileNameWithPath, commitMessage: commitMessage});
    }
  })

  // TODO: Seems to be some issue with messages (Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist)
  // TODO: Selection sometimes does not get the actual content (happens in hackerrank at times)
  // TODO: Resolve error and remove file content box to fetch file content from document.getSelection()
  // chrome.tabs.getSelected(null, function (tab) {
  //   chrome.tabs.sendMessage(
  //       tab.id,
  //       {
  //         action: "init-commit",
  //         params: {
  //           repo: repo,
  //           file: fileNameWithPath,
  //           commitMessage: commitMessage,
  //         },
  //       },
  //       null,
  //       commit
  //   );
  // });
}

function commit(commitData) {
  if (!commitData) {
    triggerNotificationBox('alert', 'Something unexpected happened, please try again.');
    return;
  }
  const selection = commitData.selection;
  const repo = commitData.repo;
  const file = commitData.file;
  const commitMessage = commitData.commitMessage;
  const fileHash = commitData.hash;

  chrome.storage.sync.get(["gitspeedUser"], (data) => {
    const userData = data.gitspeedUser;
    const url = githubCommitEndpoint
        .replace("#username", userData.username)
        .replace("#repo", repo)
        .replace("#file", file);

    var requestBody;
    if (fileHash) {
      requestBody = {
        message: commitMessage,
        content: selection,
        sha: fileHash
      }
    } else {
      requestBody = {
        message: commitMessage,
        content: selection,
      };
    }

    axios.put(
        url,
        requestBody,
        {
          headers: {
            Authorization: "token " + userData.access_token,
          },
        }
    ).then((response) => {
      triggerNotificationBox('success', "Commit has been successful");
      saveCommitDetails(repo, file, response);
    }).catch((error) => {
      const status = error.response.status;
      if(status == 422 || status == 409) {
        triggerNotificationBox('alert', 'Duplicate file that was not created using gitspeed already exists. Try changing the file name.');
      } else if (status == 401) {
        triggerNotificationBox('alert', 'Invalid access token found, please log in again to continue');
      } else {
        triggerNotificationBox('alert', 'Unexpected error during commit, please try again.');
      }
    });
  });
}

function saveCommitDetails(repo, file, response) {
  chrome.storage.sync.get(['gitspeedData'], (data) => {
    const gitspeedData = data.gitspeedData;
    let commits = gitspeedData.commits;
    commits[repo + file] = response.data.content.sha;
    chrome.storage.sync.set({'gitspeedData': gitspeedData});
  });
}
