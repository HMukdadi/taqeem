# Technical Setup Guide

Taqeem is an open-source project designed for easy self-hosting. This guide is for IT professionals or tech-savvy educators.

## 🧱 Prerequisites
- A [Supabase](https://supabase.com) account (the free tier is usually sufficient for a single school).
- Basic knowledge of HTML/JavaScript.

## 🚀 Setup Steps

### 1. Create a Supabase Project
- Log in to your Supabase dashboard and create a new project.
- Take note of your **Project URL** and **Anon Key** (found under Settings -> API).

### 2. Run the SQL Blueprint
- Copy the contents of `ARCHIVE_SCHEMA.SQL` (available on the main landing page or in the `sql/` directory).
- Paste it into the Supabase **SQL Editor** and run it. This creates all necessary tables: `competitions`, `students`, `evaluations`, and `custom_users`.

### 3. Configure the App
- Open the Taqeem app landing page.
- Go to the **Project Console** section.
- Enter your Project URL and Anon Key.
- Click **Generate Package**. This will create a customized version of the app linked to your database.

### 4. Hosting
- You can host the generated files on any static hosting provider like **GitHub Pages**, **Vercel**, or **Netlify**.
- Ensure you have configured the `SUPABASE_URL` and `SUPABASE_KEY` correctly in the generated code.

## 🛠 Maintenance
- **Backups**: Use Supabase's built-in backup tools to secure your data.
- **Updates**: Check our GitHub repository for the latest version of the Blueprint to get new features and security fixes.
