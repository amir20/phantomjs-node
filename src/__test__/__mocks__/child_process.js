let mockedSpawn;
function setMockedSpawn(mock) {
    mockedSpawn = mock;
}

const spawn = (...args) => {
    return mockedSpawn(...args);
};

export {spawn, setMockedSpawn};