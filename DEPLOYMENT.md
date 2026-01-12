# Deploying to Render

This application is configured for deployment on Render.com using Docker and PostgreSQL.

## Prerequisites

1.  A GitHub repository containing this code.
2.  A [Render](https://render.com) account.

## Deployment Steps

1.  **New Blueprint Instance**
    *   Go to your Render Dashboard.
    *   Click **New+** -> **Blueprint**.
    *   Connect your GitHub repository.
    *   Render will automatically detect the `render.yaml` file.
    *   Click **Apply**.

2.  **What Happens Next?**
    *   Render will create a **PostgreSQL Database** (`phd-thesis-buddy-db`).
    *   Render will create a **Web Service** (`phd-thesis-buddy`).
    *   It will build the application using the `Dockerfile`.
    *   It will inject the necessary environment variables (`DATABASE_URL`, `SESSION_SECRET`, etc.).

## Environment Variables

The `render.yaml` blueprint automatically configures the following:

*   `NODE_ENV`: `production`
*   `DATABASE_URL`: Auto-linked to the managed database.
*   `SESSION_SECRET`: Auto-generated secure string.
*   `PORT`: `5000`

If you need to add custom AI keys (e.g., OpenAI, Gemini), you can add them in the Render Dashboard under **Environment** -> **Environment Variables** for the Web Service.

## Verification

Once deployed, Render will use `/api/health` to verify the application is running correctly.
