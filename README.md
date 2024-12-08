# vite-plugin-svg-template
Import SVG as template src.

This plugin allows you to use an external SVG file as a component's template.

The main benefits of this approach over other svg plugins or methods are:

 - You can edit the .svg file with a graphical editor, like Inkscape.
 - You can use placeholders and other template language elements like `{{ replaceMe }}`.

This plugin handles any embedded styles within the .svg file by scoping them to the `<svg>` tag. You can apply additional styles in the component's style section.

## Example

vite.config.js:
```javascript
import { defineConfig } from 'vite'
import vueSvgTemplate from 'vite-plugin-svg-template';
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vueSvgTemplate(),
        vue(),
    ],
    ...
});
```

Now in your single-file components, you can use an external SVG file as a template.

My-Component.vue:
```html
<template src="./My-Component.svg"></template>

<script>
export default {
    name: 'My-Component',

    ...
};
</script>

<style scoped>
/* You can define additional styles here */
</style>
```
