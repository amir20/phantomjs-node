import Phantom from "./phantom";

module.exports.create = (args) => {
    new Promise((resolve, reject) => {
        return resolve(new Phantom(args));
    });
};
