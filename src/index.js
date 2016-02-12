import Phantom from './phantom'

module.exports.create = (args) => {
    return Promise.resolve(new Phantom(args));
};
