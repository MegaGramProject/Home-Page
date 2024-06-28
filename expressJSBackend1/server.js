const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();

const uri = 'mongodb://localhost:27017';
const dbName = 'Megagram';
const bucketName = 'videos';
let db;
let client;
let collection;

const corsOptions = {
    origin: 'http://localhost:3100',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


async function connectToMongo() {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    collection = db.collection('videosMetadata');
}

connectToMongo().catch(console.error);

app.get('/getVideos/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const videos = await collection.find({ usernames: username }).toArray();
        res.json(videos);
    } catch (error) {
        console.error('Error querying MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/getVideo/:id', async (req, res) => {
    try {
        const videoId = req.params.id;
        const db = client.db(dbName);
        const bucket = new GridFSBucket(db, { bucketName });
        const id = new ObjectId(videoId);
        const downloadStream = bucket.openDownloadStream(id);

        res.setHeader('Content-Type', 'video/mp4');

        downloadStream.pipe(res);

    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const port = 8004;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});
