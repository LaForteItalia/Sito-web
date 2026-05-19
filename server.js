import express from 'express';
import cors from 'cors';
import axios from 'axios';
import FiveM from './fivem-server-api-main/index.mjs';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ===============================
// CONFIGURAZIONE SERVER
// ===============================
const SERVER_ADDRESS = '45.138.201.37:30120';
const CFX_ID = '4odj5q';

const server = new FiveM(SERVER_ADDRESS, {
    timeout: 5000
});

// ===============================
// STATUS ENDPOINT
// ===============================
app.get('/status', async (req, res) => {

    let playerCount = 0;
    let maxPlayers = 0;
    let isOnline = false;
    let serverName = 'Unknown';

    try {

        console.log(`================================================`);
        console.log(`[${new Date().toLocaleTimeString()}] 🔍 Controllo server FiveM...`);

        // =========================
        // METODO 1 - IP DIRETTO
        // =========================
        const status = await server.getServerStatus();

        if (status && status.online) {

            isOnline = true;

            const players = await server.getPlayers();

            if (typeof players === 'number') {
                playerCount = players;
            }

            try {

                const infoResponse = await axios.get(
                    `http://${SERVER_ADDRESS}/info.json`,
                    { timeout: 5000 }
                );

                if (infoResponse.data) {

                    serverName =
                        infoResponse.data.vars?.sv_projectName ||
                        infoResponse.data.vars?.sv_hostname ||
                        'FiveM Server';

                    maxPlayers =
                        infoResponse.data.vars?.sv_maxClients || 0;
                }

            } catch (err) {}

        } else {
            throw new Error("Server offline");
        }

    } catch (error) {

        console.warn(`[IP] Fallito, provo CFX...`);

        try {

            // =========================
            // METODO 2 - CFX JOIN
            // =========================
            const joinResponse = await axios.head(
                `https://cfx.re/join/${CFX_ID}`,
                {
                    timeout: 5000,
                    maxRedirects: 0,
                    validateStatus: s => s >= 200 && s < 400
                }
            );

            const realIp = joinResponse.headers['x-citizenfx-url']
                ?.replace('http://', '')
                ?.replace('/', '');

            if (!realIp) throw new Error("IP non trovato");

            const playersResponse = await axios.get(
                `http://${realIp}players.json`,
                { timeout: 5000 }
            );

            if (Array.isArray(playersResponse.data)) {
                playerCount = playersResponse.data.length;
                isOnline = true;
            }

            try {

                const infoResponse = await axios.get(
                    `http://${realIp}info.json`,
                    { timeout: 5000 }
                );

                if (infoResponse.data) {

                    serverName =
                        infoResponse.data.vars?.sv_projectName ||
                        infoResponse.data.vars?.sv_hostname ||
                        'FiveM Server';

                    maxPlayers =
                        infoResponse.data.vars?.sv_maxClients || 0;
                }

            } catch (err) {}

        } catch (e) {

            console.warn(`[CFX] Fallito fallback`);

            try {

                // =========================
                // METODO 3 - API CFX
                // =========================
                const response = await axios.get(
                    `https://servers-live.fivem.net/api/servers/single/${CFX_ID}`,
                    {
                        timeout: 5000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            'Accept': 'application/json'
                        }
                    }
                );

                if (response.data?.Data) {

                    isOnline = true;
                    playerCount = response.data.Data.clients || 0;
                    maxPlayers = response.data.Data.sv_maxclients || 0;
                    serverName = response.data.Data.hostname || 'FiveM Server';
                }

            } catch (err) {

                console.error("❌ Tutti i metodi falliti");
            }
        }
    }

    res.json({
        online: isOnline,
        players: playerCount,
        maxPlayers: maxPlayers,
        serverName: serverName,
        ip: SERVER_ADDRESS,
        cfx: CFX_ID,
        timestamp: Date.now()
    });
});

// ===============================
// TEST HOME
// ===============================
app.get('/', (req, res) => {
    res.send('Backend FiveM attivo ✅');
});

// ===============================
// START SERVER
// ===============================
app.listen(port, '0.0.0.0', () => {
    console.log(`================================================`);
    console.log(`🚀 BACKEND FIVEM ONLINE`);
    console.log(`🌐 http://localhost:${port}/status`);
    console.log(`🎮 ${SERVER_ADDRESS}`);
    console.log(`================================================`);
});
