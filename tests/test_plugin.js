import { resolve } from 'path';
import { assert } from 'chai';
import vueSvgPlugin from '../src/index.js';

const SVG_PATH = resolve('svg/Court.svg');

describe('Plugin', () => {
    describe('Scopes CSS', () => {
        it('a data-id attribute is present when scoping', async () => {
            const plugin = vueSvgPlugin();
            const result = await plugin.transform('', `${SVG_PATH}?type=template`);
            assert.include(result.code, '"data-id-css-scope":');
        });

        it ('a data-id attribbute is not present when not scoping', async () => {
            const plugin = vueSvgPlugin({ scopeCss: false });
            const result = await plugin.transform('', `${SVG_PATH}?type=template`);
            assert.notInclude(result.code, '"data-id-css-scope":');
        });
    });
});
