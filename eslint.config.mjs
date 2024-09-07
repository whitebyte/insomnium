import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import stylistic from "@stylistic/eslint-plugin";


export default [
    {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
    {languageOptions: { globals: globals.browser }},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        plugins: { "@stylistic": stylistic },
        ignores: [
            "build",
            "bin",
            "send-request",
            "coverage",
            "src/main.min.js",
            "src/preload.js",
            "**/svgr",
            "svgr.config.js"
        ],
        rules: {
            'curly': 'error',
            'no-console': 'warn',
            'new-cap': ['warn', {
                'newIsCap': true,
                'capIsNew': false
            }],
            'no-lone-blocks': 'warn',
            'no-return-await': 'warn',
            'default-case': 'error',
            '@stylistic/indent': ['warn', 4, { 'SwitchCase': 1 }],
            '@stylistic/quotes': ['warn', 'single', { 'avoidEscape': true, allowTemplateLiterals: true }],
            '@stylistic/no-trailing-spaces': 'warn',
            '@stylistic/semi': ['warn', 'always'],
            '@stylistic/semi-spacing': 'warn',
            '@stylistic/semi-style': ['warn', 'last'],
            '@stylistic/quote-props': ['warn', 'as-needed'],
            '@stylistic/space-before-blocks': 'warn',
            '@stylistic/no-whitespace-before-property': 'warn',
            '@stylistic/block-spacing': 'warn',
            '@stylistic/arrow-spacing': 'warn',
            '@stylistic/keyword-spacing': ['warn', { 'before': true }],
            '@stylistic/array-bracket-spacing': ['warn', 'never', {
                'objectsInArrays': false,
                'arraysInArrays': false
            }],
            '@stylistic/func-call-spacing': ['warn', 'never'],
            '@stylistic/no-extra-parens': 'warn',
            '@stylistic/max-len': ['warn', { 'code': 120, 'comments': 240 }],
            '@stylistic/new-parens': 'warn',
            '@stylistic/space-in-parens': ['warn', 'never'],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/comma-spacing': ['error', { 'before': false, 'after': true }],
            '@stylistic/switch-colon-spacing': 'error',
            '@stylistic/brace-style': ['warn', '1tbs', { 'allowSingleLine': true }],
            '@stylistic/object-curly-spacing': ['warn', 'always'],
            '@stylistic/no-multiple-empty-lines': ['warn', {
                'max': 2,
                'maxBOF': 0,
                'maxEOF': 1
            }],
            '@stylistic/padded-blocks': ['warn', 'never'],
            '@stylistic/lines-between-class-members': ['warn', 'always', { exceptAfterSingleLine: true }],
            '@stylistic/key-spacing': ['warn', {
                'beforeColon': false,
                'afterColon': true,
                'mode': 'strict'
            }],
            '@stylistic/eol-last': ['warn', 'always'],
            '@stylistic/padded-blocks': ['error', 'never'],
        }
    }
];
