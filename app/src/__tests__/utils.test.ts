import { getStreamLength } from '../utils';

describe('getStreamLength', () => {
  let realDateNow: () => number;
  beforeAll(() => {
    realDateNow = global.Date.now;
  });
  beforeEach(() => {
    global.Date.now = jest.fn().mockReturnValue(1624594066282);
  });
  afterAll(() => {
    global.Date.now = realDateNow;
  });
  it('formats lengths over 1 hour', () => {
    const res = getStreamLength('2021-06-25T02:22:50Z');
    expect(res).toEqual('1:44:56');
  });
  it('omits hours', () => {
    const res = getStreamLength('2021-06-25T03:22:50Z');
    expect(res).toEqual('44:56');
  });
  it('keeps zeroed minutes', () => {
    const res = getStreamLength('2021-06-25T04:06:50Z');
    expect(res).toEqual('00:56');
  });
  it('pads minutes and seconds with zeroes', () => {
    const res = getStreamLength('2021-06-25T04:03:45Z');
    expect(res).toEqual('04:01');
  });
});
