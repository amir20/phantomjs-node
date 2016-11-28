import Command from '../command';

describe('Command', () => {
    it('id to be randomly generated', () => {
        expect(new Command('test').id).toEqual('85a86bea0cff860c343e5c9b83381e2e');
    });

    it('.target to be set correctly', () => {
        expect(new Command('abc').target).toEqual('abc');
    });

    it('JSON.stringify(command) to be valid json', () => {
        expect(JSON.stringify(new Command('target', 'name'))).toMatchSnapshot();
    });
});
