/**
 * HiPaySignitureMgr object is responsible for calculating and verifying SHA-1 hash string in HiPay requests.
 */

var MessageDigest = require('dw/crypto/MessageDigest'),
    Encoding      = require('dw/crypto/Encoding'),
    Bytes         = require('dw/util/Bytes'),
    Map           = require('dw/util/Map');

function HiPaySignitureMgr() {}

/* Validates if the hashed string based on the parameters is correct. */
HiPaySignitureMgr.checkIsValidResponse = function(paramsMap, passPhrase) {
    var shaSign = paramsMap.get("hash")[0],
        shaOut  = HiPaySignitureMgr.calculateSigniture(paramsMap, passPhrase),
        isValid = shaSign == shaOut;

    return isValid;
}

/* Validates if the hashed string based on the parameters is correct. */
HiPaySignitureMgr.checkIsValidNotification = function(paramsMap, passPhrase, shaSign) {
    var shaOut  = HiPaySignitureMgr.calculateNotificationSigniture(paramsMap, passPhrase),
        isValid = shaSign == shaOut;

    return isValid;
}

/**
 * Generate SHA1 hash based on the given parameters and pass phrase.
 * Empty parameters are exluded.
 */
HiPaySignitureMgr.calculateSigniture = function(paramsMap, passPhrase) {
    var names = [];

    for each (var entry in paramsMap.entrySet()) {
        if (entry.getKey() == "hash" || empty(entry.getValue()[0])) {
            continue;
        }

        names.push(entry.getKey());
    }

    names.sort(); /* Sort the elements of the Array in alphabetical order */

    var stringToHash = ''; /* Construct the string to be hashed */

    for (var i = 0; i < names.length; i++) {
        stringToHash += names[i] + paramsMap.get(names[i])[0] + passPhrase;
    }

    var digest   = new MessageDigest(MessageDigest.DIGEST_SHA_1),
        sha1Hash = Encoding.toHex(digest.digest(MessageDigest.DIGEST_SHA_1, new Bytes(stringToHash, "UTF-8"))); /* SHA-1 Hash the final string */

    return sha1Hash;
}

/**
 * Generate SHA1 hash based on the given parameters and pass phrase.
 * Empty parameters are exluded.
 */
HiPaySignitureMgr.calculateNotificationSigniture = function(paramsMap, passPhrase) {
    var paramsList = []; /* Construct the string to be hashed */

    for each (var entry in paramsMap.entrySet()) {
        paramsList.push(Encoding.toURI(entry.getKey(), "UTF-8") + '=' + Encoding.toURI(entry.getValue()[0], "UTF-8").replace(/\*/g, "%2A"));
    }

    var paramsString = paramsList.join('&'),
        stringToHash = paramsString + passPhrase,
        digest       = new MessageDigest(MessageDigest.DIGEST_SHA_1),
        sha1Hash     = Encoding.toHex(digest.digest(MessageDigest.DIGEST_SHA_1, new Bytes(stringToHash, "UTF-8"))); /* SHA-1 Hash the final string */

    return sha1Hash;
}

module.exports.HiPaySignitureMgr = HiPaySignitureMgr;
