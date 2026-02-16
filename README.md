# Tezukuri Market 🧵

A platform for handmade market organizers to share their events, built with Next.js, Prisma, and Tailwind CSS.

## Features
- **Event Listing**: Shows upcoming events first, sorted by date.
- **Auto-Expiration**: Events are automatically hidden after the event date passes.
- **Organizer Tools**: Create, Edit, and Delete your own events.
- **Authentication**: Secure registration and login.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup Database:
   ```bash
   npx prisma migrate dev --name init
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
- Next.js (App Router)
- React
- Prisma (SQLite)
- NextAuth.js
- Tailwind CSS
