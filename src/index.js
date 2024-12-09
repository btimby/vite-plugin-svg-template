import { readFileSync } from 'fs';
import HTMLParser from 'node-html-parser';
import { compileTemplate } from '@vue/compiler-sfc';

const STYLE = /<style[^>]*>([\s\S]*)<\/style>/mig
const SCOPE_ATTR = 'data-id-css-scope';
const DEFAULT_OPTIONS = {
    scopeCss: true,
    stripTags: [],
};

function resolve(id) {
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

function makeId(length) {
    let result = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result[i] = characters.charAt(Math.floor(Math.random() * characters.length));
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

/*        
        resolveId() {
            console.log('resolveId:', arguments);
        },

        load() {
            console.log('load:', arguments);
        },
*/

        async transform(source, id) {
            const { idWithoutQuery, params, matched } = resolve(id);

            if (!matched) {
                return;
            }

            // console.log(id);
            source = readFileSync(idWithoutQuery, 'utf8');

            const doc = HTMLParser.parse(source);
            const svg = doc.querySelector('svg');
            const style = doc.querySelector('defs > style');

            if (svg && style) {
                if (options.scopeCss) {
                    const idStr = makeId(8);
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
            // console.log(code);

            return {
                code,
                map,
            };
        },
    };
}

export default svgTemplatePlugin;
