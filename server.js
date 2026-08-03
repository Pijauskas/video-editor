const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const format = req.query.format || 'mp4';

    if (!videoUrl) {
        return res.status(400).send('Nenurodyta nuoroda!');
    }

    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    res.header('Content-Disposition', `attachment; filename="video.${ext}"`);

    // Naudojame tiesioginį kelią iki mūsų įdiegtaro yt-dlp faile
    const ytDlpPath = path.join(__dirname, 'yt-dlp');
    const command = format === 'mp3' 
        ? `"${ytDlpPath}" -x --audio-format mp3 -o - "${videoUrl}"`
        : `"${ytDlpPath}" -f best -o - "${videoUrl}"`;

    console.log(`Vykdoma komanda: ${command}`);

    const child = exec(command, { encoding: 'buffer', maxBuffer: 1024 * 1024 * 100 });
    
    child.stdout.pipe(res);
    
    child.stderr.on('data', (data) => {
        console.error(`yt-dlp klaida: ${data.toString()}`);
    });

    child.on('close', (code) => {
        console.log(`Procesas baigėsi su kodu: ${code}`);
        if (code !== 0 && !res.headersSent) {
            res.status(500).send('Klaida siunčiant video.');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT}`));
