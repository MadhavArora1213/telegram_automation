# TeleAuto Pro - Telegram Automation Suite

TeleAuto Pro is a premium Telegram automation and campaign management suite. It features a modern, theme-aware React frontend and a robust Python backend built with Telethon and Flask.

## Features

- **Dashboard**: Real-time overview of campaign performance and statistics.
- **Bulk Sender**: Automate message and media campaigns with smart anti-spam protection and scheduling.
- **Member Management**: Fetch, export, and manage group members with bulk messaging integration.
- **Chat Manager**: View and interact with groups, supergroups, and channels.
- **Sent History**: Comprehensive audit log of all sent campaigns with advanced filtering.
- **Theme Management**: Seamlessly switch between Light and Dark modes with persistent user preferences.
- **Security**: Official Telegram API connection via Telethon; session data stored locally.

## Project Structure

```text
.
├── telegram.py              # Backend Flask server & Telegram client logic
├── requirements.txt         # Python dependencies
├── history.json             # Campaigns persistence file
├── .env                     # Backend environment variables
└── teleauto-pro.../         # Frontend React application
    ├── src/                 # Application source code
    ├── components/          # Reusable UI components
    ├── screens/             # Main application screens (Dashboard, Settings, etc.)
    ├── services/            # API integration Layer
    └── index.html           # Main entry point with Tailwind CDN
```

## Setup Instructions

### 1. Backend Setup (Flask & Telethon)

**Prerequisites**: Python 3.8+

1. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables in `.env`:
   ```env
   X_API_KEY=your_secret_key_here
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   FLASK_HOST=127.0.0.1
   FLASK_PORT=8000
   ```
4. Run the backend server:
   ```bash
   python telegram.py
   ```

### 2. Frontend Setup (React & Vite)

**Prerequisites**: Node.js 18+

1. Navigate to the frontend directory:
   ```bash
   cd teleauto-pro---automation-suite
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open the application in your browser (usually `http://localhost:5173`).
2. Log in using your Telegram phone number and API credentials.
3. Manage your chats, scrape members, and launch automated campaigns from the sidebar.
4. Toggle Light/Dark mode via the **Settings** page.

## Technologies Used

- **Frontend**: React, Tailwind CSS, Vite, Recharts, React Router.
- **Backend**: Python, Flask, Telethon, Asyncio, Python-Dotenv.

---
© 2026 TeleAuto Pro. All rights reserved.
