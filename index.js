const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
const uploadsDirectoryPath = path.join(__dirname, '../uploads');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const fse = require('fs-extra');

app.use(express.static(publicDirectoryPath));

app.post('/upload', async (req, res, next) => {
  try {
    const { file } = req.body;
    const { filename, size, chunkIndex, chunksCount } = file;
    const chunkFilename = `${filename}.part${chunkIndex}`;
    const chunkPath = path.join(uploadsDirectoryPath, chunkFilename);

    const readStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(chunkPath, { flags: 'a' });
    await pipeline(readStream, writeStream);

    if (chunkIndex === chunksCount - 1) {
      const finalFilename = path.join(uploadsDirectoryPath, filename);
      const chunkPaths = Array.from({ length: chunksCount }, (_, i) => path.join(uploadsDirectoryPath, `${filename}.part${i}`));
      await fse.ensureDir(uploadsDirectoryPath);
      await fse.concat(chunkPaths, finalFilename);
      await fse.remove(uploadsDirectoryPath);
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
