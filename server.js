const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp4';

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).send('Neteisinga arba nenurodyta YouTube nuoroda!');
    }

    try {
        const ext = format === 'mp3' ? 'mp3' : 'mp4';
        const quality = format === 'mp3' ? 'highestaudio' : 'highest';

        res.header('Content-Disposition', `attachment; filename="video.${ext}"`);

        ytdl(videoUrl, { quality: quality })
            .on('error', (err) => {
                console.error('Siuntimo klaida:', err);
                if (!res.headersSent) {
                    res.status(500).send('Klaida siunčiant video.');
                }
            })
            .pipe(res);

    } catch (err) {
        console.error('Serverio klaida:', err);
        if (!res.headersSent) {
            res.status(500).send('Klaida apdorojant nuorodą.');
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT}`));
