import express from 'express';
import cors from 'cors';
import axios from 'axios';
import FiveM from './fivem-server-api-main/index.mjs';

const app = express();
const port = 3000;

app.use(cors());

// Configurazione server
const SERVER_ADDRESS = '45.138.201.37:30120';
const CFX_ID = '4odj5q';
const server = new FiveM(SERVER_ADDRESS, { timeout: 5000 });

app.get('/status', async (req, res) => {
    let playerCount = 0;
    let isOnline = false;

    try {
        console.log(`[${new Date().toLocaleTimeString()}] Richiesta stato server (Metodo IP: ${SERVER_ADDRESS})...`);
        
        // Tentativo tramite il pacchetto fivem-server-api (IP Diretto aggiornato)
        const status = await server.getServerStatus();
        
        if (status && status.online) {
            isOnline = true;
            const players = await server.getPlayers();
            if (typeof players === 'number') {
                playerCount = players;
                console.log(`[${new Date().toLocaleTimeString()}] Successo tramite IP: ${playerCount} giocatori.`);
            }
        } else {
            throw new Error("Server non raggiungibile via IP");
        }
    } catch (error) {
        console.warn(`[${new Date().toLocaleTimeString()}] IP Diretto fallito. Provo a risolvere ID CFX: ${CFX_ID}...`);

        try {
            // Metodo 1: Risoluzione IP tramite l'URL di Join (Il più affidabile)
            const joinResponse = await axios.head(`https://cfx.re/join/${CFX_ID}`, { timeout: 5000 });
            const realIp = joinResponse.headers['x-citizenfx-url']?.replace('http://', '').replace('/', '');

            if (realIp) {
                console.log(`[${new Date().toLocaleTimeString()}] IP risolto da CFX: ${realIp}. Recupero dati...`);
                const statsResponse = await axios.get(`http://${realIp}players.json`, { timeout: 5000 });
                if (Array.isArray(statsResponse.data)) {
                    playerCount = statsResponse.data.length;
                    isOnline = true;
                    console.log(`[${new Date().toLocaleTimeString()}] Successo tramite IP risolto: ${playerCount} giocatori.`);
                }
            } else {
                throw new Error("Impossibile risolvere IP da CFX");
            }
        } catch (cfxError) {
            console.warn(`[${new Date().toLocaleTimeString()}] Risoluzione IP fallita. Provo API Live FiveM...`);
            
            try {
                // Metodo 2: Fallback su API ufficiale di Cfx.re
                const response = await axios.get(`https://servers-live.fivem.net/api/servers/single/${CFX_ID}`, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    }
                });

                if (response.data && response.data.Data) {
                    playerCount = response.data.Data.clients || 0;
                    isOnline = true;
                    console.log(`[${new Date().toLocaleTimeString()}] Successo tramite CFX API: ${playerCount} giocatori.`);
                }
            } catch (finalError) {
                console.error(`[${new Date().toLocaleTimeString()}] Falliti tutti i metodi. Errore finale: ${finalError.message}`);
            }
        }
    }

    res.json({
        online: isOnline,
        players: playerCount
    });
});

app.listen(port, () => {
    console.log(`================================================`);
    console.log(`🚀 BACKEND SERVER AGGIORNATO (v2)`);
    console.log(`📍 Endpoint: http://localhost:${port}/status`);
    console.log(`🎮 Server FiveM: ${SERVER_ADDRESS}`);
    console.log(`🆔 CFX ID Fallback: ${CFX_ID}`);
    console.log(`================================================`);
    console.log(`Lascia questa finestra aperta per far funzionare`);
    console.log(`il conteggio giocatori sul sito.`);
    console.log(`Il sistema userà automaticamente un metodo di`);
    console.log(`emergenza se l'IP diretto non risponde.`);
    console.log(`================================================`);
});
