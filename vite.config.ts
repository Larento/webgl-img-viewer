import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve('./src'),
        },
    },
});
