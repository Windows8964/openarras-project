/*jslint node: true */
/*jshint -W061 */
/*global goog, Map, let */
"use strict";

// General requires
require('google-closure-library');
goog.require('goog.structs.PriorityQueue');
goog.require('goog.structs.QuadTree');

// Import game settings.
const c = require('./config.json');

// Import utilities.
const util = require('./lib/util');
const ran = require('./lib/random');
const hshg = require('./lib/hshg');

//Randomize the tokens
if (c.RANDOMIZETOKENS === true) {
  for (let i = 0; i < c.TOKENS.length; i++) {
    c.TOKENS[i] = (Math.random().toString(16).substr(2));
    util.log(`[TOKENS] Token number ${i} is ${c.TOKENS[i]}`);
  }
}

// Let's get a cheaper array removal thing
Array.prototype.remove = index => {
    if(index === this.length - 1){
        return this.pop();
    } else {
        let r = this[index];
        this[index] = this.pop();
        return r;
    }
};

// Set up room.
global.fps = "Unknown";
var roomSpeed = c.gameSpeed;
const room = {
    lastCycle: undefined,
    cycleSpeed: 1000 / roomSpeed / 30,
    width: c.WIDTH,
    height: c.HEIGHT,
    setup: c.ROOM_SETUP,
    xgrid: c.ROOM_SETUP[0].length, 
    ygrid: c.ROOM_SETUP.length,
    gameMode: c.MODE,
    skillBoost: c.SKILL_BOOST,
    scale: {
        square: c.WIDTH * c.HEIGHT / 100000000,
        linear: Math.sqrt(c.WIDTH * c.HEIGHT / 100000000),
    },
    maxFood: c.MAX_FOOD,
    isInRoom: location => {
        return location.x >= 0 && location.x <= c.WIDTH && location.y >= 0 && location.y <= c.HEIGHT
    },    
    topPlayerID: -1,
};
    room.findType = type => {
        let output = [];
        let j = 0;
        for(let row of room.setup){
            let i = 0;
            for(let cell of row){
                if (cell === type) { 
                    output.push({ x: (i + 0.5) * room.width / room.xgrid, y: (j + 0.5) * room.height / room.ygrid, });
                }
                i++;
            };
            j++;
        };
        room[type] = output;
    };
    room.findType('nest');
    room.findType('norm');
    room.findType('bas1');
    room.findType('bas2');
    room.findType('bas3');
    room.findType('bas4');
    room.findType('roid');
    room.findType('rock');
    room.random = () => {
        return {
            x: ran.irandom(room.width),
            y: ran.irandom(room.height),
        };
    };
    room.randomType = type => {
        let selection = room[type][ran.irandom(room[type].length-1)];
        return {
            x: ran.irandom(0.5*room.width/room.xgrid) * ran.choose([-1, 1]) + selection.x,
            y: ran.irandom(0.5*room.height/room.ygrid) * ran.choose([-1, 1])  + selection.y,
        };
    };
    room.gauss = clustering => {
        let output;
        do {
            output = {
                x: ran.gauss(room.width/2, room.height/clustering),
                y: ran.gauss(room.width/2, room.height/clustering),
            };
        } while (!room.isInRoom(output));
    };
    room.gaussInverse = clustering => {
        let output;
        do {
            output = {
                x: ran.gaussInverse(0, room.width, clustering),
                y: ran.gaussInverse(0, room.height, clustering),
            };
        } while (!room.isInRoom(output));
        return output;
    };
    room.gaussRing = (radius, clustering) => {
        let output;
        do {
            output = ran.gaussRing(room.width * radius, clustering);
            output = {
               x: output.x + room.width/2,
               y: output.y + room.height/2, 
            };
        } while (!room.isInRoom(output));
        return output;
    };
    room.isIn = (type, location) => {
        if (room.isInRoom(location)) {
            let a = Math.floor(location.y * room.ygrid / room.height);
            let b = Math.floor(location.x * room.xgrid / room.width);
            return type === room.setup[a][b];
        } else {
            return false;
        }
    };
    room.isInNorm = location => {
        if (room.isInRoom(location)) {
            let a = Math.floor(location.y * room.ygrid / room.height);
            let b = Math.floor(location.x * room.xgrid / room.width);
            let v = room.setup[a][b];
            return v !== 'nest';
        } else {
            return false;
        }
    };
    room.gaussType = (type, clustering) => {
        let selection = room[type][ran.irandom(room[type].length-1)];
        let location = {};
        do {
            location = {
                x: ran.gauss(selection.x, room.width/room.xgrid/clustering),
                y: ran.gauss(selection.y, room.height/room.ygrid/clustering),
            };
        } while (!room.isIn(type, location));
        return location;
    };
util.log(room.width + ' x ' + room.height + ' room initalized.  Max food: ' + room.maxFood);

// Define a vector
class Vector {
    constructor(x, y) { //Vector constructor.
        this.x = x;
        this.y = y;
    }

    update() {
        this.len = this.length;
        this.dir = this.direction;
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    get direction() {
        return Math.atan2(this.y, this.x);
    }
}
function nullVector(v) {
    v.x = 0; v.y = 0; //this guy's useful
}

// Get class definitions and index them
var Class = (() => {
    let def = require('./lib/definitions'),
        i = 0;
    for (let k in def) {
        if (!def.hasOwnProperty(k)) continue;
        def[k].index = i++;
    }
    return def;
})();
//Thank you 3love <3
function classFromIndex(objIndex) {
  let def = require('./lib/definitions'),
      i = 0;
  for (let k in def) {
      if (!def.hasOwnProperty(k)) continue;
      def[k].index = i++;
      if (def[k].index == (objIndex ? objIndex : new Error('No entity provided'))) return def[k];
  }
return undefined;
}
// Define IOs (AI)
function nearest(array, location, test = () => { return true; }) {
    let list = new goog.structs.PriorityQueue();
    let d;
    if (!array.length) {
        return undefined;
    }
    for(let instance of array) {
        d = Math.pow(instance.x - location.x, 2) + Math.pow(instance.y - location.y, 2);
        if (test(instance, d)) {
            list.enqueue(d, instance);
        }
    };
    return list.dequeue();
}
function timeOfImpact(p, v, s) { 
    // Requires relative position and velocity to aiming point
    let a = s * s - (v.x * v.x + v.y * v.y);
    let b = p.x * v.x + p.y * v.y;
    let c = p.x * p.x + p.y * p.y;

    let d = b * b + a * c;

    let t = 0;
    if (d >= 0) {
        t = Math.max(0, (b + Math.sqrt(d)) / a);
    }

    return t*0.9;
}
const ioTypes = {};
class IO {
    constructor(body) {
        this.body = body;
        this.acceptsFromTop = true;
    }

