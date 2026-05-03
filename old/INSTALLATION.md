# 🚀 TedTalk Installation Guide

Follow these simple steps to set up the TedTalk evaluation system for your new client.

## 1. Supabase Backend Setup (5 mins)

The app needs a database to store students and scores.

1.  **Create a Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Run Setup Script**: 
    - Open the **SQL Editor** in your Supabase dashboard.
    - Click **New Query**.
    - Open the `client_setup.sql` file (included in your package) and copy its entire content.
    - Paste it into the SQL Editor and click **Run**.
3.  **Storage Setup**:
    - Go to the **Storage** tab in Supabase.
    - Create a new bucket named `winner-photos`.
    - Make sure the bucket is set to **Public**.
4.  **Get Credentials**:
    - Go to **Project Settings** > **API**.
    - Copy your **Project URL** and your **anon public** key.

---

## 2. Generate Client Package (2 mins)

Instead of editing code manually, use our builder tool:

1.  Open `config_builder.html` in your browser.
2.  Paste the **Project URL** and **Anon Key** you copied from Supabase.
3.  Click **Generate Client ZIP**.
4.  A ZIP file will download containing the *entire* customized application for your client.

---

## 3. Launching the App (3 mins)

You can host the files anywhere (GitHub Pages, Netlify, Vercel, or even a basic server).

### Option A: Netlify Drop (Fastest)
1.  Go to [Netlify Drop](https://app.netlify.com/drop).
2.  Drag and drop the **ZIP file** you just generated.
3.  Your app is live!

### Option B: GitHub Pages
1.  Extract the ZIP and push the files to a new GitHub repository.
2.  Enable **GitHub Pages** in the repository settings.

---

## 4. Usage Tips

*   **Admin Login**: The default login is `admin` with password `admin123`. Change this in the "Setup > Users" tab once logged in.
*   **Install as PWA**: Open the app URL on a mobile device (Chrome on Android or Safari on iOS) and choose "Add to Home Screen" for a smooth, native app experience.
*   **Winner Display**: Open the `/winners/` relative URL on a projector or separate screen. It will update automatically when you "Push" a winner from the results tab.

---

### Need Help?
Check the documentation in the original project or reach out for support.
