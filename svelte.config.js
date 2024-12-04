//svelte.config.js
import vercel from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import path from 'path';

export default {
  kit: {
    adapter: vercel(), // Use Vercel adapter
    alias: {
      $components: path.resolve('./src/components'),
      $lib: path.resolve('./src/lib'),
    }
  },
  preprocess: [preprocess()]
};
