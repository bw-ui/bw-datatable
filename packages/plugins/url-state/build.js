/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-url-state - Build Script
 * ============================================================================
 */

import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

async function build() {
  // ESM build
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/url-state.esm.min.js',
    target: ['es2020'],
    legalComments: 'none',
  });
  console.log('✓ ESM build complete');

  // IIFE build
  await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'BWUrlState',
    outfile: 'dist/url-state.min.js',
    target: ['es2020'],
    legalComments: 'none',
    footer: {
      js: 'BWUrlState=BWUrlState.UrlStatePlugin;',
    },
  });
  console.log('✓ IIFE build complete');

  console.log('\n✅ @bw-ui/datatable-url-state build complete!\n');
}

if (isWatch) {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/url-state.esm.min.js',
  });
  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
