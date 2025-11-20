# Smidr ChatKit Agent Starter

A minimal Node.js server and static page for embedding an OpenAI ChatKit-powered agent workflow on smidr.org (or any Hostinger deployment). The page is centered with a white background, black text, and 7px rounded corners.

## Features
- Static HTML interface that loads ChatKit from the OpenAI CDN and requests a client secret from your backend.
- Simple Node.js server with a lightweight `.env` loader (no external dependencies) to create ChatKit sessions.
- Sample `.env.example` for your API key and workflow ID.
- Hostinger-ready: works as a Node app (Premium/Business plans) or can be exported as static assets if you point the API route to another backend.

## Prerequisites
- Node.js 18+ (provides native `fetch`).
- An OpenAI API key with ChatKit beta access.
- A workflow created via Agent Builder (grab the workflow ID).

## Setup
1. Copy the environment template and fill in your secrets:
   ```bash
   cp .env.example .env
   # edit .env to set OPENAI_API_KEY and OPENAI_WORKFLOW_ID
   ```

2. Run the server locally:
   ```bash
   node server.js
   ```
   Then open [http://localhost:3000](http://localhost:3000) and click **Start chat**. Provide a workflow ID if you want to override the default from `.env`.

## Hostinger notes
- Hostinger supports Node.js apps on Premium/Business shared plans and VPS plans. Deploy this project by uploading the repository and configuring a Node app to run `node server.js`.
- If you prefer static hosting, deploy the `public/` folder and point the `fetch('/api/chatkit/session')` call in `public/index.html` to a secure backend endpoint that runs `server.js` logic (must keep the API key server-side).

## Folder structure
```
public/           # Static assets and ChatKit UI
server.js         # Minimal HTTP server + ChatKit session endpoint
.env.example      # Sample environment variables
```

## Environment variables
- `OPENAI_API_KEY`: Required. Your OpenAI key (keep private; do not expose on the client).
- `OPENAI_WORKFLOW_ID`: Required. Workflow ID from Agent Builder. Can be overridden per-request from the UI.
- `PORT`: Optional. Defaults to `3000`.

## Workflow
- The frontend calls `/api/chatkit/session`, which forwards the workflow ID and user/device ID to `https://api.openai.com/v1/chatkit/sessions` with `OpenAI-Beta: chatkit_beta=v1`.
- The OpenAI API returns a `client_secret` that ChatKit uses to mount the chat widget and stream messages.

## GitHub usage
Commit and push changes from your local folder (`C:\Users\tg1059\OneDrive - Nordfjordnett\KI\Smidr-codex-01`) or clone the GitHub repo at https://github.com/thomas-wndr/smidr-codex-01.
