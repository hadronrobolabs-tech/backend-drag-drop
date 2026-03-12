# Deltabotix API (Backend)

Ye server **port 3000** pe chalta hai. User ise apne PC pe chalao (jahan Arduino connected hai). Tab browser se hi port list aayegi aur Upload se code USB par upload ho jayega — koi alag app nahi.

## Run

```bash
cd /home/moglix/Desktop/my2/backend-api
npm start
```

Ya dev mode (auto reload):

```bash
npm run dev
```

## Endpoints

- `GET /api/v1/kits` – kit list
- `GET /api/v1/projects` – projects list
- `POST /api/v1/projects` – create project
- `PUT /api/v1/projects/:id` – update project
- `POST /api/v1/firmware/generate` – Blockly XML → Arduino code
- `POST /api/v1/firmware/assemble` – full .ino firmware

**No separate “local upload server”.** - `GET /api/v1/upload/ports` – list USB ports (for dropdown)
- `POST /api/v1/upload` – compile + upload (body: code, board, port)

## Full stack

1. **Backend** — user ke PC pe (jahan Arduino): `npm start` → port 3000  
2. **Frontend** — `cd ../frontend && npm run dev` → port 3001  

User flow: Connect Arduino → Open app → Run → Upload tab → Refresh ports → select port → Upload. Sab browser se.  
