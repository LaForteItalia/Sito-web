import express from 'express';
import cors from 'cors';
import axios from 'axios';
import FiveM from './fivem-server-api-main/index.mjs';

const app = express();
const port = 3000;

// ===============================
// CONFIGURAZIONE SERVER
// ===============================
const SERVER_ADDRESS = '45.138.201.37:30120';
const CFX_ID = '4odj5q';

const server = new FiveM(SERVER_ADDRESS, {
    timeout: 5000
});

app.use(cors());
app.use(express.json());

// ===============================
// STATUS ENDPOINT
// ===============================
app.get('/status', async (req, res) => {

    let playerCount = 0;
    let maxPlayers = 0;
    let isOnline = false;
    let serverName = 'Unknown';

    console.log('\n================================================');
    console.log(`[${new Date().toLocaleTimeString()}] Controllo FiveM`);

    // ======================================================
    // METODO 1 - IP DIRETTO
    // ======================================================
    try {

        const status = await server.getServerStatus();

        console.log('Status:', status);

        if (status?.online) {

            isOnline = true;

            // Tentativo tramite libreria
            try {

                const players = await server.getPlayers();

                console.log('getPlayers():', players);

                if (Array.isArray(players)) {
                    playerCount = players.length;
                } else if (typeof players === 'number') {
                    playerCount = players;
                }

            } catch (err) {

                console.warn('getPlayers fallito:', err.message);

            }

            // Recupera info.json
            try {

                const infoResponse = await axios.get(
                    `http://${SERVER_ADDRESS}/info.json`,
                    { timeout: 5000 }
                );

                const info = infoResponse.data;

                serverName =
                    info?.vars?.sv_projectName ||
                    info?.vars?.sv_hostname ||
                    'FiveM Server';

                maxPlayers =
                    Number(info?.vars?.sv_maxClients) || 0;

            } catch (err) {

                console.warn('info.json non disponibile');

            }

            // Se i player sono ancora 0 prova players.json
            if (playerCount === 0) {

                try {

                    const playersResponse = await axios.get(
                        `http://${SERVER_ADDRESS}/players.json`,
                        { timeout: 5000 }
                    );

                    console.log('players.json:', playersResponse.data);

                    if (Array.isArray(playersResponse.data)) {
                        playerCount = playersResponse.data.length;
                    }

                } catch (err) {

                    console.warn('players.json non disponibile');

                }
            }
        }

    } catch (err) {

        console.warn('[IP] Fallito:', err.message);

    }

    // ======================================================
    // METODO 2 - CFX JOIN
    // ======================================================
    if (!isOnline) {

        try {

            console.log('Tentativo tramite CFX Join...');

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

            console.log('IP reale:', realIp);

            if (!realIp) {
                throw new Error('IP non trovato');
            }

            isOnline = true;

            // players.json
            try {

                const playersResponse = await axios.get(
                    `http://${realIp}/players.json`,
                    { timeout: 5000 }
                );

                if (Array.isArray(playersResponse.data)) {
                    playerCount = playersResponse.data.length;
                }

            } catch (err) {

                console.warn('players.json fallback fallito');

            }

            // info.json
            try {

                const infoResponse = await axios.get(
                    `http://${realIp}/info.json`,
                    { timeout: 5000 }
                );

                const info = infoResponse.data;

                serverName =
                    info?.vars?.sv_projectName ||
                    info?.vars?.sv_hostname ||
                    'FiveM Server';

                maxPlayers =
                    Number(info?.vars?.sv_maxClients) || 0;

            } catch (err) {

                console.warn('info.json fallback fallito');

            }

        } catch (err) {

            console.warn('[CFX JOIN] Fallito:', err.message);

        }
    }

    // ======================================================
    // METODO 3 - API UFFICIALE CFX
    // ======================================================
    if (!isOnline) {

        try {

            console.log('Tentativo API CFX...');

            const response = await axios.get(
                `https://servers-live.fivem.net/api/servers/single/${CFX_ID}`,
                {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        Accept: 'application/json'
                    }
                }
            );

            const data = response.data?.Data;

            if (data) {

                isOnline = true;

                playerCount = data.clients || 0;
                maxPlayers = data.sv_maxclients || 0;
                serverName = data.hostname || 'FiveM Server';
            }

        } catch (err) {

            console.error('API CFX fallita:', err.message);

        }
    }

    console.log('Risultato:', {
        isOnline,
        playerCount,
        maxPlayers,
        serverName
    });

    res.json({
        online: isOnline,
        players: playerCount,
        maxPlayers,
        serverName,
        ip: SERVER_ADDRESS,
        cfx: CFX_ID,
        timestamp: Date.now()
    });

});

// ===============================
// HOME
// ===============================
app.get('/', (req, res) => {
    res.send('Backend FiveM attivo ✅');
});

// ===============================
// START SERVER
// ===============================
app.listen(port, '0.0.0.0', () => {

    console.log('================================================');
    console.log('🚀 BACKEND FIVEM ONLINE');
    console.log(`🌐 http://localhost:${port}/status`);
    console.log(`🎮 ${SERVER_ADDRESS}`);
    console.log('================================================');

});
