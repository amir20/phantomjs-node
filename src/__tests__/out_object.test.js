import 'babel-polyfill';
import Phantom from '../phantom';
import OutObject from '../out_object';

describe('Command', () => {
  let phantom;

  beforeEach(() => {
    phantom = new Phantom();
  });
  afterEach(() => phantom.exit());

  it('target to be set', () => {
    expect(phantom.createOutObject().target).toBeDefined();
  });

  it('#createOutObject() is a valid OutObject', () => {
    const outObj = phantom.createOutObject();
    expect(outObj).toBeInstanceOf(OutObject);
  });
});
