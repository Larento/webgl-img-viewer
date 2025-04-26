/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: ['eslint:recommended'],
    ignorePatterns: ['dist'],
    parser: '@typescript-eslint/parser',
    overrides: [
        {
            files: ['**/*.cjs', '*.config.js'],
            env: {
                node: true,
            },
        },
    ],
};
