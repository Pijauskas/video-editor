const express = require('express');
const path = require('path');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).send('Nenurodyta nuoroda!');
    }

    const dataObj = JSON.stringify({
        url: videoUrl,
        isAudioOnly: format === 'mp3',
        aFormat: 'mp3'
    });

    const options = {
        hostname: 'co.wuk.sh',
        path: '/api/json',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': dataObj.length
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let body = '';
        apiRes.on('data', (chunk) => { body += chunk; });
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(body);
                if (json && json.url) {
                    res.redirect(json.url);
                } else {
                    res.status(500).send('Nepavyko gauti nuorodos iš serverio.');
                }
            } catch (e) {
                res.status(500).send('Klaida apdorojant duomenis.');
            }
        });
    });

    apiReq.on('error', () => {
        res.status(500).send('Nepavyko susisiekti su siuntimo tarnyba.');
    });

    apiReq.write(dataObj);
    apiReq.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT}`));