    think() {
        return {
            target: null,
            goal: null,
            fire: null,
            main: null,
            alt: null,
            power: null,
        };
    }
}
ioTypes.doNothing = class extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
    }

    think() {
        return {
            goal: {
                x: this.body.x,
                y: this.body.y,
            },
            main: false,
            alt: false,
            fire: false,
        };
    }
}
ioTypes.moveInCircles = class extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
        this.timer = 30;
        this.goal = {
            x: this.body.x + 10*Math.cos(-this.body.facing),
            y: this.body.y + 10*Math.sin(-this.body.facing),
        };
    }

    think() {
        if (!(this.timer--)) {
            this.timer = 30;
            this.goal = {
                x: this.body.x + 10*Math.cos(-this.body.facing),
                y: this.body.y + 10*Math.sin(-this.body.facing),
            };
        }
        return { goal: this.goal };
    }
}
let n = 0
ioTypes.listenToPlayer = class extends IO {
    constructor(b, p) {
        super(b);
        this.player = p;
        this.acceptsFromTop = false;
    }

    // THE PLAYER MUST HAVE A VALID COMMAND AND TARGET OBJECT
    
    think() {
        let targ = {
            x: this.player.target.x,
            y: this.player.target.y,
        };
        if (this.player.command.autospin) {
            let kk = Math.atan2(this.body.control.target.y, this.body.control.target.x) + 0.02;
            targ = {
                x: 100 * Math.cos(kk),
                y: 100 * Math.sin(kk),
            };
        }
        if (!this.player.godmode&&this.body.invuln) {
            if (this.player.command.right || this.player.command.left || this.player.command.up || this.player.command.down || this.player.command.lmb) {
                this.body.invuln = false;
            }
        }
        this.body.autoOverride = this.player.command.override;
        return {         
            target: targ,
            goal: {
                x: this.body.x + this.player.command.right - this.player.command.left,
                y: this.body.y + this.player.command.down - this.player.command.up,
            },
            fire: this.player.command.lmb || this.player.command.autofire,
            main: this.player.command.lmb || this.player.command.autospin || this.player.command.autofire,
            alt: this.player.command.rmb,
        };
    }
}
ioTypes.mapTargetToGoal = class extends IO {
    constructor(b) {
        super(b);
    }

    think(input) {
        if (input.main || input.alt) {
            return {         
                goal: {
                    x: input.target.x + this.body.x,
                    y: input.target.y + this.body.y,
                },
                power: 1,
            };
        }
    }
}
ioTypes.boomerang = class extends IO {
    constructor(b) {
        super(b);
        this.r = 0;
        this.b = b;
        this.m = b.master;
        this.turnover = false;
        let len = 10 * util.getDistance({x: 0, y:0}, b.master.control.target);
        this.myGoal = {
            x: 3 * b.master.control.target.x + b.master.x,
            y: 3 * b.master.control.target.y + b.master.y,
        };
    }
    think(input) {
        if (this.b.range > this.r) this.r = this.b.range;
        let t = 1; //1 - Math.sin(2 * Math.PI * this.b.range / this.r) || 1;
        if (!this.turnover) {
            if (this.r && this.b.range < this.r * 0.5) { this.turnover = true; }
            return {
                goal: this.myGoal,
                power: t,
            };
        } else {
            return {
                goal: {
                    x: this.m.x,
                    y: this.m.y,
                },
                power: t,
            };
        }
    }
}
ioTypes.goToMasterTarget = class extends IO {
    constructor(body) {
        super(body);
        this.myGoal = {
            x: body.master.control.target.x + body.master.x,
            y: body.master.control.target.y + body.master.y,
        };
        this.countdown = 5;
    }

    think() {
        if (this.countdown) {
            if (util.getDistance(this.body, this.myGoal) < 1) { this.countdown--; }
            return {
                goal: {
                    x: this.myGoal.x,
                    y: this.myGoal.y,
                },
            };
        }
    }
}
ioTypes.canRepel = class extends IO {
    constructor(b) {
        super(b);
    }
    
    think(input) {
        if (input.alt && input.target) {
            return {                
                target: {
                    x: -input.target.x,
                    y: -input.target.y,
                },  
                main: true,
            };
        }
    }
}
ioTypes.alwaysFire = class extends IO {
    constructor(body) {
        super(body);
    }

    think() {
        return {
            fire: true,
        };
    }
}
ioTypes.targetSelf = class extends IO {
    constructor(body) {
        super(body);
    }

    think() {
        return {
            main: true,
            target: { x: 0, y: 0, },
        };
    }
}
ioTypes.mapAltToFire = class extends IO {
    constructor(body) {
        super(body);
    }

    think(input) {
        if (input.alt) {
            return {
                fire: true,
            };
        }
    }
}
ioTypes.onlyAcceptInArc = class extends IO {
    constructor(body) {
        super(body);
    }

    think(input) {
        if (input.target && this.body.firingArc != null) {
            if (Math.abs(util.angleDifference(Math.atan2(input.target.y, input.target.x), this.body.firingArc[0])) >= this.body.firingArc[1]) {
                return {
                    fire: false,
                    alt: false,
                    main: false,
                };
            }
        }
    }
}
ioTypes.Wanderlust = class extends IO {
    constructor(b) {
        super(b);
        this.anyInRange //this presets what anyInRange is so that we can use it later in the code
        this.wanderLoc
        if (this.wanderLoc == undefined) {
            this.wanderLoc = [null]
        } // if this is the first time its being run, make the bot create a wander location to start the process
    }
  
    CheckArea(range) {
        // This makes sure it checks around the controlled item
        let m = {
                x: this.body.x,
                y: this.body.y,
            },
            mm = {
                x: this.body.master.master.x,
                y: this.body.master.master.y,
            },
            mostDangerous = 0,
            sqrRange = range * range,
            keepTarget = false;
        // Checks everything there
        let out = entities.map(e => {
                // makes sure it doesn't sense dumb stuff like itself for the scan
            if (e.health.amount > 0) {
                if (!e.invuln) {
                    if (e.master.master.team !== this.body.master.master.team) {
                        if (e.master.master.team !== -101) {
                            if (e.type === 'tank' || e.type === 'crasher' || (!this.body.aiSettings.shapefriend && e.type === 'food')) {
                                if (Math.abs(e.x - m.x) < range && Math.abs(e.y - m.y) < range) {
                                                if (!this.body.aiSettings.blind || (Math.abs(e.x - mm.x) < range && Math.abs(e.y - mm.y) < range)) return e;
                                            }
                                        }
                                    }
                                }
                            }
                        }
            })
            .filter((e) => {
                return e;
            })
        if (!out.length) {
            return 'NoneInRange'
        } else {
            return 'ItemsInRange'
        }
    }

    think(input) {
        this.anyInRange = this.CheckArea(this.body.fov / 2.3) //checks if anything is around it that it should focus on instead, and then returns to run or not based on that
        if (this.anyInRange == 'NoneInRange') {
          let walkamount = 100
            if ( //checks multiple things that it should remake a location for if they are true
                this.wanderLoc[0] == null ||
                //make a location if there is no location
                ((this.wanderLoc[0] <= this.body.x + walkamount && this.wanderLoc[0] >= this.body.x - walkamount) && (this.wanderLoc[1] <= this.body.y + walkamount && this.wanderLoc[1] >= this.body.y - walkamount)) ||
                // make a location if the bot arrived at the current location or at least close enough to it
                (this.wanderLoc[0] > c.WIDTH || this.wanderLoc[1] > c.HEIGHT || this.wanderLoc[0] < 0 || this.wanderLoc[1] < 0) ||
                //remake a location if the current one is out of bounds
                (this.wanderLoc[2] >= 30)
                //remake a location if it's been a while, so that it doesn't get caught on walls for eternity and stuff
            ) {
                this.wanderLoc = [ //creates a random location within 500 units of it in any direction, then resets what iteration it is for timing purposes
                    this.body.x + ((Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 2000)+750),
                    this.body.y + ((Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 2000)+750),
                ]
            } else {
                if(this.wanderLoc[2]==undefined){this.wanderLoc[2] = 0}else{this.wanderLoc[2] += 1}
                if(!this.wanderLoc[0]) this.wanderLoc[0] = this.body.x + ((Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 2000)+750)
                if(!this.wanderLoc[1]) this.wanderLoc[1] = this.body.y + ((Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 2000)+750)
            } //if the conditions for a new location aren't met, continue towards the current goal and increase the time spent
            return {
                goal: { //go to the set location
                    x: this.wanderLoc[0],
                    y: this.wanderLoc[1],
                },
                target: { //point the direction of the set location
                    x: -this.body.x + this.wanderLoc[0],
                    y: -this.body.y + this.wanderLoc[1],
                },
            };
        }
    }
}
ioTypes.nearestDifferentMaster = class extends IO {
  constructor(body) {
    super(body);
    this.targetLock = undefined;
    this.tick = ran.irandom(30);
    this.lead = 0;
    this.validTargets = this.buildList(body.fov);
    this.oldHealth = body.health.display();
  }

  buildList(range) {
    // Establish whom we judge in reference to
    let m = {
        x: this.body.x,
        y: this.body.y,
      },
      mm = {
        x: this.body.master.master.x,
        y: this.body.master.master.y,
      },
      mostDangerous = 0,
      sqrRange = range * range,
      keepTarget = false;
    // Filter through everybody...
    let out = entities.map(e => {
      // Only look at those within our view, and our parent's view, not dead, not our kind, not a bullet/trap/block etc
      if (e.health.amount > 0) {
        if (!e.invuln) {
          if (e.master.master.team !== this.body.master.master.team) {
            if (e.master.master.team !== -101) {
              if (e.type === 'tank' || e.type === 'crasher' || e.type === 'miniboss' || (!this.body.aiSettings.shapefriend && e.type === 'food')) {
                if (Math.abs(e.x - m.x) < range && Math.abs(e.y - m.y) < range) {
                  if (!this.body.aiSettings.blind || (Math.abs(e.x - mm.x) < range && Math.abs(e.y - mm.y) < range)) return e;
                }
              }
            }
          }
        }
      }
    }).filter((e) => {
      return e;
    });

    if (!out.length) return [];

    out = out.map((e) => {
      // Only look at those within range and arc (more expensive, so we only do it on the few)
      let yaboi = false;
      if (Math.pow(this.body.x - e.x, 2) + Math.pow(this.body.y - e.y, 2) < sqrRange) {
        if (this.body.firingArc == null || this.body.aiSettings.view360) {
          yaboi = true;
        } else if (Math.abs(util.angleDifference(util.getDirection(this.body, e), this.body.firingArc[0])) < this.body.firingArc[1]) yaboi = true;
      }
      if (yaboi) {
        mostDangerous = Math.max(e.dangerValue, mostDangerous);
        return e;
      }
    }).filter((e) => {
      // Only return the highest tier of danger
      if (e != null) {
        if (this.body.aiSettings.farm || e.dangerValue === mostDangerous) {
          if (this.targetLock) {
            if (e.id === this.targetLock.id) keepTarget = true;
          }
          return e;
        }
      }
    });
    // Reset target if it's not in there
    if (!keepTarget) this.targetLock = undefined;
    return out;
  }

  think(input) {
    // Override target lock upon other commands
    if (input.main || input.alt || this.body.master.autoOverride) {
      this.targetLock = undefined;
      return {};
    }
    // Otherwise, consider how fast we can either move to ram it or shoot at a potiential target.
    let tracking = this.body.topSpeed,
      range = this.body.fov;
    // Use whether we have functional guns to decide
    for (let i = 0; i < this.body.guns.length; i++) {
      if (this.body.guns[i].canShoot && !this.body.aiSettings.skynet) {
        let v = this.body.guns[i].getTracking();
        tracking = v.speed;
        if (true) range = 640 * this.body.FOV;
        else range = Math.min(range, (v.speed || 1) * (v.range || 90));
        break;
      }
    }
    // Check if my target's alive
    if (this.targetLock) {
      if (this.targetLock.health.amount <= 0) {
        this.targetLock = undefined;
        this.tick = 100;
      }
    }
    // Think damn hard
    if (this.tick++ > 15 * roomSpeed) {
      this.tick = 0;
      this.validTargets = this.buildList(range);
      // Ditch our old target if it's invalid
      if (this.targetLock && this.validTargets.indexOf(this.targetLock) === -1) {
        this.targetLock = undefined;
      }
      // Lock new target if we still don't have one.
      if (this.targetLock == null && this.validTargets.length) {
        this.targetLock = (this.validTargets.length === 1) ? this.validTargets[0] : nearest(this.validTargets, {
          x: this.body.x,
          y: this.body.y
        });
        this.tick = -90;
      }
    }
    // Lock onto whoever's shooting me.
    let damageRef = (this.body.bond == null) ? this.body : this.body.bond;
    if (damageRef.collisionArray.length && damageRef.health.display() < this.oldHealth) {
        this.oldHealth = damageRef.health.display();
        if (this.validTargets.indexOf(damageRef.collisionArray[0]) === -1) {
            this.targetLock = (damageRef.collisionArray[0].master.id === -1) ? damageRef.collisionArray[0].source : damageRef.collisionArray[0].master;
        }
    }
    // Consider how fast it's moving and shoot at it
    if (this.targetLock != null) {
      let radial = this.targetLock.velocity;
      let diff = {
        x: this.targetLock.x - this.body.x,
        y: this.targetLock.y - this.body.y,
      };
      /// Refresh lead time
      if (this.tick % 4 === 0) {
        this.lead = 0;
        // Find lead time (or don't)
        if (!this.body.aiSettings.chase) {
          let toi = timeOfImpact(diff, radial, tracking);
          this.lead = toi;
        }
      }
      // And return our aim
      return {
        target: {
          x: diff.x + this.lead * radial.x,
          y: diff.y + this.lead * radial.y,
        },
        fire: true,
        main: true,
      };
    }
    return {};
  }
}
ioTypes.avoid = class extends IO {
    constructor(body) {
        super(body);
    }

    think(input) {
        let masterId = this.body.master.id;
        let range = this.body.size * this.body.size * 100 ;
        this.avoid = nearest( 
            entities, 
            { x: this.body.x, y: this.body.y },
            function(test, sqrdst) { 
                return (
                    test.master.id !== masterId && 
                    (test.type === 'bullet' || test.type === 'drone' || test.type === 'swarm' || test.type === 'trap' || test.type === 'block') &&
                    sqrdst < range
                ); }
        );
        // Aim at that target
        if (this.avoid != null) { 
            // Consider how fast it's moving.
            let delt = new Vector(this.body.velocity.x - this.avoid.velocity.x, this.body.velocity.y - this.avoid.velocity.y);
            let diff = new Vector(this.avoid.x - this.body.x, this.avoid.y - this.body.y);            
            let comp = (delt.x * diff. x + delt.y * diff.y) / delt.length / diff.length;
            let goal = {};
            if (comp > 0) {
                if (input.goal) {
                    let goalDist = Math.sqrt(range / (input.goal.x * input.goal.x + input.goal.y * input.goal.y));
                    goal = {
                        x: input.goal.x * goalDist - diff.x * comp,
                        y: input.goal.y * goalDist - diff.y * comp,
                    };
                } else {
                    goal = {
                        x: -diff.x * comp,
                        y: -diff.y * comp,
                    };
                }
                return goal;
            }
        }
    }
}
ioTypes.minion = class extends IO {
    constructor(body) {
        super(body);
        this.turnwise = 1;
    }

    think(input) {
        if (this.body.aiSettings.reverseDirection && ran.chance(0.005)) { this.turnwise = -1 * this.turnwise; }
        if (input.target != null && (input.alt || input.main)) {
            let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE);
            let leash = 60 * sizeFactor;
            let orbit = 120 * sizeFactor;
            let repel = 135 * sizeFactor;
            let goal;
            let power = 1;
            let target = new Vector(input.target.x, input.target.y);
            if (input.alt) {
                // Leash
                if (target.length < leash) {
                    goal = {
                        x: this.body.x + target.x,
                        y: this.body.y + target.y,
                    };
                // Spiral repel
                } else if (target.length < repel) {
                    let dir = -this.turnwise * target.direction + Math.PI / 5;
                    goal = {
                        x: this.body.x + Math.cos(dir),
                        y: this.body.y + Math.sin(dir),
                    };
                // Free repel
                } else {
                    goal = {
                        x: this.body.x - target.x,
                        y: this.body.y - target.y,
                    };
                }
            } else if (input.main) {
                // Orbit point
                let dir = this.turnwise * target.direction + 0.01;
                goal = {
                    x: this.body.x + target.x - orbit * Math.cos(dir),
                    y: this.body.y + target.y - orbit * Math.sin(dir), 
                };
                if (Math.abs(target.length - orbit) < this.body.size * 2) {
                    power = 0.7;
                }
            }
            return { 
                goal: goal,
                power: power,
            };
        }
    }
}
ioTypes.swamper = class extends IO {
    constructor(body) {
        super(body);
        this.turnwise = 1;
    }

    think(input) {
        if (input.target != null && (input.alt || input.main)) {
            let sizeFactor = Math.sqrt(this.body.master.size / this.body.master.SIZE);
            let orbit = 220 * sizeFactor;
            let goal;
            let power = 5;
            let target = new Vector(input.target.x, input.target.y);
            let dir = target.direction + power;
            if (input.alt) {
              orbit /= 3
              this.body.range -= 1
            } else if (input.main) {
                if (Math.abs(target.length - orbit) < this.body.size * 2) {
                    power = 0.7;
                }
            }
            // Orbit point
                goal = {
                    x: this.body.x + target.x - orbit * Math.cos(dir),
                    y: this.body.y + target.y - orbit * Math.sin(dir), 
                };
            return { 
                goal: goal,
                power: power,
            };
        }
    }
}
ioTypes.hangOutNearMaster = class extends IO {
    constructor(body) {
        super(body);
        this.acceptsFromTop = false;
        this.orbit = 30;
        this.currentGoal = { x: this.body.source.x, y: this.body.source.y, };
        this.timer = 0;
    }
    think(input) {
        if (this.body.source != this.body) {
            let bound1 = this.orbit * 0.8 + this.body.source.size + this.body.size;
            let bound2 = this.orbit * 1.5 + this.body.source.size + this.body.size;
            let dist = util.getDistance(this.body, this.body.source) + Math.PI / 8; 
            let output = {
                target: {
                    x: this.body.velocity.x,
                    y: this.body.velocity.y,
                },
                goal: this.currentGoal,
                power: undefined,
            };        
            // Set a goal
            if (dist > bound2 || this.timer > 30) {
                this.timer = 0;

                let dir = util.getDirection(this.body, this.body.source) + Math.PI * ran.random(0.5); 
                let len = ran.randomRange(bound1, bound2);
                let x = this.body.source.x - len * Math.cos(dir);
                let y = this.body.source.y - len * Math.sin(dir);
                this.currentGoal = {
                    x: x,
                    y: y,
                };        
            }
            if (dist < bound2) {
                output.power = 0.15;
                if (ran.chance(0.3)) { this.timer++; }
            }
            return output;
        }
    }
}
ioTypes.spin = class extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
    
    think(input) {
        this.a += 0.05;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
ioTypes.fastspin = class extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
    
    think(input) {
        this.a += 0.072;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
ioTypes.reversespin = class extends IO {
    constructor(b) {
        super(b);
        this.a = 0;
    }
    
    think(input) {
        this.a -= 0.05;
        let offset = 0;
        if (this.body.bond != null) {
            offset = this.body.bound.angle;
        }
        return {                
            target: {
                x: Math.cos(this.a + offset),
                y: Math.sin(this.a + offset),
            },  
            main: true,
        };        
    }
}
ioTypes.dontTurn = class extends IO {
    constructor(b) {
        super(b);
    }
    
    think(input) {
        return {
            target: {
                x: 1,
                y: 0,
            },  
            main: true,
        };        
    }
}
ioTypes.fleeAtLowHealth = class extends IO {
    constructor(b) {
        super(b);
        this.fear = util.clamp(ran.gauss(0.7, 0.15), 0.1, 0.9);
    }
    
    think(input) {
        if (input.fire && input.target != null && this.body.health.amount < this.body.health.max * this.fear) {
            return {
                goal: {
                    x: this.body.x - input.target.x,
                    y: this.body.y - input.target.y,
                },
            };
        }
    }

}

/***** ENTITIES *****/
// Define skills
const skcnv = {// yoo Ive been looking for this lol
    rld: 0,
    pen: 1,
    str: 2,
    dam: 3,
    spd: 4,

    shi: 5,
    atk: 6,
    hlt: 7,
    rgn: 8,
    mob: 9,
};
const levelers = [
    1,  2,  3,  4,  5,  6,  7,  8,  9,  10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 38, 40, 42, 44,
];
class Skill {
    constructor(inital = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) { // Just skill stuff. 
        this.raw = inital;
        this.caps = [];
        this.setCaps([
            c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, 
            c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL, c.MAX_SKILL
        ]);
        this.name = [
            'Reload',
            'Bullet Penetration',
            'Bullet Health',
            'Bullet Damage',
            'Bullet Speed',
            'Shield Capacity',
            'Body Damage',
            'Max Health',
            'Shield Regeneration',
            'Movement Speed',
        ];
        this.atk = 0;
        this.hlt = 0;
        this.spd = 0;
        this.str = 0;
        this.pen = 0;
        this.dam = 0;
        this.rld = 0;
        this.mob = 0;
        this.rgn = 0;
        this.shi = 0;
        this.rst = 0;
        this.brst = 0;
        this.ghost = 0;
        this.acl = 0;

        this.reset();        
    }

    reset() {
        this.points = 0;
        this.score = 0;
        this.deduction = 0;
        this.level = 0;
        this.canUpgrade = false;
        this.update();
        this.maintain();
    }

    update() {
        let curve = (() => {
            function make(x) { return Math.log(4*x + 1) / Math.log(5); }
            let a = [];
            for (let i=0; i<c.MAX_SKILL*2; i++) { a.push(make(i/c.MAX_SKILL)); }
            // The actual lookup function
            return x => { return a[x * c.MAX_SKILL]; };
        })();
        function apply(f, x) { return (x<0) ? 1 / (1 - x * f) : f * x + 1; }
        for (let i=0; i<10; i++) {
            if (this.raw[i] > this.caps[i]) {
                this.points += this.raw[i] - this.caps[i];
                this.raw[i] = this.caps[i];
            }
        }
        let attrib = [];
        for (let i=0; i<5; i++) { for (let j=0; j<2; j+=1) {
            attrib[i + 5*j] = curve(
                (
                    this.raw[i + 5*j] + 
                    this.bleed(i, j)
                ) / c.MAX_SKILL);
        } }
        this.rld = Math.pow(0.5, attrib[skcnv.rld]);
        this.pen = apply(2.5, attrib[skcnv.pen]);
        this.str = apply(3, attrib[skcnv.str]);
        this.dam = apply(3, attrib[skcnv.dam]);
        this.spd = 0.5 + apply(1.5, attrib[skcnv.spd]);

        this.acl = apply(0.5, attrib[skcnv.rld]);
        
        this.rst = 0.5 * attrib[skcnv.str] + 2.5 * attrib[skcnv.pen];
        this.ghost = attrib[skcnv.pen];
        
        this.shi = apply(0.75, attrib[skcnv.shi]);
        this.atk = apply(1, attrib[skcnv.atk]);
        this.hlt = apply(0.5, attrib[skcnv.hlt]);
        this.mob = apply(0.8, attrib[skcnv.mob]); 
        this.rgn = apply(25, attrib[skcnv.rgn]);

        this.brst = 0.3 * (0.5 * attrib[skcnv.atk] + 0.5 * attrib[skcnv.hlt] + attrib[skcnv.rgn]);
    }

    set(thing) {
        this.raw[0] = thing[0];
        this.raw[1] = thing[1];
        this.raw[2] = thing[2];
        this.raw[3] = thing[3];
        this.raw[4] = thing[4];
        this.raw[5] = thing[5];
        this.raw[6] = thing[6];
        this.raw[7] = thing[7];
        this.raw[8] = thing[8];
        this.raw[9] = thing[9];
        this.update();
    }

    setCaps(thing) {
        this.caps[0] = thing[0];
        this.caps[1] = thing[1];
        this.caps[2] = thing[2];
        this.caps[3] = thing[3];
        this.caps[4] = thing[4];
        this.caps[5] = thing[5];
        this.caps[6] = thing[6];
        this.caps[7] = thing[7];
        this.caps[8] = thing[8];
        this.caps[9] = thing[9];
        this.update();
    }

    maintain() {
        if (this.level < c.SKILL_CAP) {
            if (this.score - this.deduction >= this.levelScore) {
                this.deduction += this.levelScore;
                this.level += 1;
                this.points += c.SKILL_PER_LV;
                if (this.level == c.TIER_1 || this.level == c.TIER_2 || this.level == c.TIER_3) {
                    this.canUpgrade = true;
                }
                this.update();
                return true;
            }
        }
        return false;
    }

    get levelScore() {
        return Math.ceil(1.8 * Math.pow(this.level + 1, 1.8) - 2 * this.level + 1);
    }

    get progress() {
        return (this.levelScore) ? (this.score - this.deduction) / this.levelScore : 0;
    }

    get levelPoints() {
        if (levelers.findIndex(e => { return e === this.level; }) != -1) { return 1; } return 0;
        
    }

    cap(skill, real = false) {
        if (!real && this.level < c.SKILL_SOFT_CAP) {
            return Math.round(this.caps[skcnv[skill]] * c.SOFT_MAX_SKILL);
        } 
        return this.caps[skcnv[skill]];
    }

    bleed(i, j) {
        let a = ((i + 2) % 5) + 5*j,
            b = ((i + ((j===1) ? 1 : 4)) % 5) + 5*j;        
        let value = 0;   
        let denom = Math.max(c.MAX_SKILL, this.caps[i + 5*j]);
        value += (1 - Math.pow(this.raw[a] / denom - 1, 2)) * this.raw[a] * c.SKILL_LEAK;
        value -= Math.pow(this.raw[b] / denom, 2) * this.raw[b] * c.SKILL_LEAK ;

        return value;
    }

    upgrade(stat) {
        if (this.points>=1 && this.amount(stat) < this.cap(stat)) {
            this.change(stat, 1);
            this.points -= 1;
            return true;
        }
        return false;
    }

    title(stat) {
        return this.name[skcnv[stat]];
    }

    /*
    let i = skcnv[skill] % 5,
        j = (skcnv[skill] - i) / 5;
    let roundvalue = Math.round(this.bleed(i, j) * 10);
    let string = '';
    if (roundvalue > 0) { string += '+' + roundvalue + '%'; }
    if (roundvalue < 0) { string += '-' + roundvalue + '%'; }

    return string;
    */

    amount(skill) {
        return this.raw[skcnv[skill]];
    }

    change(skill, levels) {
        this.raw[skcnv[skill]] += levels;
        this.update();
    }
}

const lazyRealSizes = (() => {
    let o = [1, 1, 1]; 
    for (var i=3; i<16; i++) {
        // We say that the real size of a 0-gon, 1-gon, 2-gon is one, then push the real sizes of triangles, squares, etc...
        o.push(
            Math.sqrt((2 * Math.PI / i) * (1 / Math.sin(2 * Math.PI / i)))
        );
    }
    return o;
})();

// Define how guns work
class Gun {
    constructor(body, info) {
        this.lastShot = {
            time: 0,
            power: 0,
        };
        this.body = body;
        this.master = body.source;
        this.label = '';
        this.controllers = [];
        this.children = [];
        this.control = {
            target: new Vector(0, 0),
            goal: new Vector(0, 0),
            main: false,
            alt: false,
            fire: false,
        };        
        this.canShoot = false;
        if (info.PROPERTIES != null && info.PROPERTIES.TYPE != null) {
            this.canShoot = true;
            this.label = (info.PROPERTIES.LABEL == null) ?
                '' : info.PROPERTIES.LABEL;
            if (Array.isArray(info.PROPERTIES.TYPE)) { // This is to be nicer about our definitions
                this.bulletTypes = info.PROPERTIES.TYPE;
                this.natural = info.PROPERTIES.TYPE.BODY;
            } else {
                this.bulletTypes = [info.PROPERTIES.TYPE];
            }
            // Pre-load bullet definitions so we don't have to recalculate them every shot
            let natural = {};
            function setNatural(type) {    
                if (type.PARENT != null) { // Make sure we load from the parents first
                    for (let i=0; i<type.PARENT.length; i++) {
                        setNatural(type.PARENT[i]);
                    }
                }
                if (type.BODY != null) { // Get values if they exist
                    for (let index in type.BODY) {
                        natural[index] = type.BODY[index];
                    }
                }
              }
            for(let type of this.bulletTypes){
              setNatural(type)
            };
            this.natural = natural; // Save it
            if (info.PROPERTIES.GUN_CONTROLLERS != null) { 
                let toAdd = [];
                let self = this;
                for(let ioName of info.PROPERTIES.GUN_CONTROLLERS){
                  toAdd.push(new ioTypes[ioName](self));
                  this.controllers = toAdd.concat(this.controllers);
                }
            }
            this.autofire = (info.PROPERTIES.AUTOFIRE == null) ?
                false : info.PROPERTIES.AUTOFIRE;
            this.altFire = (info.PROPERTIES.ALT_FIRE == null) ?
                false : info.PROPERTIES.ALT_FIRE;
            this.settings = (info.PROPERTIES.SHOOT_SETTINGS == null) ?
                [] : info.PROPERTIES.SHOOT_SETTINGS;
            this.calculator = (info.PROPERTIES.STAT_CALCULATOR == null) ?
                'default' : info.PROPERTIES.STAT_CALCULATOR;
            this.waitToCycle = (info.PROPERTIES.WAIT_TO_CYCLE == null) ?
                false : info.PROPERTIES.WAIT_TO_CYCLE;
            this.bulletStats = (info.PROPERTIES.BULLET_STATS == null || info.PROPERTIES.BULLET_STATS == 'master') ?
                'master' : new Skill(info.PROPERTIES.BULLET_STATS);
            this.countsOwnKids = (info.PROPERTIES.MAX_CHILDREN == null) ?
                false : info.PROPERTIES.MAX_CHILDREN;
            this.syncsSkills = (info.PROPERTIES.SYNCS_SKILLS == null) ?
                false : info.PROPERTIES.SYNCS_SKILLS;
            this.negRecoil = (info.PROPERTIES.NEGATIVE_RECOIL == null) ?
                false : info.PROPERTIES.NEGATIVE_RECOIL;
        }                    
        let position = info.POSITION;
        this.length = position[0] / 10;
        this.width = position[1] / 10;
        this.aspect = position[2];
        let _off = new Vector(position[3], position[4]);
        this.angle  = position[5] * Math.PI / 180;
        this.direction = _off.direction;
        this.offset = _off.length / 10;
        this.delay  = position[6];

        this.position = 0;
        this.motion = 0;
        if (this.canShoot) {
            this.cycle = !this.waitToCycle - this.delay;
            this.trueRecoil = this.settings.recoil;
        }
    }
    recoil() {
        if (this.motion || this.position) {
            // Simulate recoil
            this.motion -= 0.25 * this.position / roomSpeed;
            this.position += this.motion;
            if (this.position < 0) { // Bouncing off the back
                this.position = 0;
                this.motion = -this.motion;
            }
            if (this.motion > 0) {
                this.motion *= 0.75;
            }
        }   
        if (this.canShoot && !this.body.settings.hasNoRecoil) {
            // Apply recoil to motion
            if (this.motion > 0) {
                let recoilForce = -this.position * this.trueRecoil * 0.045 / roomSpeed;
                this.body.accel.x += recoilForce * Math.cos(this.body.facing + this.angle);
                this.body.accel.y += recoilForce * Math.sin(this.body.facing + this.angle);
            }      
        }
    }

    getSkillRaw() { 
        if (this.bulletStats === 'master') {
            return [
                this.body.skill.raw[0],
                this.body.skill.raw[1],
                this.body.skill.raw[2],
                this.body.skill.raw[3],
                this.body.skill.raw[4],
                0, 0, 0, 0, 0, 
            ];
        } 
        return this.bulletStats.raw;
    }

    getLastShot() {
        return this.lastShot;
    }

    live() {
        // Do 
        this.recoil();
        // Dummies ignore this
        if (this.canShoot) {
            // Find the proper skillset for shooting
            let sk = (this.bulletStats === 'master') ? this.body.skill : this.bulletStats;
            // Decides what to do based on child-counting settings
            let shootPermission = (this.countsOwnKids) ?
                    this.countsOwnKids > this.children.length * ((this.calculator == 'necro') ? sk.rld : 1)
                : (this.body.maxChildren) ?
                    this.body.maxChildren > this.body.children.length * ((this.calculator == 'necro') ? sk.rld : 1)
                : true;                
            // Override in invuln
            /*if (this.body.master.invuln) {
              shootPermission = false;
            }*/
            // Cycle up if we should
            if (shootPermission || !this.waitToCycle) {
                if (this.cycle < 1) {
                    this.cycle += 1 / this.settings.reload / roomSpeed / ((this.calculator == 'necro' || this.calculator == 'fixed reload') ? 1 : sk.rld);
                } 
            } 
            // Firing routines
            if (shootPermission && (this.autofire || ((this.altFire) ? this.body.control.alt : this.body.control.fire))) {
                if (this.cycle >= 1) {
                    // Find the end of the gun barrel
                    let gx = 
                        this.offset * Math.cos(this.direction + this.angle + this.body.facing) +
                        (1.5 * this.length - this.width * this.settings.size / 2) * Math.cos(this.angle + this.body.facing);
                    let gy = 
                        this.offset * Math.sin(this.direction + this.angle + this.body.facing) +
                        (1.5 * this.length - this.width * this.settings.size / 2) * Math.sin(this.angle + this.body.facing); 
                    // Shoot, multiple times in a tick if needed
                    while (shootPermission && this.cycle >= 1) {
                        this.fire(gx, gy, sk);   
                        // Figure out if we may still shoot
                        shootPermission = (this.countsOwnKids) ?
                            this.countsOwnKids > this.children.length
                        : (this.body.maxChildren) ?
                            this.body.maxChildren > this.body.children.length
                        : true; 
                        // Cycle down
                        this.cycle -= 1;
                    }
                }  // If we're not shooting, only cycle up to where we'll have the proper firing delay
            } else if (this.cycle > !this.waitToCycle - this.delay) {
                this.cycle = !this.waitToCycle - this.delay;
            } 
        }
    }

    syncChildren() {
        if (this.syncsSkills) {
            let self = this;
            for(let o in this.children){
              (function(o) {
                o.define({
                    BODY: self.interpret(), 
                    SKILL: self.getSkillRaw(),
                });
                o.refreshBodyAttributes();
            });
        }
    }
}
    fire(gx, gy, sk) {
        // Recoil
        this.lastShot.time = util.time();
        this.lastShot.power = 3 * Math.log(Math.sqrt(sk.spd) + this.trueRecoil + 1) + 1;
        this.motion += this.lastShot.power;                 
        // Find inaccuracy
        let ss, sd;
        do {
            ss = ran.gauss(0, Math.sqrt(this.settings.shudder));
        } while (Math.abs(ss) >= this.settings.shudder * 2);
        do {
            sd = ran.gauss(0, this.settings.spray * this.settings.shudder);
        } while (Math.abs(sd) >= this.settings.spray / 2);
        sd *= Math.PI / 180;
        // Find speed
        let s = new Vector(
            ((this.negRecoil) ? -1 : 1) * this.settings.speed * c.runSpeed * sk.spd * (1 + ss) * Math.cos(this.angle + this.body.facing + sd),
            ((this.negRecoil) ? -1 : 1) * this.settings.speed * c.runSpeed * sk.spd * (1 + ss) * Math.sin(this.angle + this.body.facing + sd)
        );     
        // Boost it if we shouldw
        if (this.body.velocity.length) { 
            let extraBoost = 
                Math.max(0, s.x * this.body.velocity.x + s.y * this.body.velocity.y) / this.body.velocity.length / s.length;
            if (extraBoost) {
                let len = s.length;
                s.x += this.body.velocity.length * extraBoost * s.x / len;
                s.y += this.body.velocity.length * extraBoost * s.y / len;   
            }                     
        }
        // Create the bullet
        var o = new Entity({
            x: this.body.x + this.body.size * gx - s.x,
            y: this.body.y + this.body.size * gy - s.y,
        }, this.master.master);
        /*let jumpAhead = this.cycle - 1;
        if (jumpAhead) {
            o.x += s.x * this.cycle / jumpAhead;
            o.y += s.y * this.cycle / jumpAhead;
        }*/
        o.velocity = s;
        this.bulletInit(o);
        o.coreSize = o.SIZE;
    }

    bulletInit(o) {
        // Define it by its natural properties
        for(let type of this.bulletTypes){o.define(type)};
        // Pass the gun attributes
        o.define({ 
            BODY: this.interpret(), 
            SKILL: this.getSkillRaw(),
            SIZE: this.body.size * this.width * this.settings.size / 2 ,
            LABEL: this.master.label + ((this.label) ? ' ' + this.label : '') + ' ' + o.label,
        });            
        o.color = this.body.master.color;
        // Keep track of it and give it the function it needs to deutil.log itself upon death
        if (this.countsOwnKids) {
            o.parent = this;
            this.children.push(o);
        } else if (this.body.maxChildren) {
            o.parent = this.body;
            this.body.children.push(o);
            this.children.push(o);  
        }        
        o.source = this.body;
        o.facing = o.velocity.direction;
        // Necromancers.
        let oo = o;
        o.necro = host => {
            let shootPermission = (this.countsOwnKids) ?
                this.countsOwnKids > this.children.length * 
                ((this.bulletStats === 'master') ? this.body.skill.rld : this.bulletStats.rld)
            : (this.body.maxChildren) ?
                this.body.maxChildren > this.body.children.length * 
                ((this.bulletStats === 'master') ? this.body.skill.rld : this.bulletStats.rld)
            : true;   
            if (shootPermission) {
                let save = {
                    facing: host.facing,
                    size: host.SIZE,
                };
                host.define(Class.genericEntity);
                this.bulletInit(host);
                host.team = oo.master.master.team;
                host.master = oo.master;
                host.color = oo.color;
                host.facing = save.facing;
                host.SIZE = save.size;
                host.health.amount = host.health.max;
                return true;
            }
            return false;
        };
        // Otherwise
        o.refreshBodyAttributes();
        o.life();
    }

    getTracking() {
        return {
            speed: c.runSpeed * ((this.bulletStats == 'master') ? this.body.skill.spd : this.bulletStats.spd) * 
                this.settings.maxSpeed * 
                this.natural.SPEED,
            range:  Math.sqrt((this.bulletStats == 'master') ? this.body.skill.spd : this.bulletStats.spd) * 
                this.settings.range * 
                this.natural.RANGE,
        };
    }

    interpret() {
        let sizeFactor = this.master.size/this.master.SIZE;
        let shoot = this.settings;
        let sk = (this.bulletStats == 'master') ? this.body.skill : this.bulletStats;
        // Defaults
        let out = {
            SPEED: shoot.maxSpeed * sk.spd,
            HEALTH: shoot.health * sk.str,
            RESIST: shoot.resist + sk.rst,
            DAMAGE: shoot.damage * sk.dam,
            PENETRATION: Math.max(1, shoot.pen * sk.pen),            
            RANGE: shoot.range / Math.sqrt(sk.spd),
            DENSITY: shoot.density * sk.pen * sk.pen / sizeFactor,
            PUSHABILITY: 1 / sk.pen,
            HETERO: 3 - 2.8 * sk.ghost,
        };
        // Special cases
        switch (this.calculator) {
        case 'thruster': 
            this.trueRecoil = this.settings.recoil * Math.sqrt(sk.rld * sk.spd);
            break;
        case 'sustained':
            out.RANGE = shoot.range;
            break;
        case 'swarm':
            out.PENETRATION = Math.max(1, shoot.pen * (0.5 * (sk.pen - 1) + 1));
            out.HEALTH /= shoot.pen * sk.pen;
            break;
        case 'trap':
        case 'block':
            out.PUSHABILITY = 1 / Math.pow(sk.pen, 0.5);    
            out.RANGE = shoot.range;
            break;
        case 'necro':
        case 'drone':
            out.PUSHABILITY = 1;
            out.PENETRATION = Math.max(1, shoot.pen * (0.5 * (sk.pen - 1) + 1));
            out.HEALTH = (shoot.health * sk.str + sizeFactor) / Math.pow(sk.pen, 0.8);
            out.DAMAGE = shoot.damage * sk.dam * Math.sqrt(sizeFactor) * shoot.pen * sk.pen;
            out.RANGE = shoot.range * Math.sqrt(sizeFactor);
            break;
        }
        // Go through and make sure we respect its natural properties
        for (let property in out) { 
            if (this.natural[property] == null || !out.hasOwnProperty(property)) continue;
            out[property] *= this.natural[property];
        }
        return out;
    }
}
// Define entities
var minimap = [];
var views = [];
var entitiesToAvoid = [];
const dirtyCheck = (loc, radius) => { return entitiesToAvoid.some(entity => { return Math.abs(loc.x - entity.x) < radius + entity.size && Math.abs(loc.y - entity.y) < radius + entity.size; }); };
const grid = new hshg.HSHG();
var entitiesIdLog = 0;
var entities = [];
const purgeEntities = () => { entities = entities.filter(e => { return !e.isGhost; }); };

var bringToLife = (() => {
    let remapTarget = (i, ref, self) => {
        if (i.target == null || (!i.main && !i.alt)) return undefined;
        return {
            x: i.target.x + ref.x - self.x,
            y: i.target.y + ref.y - self.y,
        };
    };
    let passer = (a, b, acceptsFromTop) => {
        return index => {
            if (a != null && a[index] != null && (b[index] == null || acceptsFromTop)) {
                b[index] = a[index];
            }
        };
    };
    return my => {
        // Size
        if (my.SIZE - my.coreSize) my.coreSize += (my.SIZE - my.coreSize) / 100;
        // Think 
        let faucet = (my.settings.independent || my.source == null || my.source === my) ? {} : my.source.control;
        let b = {
            target: remapTarget(faucet, my.source, my),
            goal: undefined,
            fire: faucet.fire,
            main: faucet.main,
            alt: faucet.alt,
            power: undefined,
        };
        // Seek attention
        if (my.settings.attentionCraver && !faucet.main && my.range) {
            my.range -= 1;
        }
        // Invisibility
        if (my.invisible[1]) {
          my.alpha = Math.max(0, my.alpha - my.invisible[1])
          if (!my.velocity.isShorterThan(0.1) || my.damageReceived)
            my.alpha = Math.min(1, my.alpha + my.invisible[0])
        }
        // So we start with my master's thoughts and then we filter them down through our control stack
        for(let AI of my.controllers){
            let a = AI.think(b);
            let passValue = passer(a, b, AI.acceptsFromTop);
            passValue('target');
            passValue('goal');
            passValue('fire');
            passValue('main');
            passValue('alt');
            passValue('power');
        };        
        my.control.target = (b.target == null) ? my.control.target : b.target;
        my.control.goal = b.goal;
        my.control.fire = b.fire;
        my.control.main = b.main;
        my.control.alt = b.alt;
        my.control.power = (b.power == null) ? 1 : b.power;
        // React
        my.move(); 
        my.face();
        // Handle guns and turrets if we've got them
        for(let gun of my.guns){gun.live()}
        for(let turret of my.turrets){turret.life()};
        if (my.skill.maintain()) my.refreshBodyAttributes();
    }; 
})();

class HealthType {
    constructor(health, type, resist = 0) {
        this.max = health;
        this.amount = health;
        this.type = type;
        this.resist = resist;
        this.regen = 0;
    }

    set(health, regen = 0) {
        this.amount = (this.max) ? this.amount / this.max * health : health;
        this.max = health;
        this.regen = regen;
    }

    display() {
        return this.amount / this.max;
    }

    getDamage(amount, capped = true) {
        switch (this.type) {
        case 'dynamic': 
            return (capped) ? (
                Math.min(amount * this.permeability, this.amount)
            ) : (
                amount * this.permeability
            );
        case 'static':
            return (capped) ? (
                Math.min(amount, this.amount)
            ) : (
                amount
            );
        }            
    }

    regenerate(boost = false) {
        boost /= 2;
        let cons = 5;
        switch (this.type) {
        case 'static':
            if (this.amount >= this.max || !this.amount) break;
            this.amount += cons * (this.max / 10 / 60 / 2.5 + boost);
            break;
        case 'dynamic':
            let r = util.clamp(this.amount / this.max, 0, 1);
            if (!r) {
                this.amount = 0.0001;
            }
            if (r === 1) {
                this.amount = this.max;
            } else {
                this.amount += cons * (this.regen * Math.exp(-50 * Math.pow(Math.sqrt(0.5 * r) - 0.4, 2)) / 3 + r * this.max / 10 / 15 + boost);
            }
        break; 
        }
        this.amount = util.clamp(this.amount, 0, this.max);
    }

    get permeability() {
        switch(this.type) {
        case 'static': return 1;
        case 'dynamic': return (this.max) ? util.clamp(this.amount / this.max, 0, 1) : 0;
        }
    }

    get ratio() {
        return (this.max) ? util.clamp(1 - Math.pow(this.amount / this.max - 1, 4), 0, 1) : 0;
    }
}

class Entity {
    constructor(position, master = this) {
        this.isGhost = false;
        this.killCount = { solo: 0, assists: 0, bosses: 0, killers: [], };
        this.creationTime = (new Date()).getTime();
        // Inheritance
        this.master = master;
        this.source = this;
        this.parent = this;
        this.control = {
            target: new Vector(0, 0),
            goal: new Vector(0, 0),
            main: false,
            alt: false,
            fire: false,
            power: 0,
        };
        this.isInGrid = false;
        this.removeFromGrid = () => { if (this.isInGrid) { grid.removeObject(this); this.isInGrid = false; } };
        this.addToGrid = () => { if (!this.isInGrid && this.bond == null) { grid.addObject(this); this.isInGrid = true; } };
        this.activation = (() => {
            let active = true;
            let timer = ran.irandom(15);
            return {
                update: () => {
                    if (this.isDead()) {
                        return 0;
                    }
                    if (!active) {
                        this.removeFromGrid();
                        if (this.settings.diesAtRange) {
                            this.kill();
                        }
                        if (!(timer--)) {
                            active = true;
                        }
                    } else {
                        this.addToGrid();
                        timer = 15;
                        active = views.some(v => v.check(this, 0.6)) || this.alwaysActive;
                    }
                },
                check: () => {
                    return active;
                }
            };
        })();
        this.autoOverride = false;
        this.controllers = [];
        this.blend = {
            color: '#FFFFFF',
            amount: 0,
        };
        // Objects
        this.skill = new Skill();
        this.health = new HealthType(1, 'static', 0);
        this.shield = new HealthType(0, 'dynamic');
        this.guns = [];
        this.turrets = [];
        this.upgrades = [];
        this.settings = {};
        this.aiSettings = {};
        this.children = [];
        // Define it
        this.SIZE = 1;
        this.define(Class.genericEntity);
        // Initalize physics and collision
        this.maxSpeed = 0;
        this.facing = 0;
        this.vfacing = 0;
        this.range = 0;
        this.damageRecieved = 0;
        this.stepRemaining = 1;
        this.x = position.x;
        this.y = position.y;
        this.velocity = new Vector(0, 0);
        this.accel = new Vector(0, 0);
        this.damp = 0.05;
        this.collisionArray = [];
        this.invuln = false;
        this.alpha = 1;
        this.invisible = [0, 0];
        // Get a new unique id
        this.id = entitiesIdLog++;
        this.team = this.id;
        this.team = master.team;
        // This is for collisions
        this.updateAABB = () => {};
        this.getAABB = (() => {
            let data = {}, savedSize = 0;
            let getLongestEdge = (x1, y1, x2, y2) => {
                return Math.max(
                    Math.abs(x2 - x1),
                    Math.abs(y2 - y1)
                );
            };
            this.updateAABB = active => { 
                if (this.bond != null) return 0;
                if (!active) { data.active = false; return 0; }
                // Get bounds
                let x1 = Math.min(this.x, this.x + this.velocity.x + this.accel.x) - this.realSize - 5;
                let y1 = Math.min(this.y, this.y + this.velocity.y + this.accel.y) - this.realSize - 5;
                let x2 = Math.max(this.x, this.x + this.velocity.x + this.accel.x) + this.realSize + 5;
                let y2 = Math.max(this.y, this.y + this.velocity.y + this.accel.y) + this.realSize + 5;
                // Size check
                let size = getLongestEdge(x1, y1, x2, y1);
                let sizeDiff = savedSize / size;
                // Update data
                data = { 
                    min: [x1, y1],
                    max: [x2, y2],
                    active: true,
                    size: size,
                };
                // Update grid if needed
                if (sizeDiff > Math.SQRT2 || sizeDiff < Math.SQRT1_2) {
                    this.removeFromGrid(); this.addToGrid();
                    savedSize = data.size;
                }
            };
            return () => { return data; };
        })();
        this.updateAABB(true);   
        entities.push(this); // everything else
        for(let v of views){v.add(this);this.activation.update();};
    }
    
    life() { bringToLife(this); }

    addController(newIO) {
        if (Array.isArray(newIO)) {
            this.controllers = newIO.concat(this.controllers);
        } else {
            this.controllers.unshift(newIO); 
        }
    } 

    define(set) {
        if (set.PARENT != null) {
            for (let i=0; i<set.PARENT.length; i++) {
                this.define(set.PARENT[i]);
            }
        }
        if (set.index != null) {
            this.index = set.index;
        }
        if (set.NAME != null) { 
            this.name = set.NAME; 
        }
        if (set.LABEL != null) { 
            this.label = set.LABEL; 
        }
        if (set.TYPE != null) { 
            this.type = set.TYPE; 
        }
        if (set.SHAPE != null) {
            this.shape = typeof set.SHAPE === 'number' ? set.SHAPE : 0
            this.shapeData = set.SHAPE;
        }
        if (set.COLOR != null) { 
            this.color = set.COLOR; 
        }   
        if (set.CONTROLLERS != null) { 
            let toAdd = [];
            for(let ioName of set.CONTROLLERS){
                toAdd.push(new ioTypes[ioName](this));
            };
            this.addController(toAdd);
        }
        if (set.MOTION_TYPE != null) { 
            this.motionType = set.MOTION_TYPE; 
        }
        if (set.FACING_TYPE != null) { 
            this.facingType = set.FACING_TYPE; 
        }
        if (set.DRAW_HEALTH != null) { 
            this.settings.drawHealth = set.DRAW_HEALTH; 
        }
        if (set.DRAW_SELF != null) { 
            this.settings.drawShape = set.DRAW_SELF; 
        }
        if (set.DAMAGE_EFFECTS != null) { 
            this.settings.damageEffects = set.DAMAGE_EFFECTS; 
        }
        if (set.RATIO_EFFECTS != null) { 
            this.settings.ratioEffects = set.RATIO_EFFECTS; 
        }
        if (set.MOTION_EFFECTS != null) { 
            this.settings.motionEffects = set.MOTION_EFFECTS; 
        }
        if (set.ACCEPTS_SCORE != null) { 
            this.settings.acceptsScore = set.ACCEPTS_SCORE; 
        }
        if (set.GIVE_KILL_MESSAGE != null) { 
            this.settings.givesKillMessage = set.GIVE_KILL_MESSAGE; 
        }
        if (set.CAN_GO_OUTSIDE_ROOM != null) { 
            this.settings.canGoOutsideRoom = set.CAN_GO_OUTSIDE_ROOM; 
        }
        if (set.HITS_OWN_TYPE != null) { 
            this.settings.hitsOwnType = set.HITS_OWN_TYPE; 
        }
        if (set.DIE_AT_LOW_SPEED != null) { 
            this.settings.diesAtLowSpeed = set.DIE_AT_LOW_SPEED; 
        }
        if (set.DIE_AT_RANGE != null) { 
            this.settings.diesAtRange = set.DIE_AT_RANGE; 
        }
        if (set.INDEPENDENT != null) { 
            this.settings.independent = set.INDEPENDENT; 
        }
        if (set.PERSISTS_AFTER_DEATH != null) { 
            this.settings.persistsAfterDeath = set.PERSISTS_AFTER_DEATH; 
        }
        if (set.CLEAR_ON_MASTER_UPGRADE != null) { 
            this.settings.clearOnMasterUpgrade = set.CLEAR_ON_MASTER_UPGRADE; 
        }
        if (set.HEALTH_WITH_LEVEL != null) { 
            this.settings.healthWithLevel = set.HEALTH_WITH_LEVEL; 
        }
        if (set.ACCEPTS_SCORE != null) { 
            this.settings.acceptsScore = set.ACCEPTS_SCORE; 
        }
        if (set.OBSTACLE != null) { 
            this.settings.obstacle = set.OBSTACLE; 
        }
        if (set.NECRO != null) { 
            this.settings.isNecromancer = set.NECRO; 
        }
        if (set.AUTO_UPGRADE != null) { 
            this.settings.upgrading = set.AUTO_UPGRADE; 
        }
        if (set.HAS_NO_RECOIL != null) { 
            this.settings.hasNoRecoil = set.HAS_NO_RECOIL; 
        }
        if (set.CRAVES_ATTENTION != null) { 
            this.settings.attentionCraver = set.CRAVES_ATTENTION; 
        }
        if (set.BROADCAST_MESSAGE != null) { 
            this.settings.broadcastMessage = (set.BROADCAST_MESSAGE === '') ? undefined : set.BROADCAST_MESSAGE; 
        }
        if (set.DAMAGE_CLASS != null) { 
            this.settings.damageClass = set.DAMAGE_CLASS; 
        }
        if (set.BUFF_VS_FOOD != null) { 
            this.settings.buffVsFood = set.BUFF_VS_FOOD; 
        }
        if (set.CAN_BE_ON_LEADERBOARD != null) { 
            this.settings.leaderboardable = set.CAN_BE_ON_LEADERBOARD; 
        }
        if (set.INTANGIBLE != null) { 
            this.intangibility = set.INTANGIBLE; 
        }
        if (set.IS_SMASHER != null) { 
            this.settings.reloadToAcceleration = set.IS_SMASHER; 
        }
        if (set.STAT_NAMES != null) { 
            this.settings.skillNames = set.STAT_NAMES; 
        }
        if (set.AI != null) { 
            this.aiSettings = set.AI; 
        }
        if (set.ALPHA != null) { 
            this.alpha = set.ALPHA;
        }
        if (set.INVISIBLE != null) { 
            this.invisible = set.INVISIBLE;
        }
        if (set.DANGER != null) { 
            this.dangerValue = set.DANGER; 
        }
        if (set.VARIES_IN_SIZE != null) { 
            this.settings.variesInSize = set.VARIES_IN_SIZE; 
            this.squiggle = (this.settings.variesInSize) ? ran.randomRange(0.8, 1.2) : 1;
        }
        if (set.HOVER != null) { 
          this.hover = set.HOVER; 
        }
        if (set.RESET_UPGRADES) {
            this.upgrades = [];
        }
        if (set.UPGRADES_TIER_1 != null) { 
            for(let e of set.UPGRADES_TIER_1){
                this.upgrades.push({ tier: 1, level: c.TIER_1, index: e.index });
            };
        }
        if (set.UPGRADES_TIER_2 != null) { 
            for(let e of set.UPGRADES_TIER_2){
                this.upgrades.push({ tier: 2, level: c.TIER_2, index: e.index });
            };
        }
        if (set.UPGRADES_TIER_3 != null) { 
            for(let e of set.UPGRADES_TIER_3){
                this.upgrades.push({  tier: 3, level: c.TIER_3, index: e.index });
            };
        }
        if (set.SIZE != null) {
            this.SIZE = set.SIZE * this.squiggle;
            if (this.coreSize == null) { this.coreSize = this.SIZE; }
        }
        if (set.SKILL != null && set.SKILL != []) { 
            if (set.SKILL.length != 10) {
                throw('Inappropiate skill raws.');
            }
            this.skill.set(set.SKILL);
        } 
        if (set.LEVEL != null) {
            if (set.LEVEL === -1) {
                this.skill.reset();
            }
            while (this.skill.level < c.SKILL_CHEAT_CAP && this.skill.level < set.LEVEL) {
                this.skill.score += this.skill.levelScore;
                this.skill.maintain();
            }
            this.refreshBodyAttributes();
        }
        if (set.SKILL_CAP != null && set.SKILL_CAP != []) { 
            if (set.SKILL_CAP.length != 10) {
                throw('Inappropiate skill caps.');
            }
            this.skill.setCaps(set.SKILL_CAP);
        } 
        if (set.VALUE != null) {
            this.skill.score = Math.max(this.skill.score, set.VALUE * this.squiggle);
        }
        if (set.ALT_ABILITIES != null) { 
            this.abilities = set.ALT_ABILITIES; 
        }
        if (set.GUNS != null) { 
            let newGuns = [];
            for(let gundef of set.GUNS){
                newGuns.push(new Gun(this, gundef));
            };
            this.guns = newGuns;
        }
        if (set.MAX_CHILDREN != null) { 
            this.maxChildren = set.MAX_CHILDREN; 
        }
        if (set.BODY != null) {
            if (set.BODY.ACCELERATION != null) { 
                this.ACCELERATION = set.BODY.ACCELERATION; 
            }
            if (set.BODY.SPEED != null) { 
                this.SPEED = set.BODY.SPEED; 
            }
            if (set.BODY.HEALTH != null) { 
                this.HEALTH = set.BODY.HEALTH; 
            }
            if (set.BODY.RESIST != null) { 
                this.RESIST = set.BODY.RESIST;
            }
            if (set.BODY.SHIELD != null) { 
                this.SHIELD = set.BODY.SHIELD; 
            }
            if (set.BODY.REGEN != null) { 
                this.REGEN = set.BODY.REGEN; 
            }
            if (set.BODY.DAMAGE != null) { 
                this.DAMAGE = set.BODY.DAMAGE; 
            }
            if (set.BODY.PENETRATION != null) { 
                this.PENETRATION = set.BODY.PENETRATION; 
            }
            if (set.BODY.FOV != null) { 
                this.FOV = set.BODY.FOV; 
            }
            if (set.BODY.RANGE != null) { 
                this.RANGE = set.BODY.RANGE; 
            }
            if (set.BODY.SHOCK_ABSORB != null) { 
                this.SHOCK_ABSORB = set.BODY.SHOCK_ABSORB; 
            }
            if (set.BODY.DENSITY != null) { 
                this.DENSITY = set.BODY.DENSITY; 
            }
            if (set.BODY.STEALTH != null) { 
                this.STEALTH = set.BODY.STEALTH; 
            }
            if (set.BODY.PUSHABILITY != null) { 
                this.PUSHABILITY = set.BODY.PUSHABILITY; 
            }
            if (set.BODY.HETERO != null) { 
                this.heteroMultiplier = set.BODY.HETERO; 
            }
            this.refreshBodyAttributes();
        }
        if (set.TURRETS != null) {
            let o;
            for(let o of this.turrets){o.destroy()};
            this.turrets = [];
            for(let def of set.TURRETS){
                o = new Entity(this, this.master);
                    for(let type of (Array.isArray(def.TYPE)) ? def.TYPE : [def.TYPE]){o.define(type)};
                    o.bindToMaster(def.POSITION, this);
            };
        }
        if (set.mockup != null) {
            this.mockup = set.mockup;
        }
    }

    refreshBodyAttributes() {
        let speedReduce = Math.pow(this.size / (this.coreSize || this.SIZE), 1);

        this.acceleration = c.runSpeed * this.ACCELERATION / speedReduce;
        if (this.settings.reloadToAcceleration) this.acceleration *= this.skill.acl;

        this.topSpeed = c.runSpeed * this.SPEED * this.skill.mob / speedReduce;
        if (this.settings.reloadToAcceleration) this.topSpeed /= Math.sqrt(this.skill.acl);
        
        this.health.set(
            (((this.settings.healthWithLevel) ? 2 * this.skill.level : 0) + this.HEALTH) * this.skill.hlt
        );

        this.health.resist = 1 - 1 / Math.max(1, this.RESIST + this.skill.brst);

        this.shield.set(
            (((this.settings.healthWithLevel) ? 0.6 * this.skill.level : 0) + this.SHIELD) * this.skill.shi, 
            Math.max(0, ((((this.settings.healthWithLevel) ? 0.006 * this.skill.level : 0) + 1) * this.REGEN) * this.skill.rgn)
        );
        
        this.damage = this.DAMAGE * this.skill.atk;

        this.penetration = this.PENETRATION + 1.5 * (this.skill.brst + 0.8 * (this.skill.atk - 1));

        if (!this.settings.dieAtRange || !this.range) {
            this.range = this.RANGE;
        }

        this.fov = this.FOV * 250 * Math.sqrt(this.size) * (1 + 0.003 * this.skill.level);
        
        this.density = (1 + 0.08 * this.skill.level) * this.DENSITY; 

        this.stealth = this.STEALTH;

        this.pushability = this.PUSHABILITY;        
    }    

    bindToMaster(position, bond) {
        this.bond = bond;
        this.source = bond;
        this.bond.turrets.push(this);
        this.skill = this.bond.skill;
        this.label = this.bond.label + ' ' + this.label;
        // It will not be in collision calculations any more nor shall it be seen.
        this.removeFromGrid();
        this.settings.drawShape = false;
        // Get my position.
        this.bound = {};
        this.bound.size =  position[0] / 20;
        let _off = new Vector(position[1], position[2]);
        this.bound.angle  = position[3] * Math.PI / 180;
        this.bound.direction = _off.direction;
        this.bound.offset = _off.length / 10;
        this.bound.arc = position[4] * Math.PI / 180;
        // Figure out how we'll be drawn.
        this.bound.layer = position[5];
        // Initalize.
        this.facing = this.bond.facing + this.bound.angle;
        this.facingType = 'bound';
        this.motionType = 'bound';
        this.move();
    }

    get size() {
        if (this.bond == null) return (this.coreSize || this.SIZE) * (1 + this.skill.level / 45);
        return this.bond.size * this.bound.size;
    }

    get mass() {
        return this.density * (this.size * this.size + 1); 
    }

    get realSize() {
        return this.size * ((Math.abs(this.shape) > lazyRealSizes.length) ? 1 : lazyRealSizes[Math.abs(this.shape)]);
    }

    get m_x() {
        return (this.velocity.x + this.accel.x) / roomSpeed;
    }
    get m_y() {
        return (this.velocity.y + this.accel.y) / roomSpeed;
    }

    camera(tur = false) {
        return {
            type: 0 + tur * 0x01 + this.settings.drawHealth * 0x02 + (this.type === 'tank') * 0x04,
            id: this.id,
            index: this.index,
            x: this.x,
            y: this.y ,
            vx: this.velocity.x,
            vy: this.velocity.y,  
            size: this.size,           
            rsize: this.realSize,   
            status: 1,
            health: this.health.display(),
            shield: this.shield.display(),
            alpha: this.alpha,
            facing: this.facing,
            vfacing: this.vfacing,
            twiggle: this.facingType === 'autospin' || (this.facingType === 'locksFacing' && this.control.alt),
            layer: (this.bond != null) ? this.bound.layer : 
                    (this.type === 'wall') ? 11 : 
                    (this.type === 'food') ? 10 : 
                    (this.type === 'tank'||this.type === 'minion') ? (this.hover ? 12 : 5) :
                    (this.type === 'crasher') ? 1 :
                    0,
            color: this.color,
            name: this.name,
            score: this.skill.score,
            guns: this.guns.map(gun => gun.getLastShot()),
            turrets: this.turrets.map(turret => turret.camera(true)),
        };
    }   
    
    skillUp(stat) {
        let suc = this.skill.upgrade(stat);
        if (suc) {
            this.refreshBodyAttributes();
            for(let gun of this.guns){
                gun.syncChildren();
            };
        }
        return suc;
    }

    upgrade(number) {
        if (number < this.upgrades.length && this.skill.level >= this.upgrades[number].level) {     
            let saveMe = classFromIndex(this.upgrades[number].index);           
            this.upgrades = [];
            this.define(saveMe);
            this.sendMessage('You have upgraded to ' + this.label + '.');
            let ID = this.id;
            for(let instance of entities){
                if (instance.settings.clearOnMasterUpgrade && instance.master.id === ID) {
                    instance.kill();
                }
            }; 
            this.skill.update();
            this.refreshBodyAttributes();
        }
    }

    damageMultiplier() {
        switch (this.type) {
        case 'swarm': 
            return 0.25 + 1.5 * util.clamp(this.range / (this.RANGE + 1), 0, 1);
        default: return 1;
        } 
    }

    move() {
        let g = {
                x: this.control.goal.x - this.x,
                y: this.control.goal.y - this.y,
            },
            gactive = (g.x !== 0 || g.y !== 0),
            engine = {
                x: 0,
                y: 0,
            },
            a = this.acceleration / roomSpeed;
        switch (this.motionType) {
        case 'glide':
            this.maxSpeed = this.topSpeed;
            this.damp = 0.05;
            break;
        case 'motor':
            this.maxSpeed = 0;            
            if (this.topSpeed) {
                this.damp = a / this.topSpeed;
            }
            if (gactive) {
                let len = Math.sqrt(g.x * g.x + g.y * g.y);
                engine = {
                    x: a * g.x / len,
                    y: a * g.y / len,
                };
            }
            break;
        case 'swarm': 
            this.maxSpeed = this.topSpeed;
            let l = util.getDistance({ x: 0, y: 0, }, g) + 1;
            if (gactive && l > this.size) {
                let desiredxspeed = this.topSpeed * g.x / l,
                    desiredyspeed = this.topSpeed * g.y / l,
                    turning = Math.sqrt((this.topSpeed * Math.max(1, this.range) + 1) / a);
                engine = {
                    x: (desiredxspeed - this.velocity.x) / Math.max(5, turning),
                    y: (desiredyspeed - this.velocity.y) / Math.max(5, turning),  
                };
            } else {
                if (this.velocity.length < this.topSpeed) {
                    engine = {
                        x: this.velocity.x * a / 20,
                        y: this.velocity.y * a / 20,
                    };
                }
            }
            break;        
        case 'chase':
            if (gactive) {
                let l = util.getDistance({ x: 0, y: 0, }, g);
                if (l > this.size * 2) {
                    this.maxSpeed = this.topSpeed;
                    let desiredxspeed = this.topSpeed * g.x / l,
                        desiredyspeed = this.topSpeed * g.y / l;
                    engine = {                
                        x: (desiredxspeed - this.velocity.x) * a,
                        y: (desiredyspeed - this.velocity.y) * a,
                    };
                } else {
                    this.maxSpeed = 0;
                }   
            } else {
                this.maxSpeed = 0;
            }
            break;
        case 'drift':
            this.maxSpeed = 0;
            engine = {
                x: g.x * a,
                y: g.y * a,
            };
            break;
        case 'bound':
            let bound = this.bound, ref = this.bond;
            this.x = ref.x + ref.size * bound.offset * Math.cos(bound.direction + bound.angle + ref.facing);
            this.y = ref.y + ref.size * bound.offset * Math.sin(bound.direction + bound.angle + ref.facing);
            this.bond.velocity.x += bound.size * this.accel.x;
            this.bond.velocity.y += bound.size * this.accel.y;
            this.firingArc = [ref.facing + bound.angle, bound.arc / 2];
            nullVector(this.accel);
            this.blend = ref.blend;
            break;
        }
        this.accel.x += engine.x * this.control.power;
        this.accel.y += engine.y * this.control.power;
    }

    face() {
        let t = this.control.target,
            tactive = (t.x !== 0 || t.y !== 0),
            oldFacing = this.facing;
        switch(this.facingType) {
        case 'autospin':
            this.facing += 0.02 / roomSpeed;
            break;
        case 'turnWithSpeed':
            this.facing += this.velocity.length / 90 * Math.PI / roomSpeed;
            break;
        case 'withMotion': 
            this.facing = this.velocity.direction;
            break;
        case 'smoothWithMotion':
        case 'looseWithMotion':
            this.facing += util.loopSmooth(this.facing, this.velocity.direction, 4 / roomSpeed); 
            break;
        case 'withTarget': 
        case 'toTarget': 
            this.facing = Math.atan2(t.y, t.x);
            break; 
        case 'locksFacing': 
            if (!this.control.alt) this.facing = Math.atan2(t.y, t.x);
            break;
        case 'looseWithTarget':
        case 'looseToTarget':
        case 'smoothToTarget':
            this.facing += util.loopSmooth(this.facing, Math.atan2(t.y, t.x), 4 / roomSpeed); 
            break;        
        case 'bound':
            let givenangle;
            if (this.control.main) {
                givenangle = Math.atan2(t.y, t.x);
                let diff = util.angleDifference(givenangle, this.firingArc[0]);
                if (Math.abs(diff) >= this.firingArc[1]) {
                    givenangle = this.firingArc[0];// - util.clamp(Math.sign(diff), -this.firingArc[1], this.firingArc[1]);
                }
            } else {
                givenangle = this.firingArc[0];
            }
            this.facing += util.loopSmooth(this.facing, givenangle, 4 / roomSpeed);
            break;
        }
        // Loop
        const TAU = 2 * Math.PI
        this.facing = (this.facing % TAU + TAU) % TAU;
        this.vfacing = util.angleDifference(oldFacing, this.facing) * roomSpeed;
    }

    takeSelfie() {
        this.flattenedPhoto = null;
        this.photo = (this.settings.drawShape) ? this.camera() : this.photo = undefined;
    }

    physics() {
        if (this.accel.x == null || this.velocity.x == null) {
            util.error('Void Error!');
            util.error(this.collisionArray);
            util.error(this.label);
            util.error(this);
            nullVector(this.accel); nullVector(this.velocity);
        }
        // Apply acceleration
        this.velocity.x += this.accel.x;
        this.velocity.y += this.accel.y;
        // Reset acceleration
        nullVector(this.accel); 
        // Apply motion
        this.stepRemaining = 1;
        this.x += this.stepRemaining * this.velocity.x / roomSpeed;
        this.y += this.stepRemaining * this.velocity.y / roomSpeed;        
    }

    friction() {
        var motion = this.velocity.length,
            excess = motion - this.maxSpeed;
        if (excess > 0 && this.damp) {
            var k = this.damp / roomSpeed,
                drag = excess / (k + 1),
                finalvelocity = this.maxSpeed + drag;
            this.velocity.x = finalvelocity * this.velocity.x / motion;
            this.velocity.y = finalvelocity * this.velocity.y / motion;
        }
    }

    confinementToTheseEarthlyShackles() {
        if (this.x == null || this.x == null) {
            util.error('Void Error!');
            util.error(this.collisionArray);
            util.error(this.label);
            util.error(this);
            nullVector(this.accel); nullVector(this.velocity);
            return 0;
        }
        if (!this.settings.canGoOutsideRoom) {
            this.accel.x -= Math.min(this.x - this.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
            this.accel.x -= Math.max(this.x + this.realSize - room.width - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
            this.accel.y -= Math.min(this.y - this.realSize + 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
            this.accel.y -= Math.max(this.y + this.realSize - room.height - 50, 0) * c.ROOM_BOUND_FORCE / roomSpeed;
        }
        if (room.gameMode === 'tdm' && this.type !== 'food') { 
            let loc = { x: this.x, y: this.y, };
            if (
                (this.team !== -1 && room.isIn('bas1', loc)) ||
                (this.team !== -2 && room.isIn('bas2', loc)) ||
                (this.team !== -3 && room.isIn('bas3', loc)) ||
                (this.team !== -4 && room.isIn('bas4', loc))
            ) { this.kill(); }
        }
    }

    contemplationOfMortality() {
        if (this.invuln) {
            this.damageRecieved = 0;
            return 0;
        }
        // Life-limiting effects
        if (this.settings.diesAtRange) {
            this.range -= 1 / roomSpeed;
            if (this.range < 0) {
                this.kill();
            }
        }
        if (this.settings.diesAtLowSpeed) {
            if (!this.collisionArray.length && this.velocity.length < this.topSpeed / 2) {
                this.health.amount -= this.health.getDamage(1 / roomSpeed);
            }
        }
        // Shield regen and damage
        if (this.shield.max) {
            if (this.damageRecieved !== 0) {
                let shieldDamage = this.shield.getDamage(this.damageRecieved);
                this.damageRecieved -= shieldDamage;
                this.shield.amount -= shieldDamage;
            }
        }
        // Health damage 
        if (this.damageRecieved !== 0) {
            let healthDamage = this.health.getDamage(this.damageRecieved);
            this.blend.amount = 1;
            this.health.amount -= healthDamage;
        }
        this.damageRecieved = 0;

        // Check for death
        if (this.isDead()) {
            // Initalize message arrays
            let killers = [], killTools = [], notJustFood = false;
            // If I'm a tank, call me a nameless player
            let name = (this.master.name == '') ?
                (this.master.type === 'tank') ?
                    "a nameless player's " + this.label :
                    (this.master.type === 'miniboss') ?
                        "a visiting " + this.label :
                        util.addArticle(this.label) 
                :
                this.master.name + "'s " + this.label;
            // Calculate the jackpot
            let jackpot = Math.ceil(util.getJackpot(this.skill.score) / this.collisionArray.length);
            // Now for each of the things that kill me...
            for(let instance of this.collisionArray){
                if (instance.type === 'wall') return 0;
                if (instance.master.settings.acceptsScore) { // If it's not food, give its master the score
                    if (instance.master.type === 'tank' || instance.master.type === 'miniboss') notJustFood = true;
                    instance.master.skill.score += jackpot;
                    killers.push(instance.master); // And keep track of who killed me
                } else if (instance.settings.acceptsScore) {
                    instance.skill.score += jackpot;
                }
                killTools.push(instance); // Keep track of what actually killed me
            };
            // Remove duplicates
            killers = killers.filter((elem, index, self) => { return index == self.indexOf(elem); });
            // If there's no valid killers (you were killed by food), change the message to be more passive
            let killText = (notJustFood) ? '' : "You have been killed by ",
                dothISendAText = this.settings.givesKillMessage;
            for(let instance of killers){
                this.killCount.killers.push(instance.index);
                if (this.type === 'tank') {
                    if (killers.length > 1) instance.killCount.assists++; else instance.killCount.solo++;
                } else if (this.type === "miniboss") instance.killCount.bosses++;
            };
            // Add the killers to our death message, also send them a message
            if (notJustFood) {
                for(let instance of killers){
                    if (instance.master.type !== 'food' && instance.master.type !== 'crasher') {
                        killText += (instance.name == '') ? (killText == '') ? 'An unnamed player' : 'an unnamed player' : instance.name;
                        killText += ' and ';
                    }
                    // Only if we give messages
                    if (dothISendAText) { 
                        instance.sendMessage('You killed ' + name + ((killers.length > 1) ? ' (with some help).' : '.')); 
                    }
                };
                // Prepare the next part of the next 
                killText = killText.slice(0, -4);
                killText += 'killed you with ';
            }
            // Broadcast
            if (this.settings.broadcastMessage) sockets.broadcast(this.settings.broadcastMessage);
            // Add the implements to the message
            for(let instance of killTools){
                killText += util.addArticle(instance.label) + ' and ';
            };
            // Prepare it and clear the collision array.
            killText = killText.slice(0, -5);
            if (killText === 'You have been kille') killText = 'You have died a stupid death';
            this.sendMessage(killText + '.');
            // If I'm the leader, broadcast it:
            if (this.id === room.topPlayerID) {
                let usurptText = (this.name === '') ? 'The leader': this.name;
                if (notJustFood) { 
                    usurptText += ' has been usurped by';
                    for(let instance of killers){
                        usurptText += ' ';
                        usurptText += (instance.name === '') ? 'an unnamed player' : instance.name;
                        usurptText += ' and';
                    };
                    usurptText = usurptText.slice(0, -4);
                    usurptText += '!';
                } else {
                    usurptText += ' fought a polygon... and the polygon won.';
                }
                sockets.broadcast(usurptText);
            }
            // Kill it
            return 1;
        } 
        return 0;
    }

    protect() { 
        entitiesToAvoid.push(this); this.isProtected = true; 
    }

    sendMessage(message) { } // Dummy

    kill() {
        this.health.amount = -1000;
        this.shield.amount = -1000;
    }

    destroy() {
        // Remove from the protected entities list
        if (this.isProtected) util.remove(entitiesToAvoid, entitiesToAvoid.indexOf(this)); 
        // Remove from minimap
        let i = minimap.findIndex(entry => { return entry[0] === this.id; });
        if (i != -1) util.remove(minimap, i);
        // Remove this from views
        for(let v of views){v.remove(this)};
        // Remove from parent lists if needed
        if (this.parent != null) util.remove(this.parent.children, this.parent.children.indexOf(this));
        // Kill all of its children
        let ID = this.id;
        for(let instance of entities){
            if (instance.source.id === this.id) {
                if (instance.settings.persistsAfterDeath) {
                    instance.source = instance;
                } else {
                    instance.kill();
                }
            }
            if (instance.parent && instance.parent.id === this.id) {
                instance.parent = null;
            }
            if (instance.master.id === this.id) {
                instance.kill();
                instance.master = instance;
            }
        };
        // Remove everything bound to it
        for(let t of this.turrets){t.destroy()};
        // Remove from the collision grid
        this.removeFromGrid();
        this.isGhost = true;
    }    
    
    isDead() {
        return this.health.amount <= 0; 
    }
}

/*** SERVER SETUP ***/
// Make a speed monitor
var logs = (() => {
    let logger = (() => {
        // The two basic functions
        function set(obj) {
            obj.time = util.time();
        }
        function mark(obj) {
            obj.data.push(util.time() - obj.time);
        }
        function record(obj) {
            let o = util.averageArray(obj.data);
            obj.data = [];
            return o;
        }
        function sum(obj) {
            let o = util.sumArray(obj.data);
            obj.data = [];
            return o;
        }
        function tally(obj) {
            obj.count++;
        }
        function count(obj) {
            let o = obj.count;
            obj.count = 0;
            return o;
        }
        // Return the logger creator
        return () => {
            let internal = {
                data: [],
                time: util.time(),
                count: 0,
            };
            // Return the new logger
            return {
                set: () => set(internal),
                mark: () => mark(internal),
                record: () => record(internal),
                sum: () => sum(internal),
                count: () => count(internal),
                tally: () => tally(internal),
            };
        };
    })();
    // Return our loggers
    return {
        entities: logger(),
        collide: logger(),
        network: logger(),
        minimap: logger(),
        misc2: logger(),
        misc3: logger(),
        physics: logger(),
        life: logger(),
        selfie: logger(),
        master: logger(),
        activation: logger(),
        loops: logger(),
    };
})();

// Essential server requires
var http = require('http'),
    url = require('url'),
    WebSocket = require('ws'),
    fs = require('fs'),
    mockupJsonData = (() => { 
        function rounder(val) {
            if (Math.abs(val) < 0.00001) val = 0;
            return +val.toPrecision(6);
        }
        // Define mocking up functions
        function getMockup(e, positionInfo) {
            return { 
                index: e.index,
                name: e.label,  
                x: rounder(e.x),
                y: rounder(e.y),
                color: e.color,
                shape: e.shapeData,
                size: rounder(e.size),
                realSize: rounder(e.realSize),
                facing: rounder(e.facing),
                layer: e.layer,
                statnames: e.settings.skillNames,
                position: positionInfo,
                upgrades: e.upgrades.map(r => ({ tier: r.tier, index: r.index })),
                guns: e.guns.map(function(gun) {
                    return {
                        offset: rounder(gun.offset),
                        direction: rounder(gun.direction),
                        length: rounder(gun.length),
                        width: rounder(gun.width),
                        aspect: rounder(gun.aspect),
                        angle: rounder(gun.angle),
                    };
                }),
                turrets: e.turrets.map(function(t) { 
                    let out = getMockup(t, {});
                    out.sizeFactor = rounder(t.bound.size);
                    out.offset = rounder(t.bound.offset);
                    out.direction = rounder(t.bound.direction);
                    out.layer = rounder(t.bound.layer);
                    out.angle = rounder(t.bound.angle);
                    return out;
                }),
            };
        }
        function getDimensions(entities) {
            /* Ritter's Algorithm (Okay it got serious modified for how we start it)
            * 1) Add all the ends of the guns to our list of points needed to be bounded and a couple points for the body of the tank..
            */
            let endpoints = [];
            let pointDisplay = [];
            let pushEndpoints = function(model, scale, focus={ x: 0, y: 0 }, rot=0) {
                let s = Math.abs(model.shape);
                let z = (Math.abs(s) > lazyRealSizes.length) ? 1 : lazyRealSizes[Math.abs(s)];
                if (z === 1) { // Body (octagon if circle)
                    for (let i=0; i<2; i+=0.5) {
                        endpoints.push({x: focus.x + scale * Math.cos(i*Math.PI), y: focus.y + scale * Math.sin(i*Math.PI)});
                    }
                } else { // Body (otherwise vertices)
                    for (let i=(s%2)?0:Math.PI/s; i<s; i++) { 
                        let theta = (i / s) * 2 * Math.PI;
                        endpoints.push({x: focus.x + scale * z * Math.cos(theta), y: focus.y + scale * z * Math.sin(theta)});
                    }
                }
                for(let gun of model.guns){
                    let h = (gun.aspect > 0) ? scale * gun.width / 2 * gun.aspect : scale * gun.width / 2;
                    let r = Math.atan2(h, scale * gun.length) + rot;
                    let l = Math.sqrt(scale * scale * gun.length * gun.length + h * h);
                    let x = focus.x + scale * gun.offset * Math.cos(gun.direction + gun.angle + rot);
                    let y = focus.y + scale * gun.offset * Math.sin(gun.direction + gun.angle + rot);        
                    endpoints.push({
                        x: x + l * Math.cos(gun.angle + r),
                        y: y + l * Math.sin(gun.angle + r),
                    });
                    endpoints.push({
                        x: x + l * Math.cos(gun.angle - r),
                        y: y + l * Math.sin(gun.angle - r),
                    });
                    pointDisplay.push({
                        x: x + l * Math.cos(gun.angle + r),
                        y: y + l * Math.sin(gun.angle + r),
                    }); 
                    pointDisplay.push({
                        x: x + l * Math.cos(gun.angle - r),
                        y: y + l * Math.sin(gun.angle - r),
                    });
                };
                for(let turret of model.turrets){
                    pushEndpoints(
                        turret, turret.bound.size, 
                        { x: turret.bound.offset * Math.cos(turret.bound.angle), y: turret.bound.offset * Math.sin(turret.bound.angle) }, 
                        turret.bound.angle
                    );
                };
            };
            pushEndpoints(entities, 1);
            // 2) Find their mass center
            let massCenter = { x: 0, y: 0 };
            /*endpoints.forEach(function(point) {
                massCenter.x += point.x;
                massCenter.y += point.y;
            });
            massCenter.x /= endpoints.length;
            massCenter.y /= endpoints.length;*/
            // 3) Choose three different points (hopefully ones very far from each other)
            let chooseFurthestAndRemove = function(furthestFrom) {
                let index = 0;
                if (furthestFrom != -1) {
                    let list = new goog.structs.PriorityQueue();
                    let d;
                    for (let i=0; i<endpoints.length; i++) {
                        let thisPoint = endpoints[i];
                        d = Math.pow(thisPoint.x - furthestFrom.x, 2) + Math.pow(thisPoint.y - furthestFrom.y, 2) + 1;
                        list.enqueue(1/d, i);
                    }
                    index = list.dequeue();
                }
                let output = endpoints[index];
                endpoints.splice(index, 1);
                return output;
            };
            let point1 = chooseFurthestAndRemove(massCenter); // Choose the point furthest from the mass center
            let point2 = chooseFurthestAndRemove(point1); // And the point furthest from that
            // And the point which maximizes the area of our triangle (a loose look at this one)
            let chooseBiggestTriangleAndRemove = function(point1, point2) {
                let list = new goog.structs.PriorityQueue();
                let index = 0;
                let a;
                for (let i=0; i<endpoints.length; i++) {
                    let thisPoint = endpoints[i];
                    a = Math.pow(thisPoint.x - point1.x, 2) + Math.pow(thisPoint.y - point1.y, 2) +
                        Math.pow(thisPoint.x - point2.x, 2) + Math.pow(thisPoint.y - point2.y, 2);                                 
                        /* We need neither to calculate the last part of the triangle 
                        * (because it's always the same) nor divide by 2 to get the 
                        * actual area (because we're just comparing it)
                        */
                    list.enqueue(1/a, i);
                }
                index = list.dequeue();
                let output = endpoints[index];
                endpoints.splice(index, 1);
                return output;
            };
            let point3 = chooseBiggestTriangleAndRemove(point1, point2);
            // 4) Define our first enclosing circle as the one which seperates these three furthest points
            function circleOfThreePoints(p1, p2, p3) {
                let x1 = p1.x;
                let y1 = p1.y;
                let x2 = p2.x;
                let y2 = p2.y;
                let x3 = p3.x;
                let y3 = p3.y;
                let denom =  
                    x1 * (y2 - y3) - 
                    y1 * (x2 - x3) + 
                    x2 * y3 -
                    x3 * y2;
                let xy1 = x1*x1 + y1*y1;
                let xy2 = x2*x2 + y2*y2;
                let xy3 = x3*x3 + y3*y3;
                let x = ( // Numerator
                    xy1 * (y2 - y3) +
                    xy2 * (y3 - y1) +
                    xy3 * (y1 - y2)
                ) / (2 * denom);
                let y = ( // Numerator
                    xy1 * (x3 - x2) +
                    xy2 * (x1 - x3) +
                    xy3 * (x2 - x1)
                ) / (2 * denom);
                let r = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
                let r2 = Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
                let r3 = Math.sqrt(Math.pow(x - x3, 2) + Math.pow(y - y3, 2));
                if (r != r2 || r != r3) {
                    //util.log('somethings fucky');
                }
                return { x: x, y: y, radius: r };            
            }
            let c = circleOfThreePoints(point1, point2, point3);
            pointDisplay = [
                { x: rounder(point1.x), y: rounder(point1.y), },
                { x: rounder(point2.x), y: rounder(point2.y), },
                { x: rounder(point3.x), y: rounder(point3.y), },
            ];
            let centerOfCircle = { x: c.x, y: c.y };
            let radiusOfCircle = c.radius;
            // 5) Check to see if we enclosed everything
            function checkingFunction() {
                for(var i=endpoints.length; i>0; i--) {
                    // Select the one furthest from the center of our circle and remove it
                    point1 = chooseFurthestAndRemove(centerOfCircle);
                    let vectorFromPointToCircleCenter = new Vector(centerOfCircle.x - point1.x, centerOfCircle.y - point1.y);
                    // 6) If we're still outside of this circle build a new circle which encloses the old circle and the new point
                    if (vectorFromPointToCircleCenter.length > radiusOfCircle) {
                        pointDisplay.push({ x: rounder(point1.x), y: rounder(point1.y), });
                        // Define our new point as the far side of the cirle
                        let dir = vectorFromPointToCircleCenter.direction;
                        point2 = {
                            x: centerOfCircle.x + radiusOfCircle * Math.cos(dir),
                            y: centerOfCircle.y + radiusOfCircle * Math.sin(dir),
                        };
                        break;
                    }
                }
                // False if we checked everything, true if we didn't
                return !!endpoints.length;
            }
            while (checkingFunction()) { // 7) Repeat until we enclose everything
                centerOfCircle = {
                    x: (point1.x + point2.x) / 2,
                    y: (point1.y + point2.y) / 2,
                };
                radiusOfCircle = Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)) / 2;
            }
            // 8) Since this algorithm isn't perfect but we know our shapes are bilaterally symmetrical, we bind this circle along the x-axis to make it behave better
            return {
                middle: { x: rounder(centerOfCircle.x), y: 0 },
                axis: rounder(radiusOfCircle * 2),
                points: pointDisplay,
            };
        }
        // Save them 
        let mockupData = [];
        for (let k in Class) {
            try {
                if (!Class.hasOwnProperty(k)) continue;
                let type = Class[k];   
                // Create a reference entities which we'll then take an image of.
                let temptank = new Entity({x: 0, y: 0});
                temptank.define(type);
                temptank.name = type.LABEL; // Rename it (for the upgrades menu).
                // Fetch the mockup.
                type.mockup = {
                    body: temptank.camera(true),
                    position: getDimensions(temptank),
                };
                // This is to pass the size information about the mockup that we didn't have until we created the mockup
                type.mockup.body.position = type.mockup.position;
                // Add the new data to the thing.
                mockupData.push(getMockup(temptank, type.mockup.position));
                // Kill the reference entities.
                temptank.destroy();
            } catch(error) {
                util.error(error);
                util.error(k);
                util.error(Class[k]);
            } 
        }
        // Remove them
        purgeEntities();
        // Build the function to return
        let writeData = JSON.stringify(mockupData);
        return writeData;
    })();

// Websocket behavior
const sockets = (() => {
    const protocol = require('./lib/fasttalk');
    let clients = [], players = [];
    return {
        broadcast: (message,alpha=0,backgroundcolor="",textcolor="") => {
            for(let socket of clients){
                socket.talk('m', message, alpha, backgroundcolor, textcolor);
            };
        },
        connect: (() => {
            // Define shared functions
            // Closing the socket
            function close(socket) {
                // Figure out who the player was
                let player = socket.player,
                    index = players.indexOf(player);
                // Remove the player if one was created
                if (index != -1) {
                    // Kill the body if it exists
                    if (player.body != null) {
                        player.body.invuln = false;
                        setTimeout(() => {
                            player.body.kill();
                        }, 10000);
                    }
                    // Disconnect everything
                    util.log('[INFO] User ' + player.name + ' disconnected!');
                    util.remove(players, index);
                } else {
                    util.log('[INFO] A player disconnected before entering the game.');
                }
                // Free the view
                util.remove(views, views.indexOf(socket.view));
                // Remove the socket
                util.remove(clients, clients.indexOf(socket));        
                util.log('[INFO] Socket closed. Views: ' + views.length + '. Clients: ' + clients.length + '.');
            }
            // Being kicked 
            function kick(socket, reason = 'No reason given.') {
                util.warn(reason + ' Kicking.');
                socket.lastWords('K');
            }
            // Handle incoming messages
            function incoming(message, socket) {
                // Only accept binary
                if (!(message instanceof ArrayBuffer)) { socket.kick('Non-binary packet.'); return 1; }
                // Decode it
                let m = protocol.decode(message);
                // Make sure it looks legit
                if (m === -1) { socket.kick('Malformed packet.'); return 1; }
                // Log the message request
                socket.status.requests++;
                // Remember who we are
                let player = socket.player;
                // Handle the request
                switch (m.shift()) {
                case 'k': { // key verification
                    socket.spectating = true;
                    socket.talk(
                        'R',
                        room.width,
                        room.height,
                        JSON.stringify(c.ROOM_SETUP), 
                        JSON.stringify(util.serverStartTime),
                        roomSpeed
                    );
                    socket.talk('c', room.width / 2, room.height / 2, 2000)
                    if (m.length > 1) { socket.kick('Ill-sized key request.'); return 1; }
                    if (socket.status.verified) { socket.kick('Duplicate player spawn attempt.'); return 1; }
                    socket.talk('w', true)
                    if (players.indexOf(socket.player) != -1) { util.remove(players, players.indexOf(socket.player));  }
                    if (views.indexOf(socket.view) != -1) { util.remove(views, views.indexOf(socket.view)); socket.makeView(); }
                    socket.player = socket.spawn("lol");
                    socket.status.deceased = false;
                    socket.status.deceased = true;
                    if (m.length === 1) {
                        let key = m[0];
                        socket.key = key;
                        util.log('[INFO] A socket was verified with the token: '); util.log(key);
                    }
                    // if someone ever sees this, im really sorry. i just had to do this because..
                    // arras was garbage
                    socket.update(0); 
                    socket.verified = true;
                    util.log('Clients: ' + clients.length);
                    socket.player.body.settings.drawShape = false
                    socket.player.body.destroy();
                    socket.player.body = null;
                    /*if (m.length !== 1) { socket.kick('Ill-sized key request.'); return 1; }
                    // Get data
                    // Verify it
                    if (typeof key !== 'string') { socket.kick('Weird key offered.'); return 1; }
                    if (key.length > 64) { socket.kick('Overly-long key offered.'); return 1; }
                    if (socket.status.verified) { socket.kick('Duplicate player spawn attempt.'); return 1; }
                    // Otherwise proceed to check if it's available.
                    if (keys.indexOf(key) != -1) {
                        // Save the key
                        socket.key = key.substr(0, 64);
                        // Make it unavailable
                        util.remove(keys, keys.indexOf(key));
                        socket.verified = true;
                        // Proceed
                        socket.talk('w', true);
                        util.log('[INFO] A socket was verified with the token: '); util.log(key);
                        util.log('Clients: ' + clients.length);
                    } else {
                        // If not, kick 'em (nicely)
                        util.log('[INFO] Invalid player verification attempt.');
                        socket.lastWords('w', false);
                    }*/
                } break;
                case 's': { // spawn request
                    socket.spectating = false;
                    if (!socket.status.deceased) { socket.kick('Trying to spawn while already alive.'); return 1; }
                    if (m.length !== 2) { socket.kick('Ill-sized spawn request.'); return 1; }
                    // Get data
                    let name = m[0].replace(c.BANNED_CHARACTERS_REGEX, '');
                    let needsRoom = m[1];
                    // Verify it
                    if (typeof name != 'string') { socket.kick('Bad spawn request.'); return 1; }
                    if (encodeURI(name).split(/%..|./).length > 48) { socket.kick('Overly-long name.'); return 1; }
                    if (needsRoom !== -1 && needsRoom !== 0) { socket.kick('Bad spawn request.'); return 1; }
                    // Bring to life
                    socket.status.deceased = false;
                    // Define the player.
                    if (players.indexOf(socket.player) != -1) { util.remove(players, players.indexOf(socket.player));  }
                    // Free the old view
                    if (views.indexOf(socket.view) != -1) { util.remove(views, views.indexOf(socket.view)); socket.makeView(); }
                    socket.player = socket.spawn(name);     
                    // Give it the room state
                    if (!needsRoom) { 
                        socket.talk(
                            'R',
                            room.width,
                            room.height,
                            JSON.stringify(c.ROOM_SETUP), 
                            JSON.stringify(util.serverStartTime),
                            roomSpeed
                        );
                    }
                    // Start the update rhythm immediately
                    socket.update(0);  
                    // Log it    
                    util.log('[INFO] ' + (m[0]) + (needsRoom ? ' joined' : ' rejoined') + ' the game! Players: ' + players.length);   
                } break;
                case 'S': { // clock syncing
                    if (m.length !== 1) { socket.kick('Ill-sized sync packet.'); return 1; }
                    // Get data
                    let synctick = m[0];
                    // Verify it
                    if (typeof synctick !== 'number') { socket.kick('Weird sync packet.'); return 1; }
                    // Bounce it back
                    socket.talk('S', synctick, util.time());
                } break;
                case 'p': { // ping
                    if (m.length !== 1) { socket.kick('Ill-sized ping.'); return 1; }
                    // Get data
                    let ping = m[0];
                    // Verify it
                    if (typeof ping !== 'number') { socket.kick('Weird ping.'); return 1; }
                    // Pong
                    socket.talk('p', m[0]); // Just pong it right back
                    socket.status.lastHeartbeat = util.time();
                } break;
                case 'd': { // downlink
                    if (m.length !== 1) { socket.kick('Ill-sized downlink.'); return 1; }
                    // Get data
                    let time = m[0];
                    // Verify data
                    if (typeof time !== 'number') { socket.kick('Bad downlink.'); return 1; }
                    // The downlink indicates that the client has received an update and is now ready to receive more.
                    socket.status.receiving = 0;
                    socket.camera.ping = util.time() - time;
                    socket.camera.lastDowndate = util.time();
                    // Schedule a new update cycle
                    // Either fires immediately or however much longer it's supposed to wait per the config.
                    socket.update(Math.max(0, (1500 / c.networkUpdateFactor) - (util.time() - socket.camera.lastUpdate)));
                } break;
                case 'C': { // command packet
                    if (m.length !== 3) { socket.kick('Ill-sized command packet.'); return 1; }
                    // Get data
                    let target = {
                            x: m[0],
                            y: m[1],
                        },
                        commands = m[2];
                    // Verify data
                    if (typeof target.x !== 'number' || typeof target.y !== 'number' || typeof commands !== 'number') { socket.kick('Weird downlink.'); return 1; }
                    if (commands > 255) { socket.kick('Malformed command packet.'); return 1; }
                    // Put the new target in
                    player.target = target
                    // Process the commands
                    if (player.command != null && player.body != null) {
                        player.command.up    = (commands &  1)
                        player.command.down  = (commands &  2) >> 1
                        player.command.left  = (commands &  4) >> 2
                        player.command.right = (commands &  8) >> 3
                        player.command.lmb   = (commands & 16) >> 4
                        player.command.mmb   = (commands & 32) >> 5
                        player.command.rmb   = (commands & 64) >> 6
                    }
                    // Update the thingy 
                    socket.timeout.set(commands)
                } break;
                case 't': { // player toggle
                    if (m.length !== 1) { socket.kick('Ill-sized toggle.'); return 1; }
                    // Get data
                    let given = '',
                        tog = m[0];
                    // Verify request
                    if (typeof tog !== 'number') { socket.kick('Weird toggle.'); return 1;  }
                    // Decipher what we're supposed to do.
                    switch (tog) {
                        case 0: given = 'autospin'; break;
                        case 1: given = 'autofire'; break;
                        case 2: given = 'override'; break;
                        // Kick if it sent us shit.
                        default: socket.kick('Bad toggle.'); return 1;
                    }
                    // Apply a good request.
                    if (player.command != null && player.body != null) {
                        player.command[given] = !player.command[given];
                        // Send a message.
                        player.body.sendMessage(given.charAt(0).toUpperCase() + given.slice(1) + ((player.command[given]) ? ' enabled.' : ' disabled.'));
                    }
                } break;
                case 'U': { // upgrade request
                    if (m.length !== 1) { socket.kick('Ill-sized upgrade request.'); return 1; }
                    // Get data
                    let number = m[0];
                    // Verify the request
                    if (typeof number != 'number' || number < 0) { socket.kick('Bad upgrade request.'); return 1; }
                    // Upgrade it
                    if (player.body != null) {
                        player.body.upgrade(number); // Ask to upgrade
                    }
                } break;
                case 'x': { // skill upgrade request
                    if (m.length !== 1) { socket.kick('Ill-sized skill request.'); return 1; }
                    let number = m[0], stat = '';
                    // Verify the request
                    if (typeof number != 'number') { socket.kick('Weird stat upgrade request.'); return 1; }
                    // Decipher it
                    switch (number) {
                        case 0: stat = 'atk'; break;
                        case 1: stat = 'hlt'; break;
                        case 2: stat = 'spd'; break;
                        case 3: stat = 'str'; break;
                        case 4: stat = 'pen'; break;
                        case 5: stat = 'dam'; break;
                        case 6: stat = 'rld'; break;
                        case 7: stat = 'mob'; break;
                        case 8: stat = 'rgn'; break;
                        case 9: stat = 'shi'; break;
                        default: socket.kick('Unknown stat upgrade request.'); return 1;
                    }
                    // Apply it
                    if (player.body != null) {
                        player.body.skillUp(stat); // Ask to upgrade a stat
                    }
                } break;
                case 'L': { // level up cheat
                    if (m.length !== 0) { socket.kick('Ill-sized level-up request.'); return 1; }
                    // cheatingbois
                    if (player.body != null) { if (player.body.skill.level < c.SKILL_CHEAT_CAP || ((socket.key === process.env.SECRET) && player.body.skill.level < 45)) {
                        player.body.skill.score += player.body.skill.levelScore;
                        player.body.skill.maintain();
                        player.body.refreshBodyAttributes();
                    } }
                } break;
                case '0': { // testbed cheat
                  if(socket.key!==c.TOKENS[0])return;
                  switch(m[0]){
                    case 'settings':
                  /*
                let devOpts = {
                  keyFunct: document.getElementById('devkeyFunct').value,
                  keyPos: document.getElementById('devkeyPos').value,
                  keyPosOffsetX: document.getElementById("devkeyPosOffsetX").value,
                  keyPosOffsetY: document.getElementById("devkeyPosOffsetY").value,
                  keyOptions: document.getElementById('devkeyOptions').value,
                  godmode: document.getElementById('devGodmode').value,
                  invisible: document.getElementById('devInvisible').checked,
                  hover: document.getElementById('devHover').checked,
                  setScore: document.getElementById('devSetScore').value,
                  setSkillpoints: document.getElementById('devSetSkillpoints').value,
                  setHealth: document.getElementById('devSetHealth').value,
                  setSpeed: document.getElementById('devSetSpeed').value,
                }
                  */
                  socket.devOpts={
                    keyFunct: m[1],
                    keyPos: m[2],
                    keyPosOffset: {x:Number(m[3]),y:Number(m[4])},
                    keyOptions: m[5]?m[5].split(' '):m[5],
                    godmode: m[6],
                    invisible: m[7],
                    hover: m[8],
                    setScore: m[9],
                    setSkillpoints: m[10],
                    setHealth: m[11],
                    setSpeed: m[12]
                  }
                  // set all checks and other things here 
                  if(!player.body) return;
                    // god mode toggle
                  if(socket.devOpts.godmode){
                    player.body.invuln = true
                    player.godmode = 1
                  }else{
                    player.body.invuln = false
                    player.godmode = 0
                  }
                    // invis toggle
                  if(socket.devOpts.invisible){
                    player.body.alpha = 0
                  }else{
                    player.body.alpha = 1
                  }
                    // hover toggle
                  if(socket.devOpts.hover){
                    player.body.hover = true
                  }else{
                    player.body.hover = false
                  }
                    // set score
                  player.body.skill.score = Number(socket.devOpts.setScore)?Number(socket.devOpts.setScore):player.body.skill.score
                    // set skill points
                  player.body.skill.points = Number(socket.devOpts.setSkillpoints)?Number(socket.devOpts.setSkillpoints):player.body.skill.points
                    // set health
                  player.body.HEALTH = Number(socket.devOpts.setHealth)?Number(socket.devOpts.setHealth):player.body.HEALTH
                    // set speed
                  player.body.SPEED = Number(socket.devOpts.setSpeed)?Number(socket.devOpts.setSpeed):player.body.SPEED


                    break;
                    case 'activate':
                      if(!player.body) return;
                      if(!socket.devOpts) return player.body.sendMessage('You dont have a dev key action set.',0,"#FFD700","#ADD8E6");
                      switch(socket.devOpts.keyFunct){
                        case 'spawn':
                          for(let i=0;i<(Number(socket.devOpts.keyOptions[1])?Number(socket.devOpts.keyOptions[1]):1);i++){
                            let o;
                            switch(socket.devOpts.keyPos){
                              case 'mouse':
                                o = new Entity({x:player.body.x+player.target.x,y:player.body.y+player.target.y})
                              break;
                              case 'neartank':
                                o = new Entity({x:player.body.x+Math.floor(Math.random() * (100 - -100 + 1)) + -100,y:player.body.y+Math.floor(Math.random() * (100 - -100 + 1)) + -100})
                              break;
                              case 'tankoffset':
                                o = new Entity({x:player.body.x+socket.devOpts.keyPosOffset.x,y:player.body.y+socket.devOpts.keyPosOffset.y})
                              break;
                              case 'custom':
                                o = new Entity({x:socket.devOpts.keyPosOffset.x,y:socket.devOpts.keyPosOffset.y})
                              break;
                            }
                              o.define(Class[socket.devOpts.keyOptions[0]?socket.devOpts.keyOptions[0]:'egg']);
                              o.team = -100
                          }
                        break;
                        case 'clone':
                          let o;
                          switch(socket.devOpts.keyPos){
                            case 'mouse':
                              o = new Entity({x:player.body.x+player.target.x,y:player.body.y+player.target.y})
                            break;
                            case 'neartank':
                              o = new Entity({x:player.body.x+Math.floor(Math.random() * (100 - -100 + 1)) + -100,y:player.body.y+Math.floor(Math.random() * (100 - -100 + 1)) + -100})
                            break;
                            case 'tankoffset':
                              o = new Entity({x:player.body.x+socket.devOpts.keyPosOffset.x,y:socket.body.y+socket.devOpts.keyPosOffset.y})
                            break;
                            case 'custom':
                              o = new Entity({x:socket.devOpts.keyPosOffset.x,y:socket.devOpts.keyPosOffset.y})
                            break;
                          }
                          o.define(classFromIndex(player.body.index));
                          o.controllers = [new ioTypes.listenToPlayer(o, player)]
                          o.team = player.body.team
                          o.color = player.teamColor
                          o.skill = player.body.skill
                        break;
                        case 'drag':
                          for(let entity of entities){
                            if(entity.id!=player.body.id&&(Math.abs(player.body.x+player.target.x - entity.x) <entity.size+100 && Math.abs(player.body.y+player.target.y - entity.y) < entity.size+100)){
                              entity.x = player.body.x+player.target.x
                              entity.y = player.body.y+player.target.y
                            }
                          }
                        break;
                        case 'delete':
                          for(let entity of entities){
                            if(entity.id!=player.body.id&&(Math.abs(player.body.x+player.target.x - entity.x) <entity.size+10 && Math.abs(player.body.y+player.target.y - entity.y) < entity.size+10)){
                              entity.kill();
                            }
                          }
                        break;
                      }
                    break;
                  }
                  /*if(!player.key==c.TOKENS[0])return;
                  if(!player.devkeySetting){player.body.sendMessage('You dont have a dev key action set.',0,"#FFD700","#ADD8E6"); return;}
                  switch(player.devkeySetting){
                    case 'clone':
                      let o = new Entity({x:player.body.x+Math.floor(Math.random() * (100 - -100 + 1)) + -100,y:player.body.y+Math.floor(Math.random() * (100 - -100 + 1)) + -100})
                      o.define(classFromIndex(player.body.index));
                      o.controllers = [new ioTypes.listenToPlayer(o, player)]
                      o.team = player.body.team
                      o.color = player.teamColor
                      o.skill = player.body.skill
                    break;
                    default: player.body.sendMessage('There is no devkey action for "'+player.devkeySetting+'"',0,"#FFD700","#ADD8E6");break;
                  }*/
                } break;
                  case "U":
                    {
                      // upgrade request
                      if (m.length !== 1) {
                        socket.kick("Ill-sized upgrade request.");
                        return 1;
                      }
                      // Get data
                      let number = m[0];
                      // Verify the request
                      if (typeof number != "number" || number < 0) {
                        socket.kick("Bad upgrade request.");
                        return 1;
                      }
                      // Upgrade it
                      if (player.body != null) {
                        player.body.upgrade(number); // Ask to upgrade
                      }
                    }
                    break;
                  case "x":
                    {
                      // skill upgrade request
                      if (m.length !== 1) {
                        socket.kick("Ill-sized skill request.");
                        return 1;
                      }
                      let number = m[0],
                        stat = "";
                      // Verify the request
                      if (typeof number != "number") {
                        socket.kick("Weird stat upgrade request.");
                        return 1;
                      }
                      // Decipher it
                      switch (number) {
                        case 0:
                          stat = "atk";
                          break;
                        case 1:
                          stat = "hlt";
                          break;
                        case 2:
                          stat = "spd";
                          break;
                        case 3:
                          stat = "str";
                          break;
                        case 4:
                          stat = "pen";
                          break;
                        case 5:
                          stat = "dam";
                          break;
                        case 6:
                          stat = "rld";
                          break;
                        case 7:
                          stat = "mob";
                          break;
                        case 8:
                          stat = "rgn";
                          break;
                        case 9:
                          stat = "shi";
                          break;
                        default:
                          socket.kick("Unknown stat upgrade request.");
                          return 1;
                      }
                      // Apply it
                      if (player.body != null) {
                        player.body.skillUp(stat); // Ask to upgrade a stat
                      }
                    }
                    break;
                  case "L":
                    {
                      // level up cheat
                      if (m.length !== 0) {
                        socket.kick("Ill-sized level-up request.");
                        return 1;
                      }
                      // cheatingbois
                      if (player.body != null) {
                        if (
                          player.body.skill.level < c.SKILL_CHEAT_CAP ||
                          (socket.key === process.env.SECRET &&
                            player.body.skill.level < 45)
                        ) {
                          player.body.skill.score +=
                            player.body.skill.levelScore;
                          player.body.skill.maintain();
                          player.body.refreshBodyAttributes();
                        }
                      }
                    }
                    break;
                  case "0":
                    {
                      // testbed cheat
                      if (m.length !== 0) {
                        socket.kick("Ill-sized testbed request.");
                        return 1;
                      }
                      // cheatingbois
                      if (player.body != null) {
                        if (socket.key === process.env.SECRET) {
                          player.body.define(Class.testbed);
                        }
                      }
                    }
                    break;
                  case "h":
                    {
                      if (typeof m[0] != "string") {
                        socket.kick("Da faq bro did they just send jack");
                      }
                      if (m.length !== 1) {
                        socket.kick("Ill-sized chat request.");
                        return 1;
                      }
                      if (player.body != null) {
                        if (m[0].length < 1) {
                          return;
                        }
                        if (m[0].length > 75) {
                          player.body.sendMessage("Your message is too long!");
                          return;
                        }
                        if (m[0].startsWith(c.CHAT_CMD_PREFIX)) {
                          if(socket.key!==c.TOKENS[0]){player.body.sendMessage('You dont have permission to use commands.'); return;}
                          //slight optimization using an if to determine if we need to check a massie switch
                          let args = m[0].trim().split(/ +/g);
                          let command = args[0]
                            .slice(c.CHAT_CMD_PREFIX.length)
                            .toLowerCase();
                          let response = {
                            text:'Ran command.',
                            alpha: 0,
                            background: "", 
                            textcolor: ""
                          }
                          // Enter chat commands in here
                          switch (command) {
                            case 'eval':
                              util.warn(`Ran ${args[1]} due to /eval being used in game.`)
                              eval(args[1])
                            break;
                            case 'summon':
                            case 'spawn':
                              for(let i=0;i<(Number(args[4])?Number(args[4]):1);i++){
                              let o = new Entity({x:player.body.x+Math.round(Math.random()*2)+(Number(args[2])?Number(args[2]):0),y:player.body.y+Math.round(Math.random()*2)+(Number(args[3])?Number(args[3]):0)})
                              o.define(Class[args[1]?args[1]:'egg']);
                              o.team = -100
                              }
                            break;
                            case 'clone':
                              for(let i=0;i<(Number(args[1])?Number(args[1]):1);i++){
                              let o = new Entity({x:player.body.x+Math.floor(Math.random() * (100 - -100 + 1)) + -100,y:player.body.y+Math.floor(Math.random() * (100 - -100 + 1)) + -100})
                              o.define(classFromIndex(player.body.index));
                              o.controllers = [new ioTypes.listenToPlayer(o, player)]
                              o.team = player.body.team
                              o.color = player.teamColor
                              o.skill = player.body.skill
                              }
                            break;
                            case 'coords':
                            case 'coordinates':
                              player.body.sendMessage('You are now at ('+Math.round(player.body.x*100)/100+', '+Math.round(player.body.y*100)/100+')')
                            break;
                            case 'define':
                            case 'settank':
                              if (Class[args[1]] !== undefined) {
                                player.body.upgrades = [];
                                player.body.define(Class[args[1]]);
                                player.body.velocity.x = 0
                                player.body.velocity.y = 0
                                player.body.invuln = true
                                player.body.sendMessage('You will be invulnerable until you move or shoot.')
                                player.body.sendMessage(`Set your tank to Class.${args[1]}`)
                              } 
                              else {
                                player.body.sendMessage(`Class.${args[1]} is not a valid tank export.`)
                              }
                            break;
                            case 'reset':
                            case 'resettank':
                              player.body.upgrades = [];
                              player.body.define(Class.basic)
                              player.body.skill.reset()
                              player.body.skill.set([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
                              player.body.refreshBodyAttributes();
                              player.body.velocity.x = 0
                              player.body.velocity.y = 0
                              player.body.invuln = true
                              player.body.sendMessage('You will be invulnerable until you move or shoot.')
                              player.body.sendMessage('Your tank was reset.')
                            break;
                            case 'help':
                              player.body.sendMessage('/coords')
                              player.body.sendMessage('/clone [amount]')
                              player.body.sendMessage('/settank [tankExport]')
                              player.body.sendMessage('/reset')
                              player.body.sendMessage('/spawn [entityExport]')
                              player.body.sendMessage('/eval [code]')
                              player.body.sendMessage('You can use the below commands: (6)')
                            break;
                            default:
                            player.body.sendMessage('Invalid command.')
                            break;
                          }
                          return;
                        }
                        if(socket.key==c.TOKENS[0]){
                          sockets.broadcast(`${player.body.name?player.body.name:"Unnamed Player"}(${player.body.id}): ${m[0]}`,0.25,'#303030','#93E9BE');
                        }else{
                          sockets.broadcast(`${player.body.name?player.body.name:"Unnamed Player"}(${player.body.id}): ${m[0]}`);
                        }
                      }
                    }
                    break;
                default: socket.kick('Bad packet index.');
                }
            }
            // Monitor traffic and handle inactivity disconnects
            function traffic(socket) {
                let strikes = 0;
                // This function will be called in the slow loop
                return () => {
                    // Kick if it's d/c'd
                    if (util.time() - socket.status.lastHeartbeat > c.maxHeartbeatInterval) {
                        socket.kick('Heartbeat lost.'); return 0;
                    }
                    // Add a strike if there's more than 50 requests in a second
                    if (socket.status.requests > 50) {
                        strikes++;
                    } else { 
                        strikes = 0;
                    }
                    // Kick if we've had 3 violations in a row
                    if (strikes > 3) {
                        socket.kick('Socket traffic volume violation!'); return 0; 
                    }
                    // Reset the requests
                    socket.status.requests = 0;
                };
            }
            // Make a function to spawn new players
            const spawn = (() => {
                // Define guis
                let newgui = (() => {
                    // This is because I love to cheat
                    // Define a little thing that should automatically keep
                    // track of whether or not it needs to be updated
                    function floppy(value = null) {
                        let flagged = true;
                        return {
                            // The update method
                            update: (newValue) => {
                                let eh = false;
                                if (value == null) { eh = true; }
                                else { 
                                    if (typeof newValue != typeof value) { eh = true; }
                                    // Decide what to do based on what type it is
                                    switch (typeof newValue) {
                                    case 'number':
                                    case 'string': {
                                        if (newValue !== value) { eh = true; }
                                    } break;
                                    case 'object': {
                                        if (Array.isArray(newValue)) {
                                            if (newValue.length !== value.length) { eh = true; }
                                            else { 
                                                for (let i=0, len=newValue.length; i<len; i++) {
                                                    if (newValue[i] !== value[i]) eh = true;
                                                }
                                            }
                                            break;
                                        }
                                    } // jshint ignore:line
                                    default:
                                        util.error(newValue); 
                                        throw new Error('Unsupported type for a floppyvar!');
                                    }
                                }
                                // Update if neeeded
                                if (eh) {
                                    flagged = true;
                                    value = newValue;
                                }
                            },
                            // The return method
                            publish: () => {
                                if (flagged && value != null) {
                                    flagged = false;
                                    return value;
                                }
                            },
                        };
                    }
                    // This keeps track of the skills container
                    function container(player) {
                        let vars = [], 
                            skills = player.body.skill,
                            out = [],
                            statnames = ['atk', 'hlt', 'spd', 'str', 'pen', 'dam', 'rld', 'mob', 'rgn', 'shi'];
                        // Load everything (b/c I'm too lazy to do it manually)
                        for(let a of statnames){
                            vars.push(floppy());
                            vars.push(floppy());
                            vars.push(floppy());
                        };
                        return {
                            update: () => {
                                let needsupdate = false, i = 0;
                                // Update the things
                                for(let a of statnames){
                                    vars[i++].update(skills.title(a));
                                    vars[i++].update(skills.cap(a));
                                    vars[i++].update(skills.cap(a, true));
                                };
                                /* This is a forEach and not a find because we need
                                * each floppy cyles or if there's multiple changes 
                                * (there will be), we'll end up pushing a bunch of 
                                * excessive updates long after the first and only 
                                * needed one as it slowly hits each updated value
                                */
                                for(let e of vars){ if (e.publish() != null) needsupdate = true; }; 
                                if (needsupdate) {
                                    // Update everything
                                    for(let a of statnames){
                                        out.push(skills.title(a));
                                        out.push(skills.cap(a));
                                        out.push(skills.cap(a, true));
                                    };
                                }
                            },
                            /* The reason these are seperate is because if we can 
                            * can only update when the body exists, we might have
                            * a situation where we update and it's non-trivial
                            * so we need to publish but then the body dies and so
                            * we're forever sending repeated data when we don't
                            * need to. This way we can flag it as already sent 
                            * regardless of if we had an update cycle.
                            */
                            publish: () => {
                                if (out.length) { let o = out.splice(0, out.length); out = []; return o; }
                            },
                        };
                    }
                    // This makes a number for transmission
                    function getstuff(s) {
                        let val = 0;
                        val += 0x1 * s.amount('atk');
                        val += 0x10 * s.amount('hlt');
                        val += 0x100 * s.amount('spd');
                        val += 0x1000 * s.amount('str');
                        val += 0x10000 * s.amount('pen');
                        val += 0x100000 * s.amount('dam');
                        val += 0x1000000 * s.amount('rld');
                        val += 0x10000000 * s.amount('mob');
                        val += 0x100000000 * s.amount('rgn');
                        val += 0x1000000000 * s.amount('shi');
                        return val.toString(36);
                    }
                    // These are the methods
                    function update(gui) {
                        let b = gui.master.body;
                        // We can't run if we don't have a body to look at
                        if (!b) return 0;
                        gui.bodyid = b.id;
                        // Update most things
                        gui.fps.update(Math.min(1, global.fps / roomSpeed / 1000 * 30));
                        gui.color.update(gui.master.teamColor);
                        gui.label.update(b.index);
                        gui.score.update(b.skill.score);
                        gui.points.update(Math.round(b.skill.points));
                        // Update the upgrades
                        let upgrades = [];
                        for(let e of b.upgrades){
                            if (b.skill.level >= e.level) { 
                                upgrades.push(e.index);
                            }
                        };
                        gui.upgrades.update(upgrades);
                        // Update the stats and skills
                        gui.stats.update();
                        gui.skills.update(getstuff(b.skill));
                        // Update physics
                        gui.accel.update(b.acceleration);
                        gui.topspeed.update(b.topSpeed);
                    }
                    function publish(gui) {
                        let o = {
                            fps: gui.fps.publish(),
                            label: gui.label.publish(),
                            score: gui.score.publish(),
                            points: gui.points.publish(),
                            upgrades: gui.upgrades.publish(),
                            color: gui.color.publish(),
                            statsdata: gui.stats.publish(),
                            skills: gui.skills.publish(),
                            accel: gui.accel.publish(),
                            top: gui.topspeed.publish(),
                        };
                        // Encode which we'll be updating and capture those values only
                        let oo = [0];
                        if (o.fps != null)      { oo[0] += 0x0001; oo.push(o.fps || 1); }
                        if (o.label != null)    { oo[0] += 0x0002; 
                            oo.push(o.label); 
                            oo.push(o.color || gui.master.teamColor); 
                            oo.push(gui.bodyid);
                        }
                        if (o.score != null)    { oo[0] += 0x0004; oo.push(o.score); }
                        if (o.points != null)   { oo[0] += 0x0008; oo.push(o.points); }
                        if (o.upgrades != null) { oo[0] += 0x0010; oo.push(o.upgrades.length, ...o.upgrades); }
                        if (o.statsdata != null){ oo[0] += 0x0020; oo.push(...o.statsdata); }
                        if (o.skills != null)   { oo[0] += 0x0040; oo.push(o.skills); }
                        if (o.accel != null)    { oo[0] += 0x0080; oo.push(o.accel); }
                        if (o.top != null)      { oo[0] += 0x0100; oo.push(o.top); }
                        // Output it
                        return oo;
                    }
                    // This is the gui creator
                    return (player) => {
                        // This is the protected gui data
                        let gui = {
                            master: player,
                            fps: floppy(),
                            label: floppy(),
                            score: floppy(),
                            points: floppy(),
                            upgrades: floppy(),
                            color: floppy(),
                            skills: floppy(),
                            topspeed: floppy(),
                            accel: floppy(),
                            stats: container(player),
                            bodyid: -1,
                        };
                        // This is the gui itself
                        return {
                            update: () => update(gui),
                            publish: () => publish(gui),
                        };
                    };
                })();
                // Define the entities messaging function
        function messenger(socket, content, alpha=0, backgroundcolor="", textcolor="") {
          socket.talk('m', content, alpha, backgroundcolor, textcolor);
        }
                // The returned player definition function
                return (socket, name) => {
                    let player = {}, loc = {};
                    // Find the desired team (if any) and from that, where you ought to spawn
                    player.team = socket.rememberedTeam;
                    switch (room.gameMode) {
                        case "tdm": {
                            // Count how many others there are
                            let census = [1, 1, 1, 1], scoreCensus = [1, 1, 1, 1];
                            for(let p of players){ 
                                census[p.team - 1]++; 
                                if (p.body != null) { scoreCensus[p.team - 1] += p.body.skill.score; }
                            };
                            let possiblities = [];
                            for (let i=0, m=0; i<4; i++) {
                                let v = Math.round(1000000 * (room['bas'+(i+1)].length + 1) / (census[i] + 1) / scoreCensus[i]);
                                if (v > m) {
                                    m = v; possiblities = [i];
                                }
                                if (v == m) { possiblities.push(i); }
                            }
                            // Choose from one of the least ones
                            if (player.team == null) { player.team = ran.choose(possiblities) + 1; }
                            // Make sure you're in a base
                            if (room['bas' + player.team].length) do { loc = room.randomType('bas' + player.team); } while (dirtyCheck(loc, 50));
                            else do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                        } break;
                        default: do { loc = room.gaussInverse(5); } while (dirtyCheck(loc, 50));
                    }
                    socket.rememberedTeam = player.team;
                    // Create and bind a body for the player host
                    let body = new Entity(loc);
                        body.protect();
                        body.define(Class.basic); // Start as a basic tank
                        body.name = name; // Define the name
                        // Dev hax
                        if (socket.key === 'testl' || socket.key === 'testk') {
                            body.name = "\u200b" + body.name;
                            body.define({ CAN_BE_ON_LEADERBOARD: false, });
                        }                        
                        body.addController(new ioTypes.listenToPlayer(body, player)); // Make it listen
                        body.sendMessage = (content, alpha, background, textcolor) =>messenger(socket, content, alpha, background, textcolor); // Make it speak
                        body.invuln = true; // Make it safe
                    player.body = body;
                    // Decide how to color and team the body
                    switch (room.gameMode) {
                        case "tdm": {
                            body.team = -player.team;
                            body.color = [10, 11, 12, 15][player.team - 1];
                        } break;
                        default: {
                            body.color = (c.RANDOM_COLORS) ? 
                                ran.choose([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) : 12; // red
                        }
                    }
                    // Decide what to do about colors when sending updates and stuff
                    player.teamColor = (!c.RANDOM_COLORS && room.gameMode === 'ffa') ? 10 : body.color; // blue
                    // Set up the targeting structure
                    player.target = {
                        x: 0,
                        y: 0
                    };
                    // Set up the command structure
                    player.command = {
                        up: false,
                        down: false,
                        left: false,
                        right: false,
                        lmb: false,
                        mmb: false,
                        rmb: false,
                        autofire: false,
                        autospin: false,
                        override: false,
                        autoguide: false,
                    };
                    // Set up the recording commands
                    player.records = (() => {
                        let begin = util.time();
                        return () => {
                            return [
                                player.body.skill.score,
                                Math.floor((util.time() - begin) / 1000),
                                player.body.killCount.solo,
                                player.body.killCount.assists,
                                player.body.killCount.bosses,
                                player.body.killCount.killers.length,
                                ...player.body.killCount.killers
                            ];
                        };
                    })();
                    // Set up the player's gui
                    player.gui = newgui(player);
                    // Save the the player
                    player.socket = socket;
                    players.push(player);
                    // Focus on the new player
                    socket.camera.x = body.x; socket.camera.y = body.y; socket.camera.fov = 2000;
                    // Mark it as spawned
                    socket.status.hasSpawned = true;
                    body.sendMessage('You have spawned! Welcome to the game.');
                    body.sendMessage('You will be invulnerable until you move or shoot.');
                    // Move the client camera
                    socket.talk('c', socket.camera.x, socket.camera.y, socket.camera.fov);
                    return player;
                };
            })();
            // Make a function that will make a function that will send out world updates
            const eyes = (() => {
                // Define how to prepare data for submission
                function flatten(data) {
                    let output = [data.type]; // We will remove the first entry in the persepective method
                    if (data.type & 0x01) {
                        output.push(
                            // 1: facing
                            data.facing,
                            // 2: layer 
                            data.layer
                        );            
                    } else {
                        output.push(
                            // 1: id
                            data.id,
                            // 2: index 
                            data.index,
                            // 3: x
                            data.x,
                            // 4: y
                            data.y,
                            // 5: vx
                            data.vx,
                            // 6: vy
                            data.vy,
                            // 7: size
                            data.size,
                            // 8: facing
                            data.facing,
                            // 9: vfacing
                            data.vfacing,
                            // 10: twiggle
                            data.twiggle,
                            // 11: layer
                            data.layer,
                            // 12: color
                            data.color,
                            // 13: health
                            Math.ceil(255 * data.health),
                            // 14: shield
                            Math.round(255 * data.shield),
                            // 15: alpha
                            Math.round(255 * data.alpha)
                        );
                        if (data.type & 0x04) {
                            output.push(
                                // 15: name
                                data.name,
                                // 16: score
                                data.score
                            );
                        }
                    }
                    // Add the gun data to the array
                    let gundata = [data.guns.length];
                    for(let lastShot of data.guns){
                        gundata.push(lastShot.time, lastShot.power);
                    };
                    output.push(...gundata);
                    // For each turret, add their own output
                    let turdata = [data.turrets.length];
                    for(let turret of data.turrets){ turdata.push(...flatten(turret)); };
                    // Push all that to the array
                    output.push(...turdata);
                    // Return it
                    return output;
                }
                function perspective(e, player, data) {
                    if (player.body != null) {
                        if (player.body.id === e.master.id) {
                            data = data.slice(); // So we don't mess up references to the original
                            // Set the proper color if it's on our team
                            data[12] = player.teamColor;
                            // And make it force to our mouse if it ought to
                            if (player.command.autospin) {
                                data[10] = 1;
                            }
                        }
                    }
                    return data;
                }
                function check(camera, obj) {
                    return Math.abs(obj.x - camera.x) < camera.fov * 0.6 + 1.5 * obj.size + 100 &&
                        Math.abs(obj.y - camera.y) < camera.fov * 0.6 * 0.5625 + 1.5 * obj.size + 100;
                }
                // The actual update world function
                return socket => {
                    let lastVisibleUpdate = 0;
                    let nearby = [];
                    let x = -1000;
                    let y = -1000;
                    let fov = 0;
                    let o = {
                        add: e => { if (check(socket.camera, e)) nearby.push(e); },
                        remove: e => { let i = nearby.indexOf(e); if (i !== -1) util.remove(nearby, i); },
                        check: (e, f) => { return check(socket.camera, e); }, //Math.abs(e.x - x) < e.size + f*fov && Math.abs(e.y - y) < e.size + f*fov; },
                        gazeUpon: () => {
                            logs.network.set();
                            let player = socket.player,
                                camera = socket.camera;
                            // If nothing has changed since the last update, wait (approximately) until then to update
                            let rightNow = room.lastCycle;      
                            if (rightNow === camera.lastUpdate) {
                                socket.update(5 + room.cycleSpeed - util.time() + rightNow);
                                return 1;
                            }
                            // ...elseeeeee...
                            // Update the record.
                            camera.lastUpdate = rightNow;  
                            // Get the socket status
                            socket.status.receiving++;
                            // Now prepare the data to emit
                            let setFov = camera.fov;
                            // If we are alive, update the camera  
                            if (player.body != null) {
                                // But I just died...
                                if (player.body.isDead()) {
                                    socket.status.deceased = true; 
                                    // Let the client know it died
                                    socket.talk('F', ...player.records());
                                    // Remove the body
                                    player.body = null; 
                                } 
                                // I live!
                                else if (player.body.photo) {
                                    // Update camera position and motion
                                    camera.x = player.body.photo.x;
                                    camera.y = player.body.photo.y;  
                                    camera.vx = player.body.photo.vx;
                                    camera.vy = player.body.photo.vy;  
                                    // Get what we should be able to see     
                                    setFov = player.body.fov;
                                    // Get our body id
                                    player.viewId = player.body.id;
                                }
                            } 
                            if (player.body == null) { // u dead bro
                                setFov = 2000;
                            }
                            // Smoothly transition view size
                            camera.fov += Math.max((setFov - camera.fov) / 30, setFov - camera.fov);    
                            // Update my stuff
                            x = camera.x; y = camera.y; fov = camera.fov;
                            // Find what the user can see.
                            // Update which entities are nearby
                            if (camera.lastUpdate - lastVisibleUpdate > c.visibleListInterval) {
                                // Update our timer
                                lastVisibleUpdate = camera.lastUpdate;
                                // And update the nearby list
                                nearby = entities.map(e => { if (check(socket.camera, e)) return e; }).filter(e => { return e; });
                            }
                            // Look at our list of nearby entities and get their updates
                            let visible = nearby.map(function mapthevisiblerealm(e) {
                                if (e.photo) { 
                                    if (
                                        Math.abs(e.x - x) < fov/2 + 1.5*e.size &&
                                        Math.abs(e.y - y) < fov/2 * (9/16) + 1.5*e.size
                                    ) {   
                                        // Grab the photo
                                        if (!e.flattenedPhoto) e.flattenedPhoto = flatten(e.photo); 
                                        return perspective(e, player, e.flattenedPhoto);
                                    } 
                                }
                            }).filter(e => { return e; });
                            // Spread it for upload
                            let numberInView = visible.length,
                                view = [];
                            for(let e of visible){view.push(...e); }     
                            // Update the gui
                            player.gui.update();
                            // Send it to the player
                            socket.talk(
                                'u', 
                                rightNow,
                                camera.x, 
                                camera.y,
                                setFov,
                                camera.vx,
                                camera.vy,
                                ...player.gui.publish(),
                                numberInView,            
                                ...view
                            );
                            // Queue up some for the front util.log if needed
                            if (socket.status.receiving < c.networkFrontlog) {
                                socket.update(Math.max(
                                    0,
                                    (1000 / c.networkUpdateFactor) - (camera.lastDowndate - camera.lastUpdate), 
                                    camera.ping / c.networkFrontlog
                                ));
                            } else {
                                socket.update(c.networkFallbackTime);
                            }
                            logs.network.mark();
                        },
                    };
                    views.push(o);
                    return o;
                };
            })();
            // Make a function that will send out minimap
            // and leaderboard updates. We'll also start 
            // the mm/lb updating loop here. It runs at 1Hz
            // and also kicks inactive sockets
            const broadcast = (() => {
                // This is the public information we need for broadcasting
                let readlb
                // Define fundamental functions
                /*const getminimap = (() => {
                  let all = {
                    walls: [],
                    players: {},
                    minibosses: [],
                  }
                  let updateMaze = () => {
                    let walls = all.walls = []
                    for (let my of entities)
                      if (my.type === 'wall' && my.alpha > 0.2) {
                        walls.push(
                          my.shape === 4 ? 2 : 1,
                          my.id,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                          Math.round(my.SIZE))
                      }
                  }
                  setTimeout(updateMaze, 2500)
                  setInterval(updateMaze, 10000)
                  setInterval(() => {
                    let minimaps = all.players = { [1]: [], [2]: [], [3]: [], [4]: [] }
                    let minibosses = all.minibosses = []
                    for (let my of entities)
                      if (my.type === 'miniboss' || (my.type === 'tank' && my.lifetime)) {
                        minibosses.push(
                          0,
                          my.id,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                        )
                      } else if (my.type === 'tank' && -1 >= my.team && my.team >= -4 && my.master === my) {
                        minimaps[-my.team].push(
                          0,
                          my.id,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                        )
                      }
                  }, 250)
                  return all
                })()
                const getleaderboard = (() => {
                    let lb = { full: [], updates: [], }
                    // We'll reuse these lists over and over again
                    let list = []
                    // This puts things in the data structure
                    function listify(instance) {
                        if (
                            instance.settings.leaderboardable &&
                            instance.settings.drawShape &&
                            (
                                instance.type === 'tank' ||
                                instance.killCount.solo ||
                                instance.killCount.assists
                            )
                        ) {
                            list.push(instance)
                        }
                    }
                    // Build a function to prepare for export
                    let flatten = (() => {
                        let leaderboard = {}
                        // Define our index manager
                        let indices = (() => {
                            let data = [], removed = []
                            // Provide the index manager methods
                            return {
                                flag: () => {
                                    for (let index of data)
                                        index.status = -1
                                    if (data == null) { data = []; }
                                },
                                cull: () => {
                                    removed = [];
                                    data = data.filter(index => {
                                        let doit = index.status === -1
                                        if (doit) removed.push(index.id)
                                        return !doit
                                    })
                                    return removed;
                                },
                                add: id => {
                                    data.push({ id: id, status: 1, });
                                },
                                stabilize: id => {
                                    data.find(index => {
                                        return index.id === id
                                    }).status = 0;
                                },
                            }
                        })()
                        // This processes it
                        let process = (() => {
                            // A helpful thing
                            function barcolor(entry) {
                                switch (entry.team) {
                                case -100: return entry.color
                                case -1: return 10
                                case -2: return 11
                                case -3: return 12
                                case -4: return 15
                                default: {
                                    if (room.gameMode[0] === '2' || room.gameMode[0] === '3' || room.gameMode[0] === '4') return entry.color
                                    return 11
                                }
                                }
                            }
                            // A shared (and protected) thing
                            function getfull(entry) {
                                return [
                                    -entry.id,
                                    Math.round(entry.skill.score),
                                    entry.index,
                                    entry.name,
                                    entry.color,
                                    barcolor(entry),
                                ]
                            }
                            return {
                                normal: entry => {
                                    // Check if the entry is already there
                                    let id = entry.id,
                                        score = Math.round(entry.skill.score)
                                    let lb = leaderboard['_' + id]
                                    if (lb != null) {
                                        // Unflag it for removal
                                        indices.stabilize(id)
                                        // Figure out if we need to update anything
                                        if (lb.score !== score || lb.index !== entry.index) {
                                            // If so, update our record first
                                            lb.score = score
                                            lb.index = entry.index
                                            // Return it for broadcasting
                                            return [
                                                id,
                                                score,
                                                entry.index,
                                            ];
                                        }
                                    } else {
                                        // Record it
                                        indices.add(id)
                                        leaderboard['_' + id] = {
                                            score: score,
                                            name: entry.name,
                                            index: entry.index,
                                            color: entry.color,
                                            bar: barcolor(entry),
                                        }
                                        // Return it for broadcasting
                                        return getfull(entry)
                                    }
                                },
                                full: entry => getfull(entry),
                            }
                        })()
                        // The flattening functions
                        return data => {
                            // Start
                            indices.flag()
                            // Flatten the orders
                            let orders = data.map(process.normal).filter(e => e),
                                refresh = data.map(process.full).filter(e => e),
                                flatorders = [],
                                flatrefresh = []
                            for (let e of orders) flatorders.push(...e)
                            for (let e of refresh) flatrefresh.push(...e)
                            // Find the stuff to remove
                            let removed = indices.cull()
                            // Make sure we sync the leaderboard
                            for (let id of removed) { delete leaderboard['_' + id]; }
                            return {
                                updates: [removed.length, ...removed, orders.length, ...flatorders],
                                full: [-1, refresh.length, ...flatrefresh], // The -1 tells the client it'll be a full refresh
                            }
                        }
                    })()
                    // The update function (returns a reader)
                    return () => {
                        list = []
                        // Sort everything
                        for (let e of entities) listify(e)
                        // Get the top ten
                        let topTen = []
                        for (let i = 0; i < 10 && list.length; i++) {
                          let top, is = 0
                          for (let j = 0; j < list.length; j++) {
                            let val = list[j].skill.score
                            if (val > is) {
                              is = val
                              top = j
                            }
                          }
                          if (is === 0) break
                          topTen.push(list[top])
                          list.splice(top, 1)
                        }
                        room.topPlayerID = (topTen.length) ? topTen[0].id : -1
                        // Remove empty values and process it
                        lb = flatten(topTen)
                        // Return the reader
                        return full => full ? lb.full : lb.updates
                    }
                })()*/
                // Util
                let getBarColor = entry => {
                  switch (entry.team) {
                    case -100: return entry.color
                    case -1: return 10
                    case -2: return 11
                    case -3: return 12
                    case -4: return 15
                    default:
                      if (room.gameMode[0] === '2' || room.gameMode[0] === '3' || room.gameMode[0] === '4') return entry.color
                      return 11
                  }
                }
                // Delta Calculator
                const Delta = class {
                  constructor(dataLength, finder) {
                    this.dataLength = dataLength
                    this.finder = finder
                    this.now = finder()
                  }
                  update() {
                    let old = this.now
                    let now = this.finder()
                    this.now = now

                    let oldIndex = 0
                    let nowIndex = 0
                    let updates = []
                    let updatesLength = 0
                    let deletes = []
                    let deletesLength = 0

                    while (oldIndex < old.length && nowIndex < now.length) {
                      let oldElement = old[oldIndex]
                      let nowElement = now[nowIndex]

                      if (oldElement.id === nowElement.id) { // update
                        nowIndex++
                        oldIndex++

                        let updated = false
                        for (let i = 0; i < this.dataLength; i++)
                          if (oldElement.data[i] !== nowElement.data[i]) {
                            updated = true
                            break
                          }

                        if (updated) {
                          updates.push(nowElement.id, ...nowElement.data)
                          updatesLength++
                        }
                      } else if (oldElement.id < nowElement.id) { // delete
                        deletes.push(oldElement.id)
                        deletesLength++
                        oldIndex++
                      } else { // create
                        updates.push(nowElement.id, ...nowElement.data)
                        updatesLength++
                        nowIndex++
                      }
                    }

                    for (let i = oldIndex; i < old.length; i++) {
                      deletes.push(old[i].id)
                      deletesLength++
                    }
                    for (let i = nowIndex; i < now.length; i++) {
                      updates.push(now[i].id, ...now[i].data)
                      updatesLength++
                    }

                    let reset = [0, now.length]
                    for (let element of now)
                      reset.push(element.id, ...element.data)
                    let update = [deletesLength, ...deletes, updatesLength, ...updates]
                    return { reset, update }
                  }
                }
                // Deltas
                let minimapAll = new Delta(5, () => {
                  let all = []
                  for (let my of entities)
                    if ((my.type === 'wall' && my.alpha > 0.2) ||
                         my.type === 'miniboss' ||
                        (my.type === 'tank' && my.lifetime))
                      all.push({
                        id: my.id,
                        data: [
                          my.type === 'wall' ? my.shape === 4 ? 2 : 1 : 0,
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                          Math.round(my.SIZE),
                        ]
                      })
                  return all
                })
                let minimapTeams = [1, 2, 3, 4].map(team => new Delta(3, () => {
                  let all = []
                  for (let my of entities)
                    if (my.type === 'tank' && my.team === -team && my.master === my && !my.lifetime)
                      all.push({
                        id: my.id,
                        data: [
                          util.clamp(Math.floor(256 * my.x / room.width), 0, 255),
                          util.clamp(Math.floor(256 * my.y / room.height), 0, 255),
                          my.color,
                        ]
                      })
                  return all
                }))
                let leaderboard = new Delta(5, () => {
                  let list = []
                  for (let instance of entities)
                    if (instance.settings.leaderboardable &&
                        instance.settings.drawShape &&
                       (instance.type === 'tank' || instance.killCount.solo || instance.killCount.assists)) {
                      list.push(instance)
                    }

                  let topTen = []
                  for (let i = 0; i < 10 && list.length; i++) {
                    let top, is = 0
                    for (let j = 0; j < list.length; j++) {
                      let val = list[j].skill.score
                      if (val > is) {
                        is = val
                        top = j
                      }
                    }
                    if (is === 0) break
                    let entry = list[top]
                    topTen.push({
                      id: entry.id,
                      data: [
                        Math.round(entry.skill.score),
                        entry.index,
                        entry.name,
                        entry.color,
                        getBarColor(entry),
                      ]
                    })
                    list.splice(top, 1)
                  }
                  room.topPlayerID = topTen.length ? topTen[0].id : -1

                  return topTen.sort((a, b) => a.id - b.id)
                })

                // Periodically give out updates
                let subscribers = []
                setInterval(() => {
                  logs.minimap.set()
                  let minimapUpdate = minimapAll.update()
                  let minimapTeamUpdates = minimapTeams.map(r => r.update())
                  let leaderboardUpdate = leaderboard.update()
                  for (let socket of subscribers) {
                    if (!socket.status.hasSpawned) continue
                    let team = minimapTeamUpdates[socket.player.team - 1]
                    if (socket.status.needsNewBroadcast) {
                      socket.talk('b',
                        ...minimapUpdate.reset,
                        ...(team ? team.reset : [0, 0]),
                        ...(socket.anon ? [0, 0] : leaderboardUpdate.reset))
                      socket.status.needsNewBroadcast = false
                    } else {
                      socket.talk('b',
                        ...minimapUpdate.update,
                        ...(team ? team.update : [0, 0]),
                        ...(socket.anon ? [0, 0] : leaderboardUpdate.update))
                    }
                  }

                  logs.minimap.mark()

                  let time = util.time()
                  for (let socket of clients) {
                    if (socket.timeout.check(time))
                      socket.lastWords('K')
                    if (time - socket.statuslastHeartbeat > c.maxHeartbeatInterval)
                      socket.kick('Lost heartbeat.')
                  }
                }, 250)

                return {
                  subscribe(socket) {
                    subscribers.push(socket)
                  },
                  unsubscribe(socket) {
                    let i = subscribers.indexOf(socket)
                    if (i !== -1)
                      util.remove(subscribers, i)
                  },
                }
            })()
            // Build the returned function
            // This function initalizes the socket upon connection
            return (socket, req) => {
                // Get information about the new connection and verify it
                util.log('A client is trying to connect...');
                // Set it up
                socket.binaryType = 'arraybuffer';
                socket.key = '';
                socket.player = { camera: {}, };
                socket.timeout = (() => {
                    let mem = 0;
                    let timer = 0;
                    return {
                        set: val => { if (mem !== val) { mem = val; timer = util.time(); } },
                        check: time => { return timer && time - timer > c.maxHeartbeatInterval; },
                    };
                })();
                // Set up the status container
                socket.status = {
                    verified: false,
                    receiving: 0,
                    deceased: true,
                    requests: 0,
                    hasSpawned: false,
                    needsFullMap: true,
                    needsNewBroadcast: true, 
                    lastHeartbeat: util.time(),
                };  
                // Set up loops
                socket.loops = (() => {
                    let nextUpdateCall = null; // has to be started manually
                    let trafficMonitoring = setInterval(() => traffic(socket), 1500);
                    broadcast.subscribe(socket)
                    // Return the loop methods
                    return {
                        setUpdate: timeout => {
                            nextUpdateCall = timeout; 
                        },
                        cancelUpdate: () => {
                            clearTimeout(nextUpdateCall);
                        },
                        terminate: () => {
                            clearTimeout(nextUpdateCall);
                            clearTimeout(trafficMonitoring);
                            broadcast.unsubscribe(socket)
                        },
                    };
                })();
                // Set up the camera
                socket.camera = {
                    x: undefined,
                    y: undefined,
                    vx: 0,
                    vy: 0,
                    lastUpdate: util.time(),
                    lastDowndate: undefined,
                    fov: 2000,
                };
                // Set up the viewer
                socket.makeView = () => { socket.view = eyes(socket); };
                socket.makeView();
                // Put the fundamental functions in the socket
                socket.kick = reason => kick(socket, reason);
                socket.talk = (...message) => {
                    if (socket.readyState === socket.OPEN) { 
                        socket.send(protocol.encode(message), { binary: true, }); 
                    } 
                };
                socket.lastWords = (...message) => {
                    if (socket.readyState === socket.OPEN) { 
                        socket.send(protocol.encode(message), { binary: true, }, () => setTimeout(() => socket.terminate(), 1000));
                    } 
                };
                socket.on('message', message => incoming(message, socket));
                socket.on('close', () => { socket.loops.terminate(); close(socket); });
                socket.on('error', e => { util.log('[ERROR]:'); util.error(e); });
                // Put the player functions in the socket
                socket.spawn = name => { return spawn(socket, name); };
                // And make an update
                socket.update = time => {
                    socket.loops.cancelUpdate();
                    socket.loops.setUpdate(setTimeout(() => { socket.view.gazeUpon(); }, time)); 
                };
                // Log it
                clients.push(socket);
                util.log('[INFO] New socket opened');
            };
        })(),
    };
})();

/**** GAME SETUP ****/
// Define how the game lives
// The most important loop. Fast looping.
var gameloop = (() => {
    // Collision stuff
    let collide = (() => {
        function simplecollide(my, n) {
            let diff = (1 + util.getDistance(my, n) / 2) * roomSpeed;
            let a = (my.intangibility) ? 1 : my.pushability,
                b = (n.intangibility) ? 1 : n.pushability,
                c = 0.05 * (my.x - n.x) / diff,
                d = 0.05 * (my.y - n.y) / diff;
            my.accel.x += a / (b + 0.3) * c;
            my.accel.y += a / (b + 0.3) * d;
            n.accel.x -= b / (a + 0.3) * c;
            n.accel.y -= b / (a + 0.3) * d;
        }
        function firmcollide(my, n, buffer = 0) {
            let item1 = { x: my.x + my.m_x, y: my.y + my.m_y, };
            let item2 = { x: n.x + n.m_x, y: n.y + n.m_y, };
            let dist = util.getDistance(item1, item2);
            let s1 = Math.max(my.velocity.length, my.topSpeed);
            let s2 = Math.max(n.velocity.length, n.topSpeed);
            let strike1, strike2;
            if (buffer > 0 && dist <= my.realSize + n.realSize + buffer) {
                let repel = (my.acceleration + n.acceleration) * (my.realSize + n.realSize + buffer - dist) / buffer / roomSpeed;
                my.accel.x += repel * (item1.x - item2.x) / dist;
                my.accel.y += repel * (item1.y - item2.y) / dist;
                n.accel.x -= repel * (item1.x - item2.x) / dist;
                n.accel.y -= repel * (item1.y - item2.y) / dist;
            }
            if (dist <= my.realSize + n.realSize && !(strike1 && strike2)) {
                strike1 = false; strike2 = false;
                if (my.velocity.length <= s1) {
                    my.velocity.x -= 0.05 * (item2.x - item1.x) / dist / roomSpeed;
                    my.velocity.y -= 0.05 * (item2.y - item1.y) / dist / roomSpeed;
                } else { strike1 = true; }
                if (n.velocity.length <= s2) {
                    n.velocity.x += 0.05 * (item2.x - item1.x) / dist / roomSpeed;
                    n.velocity.y += 0.05 * (item2.y - item1.y) / dist / roomSpeed;
                } else { strike2 = true; }
                item1 = { x: my.x + my.m_x, y: my.y + my.m_y, };
                item2 = { x: n.x + n.m_x, y: n.y + n.m_y, };
                dist = util.getDistance(item1, item2); 
            }
        }
        function reflectcollide(wall, bounce) {
            let delt = new Vector(wall.x - bounce.x, wall.y - bounce.y);
            let dist = delt.length;
            let diff = wall.size + bounce.size - dist;
            if (diff > 0) {
                bounce.accel.x -= diff * delt.x / dist;
                bounce.accel.y -= diff * delt.y / dist;
                return 1;
            }
            return 0;
        }
        function advancedcollide(my, n, doDamage, doInelastic, nIsFirmCollide = false) {
            // Prepare to check
            let tock = Math.min(my.stepRemaining, n.stepRemaining),
                combinedRadius = n.size + my.size,
                motion = {
                    _me: new Vector(my.m_x, my.m_y),
                    _n: new Vector(n.m_x, n.m_y),
                },
                delt = new Vector(
                    tock * (motion._me.x - motion._n.x),
                    tock * (motion._me.y - motion._n.y)
                ),
                diff = new Vector(my.x - n.x, my.y - n.y),
                dir = new Vector((n.x - my.x) / diff.length, (n.y - my.y) / diff.length),
                component = Math.max(0, dir.x * delt.x + dir.y * delt.y);

            if (component >= diff.length - combinedRadius) { // A simple check
                // A more complex check
                let goahead = false,
                    tmin = 1 - tock,
                    tmax = 1,
                    A = Math.pow(delt.x, 2) + Math.pow(delt.y, 2),
                    B = 2*delt.x*diff.x + 2*delt.y*diff.y,
                    C = Math.pow(diff.x, 2) + Math.pow(diff.y, 2) - Math.pow(combinedRadius, 2),
                    det = B * B - (4 * A * C),
                    t;

                if (!A || det < 0 || C < 0) { // This shall catch mathematical errors
                    t = 0;
                    if (C < 0) { // We have already hit without moving
                        goahead = true;
                    }
                } else {
                    let t1 = (-B - Math.sqrt(det)) / (2*A),
                        t2 = (-B + Math.sqrt(det)) / (2*A);                
                    if (t1 < tmin || t1 > tmax) { // 1 is out of range
                        if (t2 < tmin || t2 > tmax) { // 2 is out of range;
                            t = false;
                        } else { // 1 is out of range but 2 isn't
                            t = t2; goahead = true;
                        }
                    } else { // 1 is in range
                        if (t2 >= tmin && t2 <= tmax) { // They're both in range!
                            t = Math.min(t1, t2); goahead = true; // That means it passed in and then out again.  Let's use when it's going in
                        } else { // Only 1 is in range
                            t = t1; goahead = true;
                        }
                    }
                }
                /********* PROCEED ********/
                if (goahead) {
                    // Add to record
                    my.collisionArray.push(n);
                    n.collisionArray.push(my);
                    if (t) { // Only if we still need to find the collision
                        // Step to where the collision occured
                        my.x += motion._me.x * t;
                        my.y += motion._me.y * t;
                        n.x += motion._n.x * t;
                        n.y += motion._n.y * t;

                        my.stepRemaining -= t;
                        n.stepRemaining -= t;

                        // Update things
                        diff = new Vector(my.x - n.x, my.y - n.y);
                        dir = new Vector((n.x - my.x) / diff.length, (n.y - my.y) / diff.length);            
                        component = Math.max(0, dir.x * delt.x + dir.y * delt.y);
                    }
                    let componentNorm = component / delt.length;
                    /************ APPLY COLLISION ***********/
                    // Prepare some things
                    let reductionFactor = 1,
                        deathFactor = {
                            _me: 1,
                            _n: 1,
                        },
                        accelerationFactor = (delt.length) ? (
                            (combinedRadius / 4) / (Math.floor(combinedRadius / delt.length) + 1) 
                        ) : (
                            0.001
                        ),
                        depth = {
                            _me: util.clamp((combinedRadius - diff.length) / (2 * my.size), 0, 1), //1: I am totally within it
                            _n: util.clamp((combinedRadius - diff.length) / (2 * n.size), 0, 1), //1: It is totally within me
                        },                                                                         //69: we're in each other ( ͡° ͜ʖ ͡°)
                        combinedDepth = {
                            up: depth._me * depth._n,
                            down: (1-depth._me) * (1-depth._n),
                        },
                        pen = {
                            _me: {
                                sqr: Math.pow(my.penetration, 2),
                                sqrt: Math.sqrt(my.penetration),
                            },
                            _n: {
                                sqr: Math.pow(n.penetration, 2),
                                sqrt: Math.sqrt(n.penetration),
                            },
                        },
                        savedHealthRatio = {
                            _me: my.health.ratio,
                            _n: n.health.ratio,
                        };
                    if (doDamage) {
                        let speedFactor = { // Avoid NaNs and infinities
                            _me: (my.maxSpeed) ? ( Math.pow(motion._me.length/my.maxSpeed, 0.25)  ) : ( 1 ),
                            _n: (n.maxSpeed) ? ( Math.pow(motion._n.length/n.maxSpeed, 0.25) ) : ( 1 ),
                        };

                        /********** DO DAMAGE *********/
                        let bail = false;
                        if (my.shape === n.shape && my.settings.isNecromancer && n.type === 'food') {
                            bail = my.necro(n);
                        } else if (my.shape === n.shape && n.settings.isNecromancer && my.type === 'food') {
                            bail = n.necro(my);
                        } 
                        if (!bail) {
                            // Calculate base damage
                            let resistDiff = my.health.resist - n.health.resist,
                                damage = {
                                    _me: 
                                        c.DAMAGE_CONSTANT * 
                                        my.damage * 
                                        (1 + resistDiff) * 
                                        (1 + n.heteroMultiplier * (my.settings.damageClass === n.settings.damageClass)) *
                                        ((my.settings.buffVsFood && n.settings.damageType === 1) ? 3 : 1 ) *
                                        my.damageMultiplier() *
                                        Math.min(2, Math.max(speedFactor._me, 1) * speedFactor._me),
                                    _n: 
                                        c.DAMAGE_CONSTANT * 
                                        n.damage * 
                                        (1 - resistDiff) * 
                                        (1 + my.heteroMultiplier * (my.settings.damageClass === n.settings.damageClass)) *
                                        ((n.settings.buffVsFood && my.settings.damageType === 1) ? 3 : 1) *
                                        n.damageMultiplier() *
                                        Math.min(2, Math.max(speedFactor._n, 1) * speedFactor._n),
                                };
                            // Advanced damage calculations
                            if (my.settings.ratioEffects) {
                                damage._me *= Math.min(1, Math.pow(Math.max(my.health.ratio, my.shield.ratio), 1 / my.penetration));
                            }
                            if (n.settings.ratioEffects) {
                                damage._n *= Math.min(1, Math.pow(Math.max(n.health.ratio, n.shield.ratio), 1 / n.penetration));
                            }
                            if (my.settings.damageEffects) {
                                damage._me *=
                                    accelerationFactor *
                                    (1 + (componentNorm - 1) * (1 - depth._n) / my.penetration) *
                                    (1 + pen._n.sqrt * depth._n - depth._n) / pen._n.sqrt; 
                            }
                            if (n.settings.damageEffects) {
                                damage._n *=
                                    accelerationFactor *
                                    (1 + (componentNorm - 1) * (1 - depth._me) / n.penetration) *
                                    (1 + pen._me.sqrt * depth._me - depth._me) / pen._me.sqrt; 
                            }
                            // Find out if you'll die in this cycle, and if so how much damage you are able to do to the other target
                            let damageToApply = {
                                _me: damage._me,
                                _n: damage._n,
                            };
                            if (n.shield.max) { 
                                damageToApply._me -= n.shield.getDamage(damageToApply._me);
                            }
                            if (my.shield.max) { 
                                damageToApply._n -= my.shield.getDamage(damageToApply._n);
                            }
                            let stuff = my.health.getDamage(damageToApply._n, false);
                            deathFactor._me = (stuff > my.health.amount) ? my.health.amount / stuff : 1;
                            stuff = n.health.getDamage(damageToApply._me, false);
                            deathFactor._n = (stuff > n.health.amount) ? n.health.amount / stuff : 1;

                                reductionFactor = Math.min(deathFactor._me, deathFactor._n);

                            // Now apply it
                            my.damageRecieved += damage._n * deathFactor._n;
                            n.damageRecieved += damage._me * deathFactor._me;
                        }
                    }
                    /************* DO MOTION ***********/    
                    if (nIsFirmCollide < 0) {
                        nIsFirmCollide *= -0.5;
                        my.accel.x -= nIsFirmCollide * component * dir.x;
                        my.accel.y -= nIsFirmCollide * component * dir.y;
                        n.accel.x += nIsFirmCollide * component * dir.x;
                        n.accel.y += nIsFirmCollide * component * dir.y;
                    } else if (nIsFirmCollide > 0) {
                        n.accel.x += nIsFirmCollide * (component * dir.x + combinedDepth.up);
                        n.accel.y += nIsFirmCollide * (component * dir.y + combinedDepth.up);
                    } else {
                         // Calculate the impulse of the collision
                        let elasticity = 2 - 4 * Math.atan(my.penetration * n.penetration) / Math.PI; 
                        if (doInelastic && my.settings.motionEffects && n.settings.motionEffects) {
                            elasticity *= savedHealthRatio._me / pen._me.sqrt + savedHealthRatio._n / pen._n.sqrt;
                        } else {
                            elasticity *= 2;
                        }
                        let spring = 2 * Math.sqrt(savedHealthRatio._me * savedHealthRatio._n) / roomSpeed,
                            elasticImpulse = 
                                Math.pow(combinedDepth.down, 2) * 
                                elasticity * component * 
                                my.mass * n.mass / (my.mass + n.mass),
                            springImpulse = 
                                c.KNOCKBACK_CONSTANT * spring * combinedDepth.up,   
                            impulse = -(elasticImpulse + springImpulse) * (1 - my.intangibility) * (1 - n.intangibility),
                            force = {
                                x: impulse * dir.x,
                                y: impulse * dir.y,
                            },
                            modifiers = {
                                _me: c.KNOCKBACK_CONSTANT * my.pushability / my.mass * deathFactor._n,
                                _n: c.KNOCKBACK_CONSTANT * n.pushability / n.mass * deathFactor._me,
                            };
                        // Apply impulse as force
                        my.accel.x += modifiers._me * force.x;
                        my.accel.y += modifiers._me * force.y;
                        n.accel.x -= modifiers._n * force.x;
                        n.accel.y -= modifiers._n * force.y;
                    }
                }
            }
        }
        // The actual collision resolution function
        return collision => {
            // Pull the two objects from the collision grid      
            let instance = collision[0],
                other = collision[1];   
            // Check for ghosts...
            if (other.isGhost) {
                util.error('GHOST FOUND');
                util.error(other.label);
                util.error('x: ' + other.x + ' y: ' + other.y);
                util.error(other.collisionArray);
                util.error('health: ' + other.health.amount);
                util.warn('Ghost removed.');
                if (grid.checkIfInHSHG(other)) {
                    util.warn('Ghost removed.'); grid.removeObject(other);
                }
                return 0;
            }
            if (instance.isGhost) {
                util.error('GHOST FOUND');
                util.error(instance.label);
                util.error('x: ' + instance.x + ' y: ' + instance.y);
                util.error(instance.collisionArray);
                util.error('health: ' + instance.health.amount);
                if (grid.checkIfInHSHG(instance)) {
                    util.warn('Ghost removed.'); grid.removeObject(instance);
                }
                return 0;
            }
            if (!instance.activation.check() && !other.activation.check()) { util.warn('Tried to collide with an inactive instance.'); return 0; }
            // Handle walls
            if (instance.type === 'wall' || other.type === 'wall') {
              if (instance.hover) return;
                let a = (instance.type === 'bullet' || other.type === 'bullet') ? 
                    1 + 10 / (Math.max(instance.velocity.length, other.velocity.length) + 10) : 
                    1;
                if (instance.type === 'wall') advancedcollide(instance, other, false, false, a);
                else advancedcollide(other, instance, false, false, a);
            } else
            // If they can firm collide, do that
            if ((instance.type === 'crasher' && other.type === 'food') || (other.type === 'crasher' && instance.type === 'food')) {
                firmcollide(instance, other);
            } else
            // Otherwise, collide normally if they're from different teams
            if (instance.team !== other.team) {
                advancedcollide(instance, other, true, true);
            } else 
            // Ignore them if either has asked to be
            /*if (instance.settings.hitsOwnType == 'never' || other.settings.hitsOwnType == 'never') {
                // Do jack                    
            } else */
            // Standard collision resolution
            if (instance.settings.hitsOwnType === other.settings.hitsOwnType) {
                switch (instance.settings.hitsOwnType) {
                case 'push':
                case 'hard': firmcollide(instance, other); break;
                case 'hardWithBuffer': firmcollide(instance, other, 30); break;
                case 'repel': simplecollide(instance, other); break;
                }
            }     
        };
    })();
    // Living stuff
    function entitiesactivationloop(my) {
        // Update collisions.
        my.collisionArray = []; 
        // Activation
        my.activation.update();
        my.updateAABB(my.activation.check()); 
    }
    function entitiesliveloop(my) {
        // Consider death.
        if (my.contemplationOfMortality()) my.destroy();
        else {
            if (my.bond == null) {
                // Resolve the physical behavior from the last collision cycle.
                logs.physics.set();
                my.physics();
                logs.physics.mark();
            }
            if (my.activation.check()) {
                logs.entities.tally();
                // Think about my actions.
                logs.life.set();
                my.life();
                logs.life.mark();
                // Apply friction.
                my.friction();
                my.confinementToTheseEarthlyShackles();
                logs.selfie.set();
                my.takeSelfie();
                logs.selfie.mark();
            }
            logs.activation.set();
            entitiesactivationloop(my); // Activate it for the next loop if we are gonna live...
            logs.activation.mark();
        }
        // Update collisions.
        my.collisionArray = [];
    }
    let time;
    // Return the loop function
    return () => {
        logs.loops.tally();
        logs.master.set();
        //logs.activation.set();
        //for(let e of entities){entitiesactivationloop(e)};
        //logs.activation.mark();
        // Do entities life
        logs.entities.set();
            for(let e of entities){entitiesliveloop(e)};
        logs.entities.mark();
      // Do collisions
      logs.collide.set();
        if (entities.length > 1) {
            // Load the grid
            grid.update();
            // Run collisions in each grid
            for(let collision of grid.queryForCollisionPairs()){collide(collision)};
        }
        logs.collide.mark();
        logs.master.mark();
        // Remove dead entities
        purgeEntities();
        room.lastCycle = util.time();
    };
    //let expected = 1000 / c.gameSpeed / 30;
    //let alphaFactor = (delta > expected) ? expected / delta : 1;
    //roomSpeed = c.gameSpeed * alphaFactor;
    //setTimeout(moveloop, 1000 / roomSpeed / 30 - delta); 
})();

// Used to regulate the amount of bots and food
let ostsifmp = 0; // ostsifmp = OH SHIT THE SERVER IS FUCKING MELTING percent

// A less important loop. Runs at an actual 5Hz regardless of game speed.
var maintainloop = (() => {
    // Place obstacles
    function placeRoids() {
        function placeRoid(type, entityClass) {
            let x = 0;
            let position;
            do { position = room.randomType(type); 
                x++;
                if (x>200) { util.warn("Could not place some roids."); return 0; }
            } while (dirtyCheck(position, 10 + entityClass.SIZE));
            let o = new Entity(position);
                o.define(entityClass);
                o.team = -101;
                o.facing = ran.randomAngle();
                o.protect();
                o.life();
                o.alpha = 1;
        }
        // Start placing them
        let roidcount = room.roid.length * room.width * room.height / room.xgrid / room.ygrid / 150000 / 1.5;
        let rockcount = room.rock.length * room.width * room.height / room.xgrid / room.ygrid / 300000 / 1.5;
        let count = 0;
        for (let i=Math.ceil(roidcount); i; i--) { count++; placeRoid('roid', Class.obstacle); }
        for (let i=Math.ceil(roidcount * 0.3); i; i--) { count++; placeRoid('roid', Class.babyObstacle); }
        for (let i=Math.ceil(rockcount * 0.8); i; i--) { count++; placeRoid('rock', Class.obstacle); }
        for (let i=Math.ceil(rockcount * 0.5); i; i--) { count++; placeRoid('rock', Class.babyObstacle); }
        if(c.RANDOM_ROIDS){
          for (let i=Math.ceil(roidcount * 5); i; i--) { count++; placeRoid('norm', Class.obstacle); }
        }
        util.log('Placing ' + count + ' obstacles!');
    }
    placeRoids();
    // Spawning functions
    let spawnBosses = (() => {
        let timer = 0;
        let boss = (() => {
            let i = 0,
                names = [],
                bois = [Class.egg],
                n = 0,
                begin = 'yo some shit is about to move to a lower position',
                arrival = 'Something happened lol u should probably let Neph know this broke',
                message = ['oh fuck this isnt supposed to happen'],
                loc = 'norm';
                if(n>1){
                  n--
                  begin = ''
                  arrival = ''
                  message = ''
                }else{
                  begin = 'yo some shit is about to move to a lower position'
                  arrival = 'Something happened lol u should probably let Neph know this broke'
                  message = ['oh fuck this isnt supposed to happen']
                }
            let spawn = () => {
                let spot, m = 0;
                do {
                    spot = room.randomType(loc); m++;
                } while (dirtyCheck(spot, 500) && m<30);
                let o = new Entity(spot);
                    o.define(ran.choose(bois));
                    o.team = -100;
                    o.name = names[i++];
            };
            return {
                prepareToSpawn: (classArray, number, nameClass, typeOfLocation = 'norm', messageFunct) => {
                    bois = classArray
                    n = number;
                    loc = typeOfLocation;
                    begin = `${n*bois.length} visitor${(n*bois.length>1?'s are':' is')} coming.`;
                    names = [];
                    arrival = '';
                    message = messageFunct;
                    for (let i=0; i<n; i++){
                      for (let a=0; a<bois.length; a++){
                      names.push(ran.chooseBossName())
                      arrival += names[names.length-1] + ' the ' + (bois[a].LABEL?bois[a].LABEL:bois[a].PARENT[0].LABEL) + (i==n-2||a==bois.length-2?' and ':(i==n-1||a==bois.length-1)?' ':', ');
                      }
                    if(i==n-1) arrival += (n>1?'have':'has') + ' arrived.'
                    }
                },
                spawn: () => {
                    sockets.broadcast(begin, 0.25, '#55007d', '#ffe559');
                    setTimeout(()=>sockets.broadcast(message[0],message[1],message[2],message[3]),4000)
                    for (let i=0; i<n*bois.length; i++) {
                        setTimeout(spawn, ran.randomRange(3500, 4000));
                    }
                    // Wrap things up.
                    setTimeout(() => sockets.broadcast(arrival, 0.25, '#55007d', '#FFD700'), 7500);
                    util.log('[SPAWN] ' + arrival);
                },
            };
        })();
        return census => {
            if (timer > 2000 && ran.dice(8000 - timer) && census.miniboss < c.MAX_BOSSES) {
                util.log('[SPAWN] Preparing to spawn...');
                timer = 0;
                let choice = [];
                let message = ['You dont stand a chance..', 0.25, '#55007d', '#ffee91']
                switch (ran.chooseChance(20, 20, 10)) {
                    case 0:
                      choice = [[Class.elite_destroyer], 2, 'crasher', 'nest'];
                      message=['The crashers feel stronger..', 0.25, '#55007d', '#ffee91']
                    break;
                    case 1: 
                      choice = [[Class.palisade], 1, 'castle', 'norm']; 
                      message=['A strange trembling..', 0.25, '#55007d', '#ffee91']
                    break;
                    case 2:
                      choice = [[Class.tempest], 1, 'elemental', 'norm'];
                      message=['You notice the winds picking up..', 0.25, '#55007d', '#ffee91']
                    break;                }
                boss.prepareToSpawn(...choice, message);
                setTimeout(boss.spawn, 3000);
                // Set the timeout for the spawn functions
            } else if (!census.miniboss) timer++;
        };
    })();
// This is the fun function that regulates the amount of food and if things get really bad, bots  
  // bot removal is gone, turns out bots actaully dont lag the game too much
let bots = [];
let Food = [];
c.MAX_FOOD_savedvalue = c.MAX_FOOD
c.BOTS_savedvalue = c.BOTS
function serverLifesupport(){
//If shits bad or Food is over do something
  if(ostsifmp>50-c.LIFESUPPORT_SENSITIVITY){
    c.MAX_FOOD = Math.round(c.MAX_FOOD/Math.ceil(ostsifmp/100))
    // Lose some weight
    while(Food.length>c.MAX_FOOD){
      Food[0].kill()
      Food = Food.filter(e => {return !e.isDead();});
    }
    if(c.OLD_FOOD_VALUE!==c.MAX_FOOD)util.warn('Reduced the amount of food ('+ Food.length +') to keep the server alive. MAX VALUE: '+c.MAX_FOOD_savedvalue+' CURRENT MAX: '+c.MAX_FOOD+', That is ' + Math.round(c.MAX_FOOD/c.MAX_FOOD_savedvalue*100)+'% of the orignal capacity.'+(ostsifmp>100?' !CRITCAL OSTSIFMP!: ' +ostsifmp+'%':''))
    c.OLD_FOOD_VALUE = c.MAX_FOOD
//If shits realllll bad get rid of some bots
/*  if(ostsifmp>125-c.LIFESUPPORT_SENSITIVITY){
    c.BOTS = Math.round(c.BOTS/Math.ceil(ostsifmp/100))
    // Lose some weight
    while(bots.length>c.BOTS){
      bots[0].kill()
      bots = bots.filter(e => {return !e.isDead();});
    }
    if(c.OLD_BOT_VALUE!==c.BOTS)util.error('!!!CRITICAL!!! Reduced the amount of Bots ('+ bots.length +') to keep the server alive. MAX VALUE: '+c.BOTS_savedvalue+' CURRENT MAX: '+c.BOTS+', That is ' + Math.round(c.BOTS/c.BOTS_savedvalue*100)+'% of the orignal capacity.'+(ostsifmp>100?' !CRITCAL OSTSIFMP!: ' +ostsifmp+'%':''))
    c.OLD_BOTS_VALUE = c.BOTS  
  }*/
    return true;
  }else{
    if(!(c.MAX_FOOD_savedvalue===c.MAX_FOOD)){
      c.MAX_FOOD += (Math.random()>=0.5?1:0)
      if(c.MAX_FOOD_savedvalue===c.MAX_FOOD) util.log('Max Food is back at its orignal value ('+c.MAX_FOOD+').')
    }
    /*if(!(c.BOTS_savedvalue===c.BOTS)){
      c.BOTS = c.BOTS_savedvalue
      util.log('Bots is back at its orignal value ('+c.BOTS+').')
    }*/
    return false;
  }
}
  
// The NPC function
// used for bots
  let def = require('./lib/definitions');
  let totalindex = 0;
  for (let k in def) {
      if (!def.hasOwnProperty(k)) continue;
      def[k].index = totalindex++;
  }
    let makenpcs = (() => {
        // Make base protectors if needed.
            /*let f = (loc, team) => { 
                let o = new Entity(loc);
                    o.define(Class.baseProtector);
                    o.team = -team;
                    o.color = [10, 11, 12, 15][team-1];
            };
            for (let i=1; i<5; i++) {
                room['bas' + i].forEach((loc) => { f(loc, i); }); 
            }*/
        // Return the spawning function
        return () => {
            let census = {
                crasher: 0,
                miniboss: 0,
                tank: 0,
            };    
            let npcs = entities.map(function npcCensus(instance) {
                if (census[instance.type] != null) {
                    census[instance.type]++;
                    return instance;
                }
            }).filter(e => { return e; });    
            // Spawning
            spawnBosses(census);
          	  // Bots
            if (bots.length < c.BOTS) {
                // get data and if theres enough use it
                let botdata = []
                let data = JSON.parse(fs.readFileSync('./server/botdata.json', (err)=> {if(err){console.log(err)}}))
                if(!(totalindex===data.resettrigger)){
                  fs.writeFileSync('./server/botdata.json', JSON.stringify({"num":0,"resettrigger":totalindex}, null, "\t"))
                  data = JSON.parse(fs.readFileSync('./server/botdata.json', (err)=> {if(err){console.log(err)}}))
                  console.warn('We had to reset botdata.json because there was an index change')
                }
                if(data.num){
                for(let i = 0, skilllv=0, runs=0, tank, num; i<data.num; i++){
                  if(skilllv<data[i].skill){
                  skilllv = data[i].skill
                  tank = data[i]
                  num = i
                  }
                  if(i+1 == data.num){
                    //log the tank
                    botdata.push(tank)
                    //remove it from the cylce
                    data[num].skill = 0
                    //cylce again
                    skilllv=0
                    runs++
                    if(runs>7){
                      i=data.num
                    }else{
                      i=0
                    }
                  }
                }
                }
                //console.log("[BOTS] Number of bots: "+bots.length)
                let o = new Entity(room.random());
                o.define(Class.bot);
                o.color = 12;
                if(data.num){
                // have rannum sepreately so tank genes are consitent
                let rannum = Math.floor(Math.random()*botdata.length)
                //apply the tank genes
                if(Math.floor(Math.random()*4)>1){
                  // 2/3 chance to pick an older tank
                  o.define(classFromIndex(botdata[rannum].index))
                }else{
                o.define(Class.basic);
                }
                //apply the stat genes
                if(Math.floor(Math.random()*4)>1){
                  // 2/3 chance to pick older stats
                 for(let i = 0; i < botdata[rannum].skillset.length; i++){
                    if(botdata[rannum].skillset[i]>3)botdata[rannum].skillset[i]-=3
                    if(i+1 == botdata[rannum].skillset.length){
                    o.skillset = botdata[rannum].skillset
                    o.skill.points -= util.sumArray(botdata[rannum].skillset)
                    }
                  }
                }
                }else{
                  o.define(Class.basic);
                }
                o.name = ran.chooseBotName();
                o.refreshBodyAttributes();
                if (c.RANDOM_COLORS) o.color = Math.floor(Math.random() * 20);
                if (c.MODE === "tdm") {
                    let TEAMS = [];
                    for (let i = 0; i < (c.TEAMS || 4); i++) TEAMS.push([-i - 1, 0]);
                    for (let o of bots) {
                        if (o.isDead()) continue;
                        for (let team of TEAMS) {
                            if (o.team === team[0]) team[1]++;
                        }
                    }
                    TEAMS = TEAMS.sort(function(a, b) {
                        return a[1] - b[1]
                    });
                    o.team = TEAMS[0][0];
                    o.color = [10, 11, 12, 15][-o.team - 1];
                }
                bots.push(o);
            }
            // Slowly upgrade them
            for(let o of bots){
              //lv up
                    if (o.skill.level < c.SKILL_CAP) {
                        o.skill.score += 1000;
                        o.skill.maintain();
                    }
              //skill up
                    if (o.skill.points > 0){
                        if (!o.skillset) o.skillset = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        /*
-- Bullets
    rld: 0,
    pen: 1,
    str: 2,
    dam: 3,
    spd: 4,
-- Body
    shi: 5,
    atk: 6,
    hlt: 7,
    rgn: 8,
    mob: 9,
                                Adjust skill bias as needed
                        */
                        let random = ran.biasRan(o.skillset, [0.5, 0.5, 0.5, 0.5, 0.5, 0.25, 0.35, 0.25, 0.25, 0.5], true)
                        if(o.skillset[random]<c.MAX_SKILL){
                        o.skillset[random]++
                        o.skill.points--
                        }
                        while(util.sumArray(o.skillset)>c.SKILL_CAP*c.SKILL_PER_LV){
                          o.skillset[Math.floor(Math.random()*o.skillset.length)]--
                        }
                      }else if(o.skill.level>=c.SKILL_CAP&&!util.sumArray(o.skill.raw)){
                        o.skill.set(o.skillset)
                      }
              //tank up
                    if (o.skill.level>=45&&o.upgrades.length){
                      o.upgrade(Math.floor(Math.random() * o.upgrades.length))
                    }
            };
            // Remove dead ones and consider their skill at the game
            bots = bots.filter(e => {
              if (e.isDead()){
                // if they have a skill issue, if they do erase them from history
                if (e.killCount.solo == 0) {/*util.log(`${e.name} is a LOSER and had a SKILL ISSUE so they will be forever forgotten`);*/return;}
                //util.log(`${e.name} had a minor skill issue`)
                // read the data
                let data = JSON.parse(fs.readFileSync('./server/botdata.json', (err)=> {if(err){console.log(err)}}))
                // process it
                if(!data.num) data.num = 0
                data[data.num] = {'score': e.skill.score, 'kills': e.killCount.solo, 'skillset': e.skillset, 'index': e.index, 'skill': e.skill.score*e.killCount.solo, 'tank': e.label}
                data.num++
                
                // find out what the average tank looks like
                let score = []
                let kills = []
                let skill = []
                let skillset = []
                for(let i = 0; i < data.num; i++){
                  if(score.length < data.num){
                    score.push(data[i].score)
                    kills.push(data[i].kills)
                    skill.push(data[i].skill)
                    skillset.push(data[i].skillset)
                  }
                  //skill set calculation
                  if(i+1 == data.num){
                     // average of each value in each array combined into 1 to get the average skill set.. interestingly the combined value is not 45 (the normal skill cap)
                    let skillset2 = []
                    for(let a = 0; a < skillset[0].length; a++){
                      let num = 0;
                        for(var b = 0; b < skillset.length; b++){ 
                          num += skillset[b][a];
                        }
                      skillset2.push(Math.round(num / skillset.length));
                  }
                    data.averagetank = {
                        'score': util.averageArray(score),
                        'kills': util.averageArray(kills),
                        'skill': util.averageArray(skill),
                        'skillset': skillset2,
                                      }
                    // logs what the average tank looks like
                    //util.log(data.averagetank)
                  }
                }
                // write it
                fs.writeFileSync('./server/botdata.json', JSON.stringify(data, null, "\t"))
              }
              // rest in peace
              return !e.isDead();
            });
        };
    })();
//Food functions
  //placing food function
  function sendfood(place='norm', type=[]){
  let pos = room.randomType(place)
  while(dirtyCheck(pos, 125)){
    pos = room.randomType(place)
  }
  for(let i = 0; i < type.length; i++){
    pos.x += Math.floor(Math.random()*5)
    pos.y += Math.floor(Math.random()*5)
    let o = new Entity(pos)
    if(type[i].PARENT&&type[i].PARENT[0].TYPE==="food")type[i].BODY.ACCELERATION = 0.001
    o.define(type[i]);
    o.team = -100;
    Food.push(o);
  }
  }

  let makefood = census => {
    if (Food.length < c.MAX_FOOD) {
      let type = []
      let place; 
      let zonetype = ran.chooseChance(
      75, // Norm
      25, // Nest
      );
    for(let i = 0; i < (Math.floor(Math.random() * c.MAX_FOOD_CLUSTER))+c.FOOD_CLUSTER_ADDITIVE; i++){
      switch (zonetype){
      // Spawn shit in norms
        case 0:
      switch (ran.chooseChance(
        50, // Egg 
        40, // Square
        30, // Triangle
        10, // Pentagon
      )){
        case 0: {type.push(Class.egg)}; break;
        case 1: {type.push(Class.square)}; break;
        case 2: {type.push(Class.triangle)}; break;
        case 3: {type.push(Class.pentagon)}; break;
      }
      place = 'norm'
       break;
      // Spawn shit in nests
        case 1:
      switch (ran.chooseChance(
        80, // Pentagon 
        5, // Big Pentagon
        2.5, // HUGEEEEE Pentagon
        50, // Crasher
        0.5, // Sentry
      )){
        case 0: {type.push(Class.pentagon)}; break;
        case 1: {type.push(Class.bigPentagon)}; break;
        case 2: {type.push(Class.hugePentagon)}; break;
        case 3: {type.push(Class.crasher)}; break;
        case 4: {type.push(Math.random()>=0.5?Class.sentryGun:Math.random()>=0.5?Class.sentrySwarm:Class.sentryGun)}; break;
      }
      place = 'nest'
       break;
        default:
          throw new Error("INVALID FOOD SPAWNING CHOICE")
          break;
    }
        sendfood(place, type)
    }
    }
}
    // Define food and food spawning
    return () => {
        // Check if the server needs some life support
        if(c.SERVER_LIFESUPPORT)serverLifesupport();
        // Make some children
        makenpcs();      
        // Clear dead shit first
        Food = Food.filter(e => {
          return !e.isDead();
        });
        // Then Make some babies
        makefood(); 
        // Regen health and update the grid
        for(let instance of entities){
            if (instance.shield.max) {
                instance.shield.regenerate();
            }
            if (instance.health.amount) {
                instance.health.regenerate(instance.shield.max && instance.shield.max === instance.shield.amount);
            }
        };
    };
})();
// This is the checking loop. Runs at 1Hz.
var speedcheckloop = (() => {
    let fails = 0;
    // Return the function
    return () => {
        let activationtime = logs.activation.sum(),
            collidetime = logs.collide.sum(),
            movetime = logs.entities.sum(),
            playertime = logs.network.sum(),
            maptime = logs.minimap.sum(),
            physicstime = logs.physics.sum(),
            lifetime = logs.life.sum(),
            selfietime = logs.selfie.sum();
        let sum = logs.master.record();
        let loops = logs.loops.count(),
            active = logs.entities.count();
        global.fps = (1000/sum).toFixed(2);
        ostsifmp = Math.round((sum/(1000/ roomSpeed /30))*100)
        if (sum > 1000 / roomSpeed / 30) { 
            //fails++;
            util.warn('~~ LOOPS: ' + loops + '. ENTITY #: ' + entities.length + '//' + Math.round(active/loops) + '. VIEW #: ' + views.length + '. BACKLOGGED :: ' + (sum * roomSpeed * 3).toFixed(3) + '%! ~~');
            util.warn('Total activation time: ' + activationtime);
            util.warn('Total collision time: ' + collidetime);
            util.warn('Total cycle time: ' + movetime);
            util.warn('Total player update time: ' + playertime);
            util.warn('Total lb+minimap processing time: ' + maptime);
            util.warn('Total entity physics calculation time: ' + physicstime);
            util.warn('Total entity life+thought cycle time: ' + lifetime);
            util.warn('Total entity selfie-taking time: ' + selfietime);
            util.warn('Total time: ' + (activationtime + collidetime + movetime + playertime + maptime + physicstime + lifetime + selfietime));
            util.warn('OH SHIT THE SERVER IS FUCKING MELTING percent: '+ostsifmp+'%')
            if (fails > 60) {
                util.error("FAILURE!");
                //process.exit(1);
            }
        } else {
            fails = 0;
        }
    };
})();

/** BUILD THE SERVERS **/  
// Turn the server on
var express = require('express')
var app = express();
var expressWs = require('express-ws')(app);
app.use(express.static('./' + (c.COMPILED_CLIENT ? "dist" : "clientSrc")));
const server = app.listen(process.env.PORT || 3000, () => {
    console.log('======> [INFO] Server started at', process.env.PORT || 3000);
});
app.get('/mockups.json', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
      res.writeHead(200)
      res.end(mockupJsonData)
  })
  app.get('/versionInfo.json', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
      res.writeHead(200)
      res.end(JSON.stringify({version:c.VERSION}))
  })
/*let server = http.createServer((req, res) => {
  let { pathname } = url.parse(req.url)
  switch (pathname) {
    case '/mockups.json':
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.writeHead(200)
      res.end(mockupJsonData)
    break
    case '/versionInfo.json':
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.writeHead(200)
      res.end(JSON.stringify({version:c.VERSION}))
    break;
    default:
      res.writeHead(404)
      res.end()
  }
})*/

let websockets = (() => {
    // Configure the websocketserver
    let config = { server: app, path: "/websocket" }

        /*server.listen(process.env.PORT || 3000, function httpListening() {
            util.log((new Date()) + ". Joint HTTP+Websocket server turned on, listening on port "+server.address().port + ".")
        })*/
    /*if (c.servesStatic) {
    } else {
        config.port = 8080; 
        util.log((new Date()) + 'Websocket server turned on, listening on port ' + 8080 + '.'); 
    }*/
    // Build it
    app.ws("/server", sockets.connect);
})()

// Bring it to life
setInterval(gameloop, room.cycleSpeed);
setInterval(maintainloop, 50);
setInterval(speedcheckloop, 1000);

//see if we need to update the githubstats file
setInterval(()=>{
// get our files and time
let gitdata = JSON.parse(fs.readFileSync('./clientSrc/githubstats.json', 'utf8'))
let datemins = Math.round(Date.now()/60000)

// if its been 30min or later after our lastest update, ping github and update the file
if(datemins>gitdata.lastupdate+30){
  let https = require('https')
  var options = {
    host: 'api.github.com',
    path: `/repos/${c.GITHUBPATH}/contributors`,
    method: 'GET',
    headers: {'user-agent': 'node.js'}
};
let request = https.request(options, function(response){
let body = '';
response.on("data", function(chunk){
    body += chunk.toString('utf8');
});
response.on("end", function(){
  
  // Heres where we get and use all our data from github
    gitdata.lastupdate = datemins
    gitdata.gitdata = body
    fs.writeFileSync('./clientSrc/githubstats.json', JSON.stringify(gitdata));
    fs.writeFileSync('./dist/githubstats.json', JSON.stringify(gitdata));
    console.log('Updated githubstats.json!')
    });
});
request.end();
}
console.log((gitdata.lastupdate+30)-datemins + " more mins till githubstats.json is updated.")
}, 300000)//check every 5 mins, 300000 ms
 
