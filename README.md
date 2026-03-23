# 🌑 Whisper Wall — Anonymous Confession Website

A beginner-friendly full-stack web app where users can post, view, like, search, and filter anonymous confessions.

---

## 🧱 Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)

---

## 📁 Project Structure

```
confession-app/
├── frontend/
│   ├── index.html       → Main feed (view all confessions)
│   ├── post.html        → Post a new confession
│   ├── style.css        → All styles
│   └── script.js        → All frontend JS logic
│
├── backend/
│   ├── server.js        → Express server entry point
│   ├── models/
│   │   └── Confession.js   → Mongoose schema
│   └── routes/
│       └── confessionRoutes.js  → All API routes
│
├── package.json
└── README.md
```

---

## 🚀 Setup & Run

### Step 1 — Install Dependencies

```bash
npm install
```

### Step 2 — Start MongoDB

Make sure MongoDB is installed and running locally:

```bash
# On macOS/Linux:
mongod

# On Windows, run the mongod.exe from your MongoDB bin folder
# Or start via the MongoDB Compass app
```

### Step 3 — Start the Server

```bash
node backend/server.js
```

You should see:
```
✅ Connected to MongoDB successfully!
🚀 Server running at http://localhost:5000
```

### Step 4 — Open the App

Open your browser and go to: **http://localhost:5000**

> The Express server serves the frontend files automatically.

---

## 🧪 API Reference (for Postman testing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/confessions` | Get all confessions |
| GET | `/api/confessions?search=love` | Search by text |
| GET | `/api/confessions?category=Love` | Filter by category |
| GET | `/api/confessions/top` | Get top 5 most liked |
| POST | `/api/confessions` | Post a new confession |
| PUT | `/api/confessions/:id/like` | Like a confession |
| DELETE | `/api/confessions/:id` | Delete a confession |

### POST Body Example:
```json
{
  "text": "I still think about the road not taken.",
  "category": "Life"
}
```

---

## ✨ Features

- 📝 Post anonymous confessions (no login)
- 🔍 Search confessions in real-time
- 🏷️ Category filter (Love, Study, Life, Work, Family, Secret, Other)
- ❤️ Like confessions (one like per device)
- 📊 "Most Liked" leaderboard
- ⏳ "Time ago" timestamps
- 🚫 Basic profanity filter
- 🔄 Auto-refresh every 30 seconds
- 📱 Mobile-responsive design

---

## 🛠️ Development

For auto-reload during development, use nodemon:

```bash
npm run dev
```

---

## 📌 Notes

- Liked confession IDs are stored in `localStorage` to prevent re-liking
- Anti-spam: users must wait 10 seconds between posts
- Max confession length: 300 characters
