import Command from '../command';

describe('Command', () => {
  it('id to be randomly generated', () => {
    expect(new Command('test').id).toEqual(new Command().id - 1);
  });

  it('.target to be set correctly', () => {
    expect(new Command('abc').target).toEqual('abc');
  });
});
