let buildHash = "Not compiled";
if (typeof arrasBuild != "undefined") {
    buildHash = arrasBuild;
}
// Fundamental requires <3
var global = {
    started: false,
    inGame: false,
    state: 0,
    version: "v0.13",
    // 0: Logo
    // 1: Menu
    // 2: version error
    // 3: ingame
    // Keys and other mathematical constants
    KEY_ESC: 27,
    KEY_ENTER: 13,
    KEY_CHAT: 13,
    KEY_FIREFOOD: 119,
    KEY_SPLIT: 32,
    KEY_LEFT: 65,
    KEY_UP: 87,
    KEY_RIGHT: 68,
    KEY_DOWN: 83,
    KEY_LEFT_ARROW: 37,
    KEY_UP_ARROW: 38,
    KEY_RIGHT_ARROW: 39,
    KEY_DOWN_ARROW: 40,
    KEY_AUTO_SPIN: 67,
    KEY_AUTO_FIRE: 69,
    KEY_OVER_RIDE: 82,
    KEY_UPGRADE_ATK: 49,
    KEY_UPGRADE_HTL: 50,
    KEY_UPGRADE_SPD: 51,
    KEY_UPGRADE_STR: 52,
    KEY_UPGRADE_PEN: 53,
    KEY_UPGRADE_DAM: 54,
    KEY_UPGRADE_RLD: 55,
    KEY_UPGRADE_MOB: 56,
    KEY_UPGRADE_RGN: 57,
    KEY_UPGRADE_SHI: 48,
    KEY_UPGRADE_MAX: 77,
    KEY_MOUSE_0: 32,
    KEY_MOUSE_1: 86,
    KEY_MOUSE_2: 16,
    KEY_CHOOSE_1: 89,
    KEY_CHOOSE_2: 72,
    KEY_CHOOSE_3: 85,
    KEY_CHOOSE_4: 74,
    KEY_CHOOSE_5: 73,
    KEY_CHOOSE_6: 75,
    KEY_CHOOSE_7: 79,
    KEY_CHOOSE_8: 76,
    KEY_LEVEL_UP: 78,
    KEY_FUCK_YOU: 81,
    KEY_FUCK_YOUV2: 192,
  
    // Canvas
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    gameWidth: 0,
    gameHeight: 0,
    xoffset: -0,
    yoffset: -0,
    gameStart: false,
    disconnected: false,
    died: false,
    kicked: false,
    continuity: false,
    startPingTime: 0,
    toggleMassState: 0,
    backgroundColor: '#f2fbff',
    lineColor: '#000000',
    animations: {
        logo: 0,
        enterToStart: 0,
        enterToStartActivated: false,
        menu: 1,
        scoreBar: 1,
        menuFade: 1,
        menuFadeBlack: 1,
    },
    server: window.top.location.host,
    secure: true, // only on heroku!!
};

var util = (function (exports = {}) {
    exports.restoreMenu = function () {
        document.getElementById("startMenuWrapper").style.opacity = 1;
        document.getElementById("startMenuWrapper").style.top = "50px";
        document.getElementById("startMenuWrapper").style.display = "block";
        document.getElementById("menu").style.opacity = 1;
        document.getElementById("menu").style.top = "50px";
        document.getElementById("menu").style.display = "block";
    }
    exports.lerp = function (v0, v1, t) {
        return v0 * (1 - t) + v1 * t
    }
    exports.submitToLocalStorage = name => {
        localStorage.setItem(name + 'Value', document.getElementById(name).value);
        localStorage.setItem(name + 'Checked', document.getElementById(name).checked);
        return false;
    };
    exports.retrieveFromLocalStorage = name => {
        document.getElementById(name).value = localStorage.getItem(name + 'Value');
        document.getElementById(name).checked = localStorage.getItem(name + 'Checked') === 'true';
        return false;
    };
    exports.handleLargeNumber = (a, cullZeroes = false) => {
        if (cullZeroes && a == 0) {
            return '';
        }

        if (a < Math.pow(10, 3)) {
            return '' + a.toFixed(0);
        }

        if (a < Math.pow(10, 6)) {
            return (a / Math.pow(10, 3)).toFixed(2) + "k";
        }

        if (a < Math.pow(10, 9)) {
            return (a / Math.pow(10, 6)).toFixed(2) + "m";
        }

        if (a < Math.pow(10, 12)) {
            return (a / Math.pow(10, 9)).toFixed(2) + "b";
        }

        if (a < Math.pow(10, 15)) {
            return (a / Math.pow(10, 12)).toFixed(2) + "t";
        }

        return (a / Math.pow(10, 15)).toFixed(2) + "q";

    };
    exports.timeForHumans = x => {
        // ought to be in seconds
        let seconds = x % 60;
        x /= 60;
        x = Math.floor(x);
        let minutes = x % 60;
        x /= 60;
        x = Math.floor(x);
        let hours = x % 24;
        x /= 24;
        x = Math.floor(x);
        let days = x;
        let y = '';

        function weh(z, text) {
            if (z) {
                y = y + ((y === '') ? '' : ', ') + z + ' ' + text + ((z > 1) ? 's' : '');
            }
        }
        weh(days, 'day');
        weh(hours, 'hour');
        weh(minutes, 'minute');
        weh(seconds, 'second');
        if (y === '') {
            y = 'less than a second';
        }
        return y;
    };
    exports.addArticle = string => {
        return (/[aeiouAEIOU]/.test(string[0])) ? 'an ' + string : 'a ' + string;
    };
    exports.formatLargeNumber = x => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    exports.pullJSON = url => {
        let request = new XMLHttpRequest();
        // Set up the request
        console.log("Loading JSON from " + url);
        request.responseType = 'json';
        // Return a promise
        return new Promise((resolve, reject) => {
            request.open('GET', url);
            request.onload = () => {
                resolve(request.response);
                console.log('JSON load complete.');
            };
            request.onerror = () => {
                reject(request.statusText);
                console.log('JSON load failed.');
                console.log(request.statusText);
            };
            request.send();
        });
    };
    return exports;
})();

// Get color
var config = {
    graphical: {
        screenshotMode: false,
        borderChunk: 6,
        barChunk: 5,
        mininumBorderChunk: 3,
        deathBlurAmount: 3,
        darkBorders: false,
        fancyAnimations: true,
        colors: 'normal',
        pointy: true,
        fontSizeBoost: 1,
        neon: false,
        shadowColor: "#0000000F",
    },
    gui: {
        expectedMaxSkillLevel: 9,
    },
    lag: {
        unresponsive: false,
        memory: 60,
    },
};
var colors = {
    "normal": {
        "teal": "#7ADBBC",
        "lgreen": "#B9E87E",
        "orange": "#E7896D",
        "yellow": "#FDF380",
        "lavender": "#B58EFD",
        "pink": "#EF99C3",
        "vlgrey": "#E8EBF7",
        "lgrey": "#AA9F9E",
        "guiwhite": "#FFFFFF",
        "black": "#484848",
        "blue": "#3CA4CB",
        "green": "#8ABC3F",
        "red": "#E03E41",
        "gold": "#EFC74B",
        "purple": "#8D6ADF",
        "magenta": "#CC669C",
        "grey": "#A7A7AF",
        "dgrey": "#726F6F",
        "white": "#DBDBDB",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.65
    },
    "classic": {
        "teal": "#8EFFFB",
        "lgreen": "#85E37D",
        "orange": "#FC7676",
        "yellow": "#FFEB8E",
        "lavender": "#B58EFF",
        "pink": "#F177DD",
        "vlgrey": "#CDCDCD",
        "lgrey": "#999999",
        "guiwhite": "#FFFFFF",
        "black": "#525252",
        "blue": "#00B0E1",
        "green": "#00E06C",
        "red": "#F04F54",
        "gold": "#FFE46B",
        "purple": "#768CFC",
        "magenta": "#BE7FF5",
        "grey": "#999999",
        "dgrey": "#545454",
        "white": "#C0C0C0",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.5
    },
    "dark": {
        "teal": "#8975B7",
        "lgreen": "#1BA01F",
        "orange": "#C46748",
        "yellow": "#B2B224",
        "lavender": "#7D56C5",
        "pink": "#B24FAE",
        "vlgrey": "#1E1E1E",
        "lgrey": "#3C3A3A",
        "guiwhite": "#000000",
        "black": "#E5E5E5",
        "blue": "#379FC6",
        "green": "#30B53B",
        "red": "#FF6C6E",
        "gold": "#FFC665",
        "purple": "#9673E8",
        "magenta": "#C8679B",
        "grey": "#635F5F",
        "dgrey": "#73747A",
        "white": "#11110F",
        "guiblack": "#FFFFFF",
        "paletteSize": 10,
        "border": 0.15
    },
    "natural": {
        "teal": "#76C1BB",
        "lgreen": "#AAD35D",
        "orange": "#E09545",
        "yellow": "#FFD993",
        "lavender": "#939FFF",
        "pink": "#D87FB2",
        "vlgrey": "#C4B6B6",
        "lgrey": "#7F7F7F",
        "guiwhite": "#FFFFFF",
        "black": "#373834",
        "blue": "#4F93B5",
        "green": "#00B659",
        "red": "#E14F65",
        "gold": "#E5BF42",
        "purple": "#8053A0",
        "magenta": "#B67CAA",
        "grey": "#998F8F",
        "dgrey": "#494954",
        "white": "#A5B2A5",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.2
    },
    "forest": {
        "teal": "#884AA5",
        "lgreen": "#8C9B3E",
        "orange": "#D16A80",
        "yellow": "#97596D",
        "lavender": "#499855",
        "pink": "#60294F",
        "vlgrey": "#DDC6B8",
        "lgrey": "#7E949E",
        "guiwhite": "#FFFFE8",
        "black": "#665750",
        "blue": "#807BB6",
        "green": "#A1BE55",
        "red": "#E5B05B",
        "gold": "#FF4747",
        "purple": "#BAC674",
        "magenta": "#BA78D1",
        "grey": "#998866",
        "dgrey": "#529758",
        "white": "#7DA060",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.7
    },
    "midnight": {
        "teal": "#2B9098",
        "lgreen": "#4BAA5D",
        "orange": "#345678",
        "yellow": "#CDC684",
        "lavender": "#89778E",
        "pink": "#A85C90",
        "vlgrey": "#CCCCCC",
        "lgrey": "#A7B2B7",
        "guiwhite": "#BAC6FF",
        "black": "#091F28",
        "blue": "#123455",
        "green": "#098765",
        "red": "#000013",
        "gold": "#566381",
        "purple": "#743784",
        "magenta": "#B29098",
        "grey": "#555555",
        "dgrey": "#649EB7",
        "white": "#444444",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.6
    },
    "pastel": {
        "teal": "#89BFBA",
        "lgreen": "#B5D17D",
        "orange": "#E5E0E0",
        "yellow": "#B5BBE5",
        "lavender": "#939FFF",
        "pink": "#646DE5",
        "vlgrey": "#B2B2B2",
        "lgrey": "#7F7F7F",
        "guiwhite": "#FFFFFF",
        "black": "#383835",
        "blue": "#AEAEFF",
        "green": "#AEFFAE",
        "red": "#FFAEAE",
        "gold": "#FFFFFF",
        "purple": "#C3C3D8",
        "magenta": "#FFB5FF",
        "grey": "#CCCCCC",
        "dgrey": "#A0A0B2",
        "white": "#F2F2F2",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.35
    },
    "space": {
        "teal": "#4788F3",
        "lgreen": "#AF1010",
        "orange": "#FF0000",
        "yellow": "#82F850",
        "lavender": "#FFFFFF",
        "pink": "#57006C",
        "vlgrey": "#FFFFFF",
        "lgrey": "#272727",
        "guiwhite": "#000000",
        "black": "#7F7F7F",
        "blue": "#0E1B92",
        "green": "#0AEB80",
        "red": "#C2B90A",
        "gold": "#3E7E8C",
        "purple": "#285911",
        "magenta": "#A9707E",
        "grey": "#6F6A68",
        "dgrey": "#2D0738",
        "white": "#000000",
        "guiblack": "#FFFFFF",
        "paletteSize": 10,
        "border": 0.25
    },
    "nebula": {
        "teal": "#38B06E",
        "lgreen": "#22882E",
        "orange": "#D28E7F",
        "yellow": "#D5D879",
        "lavender": "#E084EB",
        "pink": "#DF3E3E",
        "vlgrey": "#F0F2CC",
        "lgrey": "#7D7D7D",
        "guiwhite": "#C2C5EF",
        "black": "#161616",
        "blue": "#9274E6",
        "green": "#89F470",
        "red": "#E08E5D",
        "gold": "#ECDC58",
        "purple": "#58CBEC",
        "magenta": "#EA58EC",
        "grey": "#7E5713",
        "dgrey": "#303030",
        "white": "#555555",
        "guiblack": "#EAEAEA",
        "paletteSize": 10,
        "border": 0.5
    },
    "bleach": {
        "teal": "#00FFFF",
        "lgreen": "#00FF00",
        "orange": "#FF3200",
        "yellow": "#FFEC00",
        "lavender": "#FF24A7",
        "pink": "#FF3CBD",
        "vlgrey": "#FFF186",
        "lgrey": "#918181",
        "guiwhite": "#F1F1F1",
        "black": "#5F5F5F",
        "blue": "#0025FF",
        "green": "#00FF00",
        "red": "#FF0000",
        "gold": "#FFFA23",
        "purple": "#3100FF",
        "magenta": "#D4D3D3",
        "grey": "#838383",
        "dgrey": "#4C4C4C",
        "white": "#FFFEFE",
        "guiblack": "#080808",
        "paletteSize": 10,
        "border": 0.4
    },
    "ocean": {
        "teal": "#76EEC6",
        "lgreen": "#41AA78",
        "orange": "#FF7F50",
        "yellow": "#FFD250",
        "lavender": "#DC3388",
        "pink": "#FA8072",
        "vlgrey": "#8B8886",
        "lgrey": "#BFC1C2",
        "guiwhite": "#FFFFFF",
        "black": "#12466B",
        "blue": "#4200AE",
        "green": "#0D6338",
        "red": "#DC4333",
        "gold": "#FEA904",
        "purple": "#7B4BAB",
        "magenta": "#5C246E",
        "grey": "#656884",
        "dgrey": "#D4D7D9",
        "white": "#3283BC",
        "guiblack": "#000000",
        "paletteSize": 10,
        "border": 0.3
    },
    "badlands": {
        "teal": "#F9CB9C",
        "lgreen": "#F1C232",
        "orange": "#38761D",
        "yellow": "#E69138",
        "lavender": "#B7B7B7",
        "pink": "#78866B",
        "vlgrey": "#6AA84F",
        "lgrey": "#B7B7B7",
        "guiwhite": "#A4C2F4",
        "black": "#000000",
        "blue": "#0C5A9E",
        "green": "#6E8922",
        "red": "#5B0000",
        "gold": "#783F04",
        "purple": "#591C77",
        "magenta": "#20124D",
        "grey": "#2F1C16",
        "dgrey": "#999999",
        "white": "#543517",
        "guiblack": "#CFE2F3",
        "paletteSize": 10,
        "border": 0.4
    }
}
let color = colors.normal;
// Color functions
let mixColors = (() => {
    /** https://gist.github.com/jedfoster/7939513 **/
    function d2h(d) {
        return d.toString(16);
    } // convert a decimal value to hex
    function h2d(h) {
        return parseInt(h, 16);
    } // convert a hex value to decimal 
    return (color_2, color_1, weight = 0.5) => {
        if (weight === 1) return color_1;
        if (weight === 0) return color_2;
        var col = "#";
        for (var i = 1; i <= 6; i += 2) { // loop through each of the 3 hex pairs—red, green, and blue, skip the '#'
            var v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
                v2 = h2d(color_2.substr(i, 2)),
                // combine the current pairs from each source color, according to the specified weight
                val = d2h(Math.floor(v2 + (v1 - v2) * weight));

            while (val.length < 2) {
                val = '0' + val;
            } // prepend a '0' if val results in a single digit        
            col += val; // concatenate val to our new color string
        }
        return col; // PROFIT!
    };
})();

function getColor(colorNumber) {
    switch (colorNumber) {
        case 0:
            return color.teal;
        case 1:
            return color.lgreen;
        case 2:
            return color.orange;
        case 3:
            return color.yellow;
        case 4:
            return color.lavender;
        case 5:
            return color.pink;
        case 6:
            return color.vlgrey;
        case 7:
            return color.lgrey;
        case 8:
            return color.guiwhite;
        case 9:
            return color.black;
        case 10:
            return color.blue;
        case 11:
            return color.green;
        case 12:
            return color.red;
        case 13:
            return color.gold;
        case 14:
            return color.purple;
        case 15:
            return color.magenta;
        case 16:
            return color.grey;
        case 17:
            return color.dgrey;
        case 18:
            return color.white;
        case 19:
            return color.guiblack;

        default:
            return '#FF0000';
    }
}

function getColorDark(givenColor) {
    let dark = (config.graphical.neon) ? color.white : color.black;
    if (config.graphical.darkBorders) return dark;
    return mixColors(givenColor, dark, color.border);
}

function getZoneColor(cell, real) {
    switch (cell) {
        case 'bas1':
            return color.blue;
        case 'bas2':
            return color.green;
        case 'bas3':
            return color.red;
        case 'bas4':
            return color.pink;
        //case 'nest': return (real) ? color.purple : color.lavender;     
        default:
            return color.white;
    }
}

