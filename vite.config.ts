import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { rm } from 'fs/promises';
import { existsSync } from 'fs';

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// Plugin to remove large data files from dist after build (since we use D1 database)
function removeDataFilesPlugin(): PluginOption {
  return {
    name: 'remove-data-files',
    apply: 'build',
    closeBundle: async () => {
      const distPath = resolve(projectRoot, 'dist');
      const filesToRemove = [
        'data/index.json',
        'data/index.json.bak',
        'data/defs',
        'data/defs.bak',
      ];
      
      for (const file of filesToRemove) {
        const fullPath = resolve(distPath, file);
        if (existsSync(fullPath)) {
          try {
            await rm(fullPath, { recursive: true, force: true });
            console.log(`[remove-data-files] Removed: ${file}`);
          } catch (e) {
            console.warn(`[remove-data-files] Failed to remove ${file}:`, e);
          }
        }
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
    removeDataFilesPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    // Optimize for speed
    minify: 'esbuild',
    target: 'esnext',
    // Faster CSS handling
    cssMinify: 'esbuild',
    // Reduce work by skipping certain optimizations
    reportCompressedSize: false, // Skip gzip size calculation
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      // Reduce treeshaking overhead
      treeshake: {
        moduleSideEffects: false,
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  publicDir: 'public',
  // Optimize dependency pre-bundling
  optimizeDeps: {
    // Don't re-scan on every build
    force: false,
  },
});
