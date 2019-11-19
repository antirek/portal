
const uuidv4 = require("uuid/v4");
const Hashids = require("hashids");
const hashids = new Hashids();


const deHyphenatedUUID = () => uuidv4().replace(/-/gi, "");
const encodedId = () => hashids.encodeHex(deHyphenatedUUID());

module.exports = {
    encodedId,
}