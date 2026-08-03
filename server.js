const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).send('Nenurodyta nuoroda!');
    }

    // Kadangi Render IP yra blokuojamas YouTube, saugiausia nukreipti į veikiančius nemokamus konverterius
    const safeUrl = encodeURIComponent(videoUrl);
    res.redirect(`https://loader.to/api/button/?url=${safeUrl}&f=mp4`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveris veikia ant ${PORT}`));
