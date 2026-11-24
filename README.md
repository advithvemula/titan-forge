# Titan Forge

3D mech battle game with online co-op, PvP duels, leaderboards and clans.

## Run on Render
- Service type: **Web Service**
- Runtime: **Node**
- Build Command: `npm install`
- Start Command: `node server.js`

Open the onrender.com address. Online play, leaderboards and clans switch on by themselves.

## Keep scores and clans permanently (optional)
Create a Render Postgres database, copy its **Internal Database URL**, and add it to the
web service under **Environment** as `DATABASE_URL`. Without it, scores reset when the server restarts.

## Run on your own PC
Install Node.js, then in this folder run `npm install` and `npm start`, and open http://localhost:3000
