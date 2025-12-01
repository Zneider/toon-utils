import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default [
  // UMD build - full bundle
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/toon-parser.js',
      format: 'umd',
      name: 'ToonParser',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        outDir: 'dist/umd',
      }),
    ],
  },
  // UMD build - minified
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/umd/toon-parser.min.js',
      format: 'umd',
      name: 'ToonParser',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        outDir: 'dist/umd',
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
        },
        mangle: {
          properties: false,
        },
      }),
    ],
  },
];
