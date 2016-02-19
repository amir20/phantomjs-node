import Phantom from "./phantom";

module.exports.create = (args) => {
    return new Promise((resolve, reject) => {
        resolve(new Phantom(args));
    });
};
