import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import replace from 'rollup-plugin-replace';
import importHttp from 'import-http/rollup';

import fs from 'fs';
import path from 'path';

export default {
  input: 'src/app.js',
  output: {
    dir: 'build',
    // file: 'build/bundle.js',
    format: 'es'
  },
  plugins: [
    del({ targets: 'build/*' }),
    importHttp(),
    copy({
      targets: [
        { src: 'index.electron.html', dest: 'build', rename: 'index.html' },
        { src: 'assets/icon.png', dest: 'build' },
        { src: 'assets', dest: 'build' },
        { src: 'libs', dest: 'build' },
        { src: ['manifest.json'], dest: 'build' },
        { src: ['./src/**/*.scss', './src/**/*.css'], dest: 'build' },
      ],
      flatten: false
    })
  ]
};