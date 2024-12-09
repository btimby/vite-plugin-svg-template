import { resolve } from 'path';
import { assert } from 'chai';
import vueSvgPlugin from '../src/index.js';

const SVG_PATH = resolve('svg/Court.svg');

describe('Plugin', async () => {
    const plugin = vueSvgPlugin();
    const result = await plugin.transform('', `${SVG_PATH}?type=template`);

    describe('Scopes CSS', () => {
        it('a data-id attribute is present', async () => {
            assert.include(result.code, '"data-id-css-scope":');
        });
    });
});
