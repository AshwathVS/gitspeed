const githubRepoEndpoint = "https://api.github.com/user/repos";

const githubRepoContentsEndpoint =
    "https://api.github.com/repos/#username/#repo/contents";

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

const removeOptions = function (selectElement) {
    let i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
        selectElement.remove(i);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btn-add").addEventListener("click", () => {fetchUserAndCallFunction('addToCollection')});
    document.getElementById("btn-cancel").addEventListener("click", () => {fetchUserAndCallFunction('cancel')});
    document.getElementById('select-repo').addEventListener('change', () => {fetchUserAndCallFunction('populateDirectories')});
    fetchUserAndCallFunction("populateRepositories");
});

function fetchUserAndCallFunction(functionName) {
    chrome.storage.sync.get(['gitspeedUser'], (user) => {
        if(!user || !user.gitspeedUser) {
            chrome.browserAction.setPopup({
                popup: "login.html",
            });
            document.location.href = document.location.href.replace("addPath.html", "login.html");
            return;
        }
        switch (functionName) {
            case "addToCollection": {
                addToCollection(user.gitspeedUser);
                break;
            }
            case "cancel": {
                cancel();
                break;
            }
            case "populateRepositories": {
                populateRepositories(user.gitspeedUser);
                break;
            }
            case "populateDirectories": {
                populateDirectories(user.gitspeedUser);
                break;
            }
        }
    })
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

function addToCollection(userData) {
    const repo = document.getElementById('select-repo').value;
    const folder = document.getElementById('select-folder').value;

    if (repo == "##~~INVALID~~##" || folder == "##~~INVALID~~##") {
        triggerNotificationBox('alert', 'Please select valid options before adding');
        return;
    }

    chrome.storage.sync.get(['gitspeedData'], (data) => {
        const gitspeedData = data.gitspeedData;
        let collection = gitspeedData.collection;
        const duplicate = collection.filter((ele) => {
            return ele.repo == repo && ele.folder == folder;
        });

        if (duplicate.length == 0) {
            collection.push({repo: repo, folder: folder});
            gitspeedData.collection = collection;
            chrome.storage.sync.set({'gitspeedData': gitspeedData});
        }

        triggerNotificationBox('success', 'Successfully added');
    });
}

function cancel() {
    document.location.href = document.location.href.replace("addPath.html", "home.html");
}

async function populateRepositories(user) {
    let repositories = await fetchRepositories(user);
    if(!repositories || repositories.length == 0) {
        triggerNotificationBox('alert', 'No repositories found, try adding a repository.');
        return;
    }
    const repoSelectElement = document.getElementById('select-repo');

    repositories.forEach((ele) => {
        const opt = document.createElement('option');
        opt.value = ele.name;
        opt.innerHTML = ele.name;
        repoSelectElement.appendChild(opt);
    })
    repoSelectElement.disabled = false;
}

const fetchRepositories = async(userData) => {
    return new Promise(((resolve, reject) => {
        const accessToken = userData.access_token;
        axios
            .get(githubRepoEndpoint, {
                headers: {
                    Authorization: "token " + accessToken,
                },
            })
            .then((resp) => {
                const repositories = pickSubsetFromMap(resp.data, ["name", "full_name"]);
                repositories.sort((a, b) => {
                    return a.name - b.name;
                });
                resolve(repositories);
            })
            .catch((error) => {
              if(error.response.status == 401) {
                triggerNotificationBox('alert', "Invalid access token found, please log in again to continue");
              }
            });
    }));
};

function populateDirectories(userData) {
    removeOptions(document.getElementById('select-folder'));
    const repo = document.getElementById('select-repo').value;
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
        .then(async (resp) => {
            const allDirs = await recurseAllDirs(
                resp.data.filter((content) => {
                    return content.type == "dir";
                }),
                userData
            );
            allDirs.sort();
            processDirectories(allDirs);
        })
        .catch(console.error);
}

async function recurseAllDirs(dirs, userData) {
    var allDirs = [];
    allDirs.push("/");
    for (const dir of dirs) {
        const pathWithForwardSlash = "/" + dir.path;
        allDirs.push(pathWithForwardSlash);
        const resp = await axios
            .get(dir.git_url + "?recursive=1", {
                headers: {
                    Authorization: "token " + userData.access_token,
                },
            });
        resp.data.tree.forEach((ele) => {
            if (ele.type == "tree") allDirs.push(pathWithForwardSlash + "/" + ele.path);
        });
    }
    return allDirs;
}

function processDirectories(directories) {
    const directorySelectElement = document.getElementById('select-folder');
    directories.forEach((ele) => {
        const opt = document.createElement('option');
        opt.value = ele;
        opt.title = ele;
        opt.innerHTML = ele;
        directorySelectElement.appendChild(opt);
    });
    directorySelectElement.disabled = false;
}
