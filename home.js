const githubCommitEndpoint =
  "https://api.github.com/repos/#username/#repo/contents/#file";

document.addEventListener("DOMContentLoaded", function () {

  document.getElementById("btn-cancel").addEventListener("click", resetPage);

  document.getElementById("btn-commit").addEventListener("click", initCommit);

  document.getElementById("btn-add-repo").addEventListener("click", addNewPath);

  populatePaths();
});

function addNewPath() {
  document.location.href = document.location.href.replace("home.html", "addPath.html");
}

function resetPage() {
  document.location.reload();
}

function populatePaths() {
  chrome.storage.sync.get(['gitspeedData'], (data) => {
    if(data && data.gitspeedData) {
      const collection = data.gitspeedData.collection;
      if (collection && collection.length > 0) {
        const selectPathElement = document.getElementById('select-path');
        collection.sort((a, b) => {
          if(a.repo == b.repo) {
            return a.folder - b.folder;
          } else {
            return a.repo - b.repo;
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
    fileNameWithPath = split[1].trim() + "/" + filename;
  } else {
    fileNameWithPath = filename;
  }

  commit({repo: repo, selection: btoa(fileContent), file: fileNameWithPath, commitMessage: commitMessage});

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

  console.log('selection', selection);
  console.log('repo', repo);
  console.log('file', file);
  console.log('commitMessage', commitMessage);

  chrome.storage.sync.get(["gitspeedUser"], (data) => {
    const userData = data.gitspeedUser;
    const url = githubCommitEndpoint
        .replace("#username", userData.username)
        .replace("#repo", repo)
        .replace("#file", file);
    axios.put(
        url,
        {
          message: commitMessage,
          content: selection,
        },
        {
          headers: {
            Authorization: "token " + userData.access_token,
          },
        }
    ).then((success) => {
      triggerNotificationBox('success', "Commit has been successful");
    }).catch((error) => {
      triggerNotificationBox('alert', 'Unexpected error during commit, please try again.');
    });
  });
}
