# Pixel Perfect Display

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/09e5431e-3dcc-433e-8c94-b5c82fae9acf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Run on a VPS with PM2

The production server is configured to listen on port `3010`:

```sh
npm install
npm run build
pm2 start ecosystem.config.cjs
```

The PM2 app name is `railsops-workforce-tracker`. To keep it running after a
server reboot, run `pm2 save` after the first successful start. The current app
does not require an external database or API credential. Its seeded demo data
is stored in `src/lib/tracker-data.ts` and is loaded automatically when no
browser data exists, so a fresh VPS deployment can run without a database.
Keep any future server-side secrets in the VPS environment instead of
committing them to the ecosystem file.
