# BikePowell.org — Deploy Guide

Your project has four files:

```
index.html      ← public website
admin.html      ← your private admin form
worker.js       ← the Cloudflare Worker (API)
wrangler.toml   ← Worker configuration
```

Follow these steps in order. The whole thing should take about 30 minutes.
Come back to this file if anything goes wrong — there are troubleshooting notes at the bottom.

---

## Step 1 — Install Node.js

Wrangler (Cloudflare's CLI tool) requires Node.js.

1. Go to https://nodejs.org and download the **LTS** version.
2. Run the installer — all defaults are fine.
3. When it's done, open **Terminal** (Mac) or **Command Prompt** (Windows).
4. Type this and press Enter to confirm it worked:

```
node --version
```

You should see something like `v20.11.0`. Any version 18 or higher is fine.

---

## Step 2 — Install Wrangler

In the same Terminal / Command Prompt window, paste this and press Enter:

```
npm install -g wrangler
```

This downloads Wrangler globally so you can use it from any folder. It takes about a minute.

Confirm it worked:

```
wrangler --version
```

You should see something like `3.x.x`.

---

## Step 3 — Log in to Cloudflare

```
wrangler login
```

This opens a browser tab asking you to authorize Wrangler with your Cloudflare account.
Click **Allow**. You can close the tab when it says "Wrangler is now logged in."

---

## Step 4 — Create the KV namespace

KV is Cloudflare's key-value store — this is where your business data will live.

```
wrangler kv:namespace create BUSINESSES
```

The output will look something like this:

```
✅ Created namespace "BUSINESSES" with id "a1b2c3d4e5f6..."
```

**Copy that ID.** Open `wrangler.toml` in a text editor and replace the placeholder:

```toml
# Before:
id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"

# After (example — yours will be different):
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

Save the file.

---

## Step 5 — Set your admin password

This stores your password securely in Cloudflare — it never appears in your code files.

```
wrangler secret put ADMIN_PASSWORD
```

Wrangler will prompt you to type a password. Pick something you'll remember — you'll type it
into admin.html every time you add a business on your phone.

---

## Step 6 — Deploy the Worker

Make sure your Terminal is in the folder that contains `worker.js` and `wrangler.toml`, then:

```
wrangler deploy
```

The output will show your Worker's URL — something like:

```
https://bikepowell-api.YOUR-SUBDOMAIN.workers.dev
```

**Copy this URL.** You need to paste it in two places:

1. In `index.html`, find this line near the bottom and replace the placeholder:
   ```js
   const WORKER_URL = "https://bikepowell-api.YOUR-SUBDOMAIN.workers.dev";
   ```

2. Do the same in `admin.html`.

---

## Step 7 — Seed your initial data (optional)

If you want to load the businesses from the original `index.html` into KV all at once,
rather than entering them one by one in the admin form, you can do it from the command line.

Create a file called `seed.json` with your initial business list (see the businesses array
in the original index.html for the format), then run:

```
wrangler kv:key put --binding=BUSINESSES "list" --path=seed.json
```

Or just use the admin form — it's actually quick once you're rolling.

---

## Step 8 — Deploy index.html and admin.html to Cloudflare Pages

You likely already have a GitHub-backed Cloudflare Pages workflow from your other sites.
The process is the same:

1. Create a new GitHub repo (e.g. `bikepowell`).
2. Push `index.html` and `admin.html` to the repo root.
3. In Cloudflare Pages, click **Create a project** → **Connect to Git** → select the repo.
4. Build settings:
   - Build command: *(leave blank)*
   - Build output directory: `/`
5. Click **Save and Deploy**.

After deploying, go to your Pages project → **Custom Domains** and add `BikePowell.org`.
Cloudflare will walk you through the DNS setup (it's just a couple of clicks since your
domain is already on Cloudflare).

---

## Step 9 — Bookmark admin.html on your phone

Once live, open `https://bikepowell.org/admin.html` on your phone.

- On iPhone: tap the Share button → **Add to Home Screen**
- On Android: tap the menu (⋮) → **Add to Home screen**

Now it's one tap from your home screen when you're out biking.

---

## Troubleshooting

**"wrangler: command not found"**
The npm global bin folder isn't in your PATH. Try `npx wrangler` instead of `wrangler` for all commands.

**Worker URL returns an error in the browser**
Open your browser's developer tools (F12) → Console tab. The error message will say what went wrong.
Common cause: the KV namespace ID in `wrangler.toml` was not updated before deploying.
Fix it, then run `wrangler deploy` again.

**Admin form says "Wrong password"**
The password you typed into the form doesn't match what you set with `wrangler secret put`.
You can change it anytime by running `wrangler secret put ADMIN_PASSWORD` again.

**Public site loads but shows no businesses**
The Worker URL in `index.html` is still the placeholder, or the KV namespace is empty.
Check the browser console for the actual fetch error.

**CORS error in browser console**
This means `index.html` is running on a different domain than the Worker, and the Worker
isn't sending the right headers. This should not happen with the provided `worker.js` — 
double-check that you deployed the latest version of `worker.js` with `wrangler deploy`.

---

## Making updates later

**To add or remove businesses:** use admin.html — no code changes needed.

**To change the site design:** edit `index.html`, commit to GitHub, Cloudflare Pages auto-deploys.

**To update the Worker:** edit `worker.js`, then run `wrangler deploy` again from your Terminal.

**To check what's in KV:**
```
wrangler kv:key get --binding=BUSINESSES "list"
```

**To back up your data:**
```
wrangler kv:key get --binding=BUSINESSES "list" > backup.json
```

Run this any time you want a local copy of your business list.
