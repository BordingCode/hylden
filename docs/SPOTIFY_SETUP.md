# Connecting Hylden to your Spotify — step by step

This is the one thing only you can do, because Spotify ties it to *your* account.
It's free and takes about 5 minutes. You never share your password.

## What you'll do
Create a small "developer app" on Spotify's website. This is just Spotify's way of
saying "this Hylden website is allowed to read my saved albums." At the end you copy
**one code** (called a *Client ID* — safe to share, it is not a password) and paste it
to me.

## Steps

1. Go to **https://developer.spotify.com/dashboard** and log in with your normal
   Spotify account.

2. Click **Create app**.

3. Fill in the form:
   - **App name:** `Hylden`
   - **App description:** `My personal album shelf`
   - **Redirect URI:** paste this exactly, then click **Add**:
     ```
     https://bordingcode.github.io/hylden/
     ```
     ⚠️ It must match exactly — including `https://` and the trailing slash `/`.
   - **Which API/SDKs are you planning to use?** tick **Web API**.

4. Accept the terms and click **Save**.

5. On the app's page, click **Settings**. You'll see **Client ID** — a string of
   letters and numbers. Click to copy it.

6. **Send me that Client ID.** I'll paste it into the app and push it live.

That's it. After that you open the site, tap **Forbind Spotify**, approve once, and
your hearted albums fill the shelf.

## Good to know
- Spotify starts new apps in "Development mode," which is perfect here — it just means
  only accounts *you* allow can use it. Your own account works automatically. If you
  ever want family to use it too, you add their Spotify email under
  **Settings → User Management** (up to 25 people, still free).
- Only albums you've **saved/hearted (♥)** in Spotify show up. Spotify doesn't let any
  app see "everything you've played." So heart the albums you love and watch the shelf
  grow.
