import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 8000,
    },
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
};