function setColor(context, givenColor) {
    if (config.graphical.neon) {
        context.fillStyle = getColorDark(givenColor);
        context.strokeStyle = givenColor;
    } else {
        context.fillStyle = givenColor;
        context.strokeStyle = getColorDark(givenColor);
    }
}

// Get mockups <3
var mockups = [];
//util.pullJSON('mockups').then(data => mockups = data);
// Mockup functions
function getEntityImageFromMockup(index, color = mockups[index].color) {
    let mockup = mockups[index];
    return {
        time: 0,
        index: index,
        x: mockup.x,
        y: mockup.y,
        vx: 0,
        vy: 0,
        size: mockup.size,
        realSize: mockup.realSize,
        color: color,
        render: {
            status: {
                getFade: () => {
                    return 1;
                },
                getColor: () => {
                    return '#FFFFFF';
                },
                getBlend: () => {
                    return 0;
                },
                health: {
                    get: () => {
                        return 1;
                    },
                },
                shield: {
                    get: () => {
                        return 1;
                    },
                },
            },
        },
        facing: mockup.facing,
        shape: mockup.shape,
        name: mockup.name,
        score: 0,
        tiggle: 0,
        layer: mockup.layer,
        guns: {
            length: mockup.guns.length,
            getPositions: () => {
                let a = [];
                mockup.guns.forEach(() => a.push(0));
                return a;
            },
            update: () => { },
        },
        turrets: mockup.turrets.map((t) => {
            let o = getEntityImageFromMockup(t.index);
            o.realSize = o.realSize / o.size * mockup.size * t.sizeFactor;
            o.size = mockup.size * t.sizeFactor;
            o.angle = t.angle;
            o.offset = t.offset;
            o.direction = t.direction;
            o.facing = t.direction + t.angle;
            o.isheli = mockup.isheli
            return o;
        }),
    };
}

// Define clickable regions
global.clickables = (() => {
    let Region = (() => {
        // Protected classes
        function Clickable() {
            let region = {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            };
            let active = false;
            return {
                set: (x, y, w, h) => {
                    region.x = x;
                    region.y = y;
                    region.w = w;
                    region.h = h;
                    active = true;
                },
                check: target => {
                    let dx = Math.round(target.x - region.x);
                    let dy = Math.round(target.y - region.y);
                    return active && dx >= 0 && dy >= 0 && dx <= region.w && dy <= region.h;
                },
                hide: () => {
                    active = false;
                },
            };
        }
        // Return the constructor
        return (size) => {
            // Define the region
            let data = [];
            for (let i = 0; i < size; i++) {
                data.push(Clickable());
            }
            // Return the region methods
            return {
                place: (index, ...a) => {
                    if (index >= data.length) {
                        console.log(index);
                        console.log(data);
                        throw new Error('Trying to reference a clickable outside a region!');
                    }
                    data[index].set(...a);
                },
                hide: () => {
                    data.forEach(r => r.hide());
                },
                check: x => {
                    return data.findIndex(r => {
                        return r.check(x);
                    });
                }
            };
        };
    })();
    return {
        stat: Region(10),
        upgrade: Region(20),
        hover: Region(1),
        skipUpgrades: Region(1),
    };
})();
global.statHover = false;
global.upgradeHover = false;

// Prepare stuff
var player = {
    reset: function () {
        player = {
            reset: player.reset,
            vx: 0,
            vy: 0,
            x: global.screenWidth / 2,
            y: global.screenHeight / 2,
            lastvx: 0,
            lastvy: 0,
            renderx: global.screenWidth / 2,
            rendery: global.screenHeight / 2,
            lastx: global.screenWidth / 2,
            lasty: global.screenHeight / 2,
            target: {
                x: global.screenWidth / 2,
                y: global.screenHeight / 2
            },
            name: '',
            lastUpdate: 0,
            time: 0,
        }
    }
};
player.reset();/*{ //Set up the player
    id: -1,
    x: global.screenWidth / 2,
    y: global.screenHeight / 2,
    vx: 0,
    vy: 0,
    renderx: global.screenWidth / 2,
    rendery: global.screenHeight / 2,
    renderv: 1,
    slip: 0,
    view: 1,
    time: 0,
    screenWidth: global.screenWidth,
    screenHeight: global.screenHeight,
    target: {
        x: global.screenWidth / 2,
        y: global.screenHeight / 2
    }
};*/
const Integrate = class {
    constructor(dataLength) {
        this.dataLength = dataLength
        this.elements = {}
    }
    update(delta, index = 0) {
        let deletedLength = delta[index++]
        for (let i = 0; i < deletedLength; i++)
            delete this.elements[delta[index++]]
        let updatedLength = delta[index++]
        for (let i = 0; i < updatedLength; i++) {
            let id = delta[index++]
            let data = delta.slice(index, index + this.dataLength)
            index += this.dataLength
            this.elements[id] = data
        }
        return index
    }
    entries() {
        return Object.entries(this.elements).map(([id, data]) => ({
            id: +id,
            data
        }))
    }
}
const Minimap = class {
    constructor(speed = 250) {
        this.speed = speed
        this.map = {}
        this.lastUpdate = Date.now()
    }
    update(elements) {
        this.lastUpdate = Date.now()
        for (let [key, value] of Object.entries(this.map))
            if (value.now) {
                value.old = value.now
                value.now = null
            } else {
                delete this.map[key]
            }
        for (let element of elements)
            if (this.map[element.id]) {
                this.map[element.id].now = element
            } else {
                this.map[element.id] = {
                    old: null,
                    now: element
                }
            }
    }
    get() {
        let state = Math.min(1, (Date.now() - this.lastUpdate) / this.speed)
        let stateOld = 1 - state
        return Object.values(this.map).map(({
            old,
            now
        }) => {
            if (!now)
                return {
                    type: old.type,
                    id: old.id,
                    x: old.x,
                    y: old.y,
                    color: old.color,
                    size: old.size,
                    alpha: stateOld,
                }
            if (!old)
                return {
                    type: now.type,
                    id: now.id,
                    x: now.x,
                    y: now.y,
                    color: now.color,
                    size: now.size,
                    alpha: state,
                }
            return {
                type: now.type,
                id: now.id,
                x: state * now.x + stateOld * old.x,
                y: state * now.y + stateOld * old.y,
                color: now.color,
                size: state * now.size + stateOld * old.size,
                alpha: 1,
            }
        })
    }
}
// Build the leaderboard object
const Entry = class {
    constructor(to) {
        this.score = Smoothbar(0, 10)
        this.update(to)
    }
    update(to) {
        this.name = to.name;
        this.bar = to.bar
        this.color = to.color
        this.index = to.index
        this.score.set(to.score)
        this.old = false
    }
    publish() {
        let ref = mockups[this.index]
        return {
            image: getEntityImageFromMockup(this.index, this.color),
            position: ref.position,
            barColor: getColor(this.bar),
            label: global.gameMode == "2tkr" ? this.name : this.name.length > 0 ? this.name + " - " + ref.name : ref.name,
            score: this.score.get(),
        }
    }
}
const Leaderboard = class {
    constructor() {
        this.entries = {}
    }
    get() {
        let out = []
        let max = 1
        for (let value of Object.values(this.entries)) {
            let data = value.publish()
            out.push(data)
            if (data.score > max)
                max = data.score
        }
        out.sort((a, b) => b.score - a.score)
        return {
            data: out,
            max
        }
    }
    update(elements) {
        elements.sort((a, b) => b.score - a.score)
        for (let value of Object.values(this.entries))
            value.old = true
        for (let element of elements)
            if (this.entries[element.id])
                this.entries[element.id].update(element)
            else
                this.entries[element.id] = new Entry(element)
        for (let [id, value] of Object.entries(this.entries))
            if (value.old)
                delete this.entries[id]
    }
}
var entities = [],
    users = [],
    minimapAllInt = new Integrate(5),
    minimapTeamInt = new Integrate(3),
    leaderboardInt = new Integrate(5),
    upgradeSpin = 0,
    messages = global.messages = [],
    chatmessages = global.chatmessages = [],
    leaderboard = new Leaderboard(),
    minimap = new Minimap(200),
    messageFade = 0,
    newMessage = 0,
    metrics = {
        latency: 0,
        lag: 0,
        rendertime: 0,
        updatetime: 0,
        lastlag: 0,
        lastrender: 0,
        rendergap: 0,
        lastuplink: 0,
    },
    lastPing = 0,
    renderTimes = 0,
    updateTimes = 0,
    target = {
        x: player.x,
        y: player.y
    },
    roomSetup = [
        ['norm']
    ],
    roomSpeed = 0;
