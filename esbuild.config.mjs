import esbuild from "esbuild";

const prod = process.argv.includes("--prod");

esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  target: "es2020",
  platform: "node",
  external: ["obsidian"],
  outfile: "main.js",
  sourcemap: prod ? false : "inline",
  minify: prod
}).catch(() => process.exit(1));
