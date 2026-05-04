import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: {
    adapter: adapter({
      functions: {
        'api/admin/trust/[id]/document': {
          includeFiles: ['static/templates/**']
        }
      }
    })
  }
};