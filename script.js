console.log("This is the JavaScript...");
let songul;
let currentsong = new Audio();
let currfolder;
let isMuted = false;
let previousVolume = 1;

/**
 * Converts seconds to time format "MM:SS".
 * @param {number} seconds - The number of seconds to convert.
 * @returns {string} The formatted time in "MM:SS".
 */
function convertSecondsToTimeFormat(seconds) {
    // Ensure the input is valid
    if (isNaN(seconds) || seconds < 0) {
        throw new Error('Invalid input. Seconds must be a non-negative number.');
    }

    // Calculate minutes and remaining seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Format minutes and seconds
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    // Return the formatted time in "MM:SS" format
    return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Fetches the list of songs from the server.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of song names.
 */
async function getSongs(folder) {
    try {
        currfolder = folder;
        let response = await fetch(`http://127.0.0.1:3000/${folder}/`);

        if (response.ok) {
            let data = await response.text();
            let div = document.createElement("div");
            div.innerHTML = data;
            let as = div.getElementsByTagName("a");
            let songs = [];

            for (let index = 0; index < as.length; index++) {
                const element = as[index];
                if (element.href.endsWith(".mp3")) {
                    songs.push(element.href.split(`${folder}/`)[1]);
                }
            }

            return songs;
        } else {
            console.error('Network response was not ok:', response.statusText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

/**
 * Plays the specified track or pauses it if specified.
 * @param {string} track - The track to play.
 * @param {boolean} pause - Whether to pause the track instead of playing it.
 */
const playmusic = (track, pause = false) => {
    currentsong.src = `${currfolder}/${track}`;
    if (!pause) {
        currentsong.play().catch(error => console.error("Error playing audio:", error));
        play.src = "images/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

/**
 * The main function to initialize the music player.
 */
async function main() {
    // Fetching the songs and storing them in an array
    let songs = await getSongs("songs/ncs");
    playmusic(songs[0], true);
    console.log(songs);
    songul = document.querySelector(".playlistbox").getElementsByTagName("ul")[0];
    for (const song of songs) {
        songul.innerHTML += `
            <li>
                <img class="invert" src="images/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div> <!-- Fix spacing issue -->
                    <div></div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="images/play.svg" alt="">
                </div>
            </li>`;
    }

    // Added click event listeners to all list items
    Array.from(songul.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            let track = e.querySelector(".info").firstElementChild.innerHTML.trim();
            console.log("Track clicked:", track);
            playmusic(track);
        });
    });

    // Event listener for play button
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "images/pause.svg";
        } else {
            currentsong.pause();
            play.src = "images/play.svg";
        }
    });

    // Event listener for time update to display the current time and duration
    currentsong.addEventListener("timeupdate", () => {
        console.log(currentsong.currentTime, currentsong.duration);
        document.querySelector(".songtime").innerHTML = `${convertSecondsToTimeFormat(currentsong.currentTime)} / ${convertSecondsToTimeFormat(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Event listener for seekbar click to change the current time
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = currentsong.duration * percent / 100;
    });

    // Event listener for previous button
    prev.addEventListener("click", () => {
        console.log("Previous Was Clicked...");
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playmusic(songs[index - 1]);
        } else {
            playmusic(songs[0]);
        }
    });

    // Event listener for next button
    next.addEventListener("click", () => {
        currentsong.pause();
        console.log("Next Was Clicked...");
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playmusic(songs[index + 1]);
        } else {
            playmusic(songs[index]);
        }
    });

    // Event listener for spacebar to toggle play/pause
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            event.preventDefault(); // Prevent default spacebar behavior (scrolling)
            if (currentsong.paused) {
                currentsong.play();
                play.src = "images/pause.svg";
            } else {
                currentsong.pause();
                play.src = "images/play.svg";
            }
        }
    });

    // Event listener to play next song as soon as the previous song is ended
    currentsong.addEventListener('ended', () => {
        console.log("Song Ended...");
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playmusic(songs[index + 1]);
        } else {
            playmusic(songs[0]);
        }
    });

    // Added an event listener for volume range
    document.querySelector(".volumerange input").addEventListener("input", (e) => {
        let volume = parseInt(e.target.value) / 100;
        console.log("Volume changed to:", volume); // Debugging log
        currentsong.volume = volume;
    });

    const toggleMute = () => {
        if (isMuted) {
            // Unmute: Restore the previous volume
            currentsong.volume = previousVolume;
            isMuted = false;
        } else {
            // Mute: Store the current volume and set volume to 0
            previousVolume = currentsong.volume;
            currentsong.volume = 0;
            isMuted = true;
        }
        console.log(isMuted ? "Muted" : "Unmuted"); // Debugging log
        // Optionally, change the speaker icon to reflect mute state
        const volume = document.querySelector(".volumerange img");
        if (isMuted) {
            volume.src = "images/mute.svg";
            document.querySelector(".volumerange input").value = 0;
        } else {
            volume.src = "images/volume.svg";
            document.querySelector(".volumerange input").value = 10;
        }
    };
    document.querySelector(".volumerange img").addEventListener("click", toggleMute);

    /**
     * Function to load songs from a specified folder and update the playlist
     * @param {string} folder - The folder from which to load songs.
     */
    async function loadSongsFromFolder(folder) {
        let songs = await getSongs(folder);
        songul.innerHTML = ""; // Clear existing playlist
        for (const song of songs) {
            songul.innerHTML += `
                <li>
                    <img class="invert" src="images/music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div></div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="images/play.svg" alt="">
                    </div>
                </li>`;
        }

        // Add click event listeners to all list items
        Array.from(songul.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                let track = e.querySelector(".info").firstElementChild.innerHTML.trim();
                console.log("Track clicked:", track);
                playmusic(track);
            });
        });
        currentsong.addEventListener('ended', () => {
            console.log("Song Ended...");
            let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
            if (index + 1 <= songs.length) {
                playmusic(songs[index + 1]);
            } else {
                playmusic(songs[0]);
            }
        }); 

        // Start playing the first song
        // if (songs.length > 0) {
        //     playmusic(songs[0]);
        // }
    }

    // Add the event listener to the artist and library element
    document.getElementById("library").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/ncs");
    });
    document.getElementById("artist1").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestOFK.K");
    });

    document.getElementById("artist2").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestOfArijitSingh");
    });
    document.getElementById("artist3").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestOfA.RRahman");
    });
    document.getElementById("artist4").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestofSachinjigar");
    });
    document.getElementById("artist5").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestofAnirudha");
    });
    document.getElementById("artist6").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestofVishalMishra");
    });
    document.getElementById("artist7").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/BestofAtifAslam");
    });

    // Adding Event listeners to the albums
    document.getElementById("album1").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/Sajni");
    });
    document.getElementById("album2").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/Zarror");
    });
    document.getElementById("album3").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/Heeriye");
    });
    document.getElementById("album4").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/TujhMey");
    });
    document.getElementById("album5").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/SuniyaSuniya");
    });
    document.getElementById("album6").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/ChannaVe");
    });
    document.getElementById("album7").addEventListener("click", async () => {
        await loadSongsFromFolder("songs/Softly");
    });
}
main();
