import { defineConfig, loadEnv } from 'vite';
import { UserConfig } from 'vite';

// Make sure you load environment variables
export default defineConfig(({ command, mode }) => {
    // Load the environment variables based on the mode
    const env = loadEnv(mode, process.cwd(), '');
    const port = env.VITE_PORT || '3030';

    return {
        server: {
            host: '0.0.0.0',
            allowedHosts: [env.VITE_DOMAIN, 'localhost', '127.0.0.1'],
            port: parseInt(port, 10),
        },
        build: {
            rollupOptions: {
                external: ['fs', 'path'], // Mark these modules as external
            },
        },
    };
});