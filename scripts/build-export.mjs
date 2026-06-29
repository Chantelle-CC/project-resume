// Cross-platform static export build script.
// Sets env vars then runs `next build`.
// Usage: node scripts/build-export.mjs

process.env.NEXT_EXPORT = "1"
process.env.BASE_PATH = process.env.BASE_PATH ?? "/project-resume"

const { execSync } = await import("node:child_process")

console.log(`[build-export] NEXT_EXPORT=${process.env.NEXT_EXPORT} BASE_PATH=${process.env.BASE_PATH}`)

execSync("npx next build", { stdio: "inherit", cwd: new URL("..", import.meta.url) })
