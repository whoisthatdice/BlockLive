/*
   This extension was made with DinoBuilder!
   https://dinobuilder.vercel.app/
*/
(async function(Scratch) {
    const variables = {};
    const blocks = [];
    const menus = {};


    if (!Scratch.extensions.unsandboxed) {
        alert("This extension needs to be unsandboxed to run!")
        return
    }

    function doSound(ab, cd, runtime) {
        const audioEngine = runtime.audioEngine;

        const fetchAsArrayBufferWithTimeout = (url) =>
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                let timeout = setTimeout(() => {
                    xhr.abort();
                    reject(new Error("Timed out"));
                }, 5000);
                xhr.onload = () => {
                    clearTimeout(timeout);
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`HTTP error ${xhr.status} while fetching ${url}`));
                    }
                };
                xhr.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to request ${url}`));
                };
                xhr.responseType = "arraybuffer";
                xhr.open("GET", url);
                xhr.send();
            });

        const soundPlayerCache = new Map();

        const decodeSoundPlayer = async (url) => {
            const cached = soundPlayerCache.get(url);
            if (cached) {
                if (cached.sound) {
                    return cached.sound;
                }
                throw cached.error;
            }

            try {
                const arrayBuffer = await fetchAsArrayBufferWithTimeout(url);
                const soundPlayer = await audioEngine.decodeSoundPlayer({
                    data: {
                        buffer: arrayBuffer,
                    },
                });
                soundPlayerCache.set(url, {
                    sound: soundPlayer,
                    error: null,
                });
                return soundPlayer;
            } catch (e) {
                soundPlayerCache.set(url, {
                    sound: null,
                    error: e,
                });
                throw e;
            }
        };

        const playWithAudioEngine = async (url, target) => {
            const soundBank = target.sprite.soundBank;

            let soundPlayer;
            try {
                const originalSoundPlayer = await decodeSoundPlayer(url);
                soundPlayer = originalSoundPlayer.take();
            } catch (e) {
                console.warn(
                    "Could not fetch audio; falling back to primitive approach",
                    e
                );
                return false;
            }

            soundBank.addSoundPlayer(soundPlayer);
            await soundBank.playSound(target, soundPlayer.id);

            delete soundBank.soundPlayers[soundPlayer.id];
            soundBank.playerTargets.delete(soundPlayer.id);
            soundBank.soundEffects.delete(soundPlayer.id);

            return true;
        };

        const playWithAudioElement = (url, target) =>
            new Promise((resolve, reject) => {
                const mediaElement = new Audio(url);

                mediaElement.volume = target.volume / 100;

                mediaElement.onended = () => {
                    resolve();
                };
                mediaElement
                    .play()
                    .then(() => {
                        // Wait for onended
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });

        const playSound = async (url, target) => {
            try {
                if (!(await Scratch.canFetch(url))) {
                    throw new Error(`Permission to fetch ${url} denied`);
                }

                const success = await playWithAudioEngine(url, target);
                if (!success) {
                    return await playWithAudioElement(url, target);
                }
            } catch (e) {
                console.warn(`All attempts to play ${url} failed`, e);
            }
        };

        playSound(ab, cd)
    }

    const ExtForge_Utils = {
        // from https://jwklong.github.io/extforge
        Broadcasts: new function() {
            this.raw_ = {};
            this.register = (name, blocks) => {
                this.raw_[name] = blocks;
            };
            this.execute = async (name) => {
                if (this.raw_[name]) {
                    await this.raw_[name]();
                };
            };
        }
    }
    class Extension {
        getInfo() {
            return {
                "blockIconURI": "data:image/png;base64,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",
                "id": "BlockLive",
                "name": "BlockLive",
                "color1": "#0088ff",
                "color2": "#0063ba",
                "tbShow": true,
                "blocks": blocks,
                "menus": menus
            }
        }
    }
    blocks.push({
        opcode: `clearLocalStorage`,
        blockType: Scratch.BlockType.COMMAND,
        hideFromPalette: false,
        color1: `#4c00ff`,
        color2: `#73ffd0`,
        color3: `#73ffd0`,
        text: `clear localstorage`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`clearLocalStorage`] = async (args, util) => {
        localStorage.clear()
    };

    blocks.push({
        opcode: `openURLinNewTab`,
        blockType: Scratch.BlockType.COMMAND,
        hideFromPalette: false,
        color1: `#4c00ff`,
        color2: `#73ffd0`,
        color3: `#73ffd0`,
        text: `open url in new tab [url]`,
        arguments: {
            "url": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://www.penguinmod.com',
            },
        },
        disableMonitor: true
    });
    Extension.prototype[`openURLinNewTab`] = async (args, util) => {
        Scratch.open(args["url"])
    };

    blocks.push({
        opcode: `modulo`,
        blockType: Scratch.BlockType.REPORTER,
        hideFromPalette: false,
        color1: `#80ff00`,
        color2: `#ff73a2`,
        color3: `#ff7773`,
        text: `[numbModu] modulo [numbModulo]`,
        arguments: {
            "numbModu": {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0,
            },
            "numbModulo": {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0,
            },
        },
        disableMonitor: true
    });
    Extension.prototype[`modulo`] = async (args, util) => {
        return (args["numbModu"] % args["numbModulo"])
    };

    blocks.push({
        opcode: `currentSprite`,
        blockType: Scratch.BlockType.REPORTER,
        hideFromPalette: false,
        color1: `#00ff00`,
        color2: `#ff00cc`,
        color3: `#3e99a3`,
        text: `current sprite`,
        filter: [Scratch.TargetType.SPRITE]
        arguments: {},
        disableMonitor: false
    });
    Extension.prototype[`currentSprite`] = async (args, util) => {
        return util.target
    };

    blocks.push({
        opcode: `===`,
        blockType: Scratch.BlockType.BOOLEAN,
        hideFromPalette: false,
        color1: `#00ff00`,
        color2: `#ff00cc`,
        color3: `#3e99a3`,
        text: `[numb1] === [numb2]`,
        arguments: {
            "numb1": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 0,
            },
            "numb2": {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 0,
            },
        },
        disableMonitor: true
    });
    Extension.prototype[`===`] = async (args, util) => {
        return (args["numb2"] === args["numb2"])
    };

    Scratch.extensions.register(new Extension());
})(Scratch);
