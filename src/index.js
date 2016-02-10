import Phantom from './phantom'

module.exports.create = () => {
    return Promise.resolve(new Phantom());
};
