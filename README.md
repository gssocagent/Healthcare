# Healthcare Doctor-Patient Translation Application

A full-stack web application enabling real-time translation between doctors and patients, featuring text chat, audio recording, conversation persistence, search, and AI-powered medical summaries.

## UI
<img width="1919" height="930" alt="image" src="https://github.com/user-attachments/assets/3a0c95e9-b15b-4a98-a693-8e5fb0d46915" />

## Features

### Completed
- Real-time translation between doctor and patient
- Text chat interface with role-based message display
- Audio recording and playback
- Conversation logging with persistence
- Keyword search across conversations
- AI-powered medical summary generation
- Mobile-responsive design

### Tech Stack
- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 18 with JavaScript
- **Database**: PostgreSQL
- **Real-time**: WebSocket
- **Translation**: LibreTranslate API
- **Summarization**: OpenAI GPT API

## Project Structure

```
Healthcare/
├── server/                 # FastAPI Backend
│   ├── main.py            # Application entry
│   ├── requirements.txt   # Python dependencies
│   ├── database/          # DB models and connection
│   ├── routers/           # API endpoints
│   ├── services/          # Business logic
│   └── websocket/         # WebSocket handling
│
└── client/                # React Frontend
    ├── public/
    └── src/
        ├── components/    # UI components
        ├── hooks/         # Custom hooks
        ├── services/      # API client
        └── styles/        # CSS
```

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL

### Database Setup
```bash
createdb healthcare
```

### Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

# Run server
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

The application will be available at http://localhost:3000

## Environment Variables

### Backend (server/.env)
```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/healthcare
ALLOWED_ORIGINS=http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /conversations | List conversations |
| POST | /conversations | Create conversation |
| GET | /conversations/{id} | Get conversation |
| DELETE | /conversations/{id} | Delete conversation |
| POST | /messages | Send message |
| POST | /audio/upload | Upload audio |
| GET | /audio/{filename} | Get audio file |
| GET | /search?q={query} | Search messages |
| POST | /summary/conversations/{id} | Generate summary |
| WS | /ws/{conversation_id} | Real-time messaging |

## AI Tools and Resources Used
- OpenAI GPT for medical conversation summarization
- LibreTranslate for text translation

## Known Limitations
- Translation depends on external API availability
- Audio stored on local filesystem
- Summary generation requires OpenAI API key

## Deployment

### Backend (Render)
1. Create Web Service
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Configure environment variables

### Frontend (Vercel)
1. Connect repository
2. Set root directory: `client`
3. Set environment variable: `REACT_APP_API_URL`
