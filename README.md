# Employee Task Assignment System (Microservices & Spring Kafka Architecture)

A full-stack enterprise task management platform with microservices architecture simulation, Eureka service discovery, Spring Kafka event bus, Semgrep static code analysis audit, and AI-assisted delegation with Gemini.

---

## 🚀 Running in VS Code (Visual Studio Code)

Follow these simple steps to run the application locally on your machine in VS Code:

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: Version 18+ or 20+ ([Download Node.js](https://nodejs.org/))
- **VS Code**: ([Download VS Code](https://code.visualstudio.com/))
- **npm** (included with Node.js) or **bun** / **pnpm** / **yarn**

---

### 2. Open Project in VS Code
Open your terminal and navigate to the project directory:
```bash
cd employee-task-assignment-system
code .
```
*(Or open VS Code and use **File -> Open Folder...** and select this directory).*

---

### 3. Install Dependencies
Open the built-in terminal in VS Code (`Ctrl + \`` on Windows/Linux or `Cmd + \`` on macOS) and run:
```bash
npm install
```

---

### 4. Configure Environment Variables (Optional for AI features)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Inside `.env`, set your Gemini API key (optional if you want AI-assisted task breakdown):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

---

### 5. Start the Application

You can start the app in two convenient ways:

#### Option A: Quick Command (Terminal)
```bash
npm run dev
```
Then open **[http://localhost:3000](http://localhost:3000)** in your browser.

#### Option B: One-Click VS Code Debugger (F5)
1. Press **`F5`** on your keyboard (or go to the **Run & Debug** tab on the left sidebar: `Ctrl+Shift+D` / `Cmd+Shift+D`).
2. Select **"Dev Server (Full-Stack Express + Vite)"**.
3. Click the green Play button or press `F5`.
4. The server will boot and automatically open `http://localhost:3000`.

---

## 🛠 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Boots the full-stack server (`tsx server.ts`) with Vite frontend middleware & hot reloading on port 3000 |
| `npm run build` | Builds the client SPA to `dist/` and bundles `server.ts` to `dist/server.cjs` via `esbuild` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes `dist/` and build artifacts |

---

## 🏗 Architecture & Stack Overview

- **Frontend**: React 19, TypeScript, Tailwind CSS (v4), Motion animations, Recharts, Lucide Icons
- **Backend**: Express.js with Vite middleware, TSX runtime
- **AI Integration**: `@google/genai` (Gemini API server-side proxy)
- **Services Simulation**:
  - Eureka Service Registry & Discovery
  - Spring Cloud Gateway routing & JWT security filters
  - Kafka Event Bus (`task-events`, `notifications`, `audit-logs`)
  - Semgrep SAST Security Scanner & Quality Gates
  - Real-time Task Comments & Activity Streams
