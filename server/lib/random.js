/*jslint node: true */
"use strict";

// Seed math

exports.random = x => {
    return x * Math.random();
};

exports.randomAngle = () => {
    return Math.PI * 2 * Math.random();
};

exports.randomRange = (min, max) => {
    return Math.random() * (max - min) + min;
};

exports.irandom = i => {
    let max = Math.floor(i);
    return Math.floor(Math.random() * (max + 1)); //Inclusive
};

exports.irandomRange = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //Inclusive
};

exports.gauss = (mean, deviation) => {
    let x1, x2, w;
    do {
        x1 = 2*Math.random() - 1;
        x2 = 2*Math.random() - 1;
        w = x1 * x1 + x2 * x2;
    } while (0 == w || w >= 1);

    w = Math.sqrt(-2 * Math.log(w) / w);
    return mean + deviation * x1 * w;
};

exports.gaussInverse = (min, max, clustering) => {
    let range = max - min;
    let output = exports.gauss(0, range / clustering);

    while (output < 0) {
        output += range;
    }
    
    while (output > range) {
        output -= range;
    }
    
    return output + min;
};

exports.gaussRing = (radius, clustering) => {
    let r = exports.random(Math.PI * 2);
    let d = exports.gauss(radius, radius*clustering);
    return {
        x: d * Math.cos(r),
        y: d * Math.sin(r),
    };
};

exports.chance = prob => {
    return exports.random(1) < prob;
};

exports.dice = sides => {
    return exports.random(sides) < 1;
};

exports.choose = arr => {
    return arr[exports.irandom(arr.length - 1)];
};

exports.chooseN = (arr, n) => {
    let o = [];
    for (let i=0; i<n; i++) {
        o.push(arr.splice(exports.irandom(arr.length - 1), 1)[0]);
    }
    return o;
};

exports.chooseChance = (...arg) => {
    let totalProb = 0;
    for(let value of arg){ totalProb += value; };
    let answer = exports.random(totalProb);
    for (let i=0; i<arg.length; i++) {
        if (answer<arg[i]) return i;
        answer -= arg[i];
    }
};

 exports.biasRan = (list, weight, returnarraypos) => {
    var total_weight = weight.reduce(function (prev, cur, i, arr) {
        return prev + cur;
    });
     
    var random_num = Math.random()*(total_weight-0) + 0;
    var weight_sum = 0;
    //console.log(random_num)
     
    for (var i = 0; i < list.length; i++) {
        weight_sum += weight[i];
        weight_sum = +weight_sum.toFixed(2);
         
        if (random_num <= weight_sum) {
          if(returnarraypos) return i
            return list[i];
        }
    }
     
    // end of function
};
/* BIASRAN EXAMPLE
biasRan([1,2,3], [0.2, 0.8, 0.3])
1 - Returned 20% of the time
2 - Returned 80% of the time
3 - Returned 30% of the time
*/

const { uniqueNamesGenerator, adjectives, colors, animals, names } = require('unique-names-generator');
exports.chooseBotName = () => {
  return uniqueNamesGenerator({
  dictionaries: [(Math.random()>=0.5?colors:adjectives), (Math.random()>=0.5?names:animals)],
  length: 2,
  style: 'capital',
  separator: ' '
});
};

exports.chooseBossName = () => {
const customAdjectives = [
'big',
'large',
'huge',
'godly',
'scary',
'ginormous',
'enormous',
'colossal',
'fat',
'unholy',
'divine'
]
return uniqueNamesGenerator({
  dictionaries: [customAdjectives,names],
  length: 2,
  style: 'capital',
  separator: '-'
});
};