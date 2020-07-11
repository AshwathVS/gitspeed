document.addEventListener("seekToSecond", function (e) {
  document.getElementById("movie_player").seekTo(e.detail);
});
