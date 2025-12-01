/**
 * ============================================================================
 * Black & White UI Engineering
 * @bw-ui/datatable-export - Build Script
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
    outfile: 'dist/export.esm.min.js',
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
    globalName: 'BWExport',
    outfile: 'dist/export.min.js',
    target: ['es2020'],
    legalComments: 'none',
    footer: {
      js: 'BWExport=BWExport.ExportPlugin;',
    },
  });
  console.log('✓ IIFE build complete');

  console.log('\n✅ @bw-ui/datatable-export build complete!\n');
}

if (isWatch) {
  const ctx = await esbuild.context({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'esm',
    outfile: 'dist/export.esm.min.js',
  });
  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
