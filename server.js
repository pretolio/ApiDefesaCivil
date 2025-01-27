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

    function processDetails(details) {
        if (details && details.alert && details.alert.info) {
            details.alert.info.forEach(info => {
                if (info.parameter) {
                    info.parameter.forEach(param => {
                        if (param.valueName && param.valueName[0] === 'Municipios') {
                            param.value = param.value[0].split(',').map(item => item.trim()).filter(item => item);
                        }
                    });
                }
                if (info.area) {
                    info.area.forEach(area => {
                        if (area.polygon) {
                            area.polygon = area.polygon[0].trim().split(' ').map(item => item.trim()).filter(item => item);
                        }
                    });
                }
            });
        }
    }

    server.get('/api/defesa-civil', async (req, res) => {
        try {
            const response = await axios.get('https://apiprevmet3.inmet.gov.br/avisos/rss');
            const parser = new xml2js.Parser();
            parser.parseString(response.data, async (err, result) => {
                if (err) {
                    res.status(500).send('Erro ao converter XML para JSON');
                } else {
                    const channel = result?.rss?.channel?.[0];
                    if (channel && channel.item) {
                        const items = channel.item;
                        const itemDetails = await Promise.all(items.map(async (item) => {
                            try {
                                const itemResponse = await axios.get(item.link[0]);
                                const itemParser = new xml2js.Parser();
                                const itemJson = await itemParser.parseStringPromise(itemResponse.data);
                                processDetails(itemJson);
                                return {
                                    ...item,
                                    details: itemJson
                                };
                            } catch (error) {
                                return {
                                    ...item,
                                    details: 'Erro ao obter detalhes do item'
                                };
                            }
                        }));
                        channel.item = itemDetails;
                        res.json(result);
                    } else {
                        res.status(500).send('Estrutura do XML inválida');
                    }
                }
            });
        } catch (error) {
            res.status(500).send('Erro ao obter dados da API');
        }
    });

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, (err) => {
        if (err) throw err;
        console.log(`Servidor rodando na porta ${port}`);
    });
});
