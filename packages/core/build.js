/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable - Build Script
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
    outfile: 'dist/bw-datatable.esm.min.js',
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
    globalName: 'BWDataTable',
    outfile: 'dist/bw-datatable.min.js',
    target: ['es2020'],
    legalComments: 'none',
    footer: {
      js: 'BWDataTable=BWDataTable.BWDataTable;',
    },
  });
  console.log('✓ IIFE build complete');

  // CSS build
  await esbuild.build({
    entryPoints: ['src/styles/bw-datatable.css'],
    bundle: true,
    minify: true,
    outfile: 'dist/bw-datatable.min.css',
  });
  console.log('✓ CSS build complete');

  console.log('\n✅ @bw-ui/datatable build complete!\n');
}

if (isWatch) {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/bw-datatable.esm.min.js',
  });
  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
