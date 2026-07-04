import { loadVersion } from '../../src/utils/version';

describe('loadVersion', () => {
  it('returns semver from package.json', () => {
    const version = loadVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(version).not.toBe('3.2.0');
  });
});
