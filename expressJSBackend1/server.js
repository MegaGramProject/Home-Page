const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


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

const connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'WINwin1$',
    database: 'Megagram'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
});



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


app.get('/getLikes/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const query = "SELECT username FROM likedPosts WHERE PostId = ?";
        connection.query(query, [postId], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            const usernames = results;
            res.json(usernames);
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getSaves/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const query = "SELECT username FROM savedPosts WHERE PostId = ?";
        connection.query(query, [postId], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            const usernames = results;
            res.json(usernames);
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/addLike/:postId', async (req, res) => {
    try {
        const username = req.body.username;
        const postId = req.params.postId;
        const query = "INSERT into likedPosts (username, PostId) VALUES (?, ?)";
        connection.query(query, [username, postId], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            res.status(200).json({ output: 'Like has been made!' });
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/removeLike/:postId', async (req, res) => {
    try {
        const username = req.body.username;
        const postId = req.params.postId;
        const query = "DELETE FROM likedPosts WHERE username = ? AND PostId = ?";
        connection.query(query, [username, postId], (error, results) => {
            if (error) {
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            res.status(200).json({ output: 'Like has been removed!' });
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/addSave/:postId', async (req, res) => {
    try {
        const username = req.body.username;
        const postId = req.params.postId;
        const query = "INSERT into savedPosts (username, PostId) VALUES (?, ?)";
        connection.query(query, [username, postId], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            res.status(200).json({ output: 'Save has been made!' });
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/removeSave/:postId', async (req, res) => {
    try {
        const username = req.body.username;
        const postId = req.params.postId;
        const query = "DELETE FROM savedPosts WHERE username = ? AND PostId = ?";
        connection.query(query, [username, postId], (error, results) => {
            if (error) {
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            res.status(200).json({ output: 'Save has been removed!' });
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


const port = 8004;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    await client.close();
    connection.end();
    process.exit(0);
});
