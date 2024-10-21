// svelte.config.js

import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';
import path from 'path';

export default {
  kit: {
    adapter: adapter(),
    alias: {
      $components: path.resolve('./src/components'),
      $lib: path.resolve('./src/lib'),
    },
    // Removed vite configuration from here
  },
  preprocess: [preprocess()],
};
