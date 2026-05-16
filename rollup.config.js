import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json' with { type: 'json' };

 const plugins = [
    resolve({
        browser: true,
        extensions: ['.js', '.ts']
    }),
    commonjs(),
    json(),
    typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: false,
        include: ['src/**/*.ts', 'src/**/*.js'],
        exclude: 'node_modules/**'
    }),
    copy({
        targets: [
            {src: './examples/assets/styles/**/*', dest: './dist/css'}
        ]
    }),
    terser({
    	format: {
    		comments: false
    	}
    }),
    babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'runtime',
        presets: [
            [
                '@babel/env',
                {
                    modules: false,
                    targets: {
                        browsers: '> 1%, IE 11, not op_mini all, not dead',
                        node: 8
                    },
                    useBuiltIns: 'usage',
                    corejs: 3
                }
            ]
        ],
        plugins: ['@babel/plugin-transform-runtime']
    }),
];

export default [
    // browser-friendly UMD build
    {
        input: pkg.moduleSrc,
        output: {
            name: 'PaperView',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: plugins
    },
    {
        input: pkg.moduleSrc,
        output: {
            name: "PaperViewModule",
            file: "./dist/paperview.esm.js",
            format: 'es'
        },
        plugins: plugins
    },
    {
        input: "./src/polyfill/polyfill.ts",
        output: {
            name: 'PaperViewPolyfill',
            file: "./dist/paperview.polyfill.js",
            format: 'umd'
        },
        plugins: plugins
    },
    // Node.js PDF Exporter (CommonJS)
    {
        input: "./src/export/node-pdf-exporter.ts",
        output: {
            name: 'PaperViewNodePDFExporter',
            file: "./dist/paperview.node-pdf.js",
            format: 'cjs'
        },
        plugins: plugins,
        external: ['puppeteer', 'fs', 'path']
    },
    // Layout Web Worker (standalone)
    {
        input: "./src/chunker/layout.worker.ts",
        output: {
            file: "./dist/layout.worker.js",
            format: 'iife'
        },
        plugins: plugins
    }
];
