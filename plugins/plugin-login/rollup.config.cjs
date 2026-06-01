const { withNx } = require('@nx/rollup/with-nx');
const url = require('@rollup/plugin-url');
const svg = require('@svgr/rollup');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: '../../dist/plugins/plugin-login',
    tsConfig: './tsconfig.lib.json',
    compiler: 'swc',
    skipTypeCheck: true,
    useLegacyTypescriptPlugin: true,
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@temp-workspace/ui-contracts',
      '@temp-workspace/ui-registry',
      '@temp-workspace/plugin-loader',
      '@temp-workspace/token-bridge',
    ],
    format: ['esm'],
    assets: [{ input: '.', output: '.', glob: 'README.md' }],
  },
  {
    plugins: [
      svg({
        svgo: false,
        titleProp: true,
        ref: true,
      }),
      url({
        limit: 10000, // 10kB
      }),
    ],
  },
);
