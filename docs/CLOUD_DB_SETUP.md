# Hosting Your Own MySQL Database

Since you have decided to completely remove Supabase and all third-party services from MEZOMAI, the PHP backend needs a **MySQL database** to handle user accounts, authentication, and chat history.

If you don't want to host MySQL locally via Docker, you can easily create a free or low-cost MySQL database in the cloud.

Here are two popular, easy-to-use platforms to get your own cloud database running in minutes:

## Option 1: Railway (Recommended for Ease of Use)
Railway provides incredibly simple cloud database provisioning.

1. Go to [Railway.app](https://railway.app/) and sign up.
2. Click **"New Project"** and select **"Provision MySQL"**.
3. Wait about 30 seconds for your database to initialize.
4. Click on your new MySQL instance, go to the **Connect** tab.
5. You will see variables for your connection:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
6. Open your MEZOMAI **Admin Dashboard** (`/admin`), go to **Settings**, and paste these values into the **Database Configuration** section.
7. Click "Copy Env" and paste that `.env` into your deployed PHP backend (e.g., on Vercel or your VPS).

## Option 2: Aiven (Recommended for Generous Free Tier)
Aiven offers a robust free tier for MySQL databases.

1. Go to [Aiven.io](https://aiven.io/) and sign up for a free account.
2. Create a new service and select **MySQL**.
3. Choose the "Free Plan" (available in select regions like DigitalOcean NYC or FRA).
4. Once your service is running (it takes a few minutes), navigate to the **Overview** page.
5. In the **Connection Information** section, grab the Host, Port, Database Name (`defaultdb`), User (`avnadmin`), and Password.
6. Open your MEZOMAI **Admin Dashboard**, paste the credentials into the Settings, generate your `.env`, and apply it to your PHP backend.

## Finalizing the Migration
Once your PHP backend is connected to your new cloud database, you need to run the initial database migrations so the tables for users and chat history are created.

If you are running the backend on a VPS:
```bash
php artisan migrate
```

If you are deploying the backend to Vercel or a serverless host, ensure your deployment script or an API endpoint runs the migration automatically.
