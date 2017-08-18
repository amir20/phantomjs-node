let mockedSpawn;
function setMockedSpawn(mock) {
  mockedSpawn = mock;
}

const spawn = (...args) => mockedSpawn(...args);

export { spawn, setMockedSpawn };
