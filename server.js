const express = require('express');
const next = require('next');
const axios = require('axios');
const xml2js = require('xml2js');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3300;

app.prepare().then(() => {
    const server = express();

    // Aumentar o limite de tamanho do JSON
    server.use(express.json({ limit: '50mb' }));
    server.use(express.urlencoded({ limit: '50mb', extended: true }));

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`Servidor rodando na porta ${port}`);
    });
});
