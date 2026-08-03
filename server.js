const express = require('express');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).send('Nenurodyta nuoroda!');
    }

    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    res.header('Content-Disposition', `attachment; filename="video.${ext}"`);

    try {
        const subprocess = youtubedl.stream(videoUrl, {
            format: format === 'mp3' ? 'bestaudio' : 'best',
            ...(format === 'mp3' && { extractAudio: true, audioFormat: 'mp3' })
        });

        subprocess.pipe(res);

        subprocess.on('error', (err) => {
            console.error('Siuntimo klaida:', err);
            if (!res.headersSent) {
                res.status(500).send('Klaida siunčiant video.');
            }
        });
    } catch (err) {
        console.error('Serverio klaida:', err);
        if (!res.headersSent) {
            res.status(500).send('Klaida apdorojant nuorodą.');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT}`));
