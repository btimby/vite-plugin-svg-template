import { readFileSync } from 'fs';
import HTMLParser from 'node-html-parser';
import { compileTemplate } from '@vue/compiler-sfc';

const STRIP_TAGS = [
    'sodipodi:namedview',
];
const SCOPE_ATTR = 'data-id-css-scope';
const DEFAULT_OPTIONS = {
    scopeCss: true,
    stripTags: STRIP_TAGS,
};
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CHARS_LEN = CHARS.length;

function parseId(id) {
    const [idWithoutQuery, query] = id.split('?', 2);
    const params = Object.fromEntries(new URLSearchParams(query));
    const matched = (
        idWithoutQuery.endsWith('.svg') &&
        params.type === 'template'
    );
  
    return {
        idWithoutQuery,
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
    const compilerOptions = {};

    if (options.stripTags) {
        compilerOptions.isCustomElement = (name) => {
            return options.stripTags.includes(name);
        };
    }

    return {
        name: 'svg-template',

        async transform(source, id) {
            const { idWithoutQuery, params, matched } = parseId(id);

            if (!matched) {
                return;
            }

            source = readFileSync(idWithoutQuery, 'utf8');

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
