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

    // Ištraukiame YouTube video ID
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (!match) {
        return res.status(400).send('Neteisinga YouTube nuoroda!');
    }

    const videoId = match[1];
    const ext = format === 'mp3' ? 'mp3' : 'mp4';

    res.header('Content-Disposition', `attachment; filename="video.${ext}"`);

    // Kreipiamės į švarų API, kuris parūpina tiesioginį failo srautą be jokių reklamų vartotojui
    const apiUri = `https://pipedapi.kavin.rocks/streams/${videoId}`;

    https.get(apiUri, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => { data += chunk; });
        apiRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                let streamUrl = '';

                if (format === 'mp3') {
                    // Randame audio srautą
                    const audioStream = json.audioStreams.find(s => s.mimeType.includes('audio'));
                    streamUrl = audioStream ? audioStream.url : '';
                } else {
                    // Randame geriausią video srautą
                    const videoStream = json.videoStreams.find(s => s.quality === '720p' || s.quality === 'medium');
                    streamUrl = videoStream ? videoStream.url : json.videoStreams[0]?.url;
                }

                if (!streamUrl) {
                    return res.status(500).send('Nepavyko gauti video srauto.');
                }

                // Srautas persiunčiamas tiesiai per tavo serverį į vartotojo naršyklę be jokių reklamų
                https.get(streamUrl, (fileStream) => {
                    fileStream.pipe(res);
                }).on('error', () => {
                    res.status(500).send('Klaida siunčiant failą.');
                });

            } catch (e) {
                res.status(500).send('Klaida apdorojant video duomenis.');
            }
        });
    }).on('error', () => {
        res.status(500).send('Nepavyko susisiekti su siuntimo tarnyba.');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT}`));
