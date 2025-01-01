import { readFile } from 'fs/promises';
import HTMLParser from 'node-html-parser';
import { compileTemplate } from '@vue/compiler-sfc';
import { optimize as optimizeSvg } from 'svgo';

const STRIP_TAGS = [
    'sodipodi:namedview',
];
const SCOPE_ATTR = 'data-id-css-scope';
const DEFAULT_OPTIONS = {
    scopeCss: true,
    stripTags: STRIP_TAGS,
    optimize: true,
    optimizeConfig: {},
};
// NOTE: Disable removeViewBox as it clobbers usefulness of SVG.
// https://github.com/svg/svgo/issues/1128
const DEFAULT_SVGO_CONFIG = {
    plugins: [
        {
            name: 'preset-default',
            params: {
                overrides: {
                    removeViewBox: false,
                },
            },
        },
    ],
};
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CHARS_LEN = CHARS.length;

function parseId(id) {
    const [path, query] = id.split('?', 2);
    const params = Object.fromEntries(new URLSearchParams(query));
    const matched = (
        path.endsWith('.svg') &&
        params.type === 'template'
    );
  
    return {
        path,
        params,
        matched,
    };
}

function randomStr(length) {
    let result = [];

    for (let i = 0; i < length; i++) {
        result[i] = CHARS.charAt(Math.floor(Math.random() * CHARS_LEN));
    }

    return result.join('');
}

function svgTemplatePlugin(options) {
    options = {
        ...DEFAULT_OPTIONS,
        ...options,
    };
    if (options.optimize !== false) {
        options.optimize = {
            ...DEFAULT_SVGO_CONFIG,
            ...options.optimize,
        };
    }
    const compilerOptions = {};

    if (options.stripTags) {
        compilerOptions.isCustomElement = (name) => {
            return options.stripTags.includes(name);
        };
    }

    return {
        name: 'svg-template',

        async transform(source, id) {
            const { path, params, matched } = parseId(id);

            if (!matched) {
                return;
            }

            source = await readFile(path, 'utf8');

            if (options.optimize) {
                ({ data: source } = optimizeSvg(source, {
                    ...options.optimizeConfig,
                    path,
                }));
            }

            const doc = HTMLParser.parse(source);
            const svg = doc.querySelector('svg');
            const style = doc.querySelector('defs > style');

            if (svg && style) {
                if (options.scopeCss) {
                    const idStr = randomStr(8);

                    svg.setAttribute(SCOPE_ATTR, idStr);
                    style.set_content(`svg[${SCOPE_ATTR}="${idStr}"] {\n${style.rawText}}`);
                }

                style.setAttribute("is", "style");
                style.tagName = "component";
                source = svg.toString();
            }

            const { code: render, map } = compileTemplate({
                id,
                filename: id,
                source,
                transformAssetUrls: false,
                compilerOptions,
            });

            const code = `${render}\nexport default { render };`;

            return {
                code,
                map,
            };
        },
    };
}

export default svgTemplatePlugin;
