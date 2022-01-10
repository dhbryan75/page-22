export const delay = async function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const randomBool = function(prob) {
    return Math.random() < prob;
};

export const randomInt = function(min, max) {
    if(min === max) return min;
    return min + Math.floor((max - min + 1) * Math.random());
};

export const randomDouble = function(min, max) {
    return min + (max - min) * Math.random();
}

export const randomSelect = function(l) {
    if(l.length === 0) return null;
    return l[randomInt(0, l.length)];
}