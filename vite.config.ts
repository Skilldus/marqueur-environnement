import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                content: resolve(__dirname, "src/content.ts"),
                options: resolve(__dirname, "src/options.ts"),
                // Ajout possible plus tard : background, popup, etc.
            },
            output: {
                entryFileNames: "[name].js"
            }
        }
    }
});