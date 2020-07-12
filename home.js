const githubRepoEndpoint = "https://api.github.com/user/repos";

const githubRepoContentsEndpoint =
  "https://api.github.com/repos/#username/#repo/contents";

const githubCommitEndpoint =
  "https://api.github.com/repos/#username/#repo/contents/#file";

const pickSubsetFromMap = function (arrayOfObjects, keys) {
  const newObject = [];
  arrayOfObjects.forEach((ele) => {
    var subset = {};
    keys.forEach((key) => {
      subset[key] = ele[key];
    });
    newObject.push(subset);
  });
  return newObject;
};

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btn-repo").addEventListener("click", fetchRepo);

  document.getElementById("btn-dir").addEventListener("click", fetchDir);

  document.getElementById("btn-commit").addEventListener("click", initCommit);
});

function fetchRepo() {
  console.log("fetch repo clicked");
  chrome.storage.local.get(["gitspeed-user"], (data) => {
    const userData = data["gitspeed-user"];
    const accessToken = userData.access_token;
    axios
      .get(githubRepoEndpoint, {
        headers: {
          Authorization: "token " + accessToken,
        },
      })
      .then(processRepoResponse)
      .catch((error) => {});
  });
}

function processRepoResponse(resp) {
  if (resp.data) {
    const repos = pickSubsetFromMap(resp.data, ["name", "full_name"]);
    populateRepoBox(repos);
  }
}

function fetchDir(repo) {
  repo = "Programming";
  if (repo) {
    chrome.storage.local.get(["gitspeed-user"], (data) => {
      const userData = data["gitspeed-user"];
      const username = userData.username;
      const accessToken = userData.access_token;

      const url = githubRepoContentsEndpoint
        .replace("#username", username)
        .replace("#repo", repo);
      axios
        .get(url, {
          headers: {
            Authorization: "token " + accessToken,
          },
        })
        .then((resp) => {
          const allDirs = recurseAllDirs(
            resp.data.filter((content) => {
              return content.type == "dir";
            }),
            userData
          );
          allDirs.sort();
          console.log(allDirs);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }
}

function recurseAllDirs(dirs, userData) {
  var allDirs = [];
  allDirs.push("/");
  dirs.forEach((dir) => {
    allDirs.push(dir.path);
    axios
      .get(dir.git_url + "?recursive=1", {
        headers: {
          Authorization: "token " + userData.access_token,
        },
      })
      .then((resp) => {
        resp.data.tree.forEach((ele) => {
          if (ele.type == "tree") allDirs.push(dir.path + "/" + ele.path);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  });
  return allDirs;
}

function initCommit() {
  const repo = "gittest"; // fetch from dom
  const fileWithPath = "Heyooo.java"; // fetch from dom
  const commitMessage = "Commit using gitspeed chrome extension"; // fetch from dom

  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "init-commit",
        params: {
          repo: repo,
          file: fileWithPath,
          commitMessage: commitMessage,
        },
      },
      null,
      commit
    );
  });
}

function commit(commitData) {
  const selection = commitData.selection;
  const repo = commitData.repo;
  const file = commitData.file;
  const commitMessage = commitData.commitMessage;

  chrome.storage.local.get(["gitspeed-user"], (data) => {
    const userData = data["gitspeed-user"];
    const url = githubCommitEndpoint
      .replace("#username", userData.username)
      .replace("#repo", repo)
      .replace("#file", file);
    axios.put(
      url,
      {
        message: commitMessage,
        content: btoa(selection.toString()),
      },
      {
        headers: {
          Authorization: "token " + userData.access_token,
        },
      }
    );
  });
}
