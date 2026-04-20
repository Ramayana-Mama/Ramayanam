import fs from 'fs';
import https from 'https';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function main() {
  if (!fs.existsSync('./public')) fs.mkdirSync('./public');
  
  console.log('Downloading mp3...');
  await download('https://www.soundjay.com/misc/sounds/page-flip-01a.mp3', './public/page-flip.mp3');
  console.log('Downloading image...');
  await download('https://raw.githubusercontent.com/Ramayana-Mama/Ramayanam/main/Ramayana-Mama.webp', './public/Ramayana-Mama.webp');
  console.log('Done!');
}

main().catch(console.error);
