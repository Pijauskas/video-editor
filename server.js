const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Siuntimo maršrutas
app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).send('Nenurodyta nuoroda!');
    }

    // Nustatome plėtinį
    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    res.header('Content-Disposition', `attachment; filename="video.${ext}"`);

    // Naudojame yt-dlp tiesioginiam srautui siųsti
    const command = format === 'mp3' 
        ? `yt-dlp -x --audio-format mp3 -o - "${videoUrl}"`
        : `yt-dlp -f best -o - "${videoUrl}"`;

    const child = exec(command, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 100 });
    
    child.stdout.pipe(res);
    
    child.stderr.on('data', (data) => {
        // Galima stebėti klaidas konsolėje
    });

    child.on('close', (code) => {
        if (code !== 0 && !res.headersSent) {
            res.status(500).send('Klaida siunčiant video.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT port}`));