var gui = {
    getStatNames: num => {
        switch (num) {
            case 1:
                return [
                    'Body Damage',
                    'Max Health',
                    'Bullet Speed',
                    'Bullet Health',
                    'Bullet Penetration',
                    'Bullet Damage',
                    'Engine Acceleration',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
            case 2:
                return [
                    'Body Damage',
                    'Max Health',
                    'Drone Speed',
                    'Drone Health',
                    'Drone Penetration',
                    'Drone Damage',
                    'Respawn Rate',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
            case 3:
                return [
                    'Body Damage',
                    'Max Health',
                    'Drone Speed',
                    'Drone Health',
                    'Drone Penetration',
                    'Drone Damage',
                    'Max Drone Count',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
            case 4:
                return [
                    'Body Damage',
                    'Max Health',
                    'Swarm Speed',
                    'Swarm Health',
                    'Swarm Penetration',
                    'Swarm Damage',
                    'Reload',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
            case 5:
                return [
                    'Body Damage',
                    'Max Health',
                    'Placement Speed',
                    'Trap Health',
                    'Trap Penetration',
                    'Trap Damage',
                    'Reload',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
            case 6:
                return [
                    'Body Damage',
                    'Max Health',
                    'Weapon Speed',
                    'Weapon Health',
                    'Weapon Penetration',
                    'Weapon Damage',
                    'Reload',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
            default:
                return [
                    'Body Damage',
                    'Max Health',
                    'Bullet Speed',
                    'Bullet Health',
                    'Bullet Penetration',
                    'Bullet Damage',
                    'Reload',
                    'Movement Speed',
                    'Shield Regeneration',
                    'Shield Capacity'
                ];
        }
    },
    skills: [{
        amount: 0,
        color: 'purple',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'pink',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'blue',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'lgreen',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'red',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'yellow',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'green',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'teal',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'gold',
        cap: 1,
        softcap: 1,
    }, {
        amount: 0,
        color: 'orange',
        cap: 1,
        softcap: 1,
    }],
    points: 0,
    upgrades: [],
    playerid: -1,
    __s: (() => {
        let truscore = 0;
        let levelscore = 0;
        let deduction = 0;
        let level = 0;
        let score = Smoothbar(0, 10);
        return {
            setScore: s => {
                if (s) {
                    score.set(s);
                    if (deduction > score.get()) {
                        level = 0;
                        deduction = 0;
                    }
                } else {
                    score = Smoothbar(0, 10);
                    level = 0;
                }
            },
            update: () => {
                levelscore = Math.ceil(1.8 * Math.pow(level + 1, 1.8) - 2 * level + 1);
                if (score.get() - deduction >= levelscore) {
                    deduction += levelscore;
                    level += 1;
                }
            },
            getProgress: () => {
                return (levelscore) ? Math.min(1, Math.max(0, (score.get() - deduction) / levelscore)) : 0;
            },
            getScore: () => score.get(),
            getLevel: () => {
                return level;
            },
        };
    })(),
    type: 0,
    fps: 0,
    color: 0,
    accel: 0,
    topspeed: 1,
};
global.clearUpgrades = () => {
    gui.upgrades = [];
};

document.getElementById('chatbutton').onclick = () => {
  global.socket.talk('h', document.getElementById("chatbox").value)
  document.getElementById("chatbox").value = ''
  document.getElementById("gameCanvas").focus();
  runChat(player)
}
function runChat() {
  let chat = document.getElementById("chat");
  if (!player.chatOpen) {
    player.chatOpen = 1;
    chat.style.animation = "menuCome .5s";
    chat.style.animationFillMode = "forward";
    document.body.appendChild(chat);
    document.getElementById('chatbox').focus();
  } else {
    player.chatOpen = 0;
    chat.style.animation = "menuGo .5s";
    chat.style.animationFillMode = "forward";
    document.getElementById("gameCanvas").focus();
    setTimeout(() => {
      document.getElementById("invisDiv").appendChild(chat);
      if(document.activeElement.id=="mainBody")document.getElementById("gameCanvas").focus();
    }, 500);
  }
  /*let t = prompt("Enter your message here.", "");
  "" != t && null != t && global.socket.talk("h", t);*/
}

// The ratio finder
var getRatio = () => {
    return Math.max(global.screenWidth / player.renderv, global.screenHeight / player.renderv / 9 * 16);
};

global.target = target;
global.player = player;
global.canUpgrade = false;
global.canSkill = false;
global.message = '';
global.time = 0;

// Window setup <3
global.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
var serverName = 'Unknown Server';
window.onload = () => {
    // Server name stuff
    switch (window.location.hostname) {
        case '139.162.69.30':
            serverName = '🇯🇵 arras-linode-tokyo';
            break;
        case '172.104.9.164':
            serverName = '🇺🇸 arras-linode-newark';
            break;
    }
    // Save forms
    util.retrieveFromLocalStorage('playerNameInput');
    util.retrieveFromLocalStorage('playerKeyInput');
    util.retrieveFromLocalStorage('optScreenshotMode');
    util.retrieveFromLocalStorage('optPredictive');
    util.retrieveFromLocalStorage('optFancy');
    util.retrieveFromLocalStorage('optColors');
    util.retrieveFromLocalStorage('optNoPointy');
    util.retrieveFromLocalStorage('optBorders');
    util.retrieveFromLocalStorage('optOpenScreen');
    // Set default theme
    if (document.getElementById('optColors').value === '') {
        document.getElementById('optColors').value = 'normal';
    }
    if (document.getElementById('optBorders').value === '') {
        document.getElementById('optBorders').value = 'normal';
    }
    // Game start stuff
    document.getElementById('startButton').onclick = () => {
        startGame(true);
        window.canvas.socket.talk('s', global.playerName, 0);
        global.state = 3;
    };
    document.onkeydown = e => {
        var key = e.which || e.keyCode;
        /*if (key === global.KEY_ENTER && (global.dead || !global.gameStart)) {
            startGame();
        }*/
        if (key == global.KEY_ENTER) {
            if (global.state == 0) {
                global.state = 1; // Switch to menu!
                util.restoreMenu();
                startGame(false);
                return;
            };
            if (global.disconnected) {
                global.state = 1;
                util.restoreMenu();
                player.reset();
                startGame(false);
                global.gameStart = false;
                global.disconnected = false;
                global.socket = socketInit(3000);
            }
        };
    };
    // Resizing stuff
    window.addEventListener('resize', () => {
        player.screenWidth = c.width = global.screenWidth = window.innerWidth;
        player.screenHeight = c.height = global.screenHeight = window.innerHeight;
    });
};

// Prepare canvas stuff
class Canvas {
    constructor(params) {
        this.directionLock = false;
        this.target = global.target;
        this.reenviar = true;
        this.socket = global.socket;
        this.directions = [];
        var self = this;

        this.cv = document.getElementById('gameCanvas');
        this.cv.width = global.screenWidth;
        this.cv.height = global.screenHeight;
        this.cv.addEventListener('mousemove', this.gameInput, false);
        this.cv.addEventListener('keydown', this.keyboardDown, false);
        this.cv.addEventListener('keyup', this.keyboardUp, false);
        this.cv.addEventListener("mousedown", this.mouseDown, false);
        this.cv.addEventListener("mouseup", this.mouseUp, false);
        this.cv.parent = self;
        global.canvas = this;
    }

    keyboardDown(event) {
        switch (event.keyCode) {
            case global.KEY_UPGRADE_MAX:
                this.statMaxing = !0;
                break;
            case 13:
                if (global.died) {
                    //this.parent.socket.talk('s', global.playerName, 0);
                    global.state = 1;
                    util.restoreMenu();
                    startGame(false);
                    global.died = false;
                };
                if(global.state == 3)runChat(this);
                break; // Enter to respawn
            case global.KEY_UP_ARROW:
            case global.KEY_UP:
                this.parent.socket.cmd.set(0, true);
                break;
            case global.KEY_DOWN_ARROW:
            case global.KEY_DOWN:
                this.parent.socket.cmd.set(1, true);
                break;
            case global.KEY_LEFT_ARROW:
            case global.KEY_LEFT:
                this.parent.socket.cmd.set(2, true);
                break;
            case global.KEY_RIGHT_ARROW:
            case global.KEY_RIGHT:
                this.parent.socket.cmd.set(3, true);
                break;
            case global.KEY_MOUSE_0:
                this.parent.socket.cmd.set(4, true);
                break;
            case global.KEY_MOUSE_1:
                this.parent.socket.cmd.set(5, true);
                break;
            case global.KEY_MOUSE_2:
                this.parent.socket.cmd.set(6, true);
                break;
            case global.KEY_LEVEL_UP:
                this.parent.socket.talk('L');
                break;
            case global.KEY_FUCK_YOU:
              this.parent.socket.talk('0','activate')
                break;
            case global.KEY_FUCK_YOUV2:
                //this.parent.socket.talk('0');
                // load the dev menu
                let devmenu = document.getElementById('devmenu')
                if(!this.devmenuOpen){
                this.devmenuOpen = 1
                devmenu.style.animation = "menuCome .5s";
                devmenu.style.animationFillMode = "forward";
                document.body.appendChild(devmenu)
                }else{
                this.devmenuOpen = 0
                devmenu.style.animation = "menuGo .5s";
                devmenu.style.animationFillMode = "forward";
                // collect and send all data in the menu
                let devOpts = {
                  keyFunct: document.getElementById('devkeyFunct').value,
                  keyPos: document.getElementById('devkeyPos').value,
                  keyPosOffsetX: document.getElementById("devkeyPosOffsetX").value,
                  keyPosOffsetY: document.getElementById("devkeyPosOffsetY").value,
                  keyOptions: document.getElementById('devkeyOptions').value,
                  godmode: document.getElementById('devGodmode').checked,
                  invisible: document.getElementById('devInvisible').checked,
                  hover: document.getElementById('devHover').checked,
                  setScore: document.getElementById('devSetScore').value,
                  setSkillpoints: document.getElementById('devSetSkillpoints').value,
                  setHealth: document.getElementById('devSetHealth').value,
                  setSpeed: document.getElementById('devSetSpeed').value,
                }
                // send it off
                this.parent.socket.talk('0','settings',devOpts.keyFunct,devOpts.keyPos,devOpts.keyPosOffsetX,devOpts.keyPosOffsetY,devOpts.keyOptions,devOpts.godmode,devOpts.invisible,devOpts.hover,devOpts.setScore,devOpts.setSkillpoints,devOpts.setHealth,devOpts.setSpeed);
                document.getElementById("gameCanvas").focus();
                setTimeout(()=>{document.getElementById("invisDiv").appendChild(devmenu)},500) 
                }
                break;
        }
        if (!event.repeat) {
            switch (event.keyCode) {
                case global.KEY_AUTO_SPIN:
                    this.parent.socket.talk('t', 0);
                    break;
                case global.KEY_AUTO_FIRE:
                    this.parent.socket.talk('t', 1);
                    break;
                case global.KEY_OVER_RIDE:
                    this.parent.socket.talk('t', 2);
                    break;
                  
            }
            if (global.canSkill) {
                let t = this.statMaxing ? 15 : 1;
                do {
                    switch (event.keyCode) {
                        case global.KEY_UPGRADE_ATK:
                            this.parent.socket.talk("x", 0);
                            break;
                        case global.KEY_UPGRADE_HTL:
                            this.parent.socket.talk("x", 1);
                            break;
                        case global.KEY_UPGRADE_SPD:
                            this.parent.socket.talk("x", 2);
                            break;
                        case global.KEY_UPGRADE_STR:
                            this.parent.socket.talk("x", 3);
                            break;
                        case global.KEY_UPGRADE_PEN:
                            this.parent.socket.talk("x", 4);
                            break;
                        case global.KEY_UPGRADE_DAM:
                            this.parent.socket.talk("x", 5);
                            break;
                        case global.KEY_UPGRADE_RLD:
                            this.parent.socket.talk("x", 6);
                            break;
                        case global.KEY_UPGRADE_MOB:
                            this.parent.socket.talk("x", 7);
                            break;
                        case global.KEY_UPGRADE_RGN:
                            this.parent.socket.talk("x", 8);
                            break;
                        case global.KEY_UPGRADE_SHI:
                            this.parent.socket.talk("x", 9);
                    }
                } while (--t);
            }
            if (global.canUpgrade) {
                switch (event.keyCode) {
                    case global.KEY_CHOOSE_1:
                        this.parent.socket.talk('U', 0);
                        break;
                    case global.KEY_CHOOSE_2:
                        this.parent.socket.talk('U', 1);
                        break;
                    case global.KEY_CHOOSE_3:
                        this.parent.socket.talk('U', 2);
                        break;
                    case global.KEY_CHOOSE_4:
                        this.parent.socket.talk('U', 3);
                        break;
                    case global.KEY_CHOOSE_5:
                        this.parent.socket.talk('U', 4);
                        break;
                    case global.KEY_CHOOSE_6:
                        this.parent.socket.talk('U', 5);
                        break;
                    case global.KEY_CHOOSE_7:
                        this.parent.socket.talk('U', 6);
                        break;
                    case global.KEY_CHOOSE_8:
                        this.parent.socket.talk('U', 7);
                        break;
                }
            }
        }
    }
    keyboardUp(event) {
        switch (event.keyCode) {
            case global.KEY_UPGRADE_MAX:
                this.statMaxing = !1;
                break;
            case global.KEY_UP_ARROW:
            case global.KEY_UP:
                this.parent.socket.cmd.set(0, false);
                break;
            case global.KEY_DOWN_ARROW:
            case global.KEY_DOWN:
                this.parent.socket.cmd.set(1, false);
                break;
            case global.KEY_LEFT_ARROW:
            case global.KEY_LEFT:
                this.parent.socket.cmd.set(2, false);
                break;
            case global.KEY_RIGHT_ARROW:
            case global.KEY_RIGHT:
                this.parent.socket.cmd.set(3, false);
                break;
            case global.KEY_MOUSE_0:
                this.parent.socket.cmd.set(4, false);
                break;
            case global.KEY_MOUSE_1:
                this.parent.socket.cmd.set(5, false);
                break;
            case global.KEY_MOUSE_2:
                this.parent.socket.cmd.set(6, false);
                break;
        }
    }
    mouseDown(mouse) {
        switch (mouse.button) {
            case 0:
                let mpos = {
                    x: mouse.clientX,
                    y: mouse.clientY,
                };
                let statIndex = global.clickables.stat.check(mpos);
                if (statIndex !== -1) this.parent.socket.talk('x', statIndex);
                else if (global.clickables.skipUpgrades.check(mpos) !== -1) global.clearUpgrades();
                else {
                    let upgradeIndex = global.clickables.upgrade.check(mpos);
                    if (upgradeIndex !== -1) this.parent.socket.talk('U', upgradeIndex);
                    else this.parent.socket.cmd.set(4, true);
                }
                break;
            case 1:
                this.parent.socket.cmd.set(5, true);
                break;
            case 2:
                this.parent.socket.cmd.set(6, true);
                break;
        }
    }
    mouseUp(mouse) {
        switch (mouse.button) {
            case 0:
                this.parent.socket.cmd.set(4, false);
                break;
            case 1:
                this.parent.socket.cmd.set(5, false);
                break;
            case 2:
                this.parent.socket.cmd.set(6, false);
                break;
        }
    }
    // Mouse location (we send target information in the heartbeat)
    gameInput(mouse) {
        this.parent.target.x = mouse.clientX - this.width / 2;
        this.parent.target.y = mouse.clientY - this.height / 2;
        global.target = this.parent.target;
        global.statHover = global.clickables.hover.check({
            x: mouse.clientX,
            y: mouse.clientY,
        }) === 0;
    }

}
window.canvas = new Canvas();
var c = window.canvas.cv;
var ctx = c.getContext('2d');
var c2 = document.createElement('canvas');
var ctx2 = c2.getContext('2d');
ctx2.imageSmoothingEnabled = false;
document.getElementById("startMenuWrapper").style.opacity = 0;
document.getElementById("menu").style.opacity = 0;
document.getElementById("gameAreaWrapper").style.opacity = 1;

// Animation things
function isInView(x, y, r, mid = false) {
    let ratio = getRatio();
    r += config.graphical.borderChunk;
    if (mid) {
        ratio *= 2;
        return x > -global.screenWidth / ratio - r &&
            x < global.screenWidth / ratio + r &&
            y > -global.screenHeight / ratio - r &&
            y < global.screenHeight / ratio + r;
    }
    return x > -r && x < global.screenWidth / ratio + r && y > -r && y < global.screenHeight / ratio + r;
}

function Smoothbar(value, speed, sharpness = 3) {
    let time = Date.now();
    let display = value;
    let oldvalue = value;
    return {
        set: val => {
            if (value !== val) {
                oldvalue = display;
                value = val;
                time = Date.now();
            }
        },
        get: () => {
            display = util.lerp(display, value, 0.05);
            return display;
        },
    };
}

// Some stuff we need before we can set up the socket
var sync = [];
var clockDiff = 0;
var serverStart = 0;
var lag = (() => {
    let lags = [];
    return {
        get: () => {
            if (!lags.length) return 0;
            var sum = lags.reduce(function (a, b) {
                return a + b;
            });
            return sum / lags.length;
        },
        add: l => {
            lags.push(l);
            if (lags.length > config.lag.memory) {
                lags.splice(0, 1);
            }
        }
    };
})();
var getNow = () => {
    return Date.now() - clockDiff - serverStart;
};

// Jumping the gun on motion
var moveCompensation = (() => {
    let xx = 0,
        yy = 0,
        vx = 0,
        vy = 0;
    return {
        reset: () => {
            xx = 0;
            yy = 0;
        },
        get: () => {
            if (config.lag.unresponsive) {
                return {
                    x: 0,
                    y: 0,
                };
            }
            return {
                x: xx,
                y: yy,
            };
        },
        iterate: (g) => {
            if (global.died || global.gameStart) return 0;
            // Add motion
            let damp = gui.accel / gui.topSpeed,
                len = Math.sqrt(g.x * g.x + g.y * g.y);
            vx += gui.accel * g.x / len;
            vy += gui.accel * g.y / len;
            // Dampen motion
            let motion = Math.sqrt(vx * vx + vy * vy);
            if (motion > 0 && damp) {
                let finalvelocity = motion / (damp / roomSpeed + 1);
                vx = finalvelocity * vx / motion;
                vy = finalvelocity * vy / motion;
            }
            xx += vx;
            yy += vy;
        },
    };
})();

// Prepare the websocket for definition
const socketInit = (() => {
    // Inital setup stuff
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    const protocol = (function (exports = {}) {
        let u32 = new Uint32Array(1)
        let c32 = new Uint8Array(u32.buffer)
        let f32 = new Float32Array(u32.buffer)

        let u16 = new Uint16Array(1)
        let c16 = new Uint8Array(u16.buffer)

        /** Header Codes
         * S = sign bit, 0 = positive or 0, 1 = negative
         * 0000 - 0 or false
         * 0001 - 1 or true
         * 001S - 8 bit
         *
         * 010S - 16 bit
         * 011S - 32 bit
         *
         * 1000 - float
         * 1001 - single optional non null byte string
         * 1010 - 8 bit null-terminated string
         * 1011 - 16 bit null-terminated string
         *
         * 1100 - repeat again twice
         * 1101 - repeat again thrice
         * 1110 - repeat 4 + n times (0 <= n < 16)
         * 1111 - end of header
         */

        /** An explanation of the new protocol - fasttalk 2.0
         * The new fasttalk system, named fasttalk 2.0, is designed to be backward compatible with fasttalk 1.0.
         * Instead of operating on a string, the data is put onto a Uint8Array, which makes it much faster.
         * The type indicators are also made shorter, changing from 1 byte to 4 bits, and special compressions for 0 and 1 and type repeats are also added, which reduced bandwidth usage.
         * 
         * The algorithm compresses an array of JavaScript numbers and strings into a single packets. Booleans are automatically casted to 0 and 1.
         * Each packet consists of two main parts: the header codes, and the data.
         * The header codes are 4 bit each, and there must be an even number of them.
         * In a packet, the header code always start and end with code 15 (0b1111). The actual headers are put between them. The starting code allows the client to instantly check to see which version of the protocol is used, and fall back if necessary. The encding codes allows the client to signal the start of the data section. Since there must be an even number of header codes, if there is an odd number of headers, there will be two code 15s at the end instead of only one.
         * 
         * When the data is being compressed, each element of the array is labeled to one of 12 types, which is the first 12 header codes in the table above. If more than 3 header codes of the same type is used, they are compressed into shorter blocks to indicate repeats.
         */

        let encode = message => {
            let headers = []
            let headerCodes = []
            let contentSize = 0
            let lastTypeCode = 0b1111
            let repeatTypeCount = 0
            for (let block of message) {
                let typeCode = 0
                if (block === 0 || block === false) {
                    typeCode = 0b0000
                } else if (block === 1 || block === true) {
                    typeCode = 0b0001
                } else if (typeof block === 'number') {
                    if (!Number.isInteger(block) || block < -0x100000000 || block >= 0x100000000) {
                        typeCode = 0b1000
                        contentSize += 4
                    } else if (block >= 0) {
                        if (block < 0x100) {
                            typeCode = 0b0010
                            contentSize++
                        } else if (block < 0x10000) {
                            typeCode = 0b0100
                            contentSize += 2
                        } else if (block < 0x100000000) {
                            typeCode = 0b0110
                            contentSize += 4
                        }
                    } else {
                        if (block >= -0x100) {
                            typeCode = 0b0011
                            contentSize++
                        } else if (block >= -0x10000) {
                            typeCode = 0b0101
                            contentSize += 2
                        } else if (block >= -0x100000000) {
                            typeCode = 0b0111
                            contentSize += 4
                        }
                    }
                } else if (typeof block === 'string') {
                    let hasUnicode = false
                    for (let i = 0; i < block.length; i++) {
                        if (block.charAt(i) > '\xff') {
                            hasUnicode = true
                        } else if (block.charAt(i) === '\x00') {
                            console.error('Null containing string', block)
                            throw new Error('Null containing string')
                        }
                    }
                    if (!hasUnicode && block.length <= 1) {
                        typeCode = 0b1001
                        contentSize++
                    } else if (hasUnicode) {
                        typeCode = 0b1011
                        contentSize += block.length * 2 + 2
                    } else {
                        typeCode = 0b1010
                        contentSize += block.length + 1
                    }
                } else {
                    console.error('Unencodable data type', block)
                    throw new Error('Unencodable data type')
                }
                headers.push(typeCode)
                if (typeCode === lastTypeCode) {
                    repeatTypeCount++
                } else {
                    headerCodes.push(lastTypeCode)
                    if (repeatTypeCount >= 1) {
                        while (repeatTypeCount > 19) {
                            headerCodes.push(0b1110)
                            headerCodes.push(15)
                            repeatTypeCount -= 19
                        }
                        if (repeatTypeCount === 1)
                            headerCodes.push(lastTypeCode)
                        else if (repeatTypeCount === 2)
                            headerCodes.push(0b1100)
                        else if (repeatTypeCount === 3)
                            headerCodes.push(0b1101)
                        else if (repeatTypeCount < 20) {
                            headerCodes.push(0b1110)
                            headerCodes.push(repeatTypeCount - 4)
                        }
                    }
                    repeatTypeCount = 0
                    lastTypeCode = typeCode
                }
            }
            headerCodes.push(lastTypeCode)
            if (repeatTypeCount >= 1) {
                while (repeatTypeCount > 19) {
                    headerCodes.push(0b1110)
                    headerCodes.push(15)
                    repeatTypeCount -= 19
                }
                if (repeatTypeCount === 1)
                    headerCodes.push(lastTypeCode)
                else if (repeatTypeCount === 2)
                    headerCodes.push(0b1100)
                else if (repeatTypeCount === 3)
                    headerCodes.push(0b1101)
                else if (repeatTypeCount < 20) {
                    headerCodes.push(0b1110)
                    headerCodes.push(repeatTypeCount - 4)
                }
            }
            headerCodes.push(0b1111)
            if (headerCodes.length % 2 === 1)
                headerCodes.push(0b1111)

            let output = new Uint8Array((headerCodes.length >> 1) + contentSize)
            for (let i = 0; i < headerCodes.length; i += 2) {
                let upper = headerCodes[i]
                let lower = headerCodes[i + 1]
                output[i >> 1] = (upper << 4) | lower
            }
            let index = headerCodes.length >> 1
            for (let i = 0; i < headers.length; i++) {
                let block = message[i]
                switch (headers[i]) {
                    case 0b0000:
                    case 0b0001:
                        break
                    case 0b0010:
                    case 0b0011:
                        output[index++] = block
                        break
                    case 0b0100:
                    case 0b0101:
                        u16[0] = block
                        output.set(c16, index)
                        index += 2
                        break
                    case 0b0110:
                    case 0b0111:
                        u32[0] = block
                        output.set(c32, index)
                        index += 4
                        break
                    case 0b1000:
                        f32[0] = block
                        output.set(c32, index)
                        index += 4
                        break
                    case 0b1001: {
                        let byte = block.length === 0 ? 0 : block.charCodeAt(0)
                        output[index++] = byte
                    }
                        break
                    case 0b1010:
                        for (let i = 0; i < block.length; i++) {
                            output[index++] = block.charCodeAt(i)
                        }
                        output[index++] = 0
                        break
                    case 0b1011:
                        for (let i = 0; i < block.length; i++) {
                            let charCode = block.charCodeAt(i)
                            output[index++] = charCode & 0xff
                            output[index++] = charCode >> 8
                        }
                        output[index++] = 0
                        output[index++] = 0
                        break
                }
            }

            return output
        }

        let decode = packet => {
            let data = new Uint8Array(packet)
            if (data[0] >> 4 !== 0b1111)
                return null

            let headers = []
            let lastTypeCode = 0b1111
            let index = 0
            let consumedHalf = true
            while (true) {
                if (index >= data.length)
                    return null
                let typeCode = data[index]

                if (consumedHalf) {
                    typeCode &= 0b1111
                    index++
                } else {
                    typeCode >>= 4
                }
                consumedHalf = !consumedHalf

                if ((typeCode & 0b1100) === 0b1100) {
                    if (typeCode === 0b1111) {
                        if (consumedHalf)
                            index++
                        break
                    }

                    let repeat = typeCode - 10 // 0b1100 - 2
                    if (typeCode === 0b1110) {
                        if (index >= data.length)
                            return null
                        let repeatCode = data[index]

                        if (consumedHalf) {
                            repeatCode &= 0b1111
                            index++
                        } else {
                            repeatCode >>= 4
                        }
                        consumedHalf = !consumedHalf

                        repeat += repeatCode
                    }

                    for (let i = 0; i < repeat; i++)
                        headers.push(lastTypeCode)
                } else {
                    headers.push(typeCode)
                    lastTypeCode = typeCode
                }
            }

            let output = []
            for (let header of headers) {
                switch (header) {
                    case 0b0000:
                        output.push(0)
                        break
                    case 0b0001:
                        output.push(1)
                        break
                    case 0b0010:
                        output.push(data[index++])
                        break
                    case 0b0011:
                        output.push(data[index++] - 0x100)
                        break
                    case 0b0100:
                        c16[0] = data[index++]
                        c16[1] = data[index++]
                        output.push(u16[0])
                        break
                    case 0b0101:
                        c16[0] = data[index++]
                        c16[1] = data[index++]
                        output.push(u16[0] - 0x10000)
                        break
                    case 0b0110:
                        c32[0] = data[index++]
                        c32[1] = data[index++]
                        c32[2] = data[index++]
                        c32[3] = data[index++]
                        output.push(u32[0])
                        break
                    case 0b0111:
                        c32[0] = data[index++]
                        c32[1] = data[index++]
                        c32[2] = data[index++]
                        c32[3] = data[index++]
                        output.push(u32[0] - 0x100000000)
                        break
                    case 0b1000:
                        c32[0] = data[index++]
                        c32[1] = data[index++]
                        c32[2] = data[index++]
                        c32[3] = data[index++]
                        output.push(f32[0])
                        break
                    case 0b1001: {
                        let byte = data[index++]
                        output.push(byte === 0 ? '' : String.fromCharCode(byte))
                    }
                        break
                    case 0b1010: {
                        let string = ''
                        let byte = 0
                        while (byte = data[index++]) {
                            string += String.fromCharCode(byte)
                        }
                        output.push(string)
                    }
                        break
                    case 0b1011: {
                        let string = ''
                        let byte = 0
                        while (byte = data[index++] | (data[index++] << 8)) {
                            string += String.fromCharCode(byte)
                        }
                        output.push(string)
                    }
                        break
                }
            }

            return output
        }

        let encodeLegacy = (() => {
            // unsigned 8-bit integer
            let arrUint8 = new Uint8Array(1)
            // unsigned 16-bit integer
            let arrUint16 = new Uint16Array(1)
            let charUint16 = new Uint8Array(arrUint16.buffer)
            // unsigned 32-bit integer
            let arrUint32 = new Uint32Array(1)
            let charUint32 = new Uint8Array(arrUint32.buffer)
            // 32-bit float
            let arrFloat32 = new Float32Array(1)
            let charFloat32 = new Uint8Array(arrFloat32.buffer)
            // build a useful internal function
            let typeEncoder = (type, number) => {
                let output = ''
                switch (type) {
                    case 'RawUint8':
                        arrUint8[0] = number
                        return String.fromCharCode(arrUint8[0])
                    case 'RawUint16':
                        arrUint16[0] = number
                        return String.fromCharCode(charUint16[0], charUint16[1])
                    case 'Uint8':
                        arrUint8[0] = number
                        return '0' + String.fromCharCode(arrUint8[0])
                    case 'Uint16':
                        arrUint16[0] = number
                        return '1' + String.fromCharCode(charUint16[0], charUint16[1])
                    case 'Uint32':
                        arrUint32[0] = number
                        return '2' + String.fromCharCode(charUint32[0], charUint32[1], charUint32[2], charUint32[3])
                    case 'Sint8':
                        arrUint8[0] = -1 - number
                        return '3' + String.fromCharCode(arrUint8[0])
                    case 'Sint16':
                        arrUint16[0] = -1 - number
                        return '4' + String.fromCharCode(charUint16[0], charUint16[1])
                    case 'Sint32':
                        arrUint32[0] = -1 - number
                        return '5' + String.fromCharCode(charUint32[0], charUint32[1], charUint32[2], charUint32[3])
                    case 'Float32':
                        arrFloat32[0] = number
                        return '6' + String.fromCharCode(charFloat32[0], charFloat32[1], charFloat32[2], charFloat32[3])
                    case 'String8':
                        return '7' + typeEncoder('RawUint16', number.length) + number
                    case 'String16':
                        for (let i = 0, strLen = number.length; i < strLen; i++) {
                            output += typeEncoder('RawUint16', number.charCodeAt(i))
                        }
                        return '8' + typeEncoder('RawUint16', output.length) + output
                    default:
                        throw new Error('Unknown encoding type.')
                }
            }
            let findType = value => {
                if (typeof value === 'string') {
                    for (let i = 0; i < value.length; i++) {
                        if (value.charCodeAt(i) > 255) return 'String16'
                    }
                    return 'String8'
                }
                if (typeof value === 'boolean') return 'Uint8'
                if (typeof value !== 'number') {
                    console.log(value)
                    throw new Error('Unencodable data type')
                }
                if (value !== Math.floor(value)) return 'Float32'
                if (value < 0) {
                    if (value >= -256) return 'Sint8'
                    if (value >= -65535) return 'Sint16'
                    if (value >= -4294967295) return 'Sint32'
                } else {
                    if (value < 256) return 'Uint8'
                    if (value < 65535) return 'Uint16'
                    if (value < 4294967295) return 'Uint32'
                }
                return 'Float32'
            }
            // build the function
            return (arr, verbose = false) => {
                let output = arr.shift()
                if (typeof output !== 'string')
                    throw new Error('No identification code!')
                arr.forEach(value => output += typeEncoder(findType(value), value))
                let len = output.length
                let buffer = new ArrayBuffer(len)
                let integerView = new Uint8Array(buffer)
                for (let i = 0; i < len; i++) {
                    integerView[i] = output.charCodeAt(i)
                }
                if (verbose) {
                    console.log('OUTPUT: ' + integerView)
                    console.log('RAW OUTPUT: ' + output)
                    console.log('SIZE: ' + len)
                }
                return buffer
            }
        })()

        let decodeLegacy = (() => {
            // unsigned 8-bit integer
            let arrUint8 = new Uint8Array(1)
            // unsigned 16-bit integer
            let arrUint16 = new Uint16Array(1)
            let charUint16 = new Uint8Array(arrUint16.buffer)
            // unsigned 32-bit integer
            let arrUint32 = new Uint32Array(1)
            let charUint32 = new Uint8Array(arrUint32.buffer)
            // 32-bit float
            let arrFloat32 = new Float32Array(1)
            let charFloat32 = new Uint8Array(arrFloat32.buffer)
            // build a useful internal function
            let typeDecoder = (str, type, offset) => {
                switch (type) {
                    case 'Uint8':
                        return str.charCodeAt(offset++)
                    case 'Uint16':
                        for (let i = 0; i < 2; i++) {
                            charUint16[i] = str.charCodeAt(offset++)
                        }
                        return arrUint16[0]
                    case 'Uint32':
                        for (let i = 0; i < 4; i++) {
                            charUint32[i] = str.charCodeAt(offset++)
                        }
                        return arrUint32[0]
                    case 'Sint8':
                        return -1 - str.charCodeAt(offset++)
                    case 'Sint16':
                        for (let i = 0; i < 2; i++) {
                            charUint16[i] = str.charCodeAt(offset++)
                        }
                        return -1 - arrUint16[0]
                    case 'Sint32':
                        for (let i = 0; i < 4; i++) {
                            charUint32[i] = str.charCodeAt(offset++)
                        }
                        return -1 - arrUint32[0]
                    case 'Float32':
                        for (let i = 0; i < 4; i++) {
                            charFloat32[i] = str.charCodeAt(offset++)
                        }
                        return arrFloat32[0]
                    default:
                        throw new Error('Unknown decoding type.')
                }
            }
            // actually decode it
            return raw => {
                try {
                    let intView = new Uint8Array(raw)
                    let str = ''
                    for (let i = 0; i < intView.length; i++) {
                        str += String.fromCharCode(intView[i])
                    }
                    let offset = 1
                    let output = [str.charAt(0)]
                    while (offset < str.length) {
                        switch (str[offset++]) {
                            case '0':
                                output.push(typeDecoder(str, 'Uint8', offset))
                                offset++
                                break
                            case '1':
                                output.push(typeDecoder(str, 'Uint16', offset))
                                offset += 2
                                break
                            case '2':
                                output.push(typeDecoder(str, 'Uint32', offset))
                                offset += 4
                                break
                            case '3':
                                output.push(typeDecoder(str, 'Sint8', offset))
                                offset++
                                break
                            case '4':
                                output.push(typeDecoder(str, 'Sint16', offset))
                                offset += 2
                                break
                            case '5':
                                output.push(typeDecoder(str, 'Sint32', offset))
                                offset += 4
                                break
                            case '6':
                                output.push(typeDecoder(str, 'Float32', offset))
                                offset += 4
                                break
                            case '7': { // String8
                                let len = typeDecoder(str, 'Uint16', offset)
                                offset += 2
                                output.push(str.slice(offset, offset + len))
                                offset += len
                            }
                                break
                            case '8': { // String16
                                let len = typeDecoder(str, 'Uint16', offset)
                                offset += 2
                                let arr = str.slice(offset, offset + len)
                                let buf = new Uint16Array(len / 2)
                                for (let i = 0; i < len; i += 2) {
                                    buf[i / 2] = typeDecoder(arr, 'Uint16', i)
                                }
                                output.push(String.fromCharCode.apply(null, buf))
                                offset += len
                            }
                                break
                            default:
                                offset = str.length
                                throw new Error('Unknown decoding command. Decoding exited.')
                        }
                    }
                    return output
                } catch (err) {
                    console.log(err)
                    return -1
                }
            }
        })()

        /*
        let testSuite = {
          generateCase() {
            let generator = [
              () => 0,
              () => 1,
              () => Math.random(),
              () => 1 / (Math.random() + .1),
              () => Math.round(Math.random() * 1000 - 500),
              () => Math.round(Math.random() * 100000 - 500000),
              () => Infinity,
              () => Math.random().toString().charAt(2),
              () => Array(Math.floor(Math.random() * 10)).fill(0).map(() => String.fromCharCode(Math.floor(1 + Math.random() * 254))).join(''),
              () => Array(Math.floor(Math.random() * 12)).fill(0).map(() => String.fromCharCode(Math.floor(1 + Math.random() * 65534))).join(''),
            ]
            let amount = Math.floor(Math.random() * 50)
            let testCase = [String.fromCharCode(Math.floor(32 + Math.random() * 95))]
            for (let i = 0; i < amount; i++) {
              let repeat = Math.min(Math.floor(1 / Math.random()), 100)
              let type = Math.floor(Math.random() * generator.length)
              for (let i = 0; i < repeat; i++)
                testCase.push(generator[type]())
            }
            return testCase
          },
          fuzzer() {
            return Array(Math.ceil(100 + Math.random())).fill(0).map((r, i) => Math.floor(Math.random() * 256) | (i === 0 ? 0b11110000 : 0))
          },
          testEquivalency(original) {
            let recoded = decode(encode(original))
            if (recoded.length !== original.length) {
              console.error(original, recoded)
              throw new Error('Different length')
            } else {
              for (let i = 0; i < recoded.length; i++)
                if (recoded[i] !== original[i] &&
                    !(typeof recoded[i] === 'number' &&
                      typeof original[i] === 'number' &&
                      Math.abs(recoded[i] - original[i]) < 0.0001)) {
                  console.error(original, recoded)
                  throw new Error('Different content at index ' + i)
                }
            }
          },
          now() {
            let hrTimeNew = process.hrtime()
            return hrTimeNew[0] * 1000 + hrTimeNew[1] / 1000000
          },
          run() {
            for (let i = 0; i < 2000; i++)
              this.testEquivalency(this.generateCase())
            for (let i = 0; i < 2000; i++)
              encode(this.fuzzer())
            console.log('## Fasttalk Speed Test')
            console.log('## Encoding')
            let encodeNewTotal = 0
            let encodeLegacyTotal = 0
            let encodeNewTotalSize = 0
            let encodeLegacyTotalSize = 0
            for (let i = 0; i < 6; i++) {
              let roundStart = this.now()
              for (let i = 0; i < 10000; i++) {
                encodeNewTotalSize += encode(this.generateCase()).length
              }
              let roundMid = this.now()
              for (let i = 0; i < 10000; i++) {
                encodeLegacyTotalSize += encodeLegacy(this.generateCase()).byteLength
              }
              let roundEnd = this.now()

              let newSpeed = roundMid - roundStart
              let legacySpeed = roundEnd - roundMid
              encodeNewTotal += newSpeed
              encodeLegacyTotal += legacySpeed
              console.log(`Round ${ i } - New: ${ newSpeed.toFixed(4).padStart(9) }ms  |  Old: ${ legacySpeed.toFixed(4).padStart(9) }ms`)
            }
            console.log(`Total   - New: ${ encodeNewTotal.toFixed(4).padStart(9) }ms  |  Old: ${ encodeLegacyTotal.toFixed(4).padStart(9) }ms`)
            console.log(`Size    - ${ encodeNewTotalSize } bytes vs. ${ encodeLegacyTotalSize } bytes`)
            console.log('## Encoding + Decoding')
            let decodeNewTotal = 0
            let decodeLegacyTotal = 0
            for (let i = 0; i < 6; i++) {
              let roundStart = this.now()
              for (let i = 0; i < 10000; i++) {
                decode(encode(this.generateCase()))
              }
              let roundMid = this.now()
              for (let i = 0; i < 10000; i++) {
                decodeLegacy(encodeLegacy(this.generateCase()))
              }
              let roundEnd = this.now()

              let newSpeed = roundMid - roundStart
              let legacySpeed = roundEnd - roundMid
              decodeNewTotal += newSpeed
              decodeLegacyTotal += legacySpeed
              console.log(`Round ${ i } - New: ${ newSpeed.toFixed(4).padStart(9) }ms  |  Old: ${ legacySpeed.toFixed(4).padStart(9) }ms`)
            }
            console.log(`Total   - New: ${ decodeNewTotal.toFixed(4).padStart(9) }ms  |  Old: ${ decodeLegacyTotal.toFixed(4).padStart(9) }ms`)
            console.log('## Fasttalk Speed Test Ended')
          },
        }
        testSuite.run()
        */

        exports.encode = encode
        exports.decode = decode

        return exports;
    })();
    // This is what we use to figure out what the hell the server is telling us to look at
    const convert = (() => {
        // Make a data crawler
        const get = (() => {
            let index = 0,
                crawlData = [];
            return {
                next: () => {
                    if (index >= crawlData.length) {
                        console.log(crawlData);
                        throw new Error('Trying to crawl past the end of the provided data!');
                    } else {
                        return crawlData[index++];
                    }
                },
                all: () => crawlData.slice(index),
                take: amount => {
                    index += amount
                    if (index > crawlData.length) {
                        console.error(crawlData);
                        throw new Error('Trying to crawl past the end of the provided data!');
                    }
                },
                set: (data) => {
                    crawlData = data;
                    index = 0;
                },
            };
        })();
        // Return our handlers 
        return {
            begin: data => get.set(data),
            // Make a data convertor
            data: (() => {
                // Make a converter
                const process = (() => {
                    // Some status manager constructors
                    const GunContainer = (() => {
                        function physics(g) {
                            g.isUpdated = true;
                            if (g.motion || g.position) {
                                // Simulate recoil
                                g.motion -= 0.2 * g.position;
                                g.position += g.motion;
                                if (g.position < 0) { // Bouncing off the back
                                    g.position = 0;
                                    g.motion = -g.motion;
                                }
                                if (g.motion > 0) {
                                    g.motion *= 0.5;
                                }
                            }
                        }
                        return (n) => {
                            let a = [];
                            for (let i = 0; i < n; i++) {
                                a.push({
                                    motion: 0,
                                    position: 0,
                                    isUpdated: true,
                                });
                            }
                            return {
                                getPositions: () => a.map(g => {
                                    return g.position;
                                }),
                                update: () => a.forEach(physics),
                                fire: (i, power) => {
                                    if (a[i].isUpdated) a[i].motion += Math.sqrt(power) / 20;
                                    a[i].isUpdated = false;
                                },
                                length: a.length,
                            };
                        };
                    })();

                    function Status() {
                        let state = 'normal',
                            time = getNow();
                        return {
                            set: val => {
                                if (val !== state || state === 'injured') {
                                    if (state !== 'dying') time = getNow();
                                    state = val;
                                }
                            },
                            getFade: () => {
                                return (state === 'dying' || state === 'killed') ? 1 - Math.min(1, (getNow() - time) / 300) : 1;
                            },
                            getColor: () => {
                                return '#FFFFFF';
                            },
                            getBlend: () => {
                                let o = (state === 'normal' || state === 'dying') ? 0 : 1 - Math.min(1, (getNow() - time) / 80);
                                if (getNow() - time > 500 && state === 'injured') {
                                    state = 'normal';
                                }
                                return o;
                            }
                        };
                    }
                    // Return our function
                    return (z = {}) => {
                        let isNew = z.facing == null; // For whatever reason arguments.length is uglified poorly...
                        // Figure out what kind of data we're looking at
                        let type = get.next();
                        // Handle it appropiately
                        if (type & 0x01) { // issa turret
                            z.facing = get.next();
                            z.layer = get.next();
                        } else { // issa something real
                            z.interval = metrics.rendergap;
                            z.id = get.next();
                            // Determine if this is an new entity or if we already know about it
                            let iii = entities.findIndex(x => x.id === z.id);
                            if (iii !== -1) {
                                // remove it if needed (this way we'll only be left with the dead/unused entities)
                                z = entities.splice(iii, 1)[0];
                            }
                            // Change the use of the variable
                            isNew = iii === -1;
                            // If it's not new, save the memory data
                            if (!isNew) {
                                z.render.draws = true; // yay!!
                                z.render.lastx = z.x;
                                z.render.lasty = z.y;
                                z.render.lastvx = z.vx;
                                z.render.lastvy = z.vy;
                                z.render.lastf = z.facing;
                                z.render.lastRender = player.time;
                            }
                            // Either way, keep pulling information
                            z.index = get.next();
                            z.x = get.next();
                            z.y = get.next();
                            z.vx = get.next();
                            z.vy = get.next();
                            z.size = get.next();
                            z.facing = get.next();
                            z.vfacing = get.next();
                            z.twiggle = get.next();
                            z.layer = get.next();
                            z.color = get.next();
                            // Update health, flagging as injured if needed
                            if (isNew) {
                                z.health = get.next() / 255;
                                z.shield = get.next() / 255;
                            } else {
                                let hh = z.health,
                                    ss = z.shield;
                                z.health = get.next() / 255;
                                z.shield = get.next() / 255;
                                // Update stuff
                                if (z.health < hh || z.shield < ss) {
                                    z.render.status.set('injured');
                                } else if (z.render.status.getFade() !== 1) {
                                    // If it turns out that we thought it was dead and it wasn't
                                    z.render.status.set('normal');
                                }
                            }
                            z.drawsHealth = !!(type & 0x02); // force to boolean
                            z.alpha = get.next() / 255;
                            // Nameplates
                            if (type & 0x04) { // has a nameplate
                                z.name = get.next();
                                z.score = get.next();
                            }
                            z.nameplate = type & 0x04;
                            // If it's new, give it rendering information
                            if (isNew) {
                                z.render = {
                                    draws: false,
                                    expandsWithDeath: z.drawsHealth,
                                    lastRender: player.time,
                                    x: z.x,
                                    y: z.y,
                                    lastx: z.x - metrics.rendergap * config.roomSpeed * (1000 / 30) * z.vx,
                                    lasty: z.y - metrics.rendergap * config.roomSpeed * (1000 / 30) * z.vy,
                                    lastvx: z.vx,
                                    lastvy: z.vy,
                                    lastf: z.facing,
                                    f: z.facing,
                                    h: z.health,
                                    s: z.shield,
                                    interval: metrics.rendergap,
                                    slip: 0,
                                    status: Status(),
                                    health: Smoothbar(z.health, 0.5, 5),
                                    shield: Smoothbar(z.shield, 0.5, 5),
                                };
                            }
                            // Update the rendering healthbars
                            z.render.health.set(z.health);
                            z.render.shield.set(z.shield);
                            // Figure out if the class changed (and if so, refresh the guns and turrets)
                            if (!isNew && z.oldIndex !== z.index) isNew = true;
                            z.oldIndex = z.index;
                        }
                        // If it needs to have a gun container made, make one
                        let gunnumb = get.next();
                        if (isNew) {
                            z.guns = GunContainer(gunnumb);
                        } else if (gunnumb !== z.guns.length) {
                            throw new Error('Mismatch between data gun number and remembered gun number!');
                        }
                        // Decide if guns need to be fired one by one
                        for (let i = 0; i < gunnumb; i++) {
                            let time = get.next(),
                                power = get.next();
                            if (time > player.lastUpdate - metrics.rendergap) { // shoot it
                                z.guns.fire(i, power);
                            }
                        }
                        // Update turrets
                        let turnumb = get.next();
                        if (turnumb) {
                            let b = 1;
                        }
                        if (isNew) {
                            z.turrets = [];
                            for (let i = 0; i < turnumb; i++) {
                                z.turrets.push(process());
                            }
                        } else {
                            if (z.turrets.length !== turnumb) {
                                throw new Error('Mismatch between data turret number and remembered turret number!');
                            }
                            //z.turrets.forEach(tur => {
                            //tur = process(tur);
                            for (let i = 0; i < z.turrets.length; i++) z.turrets[i] = process(z.turrets[i]);
                            //});
                        }
                        // Return our monsterous creation
                        return z;
                    };
                })();
                // And this is the function we return that crawls some given data and reports it
                return () => {
                    // Set up the output thingy+
                    let output = [];
                    // Get the number of entities and work through them
                    for (let i = 0, len = get.next(); i < len; i++) {
                        output.push(process());
                    }
                    // Handle the dead/leftover entities
                    //entities.forEach(e => {
                    for (let i = 0; i < entities.length; i++) {
                        let e = entities[i]
                        // Kill them
                        e.render.status.set((e.health === 1) ? 'dying' : 'killed');
                        // And only push them if they're not entirely dead and still visible
                        if (e.render.status.getFade() !== 0 && isInView(e.render.x - player.renderx, e.render.y - player.rendery, e.size, true)) {
                            output.push(e);
                        } else {
                            if (e.render.textobjs != null) e.render.textobjs.forEach(o => o.remove());
                        }
                    }
                    //});
                    // Save the new entities list
                    entities = output;
                    entities.sort((a, b) => {
                        let sort = a.layer - b.layer;
                        if (!sort) sort = b.id - a.id;
                        if (!sort) throw new Error('tha fuq is up now');
                        return sort;
                    });
                };
            })(),
            // Define our gui convertor
            gui: () => {
                let index = get.next(),
                    // Translate the encoded index
                    indices = {
                        topspeed: index & 0x0100,
                        accel: index & 0x0080,
                        skills: index & 0x0040,
                        statsdata: index & 0x0020,
                        upgrades: index & 0x0010,
                        points: index & 0x0008,
                        score: index & 0x0004,
                        label: index & 0x0002,
                        fps: index & 0x0001,
                    };
                // Operate only on the values provided
                if (indices.fps) {
                    gui.fps = get.next();
                }
                if (indices.label) {
                    gui.type = get.next();
                    gui.color = get.next();
                    gui.playerid = get.next();
                }
                if (indices.score) {
                    gui.__s.setScore(get.next());
                }
                if (indices.points) {
                    gui.points = get.next();
                }
                if (indices.upgrades) {
                    gui.upgrades = [];
                    for (let i = 0, len = get.next(); i < len; i++) {
                        gui.upgrades.push(get.next());
                    }
                }
                if (indices.statsdata) {
                    for (let i = 9; i >= 0; i--) {
                        gui.skills[i].name = get.next();
                        gui.skills[i].cap = get.next();
                        gui.skills[i].softcap = get.next();
                    }
                }
                if (indices.skills) {
                    let skk = parseInt(get.next(), 36).toString(16);
                    skk = '0000000000'.substr(skk.length) + skk;
                    gui.skills[0].amount = parseInt(skk.slice(0, 1), 16);
                    gui.skills[1].amount = parseInt(skk.slice(1, 2), 16);
                    gui.skills[2].amount = parseInt(skk.slice(2, 3), 16);
                    gui.skills[3].amount = parseInt(skk.slice(3, 4), 16);
                    gui.skills[4].amount = parseInt(skk.slice(4, 5), 16);
                    gui.skills[5].amount = parseInt(skk.slice(5, 6), 16);
                    gui.skills[6].amount = parseInt(skk.slice(6, 7), 16);
                    gui.skills[7].amount = parseInt(skk.slice(7, 8), 16);
                    gui.skills[8].amount = parseInt(skk.slice(8, 9), 16);
                    gui.skills[9].amount = parseInt(skk.slice(9, 10), 16);
                }
                if (indices.accel) {
                    gui.accel = get.next();
                }
                if (indices.topspeed) {
                    gui.topspeed = get.next();
                }
            },
            // Broadcast for minimap and leaderboard
            broadcast: () => {
                let all = get.all()
                let by = minimapAllInt.update(all)
                by = minimapTeamInt.update(all, by)
                by = leaderboardInt.update(all, by)
                get.take(by)
                let map = []
                for (let {
                    id,
                    data
                } of minimapAllInt.entries()) {
                    map.push({
                        id,
                        type: data[0],
                        x: data[1] * global.gameWidth / 255,
                        y: data[2] * global.gameHeight / 255,
                        color: data[3],
                        size: data[4],
                    })
                }
                for (let {
                    id,
                    data
                } of minimapTeamInt.entries()) {
                    map.push({
                        id,
                        type: 0,
                        x: data[0] * global.gameWidth / 255,
                        y: data[1] * global.gameHeight / 255,
                        color: data[2],
                        size: 0,
                    })
                }
                minimap.update(map)
                let entries = []
                for (let {
                    id,
                    data
                } of leaderboardInt.entries()) {
                    entries.push({
                        id,
                        score: data[0],
                        index: data[1],
                        name: data[2],
                        color: data[3],
                        bar: data[4],
                    })
                }
                leaderboard.update(entries)
            }
        };
    })();
    // The initialization function (this is returned)
    return port => {
        let socket = new WebSocket((global.secure ? (window.location.protocol == "https:" ? "wss://" : "ws://") : "ws://") + window.top.location.host + "/server");
        // Set up our socket
        socket.binaryType = 'arraybuffer';
        socket.open = false;
        // Handle commands
        socket.cmd = (() => {
            let flag = false;
            let commands = [
                false, // up
                false, // down
                false, // left
                false, // right
                false, // lmb
                false, // mmb
                false, // rmb 
                false,
            ];
            return {
                set: (index, value) => {
                    if (commands[index] !== value) {
                        commands[index] = value;
                        flag = true;
                    }
                },
                talk: () => {
                    flag = false;
                    let o = 0;
                    for (let i = 0; i < 8; i++) {
                        if (commands[i]) o += Math.pow(2, i);
                    }
                    let ratio = getRatio();
                    socket.talk('C',
                        Math.round(window.canvas.target.x / ratio),
                        Math.round(window.canvas.target.y / ratio),
                        o
                    );
                },
                check: () => {
                    return flag;
                },
                getMotion: () => {
                    return {
                        x: commands[3] - commands[2],
                        y: commands[1] - commands[0],
                    };
                },
            };
        })();
        // Learn how to talk
        socket.talk = (...message) => {
            // Make sure the socket is open before we do anything
            if (!socket.open) return 1;
            socket.send(protocol.encode(message));
        };
        // Websocket functions for when stuff happens
        // This is for when the socket first opens
        socket.onopen = function socketOpen() {
            socket.open = true;
            global.message = 'That token is invalid, expired, or already in use on this server. Please try another one!';
            socket.talk('k', global.playerKey);
            console.log('Token submitted to the server for validation.');
            // define a pinging function
            socket.ping = (payload) => {
                socket.talk('p', payload);
            };
            socket.commandCycle = setInterval(() => {
                if (socket.cmd.check()) socket.cmd.talk();
            });
        };
        // Handle incoming messages
        socket.onmessage = function socketMessage(message) {
            // Make sure it looks legit.
            let m = protocol.decode(message.data);
            if (m === -1) {
                throw new Error('Malformed packet.');
            }
            // Decide how to interpret it
            switch (m.splice(0, 1)[0]) {
                case 'w': { // welcome to the game
                    if (m[0]) { // Ask to spawn                    
                        console.log('The server has welcomed us to the game room. Sending spawn request.');
                        //socket.talk('s', global.playerName, 0);
                        global.message = '';
                    }
                }
                    break;
                case 'R': { // room setup
                    global.gameWidth = m[0];
                    global.gameHeight = m[1];
                    roomSetup = JSON.parse(m[2]);
                    serverStart = JSON.parse(m[3]);
                    config.roomSpeed = m[4];
                    console.log('Room data recieved. Commencing syncing process.');
                    // Start the syncing process
                    socket.talk('S', getNow());
                }
                    break;
                case 'c': { // force camera move
                    /*player.cx = c[0];
                    player.cy = c[1];
                    player.view = c[2];
                    player.renderx = player.cx;
                    player.rendery = player.cy;
                    player.renderv = player.view;*/
                }
                    break;
                case 'S': { // clock syncing
                    let clientTime = m[0],
                        serverTime = m[1],
                        laten = (getNow() - clientTime) / 2,
                        delta = getNow() - laten - serverTime;
                    // Add the datapoint to the syncing data
                    sync.push({
                        delta: delta,
                        latency: laten,
                    });
                    // Do it again a couple times
                    if (sync.length < 10) {
                        // Wait a bit just to space things out
                        setTimeout(() => {
                            socket.talk('S', getNow());
                        }, 10);
                        global.message = "Syncing clocks, please do not tab away. " + sync.length + "/10...";
                    } else {
                        // Calculate the clock error
                        sync.sort((e, f) => {
                            return e.latency - f.latency;
                        });
                        let median = sync[Math.floor(sync.length / 2)].latency;
                        let sd = 0,
                            sum = 0,
                            valid = 0;
                        sync.forEach(e => {
                            sd += Math.pow(e.latency - median, 2);
                        });
                        sd = Math.sqrt(sd / sync.length);
                        sync.forEach(e => {
                            if (Math.abs(e.latency - median) < sd) {
                                sum += e.delta;
                                valid++;
                            }
                        });
                        clockDiff = Math.round(sum / valid);
                        // Start the game
                        console.log(sync);
                        console.log('Syncing complete, calculated clock difference ' + clockDiff + 'ms. Beginning game.');
                        global.gameStart = true;
                        global.message = '';
                    }
                }
                    break;
              case 'm':{
                  //we dont like blank messages
                  if (m[0] == 0) return;
                  messages.push({
                    text: m[0],
                    status: 2,
                    alpha: m[1]?m[1]:0,
                    color: m[2]?m[2]:color.dgrey,
                    textcolor: m[3]?m[3]:color.guiwhite,
                    time: Date.now(),
                  });
                }
                break;
                case 'u': { // uplink
                    // Pull the camera info
                    let camtime = m[0],
                        camx = m[1],
                        camy = m[2],
                        camfov = m[3],
                        camvx = m[4],
                        camvy = m[5],
                        // We'll have to do protocol decoding on the remaining data
                        theshit = m.slice(6);
                    // Process the data
                    if (camtime > player.lastUpdate) { // Don't accept out-of-date information. 
                        // Time shenanigans
                        lag.add(getNow() - camtime);
                        player.time = camtime + lag.get();
                        metrics.rendergap = camtime - player.lastUpdate;
                        if (metrics.rendergap <= 0) {
                            console.log('yo some bullshit is up wtf');
                        }
                        player.lastUpdate = camtime;
                        // Convert the gui and entities
                        convert.begin(theshit);
                        convert.gui();
                        convert.data();
                        // Set camera values
                        player.cx = camx
                        player.cy = camy
                        // Save old physics values
                        player.lastx = player.x;
                        player.lasty = player.y;
                        player.lastvx = player.vx;
                        player.lastvy = player.vy;
                        // Get new physics values
                        player.x = camx;
                        player.y = camy;
                        player.vx = global.died ? 0 : camvx;
                        player.vy = global.died ? 0 : camvy;
                        // Figure out where we're rendering if we don't yet know
                        if (isNaN(player.renderx)) {
                            player.renderx = player.x;
                        }
                        if (isNaN(player.rendery)) {
                            player.rendery = player.y;
                        }
                        moveCompensation.reset();
                        // Fov stuff
                        player.view = camfov;
                        if (isNaN(player.renderv) || player.renderv === 0) {
                            player.renderv = 2000;
                        }
                        // Metrics
                        metrics.lastlag = metrics.lag;
                        metrics.lastuplink = getNow();
                    } else {
                        console.log("Old data! Last given time: " + player.time + "; offered packet timestamp: " + camtime + ".");
                    }
                    // Send the downlink and the target
                    socket.talk('d', Math.max(player.lastUpdate, camtime));
                    socket.cmd.talk();
                    updateTimes++; // metrics                                        
                }
                    break;
                case 'b': { // broadcasted minimap
                    convert.begin(m);
                    convert.broadcast();
                }
                    break;
                case 'p': { // ping
                    metrics.latency = global.time - m[0];
                }
                    break;
                case 'F': { // to pay respects
                    global.finalScore = Smoothbar(0, 4);
                    global.finalScore.set(m[0]);
                    global.finalLifetime = Smoothbar(0, 5);
                    global.finalLifetime.set(m[1]);
                    global.finalKills = [Smoothbar(0, 3), Smoothbar(0, 4.5), Smoothbar(0, 2.5)];
                    global.finalKills[0].set(m[2]);
                    global.finalKills[1].set(m[3]);
                    global.finalKills[2].set(m[4]);
                    global.finalKillers = [];
                    for (let i = 0; i < m[5]; i++) {
                        global.finalKillers.push(m[6 + i]);
                    }
                    global.died = true;
                    window.onbeforeunload = () => {
                        return false;
                    };
                }
                    break;
                case 'K': { // kicked
                    window.onbeforeunload = () => {
                        return false;
                    };
                }
                    break;
                default:
                    throw new Error('Unknown message index.');
            }
        };
        // Handle closing 
        socket.onclose = function socketClose() {
            socket.open = false;
            global.disconnected = true;
            if (global.state == 1) {
                startGame(true);
            }
            clearInterval(socket.commandCycle);
            window.onbeforeunload = () => {
                return false;
            };
            console.log('Socket closed.');
        };
        // Notify about errors
        socket.onerror = function socketError(error) {
            console.log('WebSocket error: ' + error);
            global.message = 'Socket error. Maybe another server will work.';
        };
        // Gift it to the rest of the world
        return socket;
    };
})();

// This starts the game and sets up the websocket
function startGame(hideMenu = false) {
    global.started = true;
    // Get options
    util.submitToLocalStorage('optScreenshotMode');
    config.graphical.screenshotMode = document.getElementById('optScreenshotMode').checked;
    util.submitToLocalStorage('optFancy');
    config.graphical.pointy = !document.getElementById('optNoPointy').checked;
    util.submitToLocalStorage('optNoPointy');
    config.graphical.fancyAnimations = !document.getElementById('optFancy').checked;
    util.submitToLocalStorage('optPredictive');
    config.lag.unresponsive = document.getElementById('optPredictive').checked;
    util.submitToLocalStorage('optBorders');
    util.submitToLocalStorage('optOpenScreen');
    switch (document.getElementById('optBorders').value) {
        case 'normal':
            config.graphical.darkBorders = config.graphical.neon = false;
            break;
        case 'dark':
            config.graphical.darkBorders = true;
            config.graphical.neon = false;
            break;
        case 'glass':
            config.graphical.darkBorders = false;
            config.graphical.neon = true;
            break;
        case 'neon':
            config.graphical.darkBorders = config.graphical.neon = true;
            break;
    }
    util.submitToLocalStorage('optColors');
    let a = document.getElementById('optColors').value;
    color = colors[(a === '') ? 'normal' : a];
    // Other more important stuff
    let playerNameInput = document.getElementById('playerNameInput');
    let playerKeyInput = document.getElementById('playerKeyInput');
    // Name and keys
    util.submitToLocalStorage('playerNameInput');
    util.submitToLocalStorage('playerKeyInput');
    global.playerName = player.name = playerNameInput.value;
    global.playerKey = playerKeyInput.value.replace(/(<([^>]+)>)/ig, '').substring(0, 64);
    // Change the screen
    global.screenWidth = window.innerWidth;
    global.screenHeight = window.innerHeight;
    if (hideMenu) {
        document.getElementById("startMenuWrapper").style.top = "-60px";
        document.getElementById("startMenuWrapper").style.opacity = 0;
        document.getElementById("menu").style.top = "-60px";
        document.getElementById("menu").style.opacity = 0;
        setTimeout(function () {
            document.getElementById("startMenuWrapper").style.display = "none";
            document.getElementById("menu").style.display = "none";
        }, 1000)
        global.inGame = true;
        global.animations.menuFade = 0;
    };
    //document.getElementById("gameAreaWrapper").style.opacity = 1;
    // Set up the socket
    if (!global.socket) {
        //let mockupUrl = `${global.server.secure||isSecureProtocol?"https":"http"}://${global.server.at}/mockups.json`
        let mockupUrl = (global.secure ? (window.location.protocol + "//") : "http://") + global.server + "/mockups.json";
        util.pullJSON(mockupUrl).then(data => {
            mockups = data;
        });
        global.socket = socketInit(3000);
    }
    window.canvas.socket = global.socket;
    setInterval(() => moveCompensation.iterate(global.socket.cmd.getMotion()), 1000 / 30);
    document.getElementById('gameCanvas').focus();
    window.onbeforeunload = () => {
        return true;
    };
}

// Background clearing
function clearScreen(clearColor, alpha, blur) {
    ctx.fillStyle = clearColor;
    ctx.globalAlpha = alpha;
    ctx.fillRect(0, 0, global.screenWidth, global.screenHeight);
    ctx.globalAlpha = 1;
}

// Text functions
const measureText = (() => {
    let div = document.createElement('div');
    document.body.appendChild(div);
    return (text, fontSize, twod = false) => {
        fontSize += config.graphical.fontSizeBoost;
        var w, h;
        div.style.font = 'bold ' + fontSize + 'px Ubuntu';
        div.style.padding = '0';
        div.style.margin = '0';
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.innerHTML = text;
        w = div.clientWidth;
        h = div.clientHeight;
        return (twod) ? {
            width: w,
            height: h
        } : w;
    };
})();
const TextObj = (() => {
    // A thing
    let floppy = (value = null) => {
        let flagged = true;
        // Methods
        return {
            update: newValue => {
                let eh = false;
                if (value == null) {
                    eh = true;
                } else {
                    if (typeof newValue != typeof value) {
                        eh = true;
                    }
                    // Decide what to do based on what type it is
                    switch (typeof newValue) {
                        case 'number':
                        case 'string': {
                            if (newValue !== value) {
                                eh = true;
                            }
                        }
                            break;
                        case 'object': {
                            if (Array.isArray(newValue)) {
                                if (newValue.length !== value.length) {
                                    eh = true;
                                } else {
                                    for (let i = 0, len = newValue.length; i < len; i++) {
                                        if (newValue[i] !== value[i]) eh = true;
                                    }
                                }
                                break;
                            }
                        } // jshint ignore:line
                        default:
                            console.log(newValue);
                            throw new Error('Unsupported type for a floppyvar!');
                    }
                }
                // Update if neeeded
                if (eh) {
                    flagged = true;
                    value = newValue;
                }
            },
            publish: () => {
                return value;
            },
            check: () => {
                if (flagged) {
                    flagged = false;
                    return true;
                }
                return false;
            },
        };
    };
    // An index
    let index = 0;
    return () => {
        let textcanvas = document.createElement('canvas');
        let canvasId = 'textCanvasNo' + index++;
        textcanvas.setAttribute('id', canvasId);
        let tctx = textcanvas.getContext('2d');
        tctx.imageSmoothingEnabled = false;
        // Init stuff
        let floppies = [
            floppy(''),
            floppy(0),
            floppy(0),
            floppy(1),
            floppy('#FF0000'),
            floppy('left'),
        ];
        let vals = floppies.map(f => f.publish());
        let xx = 0;
        let yy = 0;
        return {
            draw: (text, x, y, size, fill, align = 'left', center = false, fade = 1) => {
                size += config.graphical.fontSizeBoost;
                let drawRatio = ctx.getTransform().a;
                size *= drawRatio;
                // Update stuff
                floppies[0].update(text);
                floppies[1].update(x);
                floppies[2].update(y);
                floppies[3].update(size);
                floppies[4].update(fill);
                floppies[5].update(align);
                // Check stuff
                if (floppies.some(f => f.check())) {
                    // Get text dimensions and resize/reset the canvas
                    let offset = Math.max(3, size / 5);
                    let dim = measureText(text, size - config.graphical.fontSizeBoost, true);
                    tctx.canvas.height = dim.height + 2 * offset;
                    tctx.canvas.width = dim.width + 2 * offset;
                    // Redraw it
                    switch (align) {
                        case 'left':
                        case 'start':
                            xx = offset;
                            break;
                        case 'center':
                            xx = tctx.canvas.width / 2;
                            break;
                        case 'right':
                        case 'end':
                            xx = tctx.canvas.width - offset;
                            break;
                    }
                    yy = tctx.canvas.height / 2;
                    // Draw it
                    tctx.lineWidth = offset;
                    tctx.font = 'bold ' + size + 'px Ubuntu';
                    tctx.textAlign = align;
                    tctx.textBaseline = 'middle';
                    tctx.strokeStyle = color.black;
                    tctx.fillStyle = fill;
                    tctx.lineCap = 'round';
                    tctx.lineJoin = 'round';
                    tctx.strokeText(text, xx, yy);
                    tctx.fillText(text, xx, yy);
                }
                // Draw the cached text
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(tctx.canvas, Math.round(x - xx / drawRatio), Math.round(y - (yy * (1.05 + !center * 0.45)) / drawRatio), tctx.canvas.width / drawRatio, tctx.canvas.height / drawRatio);
                ctx.restore();
            },
            remove: () => {
                var element = document.getElementById(canvasId);
                if (element != null) element.parentNode.removeChild(element);
            },
        };
    };
})();

// Gui drawing functions
function drawGuiRect(x, y, length, height, stroke = false) {
    switch (stroke) {
        case true:
            ctx.strokeRect(x, y, length, height);
            break;
        case false:
            ctx.fillRect(x, y, length, height);
            break;
    }
}

function drawGuiCircle(x, y, radius, stroke = false) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    stroke ? ctx.stroke() : ctx.fill()
}

function drawGuiLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.lineTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
    ctx.closePath();
    ctx.stroke();
}

function drawBar(x1, x2, y, width, color) {
    ctx.beginPath();
    ctx.lineTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.closePath();
    ctx.stroke();
}

// Entity drawing (this is a function that makes a function)
const drawEntity = (() => {
    // Sub-drawing functions
    function drawPoly(context, centerX, centerY, radius, sides, angle = 0, fill = true, stroke = true) {
        angle += (sides % 2) ? 0 : Math.PI / sides;
        // Start drawing
        context.beginPath();
        if (!sides) { // Circle
            let strokeStyle = context.strokeStyle;
            let fillStyle = context.fillStyle;
            if (stroke) {
                context.fillStyle = strokeStyle;
                context.arc(centerX, centerY, radius + ctx.lineWidth / 2, 0, 2 * Math.PI);
                context.fill();
            };
            ctx.closePath();
            ctx.beginPath();
            context.fillStyle = fillStyle;
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.fill();
            ctx.closePath();
        } else if (sides < 0) { // Star
            if (config.graphical.pointy) context.lineJoin = 'miter';
            let dip = 1 - (6 / sides / sides);
            sides = -sides;
            context.moveTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            for (let i = 0; i < sides; i++) {
                var theta = (i + 1) / sides * 2 * Math.PI;
                var htheta = (i + 0.5) / sides * 2 * Math.PI;
                var c = {
                    x: centerX + radius * dip * Math.cos(htheta + angle),
                    y: centerY + radius * dip * Math.sin(htheta + angle),
                };
                var p = {
                    x: centerX + radius * Math.cos(theta + angle),
                    y: centerY + radius * Math.sin(theta + angle),
                };
                context.quadraticCurveTo(c.x, c.y, p.x, p.y);
            }
        } else if (sides > 0) { // Polygon
            for (let i = 0; i < sides; i++) {
                let theta = (i / sides) * 2 * Math.PI;
                let x = centerX + radius * Math.cos(theta + angle);
                let y = centerY + radius * Math.sin(theta + angle);
                context.lineTo(x, y);
            }
        }
        context.closePath();
        if (sides != 0) {
            if (stroke) context.stroke();
            if (fill) {
                context.fill();
            }
        };
        context.lineJoin = 'round';
    }

    function drawTrapezoid(context, x, y, length, height, aspect, angle, stroke = true) {
        let h = [];
        h = (aspect > 0) ? [height * aspect, height] : [height, -height * aspect];
        let r = [
            Math.atan2(h[0], length),
            Math.atan2(h[1], length)
        ];
        let l = [
            Math.sqrt(length * length + h[0] * h[0]),
            Math.sqrt(length * length + h[1] * h[1])
        ];

        context.beginPath();
        context.lineTo(x + l[0] * Math.cos(angle + r[0]), y + l[0] * Math.sin(angle + r[0]));
        context.lineTo(x + l[1] * Math.cos(angle + Math.PI - r[1]), y + l[1] * Math.sin(angle + Math.PI - r[1]));
        context.lineTo(x + l[1] * Math.cos(angle + Math.PI + r[1]), y + l[1] * Math.sin(angle + Math.PI + r[1]));
        context.lineTo(x + l[0] * Math.cos(angle - r[0]), y + l[0] * Math.sin(angle - r[0]));
        context.closePath();
        if (stroke) context.stroke();
        context.fill();
    }
    // The big drawing function
    return (x, y, instance, ratio, alpha = 1, scale = 1, rot = 0, turretsObeyRot = false, assignedContext = false, turretInfo = false, render = instance.render, isShadow) => {
        let context = assignedContext || ctx;
        let fade = turretInfo ? 1 : render.status.getFade(),
            drawSize = scale * ratio * instance.size,
            m = mockups[instance.index],
            xx = x,
            yy = y,
            source = (turretInfo === false) ? instance : turretInfo;
        if (0 !== fade && 0 !== alpha) {
            render.expandsWithDeath && (drawSize *=
                1 + .5 * (1 - fade));
            if (assignedContext !== ctx && (1 !== fade || 1 !== alpha))
                if (config.graphical.fancyAnimations) {
                    context = ctx2;
                    context.canvas.width = context.canvas.height = drawSize * m.position.axis + ratio * 20;
                    xx = context.canvas.width / 2 - drawSize * m.position.axis * m.position.middle.x * Math.cos(rot) / 4;
                    yy = context.canvas.height / 2 - drawSize * m.position.axis * m.position.middle.x * Math.sin(rot) / 4;
                    assignedContext = false
                }
                else if (.5 > fade * alpha) return;
            "object" !== typeof context && (context = ctx);
            context.lineCap = "round";
            context.lineJoin = 'round';
            if (!isShadow) {
                // Draw turrets beneath us
                if (source.turrets.length === m.turrets.length) {
                    for (let i = 0; i < m.turrets.length; i++) {
                        let t = m.turrets[i];
                        if (t.layer === 0) {
                            let ang = t.direction + t.angle + rot,
                                len = t.offset * drawSize;
                            drawEntity(
                                xx + len * Math.cos(ang),
                                yy + len * Math.sin(ang),
                                t, ratio, alpha, drawSize / ratio / t.size * t.sizeFactor,
                                source.turrets[i].facing + turretsObeyRot * rot,
                                turretsObeyRot, context, source.turrets[i], render, isShadow
                            );
                        }
                    }
                } else {
                    throw new Error("Mismatch turret number with mockup.");
                }
                // Draw guns  
                source.guns.update();
                context.lineWidth = Math.max(config.graphical.mininumBorderChunk, ratio * config.graphical.borderChunk);
                setColor(context, isShadow ? config.graphical.shadowColor : mixColors(color.grey, render.status.getColor(), render.status.getBlend()));
                if (source.guns.length === m.guns.length) {
                    let positions = source.guns.getPositions();
                    for (let i = 0; i < m.guns.length; i++) {
                        let g = m.guns[i],
                            position = positions[i] / ((g.aspect === 1) ? 2 : 1),
                            gx =
                                g.offset * Math.cos(g.direction + g.angle + rot) +
                                (g.length / 2 - position) * Math.cos(g.angle + rot),
                            gy =
                                g.offset * Math.sin(g.direction + g.angle + rot) +
                                (g.length / 2 - position) * Math.sin(g.angle + rot);
                        drawTrapezoid(
                            context,
                            xx + drawSize * gx,
                            yy + drawSize * gy,
                            drawSize * (g.length / 2 - ((g.aspect === 1) ? position * 2 : 0)),
                            drawSize * g.width / 2,
                            g.aspect,
                            g.angle + rot,
                            !isShadow
                        );
                    }
                } else {
                    throw new Error("Mismatch gun number with mockup.");
                }
            };
            // Draw body
            context.globalAlpha = 1;
            setColor(context, isShadow ? config.graphical.shadowColor : mixColors(getColor(instance.color), render.status.getColor(), render.status.getBlend()));
            drawPoly(context, xx, yy, drawSize / m.size * m.realSize, m.shape, rot, true, !isShadow);
            if (!isShadow) {
                // Draw turrets above us
                if (source.turrets.length === m.turrets.length) {
                    for (let i = 0; i < m.turrets.length; i++) {
                        let t = m.turrets[i];
                        if (t.layer === 1) {
                            let ang = t.direction + t.angle + rot,
                                len = t.offset * drawSize;
                            drawEntity(
                                xx + len * Math.cos(ang),
                                yy + len * Math.sin(ang),
                                t, ratio, alpha, drawSize / ratio / t.size * t.sizeFactor,
                                source.turrets[i].facing + turretsObeyRot * rot,
                                turretsObeyRot, context, source.turrets[i], render, isShadow
                            );
                        }
                    }
                } else {
                    throw new Error("Mismatch turret number with mockup.");
                }
            };
            assignedContext || context === ctx || (ctx.save(), ctx.globalAlpha = alpha * fade, ctx.drawImage(context.canvas, x - xx, y - yy), ctx.restore())
        }
    };
})();

function drawHealth(x, y, instance, ratio) {
    // Draw health bar
    ctx.globalAlpha = Math.pow(instance.render.status.getFade(), 2);
    let size = (instance.size * ratio) / 1.1;
    let m = mockups[instance.index];
    let realSize = size / m.size * m.realSize;
    // Draw health
    if (instance.drawsHealth) {
        let health = instance.render.health.get();
        let shield = instance.render.shield.get();
        if (health < 1 || shield < 1) {
            let yy = y + 1.1 * realSize + 15 * ratio;
            drawBar(x - size, x + size, yy, (2 + config.graphical.barChunk) * ratio, color.black);
            drawBar(x - size, x - size + 2 * size * health, yy, 3.5 * ratio, color.lgreen);
            if (shield) {
                ctx.globalAlpha = 0.3 + shield * 0.3;
                drawBar(x - size, x - size + 2 * size * shield, yy, 2 * ratio, color.teal);
                ctx.globalAlpha = 1;
            }
        }
    }
    // Draw label
    if (instance.nameplate && instance.id !== gui.playerid) {
        if (instance.render.textobjs == null) instance.render.textobjs = [TextObj(), TextObj()];
        if (instance.name !== '\u0000') {
            instance.render.textobjs[0].draw(
                instance.alpha?instance.name:'',
                x, y - realSize - 30, 16, color.guiwhite, 'center'
            );
            instance.render.textobjs[1].draw(
                util.handleLargeNumber(instance.alpha?instance.score:'', true),
                x, y - realSize - 16, 8, color.guiwhite, 'center'
            );
        } else {
            instance.render.textobjs[0].draw(
                'a spoopy 👻',
                x, y - realSize - 30, 16, color.lavender, 'center'
            );
            instance.render.textobjs[1].draw(
                util.handleLargeNumber(instance.score, true),
                x, y - realSize - 16, 8, color.lavender, 'center'
            );
        }
    }
}

// Start animation
window.requestAnimFrame = (() => {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            //window.setTimeout(callback, 1000 / 60);
        };
})();
window.cancelAnimFrame = (() => {
    return window.cancelAnimationFrame ||
        window.mozCancelAnimationFrame;
})();

// Drawing states
const gameDraw = (() => {
    const statMenu = Smoothbar(0, 0.7, 1.5);
    const upgradeMenu = Smoothbar(0, 2, 3);
    // Define the graph constructor
    function graph() {
        var data = [];
        return (point, x, y, w, h, col) => {
            // Add point and push off old ones
            data.push(point);
            while (data.length > w) {
                data.splice(0, 1);
            }
            // Get scale
            let min = Math.min(...data),
                max = Math.max(...data),
                range = max - min;
            // Draw zero
            if (max > 0 && min < 0) {
                drawBar(x, x + w, y + h * max / range, 2, color.guiwhite);
            }
            // Draw points
            ctx.beginPath();
            let i = -1;
            data.forEach((p) => {
                if (!++i) {
                    ctx.moveTo(x, y + h * (max - p) / range);
                } else {
                    ctx.lineTo(x + i, y + h * (max - p) / range);
                }
            });
            ctx.lineWidth = 1;
            ctx.strokeStyle = col;
            ctx.stroke();
        };
    }
    // Lag compensation functions
    const compensation = (() => {
        // Protected functions
        function interpolate(p1, p2, v1, v2, ts, tt) {
            let k = Math.cos((1 + tt) * Math.PI);
            return 0.5 * (((1 + tt) * v1 + p1) * (k + 1) + (-tt * v2 + p2) * (1 - k));
        }

        function extrapolate(p1, p2, v1, v2, ts, tt) {
            return p2 + (p2 - p1) * tt; /*v2 + 0.5 * tt * (v2 - v1) * ts*/
        }
        // Useful thing
        function angleDifference(sourceA, targetA) {
            let mod = function (a, n) {
                return (a % n + n) % n;
            };
            let a = targetA - sourceA;
            return mod(a + Math.PI, 2 * Math.PI) - Math.PI;
        }
        // Constructor
        return () => {
            // Protected vars
            let timediff = 0,
                t = 0,
                tt = 0,
                ts = 0;
            // Methods
            return {
                set: (time = player.time, interval = metrics.rendergap) => {
                    t = Math.max(getNow() - time - 80, -interval);
                    if (t > 150 && t < 1000) {
                        t = 150;
                    }
                    if (t > 1000) {
                        t = 1000 * 1000 * Math.sin(t / 1000 - 1) / t + 1000;
                    }
                    tt = t / interval;
                    ts = config.roomSpeed * 30 * t / 1000;
                },
                predict: (p1, p2, v1, v2) => {
                    return (t >= 0) ? extrapolate(p1, p2, v1, v2, ts, tt) : interpolate(p1, p2, v1, v2, ts, tt);
                },
                predictFacing: (f1, f2) => {
                    return f1 + (1 + tt) * angleDifference(f1, f2);
                },
                lerp: util.lerp,
                lerpAngle: (is, to, amount, syncWithFps) => {
                    var normal = {
                        x: Math.cos(is),
                        y: Math.sin(is)
                    };
                    var normal2 = {
                        x: Math.cos(to),
                        y: Math.sin(to)
                    };
                    var res = {
                        x: util.lerp(normal.x, normal2.x, amount, syncWithFps),
                        y: util.lerp(normal.y, normal2.y, amount, syncWithFps)
                    };
                    return Math.atan2(res.y, res.x);
                },
                getPrediction: () => {
                    return t;
                },
            };
        };
    })();
    // Make graphs
    const timingGraph = graph(),
        lagGraph = graph(),
        gapGraph = graph();
    // The skill bar dividers
    const ska = (() => {
        function make(x) {
            return Math.log(4 * x + 1) / Math.log(5);
        }
        let a = [];
        for (let i = 0; i < config.gui.expectedMaxSkillLevel * 2; i++) {
            a.push(make(i / config.gui.expectedMaxSkillLevel));
        }
        // The actual lookup function
        return x => {
            return a[x];
        };
    })();
    // Text objects
    const text = {
        skillNames: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        skillKeys: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        skillValues: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        skillPoints: TextObj(),
        score: TextObj(),
        name: TextObj(),
        class: TextObj(),
        debug: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        lbtitle: TextObj(),
        leaderboard: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        upgradeNames: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        upgradeKeys: [
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
            TextObj(),
        ],
        skipUpgrades: TextObj(),
    };
    // The drawing loop
    return ratio => {
        //lag.set();
        let GRAPHDATA = 0;
        // Prep stuff
        renderTimes++;

        let px, py; { // Move the camera
            let motion = compensation();
            motion.set();
            let smear = {
                x: 0,
                y: 0,
            }; // moveCompensation.get();
            GRAPHDATA = motion.getPrediction();
            // Don't move the camera if you're dead. This helps with jitter issues
            player.renderx = util.lerp(player.renderx, player.cx, 0.2);
            player.rendery = util.lerp(player.rendery, player.cy, 0.2);
            //player.renderx += (desiredx - player.renderx) / 5;
            //player.rendery += (desiredy - player.rendery) / 5;
            px = ratio * player.renderx;
            py = ratio * player.rendery;
        }

        { // Clear the background + draw grid 
            clearScreen(color.white, 1);
            clearScreen(color.guiblack, 0.1);

            let W = roomSetup[0].length,
                H = roomSetup.length,
                i = 0;
            roomSetup.forEach((row) => {
                let j = 0;
                row.forEach((cell) => {
                    let left = Math.max(0, ratio * j * global.gameWidth / W - px + global.screenWidth / 2),
                        top = Math.max(0, ratio * i * global.gameHeight / H - py + global.screenHeight / 2),
                        right = Math.min(global.screenWidth, (ratio * (j + 1) * global.gameWidth / W - px) + global.screenWidth / 2),
                        bottom = Math.min(global.screenHeight, (ratio * (i + 1) * global.gameHeight / H - py) + global.screenHeight / 2);
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = (config.graphical.screenshotMode) ? color.guiwhite : color.white;
                    ctx.fillRect(left, top, right - left, bottom - top);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = (config.graphical.screenshotMode) ? color.guiwhite : getZoneColor(cell, true);
                    ctx.fillRect(left, top, right - left, bottom - top);
                    j++;
                });
                i++;
            });
            /*ctx.lineWidth = 1;
            ctx.strokeStyle = (config.graphical.screenshotMode) ? color.guiwhite : color.guiblack;
            ctx.globalAlpha = 0.04;
            ctx.beginPath();
            let gridsize = 30 * ratio;
            for (let x = (global.screenWidth / 2 - px) % gridsize; x < global.screenWidth; x += gridsize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, global.screenHeight);
            }
            for (let y = (global.screenHeight / 2 - py) % gridsize; y < global.screenHeight; y += gridsize) {
                ctx.moveTo(0, y);
                ctx.lineTo(global.screenWidth, y);
            }
            ctx.stroke();*/
            ctx.globalAlpha = 1;
        }

        { // Draw things 
            entities.forEach(function entitydrawingloop(instance) {
                if (!instance.render.draws) {
                    return 1;
                }
                let motion = compensation();
                if (instance.render.status.getFade() === 1) {
                    motion.set();
                } else {
                    motion.set(instance.render.lastRender, instance.render.interval);
                }
                instance.render.x = motion.lerp(instance.render.x, instance.x + instance.vx, 0.25);
                instance.render.y = motion.lerp(instance.render.y, instance.y + instance.vy, 0.25);
                instance.render.f = (instance.id === gui.playerid && !instance.twiggle) ?
                    Math.atan2(target.y, target.x) :
                    motion.lerpAngle(instance.render.f, instance.facing, 0.25);
                let x = ratio * instance.render.x - px,
                    y = ratio * instance.render.y - py;
                x += global.screenWidth / 2;
                y += global.screenHeight / 2;
                // x, y, instance, ratio, alpha = 1, scale = 1, rot = 0, turretsObeyRot = false, assignedContext = false, turretInfo = false, render = instance.render
                drawEntity(x, y + (20 * ratio), instance, ratio, instance.id === gui.playerid || global.showInvisible ? instance.alpha ? .6 * instance.alpha + .4 : .25 : instance.alpha, 1.2, instance.render.f, undefined, undefined, undefined, undefined, true);
            });
            entities.forEach(function entitydrawingloop(instance) {
                if (!instance.render.draws) {
                    return 1;
                }
                let x = ratio * instance.render.x - px,
                    y = ratio * instance.render.y - py;
                x += global.screenWidth / 2;
                y += global.screenHeight / 2;
                drawEntity(x, y, instance, ratio, instance.id === gui.playerid || global.showInvisible ? instance.alpha ? .6 * instance.alpha + .4 : .25 : instance.alpha, 1, instance.render.f);
            });
            if (!config.graphical.screenshotMode) {
                entities.forEach(function entityhealthdrawingloop(instance) {
                    let x = ratio * instance.render.x - px,
                        y = ratio * instance.render.y - py;
                    x += global.screenWidth / 2;
                    y += global.screenHeight / 2;
                    if(instance.alpha)drawHealth(x, y, instance, ratio);
                });
            }
        }
        var scaleGui = (scale, scaleRatio) => {
            global.screenWidth /= scale;
            global.screenHeight /= scale;
            ctx.scale(scale, scale);
            scaleRatio || (global.scaleGuiRatio *= scale)
        };
        scaleGui(global.scaleGuiRatio, true)
        // Draw GUI       
        let alcoveSize = 200;
        let spacing = 20;
        gui.__s.update();
        let lb = leaderboard.get();
        let max = lb.max;

        { // Draw messages
            let vspacing = 4;
            let len = 0;
            let height = 18;
            let x = global.screenWidth / 2;
            let y = spacing;
            // Draw each message
            for (let i = messages.length - 1; i >= 0; i--) {
                let msg = messages[i],
                    txt = msg.text,
                    text = txt; //txt[0].toUpperCase() + txt.substring(1);  
                // Give it a textobj if it doesn't have one
                if (msg.textobj == null) msg.textobj = TextObj();
                if (msg.len == null) msg.len = measureText(text, height - 4);
                // Draw the background
                ctx.globalAlpha = 0.5 * msg.alpha;
                drawBar(x - msg.len / 2, x + msg.len / 2, y + height / 2, height, msg.color);
                // Draw the text
                ctx.globalAlpha = Math.min(1, msg.alpha);
                msg.textobj.draw(text, x, y + height / 2, height - 4, msg.textcolor, 'center', true);
                // Iterate and move
                y += (vspacing + height);
                if (msg.status > 1) {
                    y -= (vspacing + height) * (1 - Math.sqrt(msg.alpha));
                }
                if (msg.status > 1) {
                    msg.status -= 0.05;
                    msg.alpha += 0.05;
                } else if (i === 0 && (messages.length > 5 || Date.now() - msg.time > 10000)) {
                    msg.status -= 0.05;
                    msg.alpha -= 0.05;
                    // Remove
                    if (msg.alpha <= 0) {
                        messages[0].textobj.remove();
                        messages.splice(0, 1);
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        { // Draw skill bars
            global.canSkill = !!gui.points;
            statMenu.set(0 + (global.canSkill || global.died || global.statHover));
            global.clickables.stat.hide();

            let vspacing = 4;
            let height = 15;
            let gap = 35;
            let len = alcoveSize; // The 30 is for the value modifiers
            let save = len;
            let x = -spacing - 2 * len + statMenu.get() * (2 * spacing + 2 * len);
            let y = global.screenHeight - spacing - height;
            let ticker = 11;
            let namedata = gui.getStatNames(mockups[gui.type].statnames || -1);
            gui.skills.forEach(function drawASkillBar(skill) { // Individual skill bars 
                ticker--;
                let name = namedata[ticker - 1],
                    level = skill.amount,
                    col = color[skill.color],
                    cap = skill.softcap,
                    maxLevel = skill.cap;
                if (cap) {
                    len = save;
                    let max = config.gui.expectedMaxSkillLevel,
                        extension = cap > max,
                        blocking = cap < maxLevel;
                    if (extension) {
                        max = cap;
                    }
                    drawBar(x + height / 2, x - height / 2 + len * ska(cap), y + height / 2, height - 3 + config.graphical.barChunk, color.black);
                    drawBar(x + height / 2, x + height / 2 + (len - gap) * ska(cap), y + height / 2, height - 3, color.grey);
                    drawBar(x + height / 2, x + height / 2 + (len - gap) * ska(level), y + height / 2, height - 3.5, col);
                    // Blocked-off area
                    if (blocking) {
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = color.grey;
                        for (let j = cap + 1; j < max; j++) {
                            drawGuiLine(
                                x + (len - gap) * ska(j), y + 1.5,
                                x + (len - gap) * ska(j), y - 3 + height
                            );
                        }
                    }
                    // Vertical dividers
                    ctx.strokeStyle = color.black;
                    ctx.lineWidth = 1;
                    for (let j = 1; j < level + 1; j++) {
                        drawGuiLine(
                            x + (len - gap) * ska(j), y + 1.5,
                            x + (len - gap) * ska(j), y - 3 + height
                        );
                    }
                    // Skill name
                    len = save * ska(max);
                    let textcolor = (level == maxLevel) ? col : (!gui.points || (cap !== maxLevel && level == cap)) ? color.grey : color.guiwhite;
                    text.skillNames[ticker - 1].draw(
                        name,
                        Math.round(x + len / 2) + 0.5, y + height / 2,
                        height - 5, textcolor, 'center', true
                    );
                    // Skill key
                    text.skillKeys[ticker - 1].draw(
                        '[' + (ticker % 10) + ']',
                        Math.round(x + len - height * 0.25) - 1.5, y + height / 2,
                        height - 5, textcolor, 'right', true
                    );
                    if (textcolor === color.guiwhite) { // If it's active
                        global.clickables.stat.place(ticker - 1, x * global.scaleGuiRatio, y * global.scaleGuiRatio, len * global.scaleGuiRatio, height * global.scaleGuiRatio);
                    }
                    // Skill value
                    if (level) {
                        text.skillValues[ticker - 1].draw(
                            (textcolor === col) ? 'MAX' : '+' + level,
                            Math.round(x + len + 4) + 0.5, y + height / 2,
                            height - 5, col, 'left', true
                        );
                    }
                    // Move on 
                    y -= height + vspacing;
                }
            });
            global.clickables.hover.place(0, 0, y * global.scaleGuiRatio, 0.8 * len * global.scaleGuiRatio, 0.8 * (global.screenHeight - y) * global.scaleGuiRatio);
            if (gui.points !== 0) { // Draw skillpoints to spend
                text.skillPoints.draw('x' + gui.points, Math.round(x + len - 2) + 0.5, Math.round(y + height - 4) + 0.5, 20, color.guiwhite, 'right');
            }
        }
        if (global.inGame) {
            global.animations.scoreBar = util.lerp(global.animations.scoreBar, 0, 0.1);
        };
        ctx.save();
        ctx.translate(0, global.animations.scoreBar * 200); { // Draw name, exp and score bar
            let vspacing = 4;
            let len = 1.65 * alcoveSize;
            let height = 25;
            let x = (global.screenWidth - len) / 2;
            let y = global.screenHeight - spacing - height;

            ctx.lineWidth = 1;
            // Handle exp
            // Draw the exp bar
            drawBar(x, x + len, y + height / 2, height - 3 + config.graphical.barChunk, color.black);
            drawBar(x, x + len, y + height / 2, height - 3, color.grey);
            drawBar(x, x + len * gui.__s.getProgress(), y + height / 2, height - 3.5, color.gold);
            // Draw the class type
            text.class.draw(
                'Level ' + gui.__s.getLevel() + ' ' + mockups[gui.type].name,
                x + len / 2, y + height / 2,
                height - 4, color.guiwhite, 'center', true
            );
            height = 14;
            y -= height + vspacing;
            // Draw the %-of-leader bar
            drawBar(x + len * 0.1, x + len * 0.9, y + height / 2, height - 3 + config.graphical.barChunk, color.black);
            drawBar(x + len * 0.1, x + len * 0.9, y + height / 2, height - 3, color.grey);
            drawBar(x + len * 0.1, x + len * (0.1 + 0.8 * ((max) ? Math.min(1, gui.__s.getScore() / max) : 1)), y + height / 2, height - 3.5, color.green);
            // Draw the score
            text.score.draw(
                'Score: ' + util.handleLargeNumber(gui.__s.getScore()),
                x + len / 2, y + height / 2,
                height - 2, color.guiwhite, 'center', true
            );
            // Draw the name
            ctx.lineWidth = 4;
            text.name.draw(
                player.name,
                Math.round(x + len / 2) + 0.5, Math.round(y - 10 - vspacing) + 0.5,
                32, color.guiwhite, 'center'
            );
        }
        ctx.restore(); { // Draw minimap and FPS monitors
            let len = alcoveSize;
            let height = len;
            let x = global.screenWidth - len - spacing;
            let y = global.screenHeight - height - spacing;

            ctx.globalAlpha = 0.6;
            let W = roomSetup[0].length,
                H = roomSetup.length,
                i = 0;
            roomSetup.forEach((row) => {
                let j = 0;
                row.forEach((cell) => {
                    ctx.fillStyle = getZoneColor(cell, false);
                    drawGuiRect(x + (j++) * len / W, y + i * height / H, len / W, height / H);
                });
                i++;
            });
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = mixColors(color.grey, color.vlgrey);
            drawGuiRect(x, y, len, height);
            ctx.globalAlpha = 1;
            for (let entity of minimap.get()) {
                ctx.fillStyle = mixColors(getColor(entity.color), color.black, 0.3);
                2 === entity.type ? (drawGuiRect(
                    x + ((entity.x - entity.size) / global.gameWidth) * len - 0.4,
                    y + ((entity.y - entity.size) / global.gameWidth) * len - 1,
                    ((2 * entity.size) / global.gameWidth) * len + 0.2,
                    ((2 * entity.size) / global.gameWidth) * len + 0.2
                )) :
                    1 === entity.type ?
                        drawGuiCircle(
                            x + (entity.x / global.gameWidth) * len,
                            y + (entity.y / global.gameWidth) * len,
                            (entity.size / global.gameWidth) * len + 0.2
                        ) :
                        entity.id !== gui.playerid &&
                        drawGuiCircle(x + (entity.x / global.gameWidth) * len, y + (entity.y / global.gameWidth) * len, 2);
            }
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
            ctx.strokeStyle = color.black;
            ctx.fillStyle = color.black;
            drawGuiCircle( // My position
                x + (player.x / global.gameWidth) * len - 1,
                y + (player.y / global.gameWidth) * height - 1,
                2, false
            );
            ctx.lineWidth = 3;
            ctx.fillStyle = color.black;
            drawGuiRect(x, y, len, height, true); // Border

            /*drawGuiRect(x, y - 40, len, 30);
            lagGraph(lag.get(), x, y - 40, len, 30, color.teal);
            gapGraph(metrics.rendergap, x, y - 40, len, 30, color.pink);
            timingGraph(GRAPHDATA, x, y - 40, len, 30, color.yellow);*/
            // Text
            text.debug[3].draw(
                'openarras-' + buildHash,
                global.screenWidth / 2, 16,
                12, color.guiwhite, 'center'
            );
            text.debug[1].draw(
                (100 * gui.fps).toFixed(2) + '% : ' + metrics.rendertime + " FPS",
                x + len, y - 10 - 1 * 14,
                10, metrics.rendertime > 10 ? color.guiwhite : color.orange, 'right'
            );
            text.debug[0].draw(
                metrics.latency + ".0 ms",
                x + len, y - 10,
                10, color.guiwhite, 'right'
            );
        }

        { // Draw leaderboard
            let vspacing = 4;
            let len = alcoveSize;
            let height = 14;
            let x = global.screenWidth - len - spacing;
            let y = spacing + height + 7;
            text.lbtitle.draw(
                'Leaderboard', Math.round(x + len / 2) + 0.5,
                Math.round(y - 6) + 0.5,
                height + 4, color.guiwhite, 'center'
            );
            let i = 0;
            lb.data.forEach(entry => {
                drawBar(x, x + len, y + height / 2, height - 3 + config.graphical.barChunk, color.black);
                drawBar(x, x + len, y + height / 2, height - 3, color.grey);
                let shift = Math.min(1, entry.score / max);
                drawBar(x, x + len * shift, y + height / 2, height - 3.5, entry.barColor);
                // Leadboard name + score 
                text.leaderboard[i++].draw(
                    entry.label + ': ' + util.handleLargeNumber(Math.round(entry.score)),
                    x + len / 2, y + height / 2,
                    height - 5, color.guiwhite, 'center', true
                );
                // Mini-image
                let scale = height / entry.position.axis,
                    xx = x - 1.5 * height - scale * entry.position.middle.x * 0.707,
                    yy = y + 0.5 * height + scale * entry.position.middle.x * 0.707;
                drawEntity(xx, yy, entry.image, 1 / scale, 1, scale * scale / entry.image.size, -Math.PI / 4, true);
                // Move down
                y += vspacing + height;
            });
        }

        { // Draw upgrade menu
            upgradeMenu.set(0 + (global.canUpgrade || global.upgradeHover));
            let glide = upgradeMenu.get();
            global.clickables.upgrade.hide();
            if (gui.upgrades.length > 0) {
                global.canUpgrade = true;
                var getClassUpgradeKey = function (number) {
                    switch (number) {
                        case 0:
                            return 'y';
                        case 1:
                            return 'h';
                        case 2:
                            return 'u';
                        case 3:
                            return 'j';
                        case 4:
                            return 'i';
                        case 5:
                            return 'k';
                        case 6:
                            return 'o';
                        case 7:
                            return 'l';
                    }
                };
                let internalSpacing = 14;
                let len = alcoveSize / 2;
                let height = len;
                let x = glide * 2 * spacing - spacing;
                let xStart = x;
                let y = spacing;
                let xo = x;
                let xxx = 0;
                let yo = y;
                let ticker = 0;
                upgradeSpin += 0.01;
                let colorIndex = 10;
                let i = 0;
                gui.upgrades.forEach(function drawAnUpgrade(model) {
                    if (y > yo) yo = y;
                    xxx = x;
                    global.clickables.upgrade.place(i++, x * global.scaleGuiRatio, y * global.scaleGuiRatio, len * global.scaleGuiRatio, height * global.scaleGuiRatio);
                    // Draw box
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = getColor(colorIndex);
                    drawGuiRect(x, y, len, height);
                    ctx.globalAlpha = 0.1;
                    ctx.fillStyle = getColor(-10 + colorIndex++);
                    drawGuiRect(x, y, len, height * 0.6);
                    ctx.fillStyle = color.black;
                    drawGuiRect(x, y + height * 0.6, len, height * 0.4);
                    ctx.globalAlpha = 1;
                    // Find offset location with rotation
                    let picture = getEntityImageFromMockup(model, gui.color),
                        position = mockups[model].position,
                        scale = 0.6 * len / position.axis,
                        xx = x + 0.5 * len - scale * position.middle.x * Math.cos(upgradeSpin),
                        yy = y + 0.5 * height - scale * position.middle.x * Math.sin(upgradeSpin);
                    drawEntity(xx, yy, picture, 1, 1, scale / picture.size, upgradeSpin, true);
                    // Tank name
                    text.upgradeNames[i - 1].draw(
                        picture.name,
                        x + 0.9 * len / 2, y + height - 6,
                        height / 8 - 3, color.guiwhite, 'center'
                    );
                    // Upgrade key
                    text.upgradeKeys[i - 1].draw(
                        '[' + getClassUpgradeKey(ticker) + ']',
                        x + len - 4, y + height - 6,
                        height / 8 - 3, color.guiwhite, 'right'
                    );
                    ctx.strokeStyle = color.black;
                    ctx.globalAlpha = 1;
                    ctx.lineWidth = 3;
                    drawGuiRect(x, y, len, height, true); // Border
                    if (++ticker % 3 === 0) {
                        x = xStart;
                        y += height + internalSpacing;
                    } else {
                        x += glide * (len + internalSpacing);
                    }
                });
                // Draw box
                let h = 14,
                    msg = "Don't Upgrade",
                    m = measureText(msg, h - 3) + 10;
                let xx = xo + (xxx + len + internalSpacing - xo) / 2,
                    yy = yo + height + internalSpacing;
                drawBar(xx - m / 2, xx + m / 2, yy + h / 2, h + config.graphical.barChunk, color.black);
                drawBar(xx - m / 2, xx + m / 2, yy + h / 2, h, color.white);
                text.skipUpgrades.draw(msg, xx, yy + h / 2, h - 2, color.guiwhite, 'center', true);
                global.clickables.skipUpgrades.place(0, (xx - m / 2) * global.scaleGuiRatio, yy * global.scaleGuiRatio, m * global.scaleGuiRatio, h * global.scaleGuiRatio);
            } else {
                global.canUpgrade = false;
                global.clickables.upgrade.hide();
                global.clickables.skipUpgrades.hide();
            }
        }
        scaleGui(1 / global.scaleGuiRatio, true);
        metrics.lastrender = getNow();
    };
})();

const gameDrawDead = (() => {
    let text = {
        taunt: TextObj(),
        level: TextObj(),
        score: TextObj(),
        time: TextObj(),
        kills: TextObj(),
        death: TextObj(),
        playagain: TextObj(),
    };
    let getKills = () => {
        let finalKills = [Math.round(global.finalKills[0].get()), Math.round(global.finalKills[1].get()), Math.round(global.finalKills[2].get())];
        let b = finalKills[0] + 0.5 * finalKills[1] + 3 * finalKills[2];
        return ((b === 0) ? '🌼' :
            (b < 4) ? '🎯' :
                (b < 8) ? '💥' :
                    (b < 15) ? '💢' :
                        (b < 25) ? '🔥' :
                            (b < 50) ? '💣' :
                                (b < 75) ? '👺' :
                                    (b < 100) ? '🌶️' : '💯') +
            ((finalKills[0] || finalKills[1] || finalKills[2]) ?
                ' ' +
                ((finalKills[0]) ? finalKills[0] + ' kills' : '') +
                ((finalKills[0] && finalKills[1]) ? ' and ' : '') +
                ((finalKills[1]) ? finalKills[1] + ' assists' : '') +
                (((finalKills[0] || finalKills[1]) && finalKills[2]) ? ' and ' : '') +
                ((finalKills[2]) ? finalKills[2] + ' visitors defeated' : '') :
                ' A true pacifist') +
            '.';
    };
    let getDeath = () => {
        let txt = '';
        if (global.finalKillers.length) {
            txt = '🔪 Succumbed to';
            global.finalKillers.forEach(e => {
                txt += ' ' + util.addArticle(mockups[e].name) + ' and';
            });
            txt = txt.slice(0, -4) + '.';
        } else {
            txt += '🤷 Well that was kinda dumb huh';
        }
        return txt;
    };
    return () => {
        clearScreen(color.black, 0.25);
        let x = global.screenWidth / 2,
            y = global.screenHeight / 2 - 50;
        let picture = getEntityImageFromMockup(gui.type, gui.color),
            len = 140,
            position = mockups[gui.type].position,
            scale = len / position.axis,
            xx = global.screenWidth / 2 - scale * position.middle.x * 0.707,
            yy = global.screenHeight / 2 - 35 + scale * position.middle.x * 0.707;
        drawEntity(xx - 190 - len / 2, yy - 10, picture, 1.5, 1, 0.5 * scale / picture.realSize, -Math.PI / 4, true);
        text.taunt.draw(
            'lol you died', x, y - 80, 8, color.guiwhite, 'center'
        );
        text.level.draw(
            'Level ' + gui.__s.getLevel() + ' ' + mockups[gui.type].name,
            x - 170, y - 30, 24, color.guiwhite
        );
        text.score.draw(
            'Final score: ' + util.formatLargeNumber(Math.round(global.finalScore.get())),
            x - 170, y + 25, 50, color.guiwhite
        );
        text.time.draw(
            '⌚ Survived for ' + util.timeForHumans(Math.round(global.finalLifetime.get())) + '.',
            x - 170, y + 55, 16, color.guiwhite
        );
        text.kills.draw(
            getKills(), x - 170, y + 77, 16, color.guiwhite
        );
        text.death.draw(
            getDeath(), x - 170, y + 99, 16, color.guiwhite
        );
        text.playagain.draw(
            'Press enter to play again!', x, y + 125, 16, color.guiwhite, 'center'
        );
    };
})();

const gameDrawBeforeStart = (() => {
    let text = {
        connecting: TextObj(),
        message: TextObj(),
    };
    return () => {
        clearScreen(color.white, 0.5);
        text.connecting.draw('Connecting...', global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, 'center');
        text.message.draw(global.message, global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.lgreen, 'center');
    };
})();

const gameDrawDisconnected = (() => {
    let text = {
        disconnected: TextObj(),
        message: TextObj(),
    };
    return () => {
        clearScreen(mixColors(color.red, color.guiblack, 0.3), 0.25);
        text.disconnected.draw('(Press enter to reconnect)', global.screenWidth / 2, global.screenHeight / 2 - 30, 15, color.guiwhite, 'center');
        text.disconnected.draw('💀 Disconnected. 💀', global.screenWidth / 2, global.screenHeight / 2, 30, color.guiwhite, 'center');
        text.message.draw(global.message, global.screenWidth / 2, global.screenHeight / 2 + 30, 15, color.orange, 'center');
    };
})();

// The main function
function animloop() {
    global.scaleGuiRatio = Math.max(global.screenWidth, 16 * global.screenHeight / 9) / (1280 >= global.screenWidth ? 1280 : 1920 <= global.screenWidth ? 1920 : global.screenWidth);
    global.animLoopHandle = window.requestAnimFrame(animloop);
    player.renderv += (player.view - player.renderv) / 30;
    var ratio = (config.graphical.screenshotMode) ? 2 : getRatio();
    // Set the drawing style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.filter = 'none';
    if (global.started) {
        if (global.gameStart && !global.disconnected) {
            global.time = getNow();
            if (global.time - lastPing > 1000) { // Latency
                // Do ping.
                global.socket.ping(global.time);
                lastPing = global.time;
                // Do rendering speed.
                metrics.rendertime = renderTimes;
                renderTimes = 0;
                // Do update rate.
                metrics.updatetime = updateTimes;
                updateTimes = 0;
            }
            metrics.lag = global.time - player.time;
        }
        if (global.gameStart) {
            gameDraw(ratio, global.inGame);
        } else if (!global.disconnected) {
            gameDrawBeforeStart();
        }
        if (global.died) {
            gameDrawDead();
        }
        if (global.disconnected) {
            gameDrawDisconnected();
        }
    } else {
        switch (global.state) {
            case 2:
            case 0: {
              if(!document.getElementById('optOpenScreen').checked){
                clearScreen(color.guiblack);
                global.animations.logo = util.lerp(global.animations.logo, 1, 0.1);
                if (global.animations.enterToStartActivated) global.animations.enterToStart = util.lerp(global.animations.enterToStart, 1, 0.1);
                clearScreen(color.black, global.animations.logo);
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.globalAlpha = global.animations.logo;
                if (global.state == 2) {
                    ctx.font = "Bold " + (global.animations.logo * 30) + "px Ubuntu";
                    ctx.fillText("ERROR: Old version! Your version: " + global.version + ", Server version: " + global.serverVersion, global.screenWidth / 2, global.screenHeight / 2 - 100);
                    ctx.font = "Bold " + (global.animations.logo * 15) + "px Ubuntu";
                    ctx.fillText("Please do CTRL + F5 to reset your browser cache", global.screenWidth / 2, global.screenHeight / 2 - 140);
                };
                ctx.font = "Bold " + (global.animations.logo * 90) + "px Ubuntu";
                ctx.fillText("OpenArras", global.screenWidth / 2, global.screenHeight / 2);
                ctx.font = "Bold " + (global.animations.logo * 20) + "px Ubuntu";
                ctx.fillText("An opensource arras server everyone can work on, and have fun!", global.screenWidth / 2, global.screenHeight / 2 + (global.animations.logo * 50));
                ctx.fillText("Made by Winquacks and the creativity from all of you!", global.screenWidth / 2, global.screenHeight / 2 + (global.animations.logo * 90));
                ctx.font = "Bold 20px Ubuntu";
                if (global.animations.enterToStartActivated) {
                    ctx.globalAlpha = global.animations.enterToStart
                    ctx.fillText("(Press enter to continue)", global.screenWidth / 2, global.screenHeight / 2 + (global.animations.logo * 120));
                    ctx.globalAlpha /= 2;
                    ctx.fillText("(Disable this in the settings section of the options menu)", global.screenWidth / 2, global.screenHeight / 2 + 120 + 30);
                };
                ctx.globalAlpha = 1;
            }else{
                global.state = 1; // Switch to menu!
                util.restoreMenu();
                startGame(false);
                //return;
            }
            }
                break
        };
    };
    if (global.state == 1) {
        global.animations.menuFadeBlack = util.lerp(global.animations.menuFadeBlack, global.animations.menuFade, 0.1)
        clearScreen(color.guiblack, global.animations.menuFadeBlack * 0.25, 4);
        global.animations.menu = util.lerp(global.animations.menu, 0, 0.1, 4);
        clearScreen(color.guiwhite, global.animations.menu);
    };
    // Draw the game
}
animloop();
setTimeout(function () {
    global.animations.enterToStartActivated = true;
}, 3000);
setTimeout(function () {
    global.animations.loading = true;
    //let mockupUrl = `${global.server.secure||isSecureProtocol?"https":"http"}://${global.server.at}/mockups.json`
    let url = (global.secure ? (window.location.protocol + "//") : "http://") + global.server + "/versionInfo.json";
    util.pullJSON(url).then(data => {
        console.log(data);
        global.serverVersion = data.version;
        if (global.version != data.version) global.state = 2;
    });
}, 1000)    
