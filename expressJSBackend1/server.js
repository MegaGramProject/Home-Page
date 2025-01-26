const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const mysql = require('mysql');
const mysql2 = require('mysql2/promise');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
app.use(bodyParser.json());


const uri = 'mongodb://localhost:27017';
const dbName = 'Megagram';
const bucketName = 'videos';
let db;
let client;
let collection;

const allowedOrigins = ['http://localhost:3100', 'http://localhost:8019'];

const corsOptions = {
    origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
    },
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
    user: 'root',
    password: 'WINwin1$',
    database: 'Megagram',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
});

const mysqlPool = mysql2.createPool({
    host: 'localhost',
    user: 'root',
    password: 'WINwin1$',
    database: 'Megagram',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Megagram',
    password: 'WINwin1$',
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

app.get('/getTaggedVideos/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const taggedVideos =  await collection.find({ taggedAccounts: username }).toArray();
        const output = [];
        const postIdToFirstVideoSlideMapping = {}; //key: postId, value: relevant info on the taggedVideo whose slide-number is the smallest
        for(let taggedVideo of taggedVideos) {
            if(taggedVideo['overallPostId'] in postIdToFirstVideoSlideMapping) {
                if(taggedVideo['slideNumber'] < postIdToFirstVideoSlideMapping[taggedVideo['overallPostId']]['smallestSlideNumberWhereUserIsTagged']) {
                    postIdToFirstVideoSlideMapping[taggedVideo['overallPostId']] = {
                        smallestSlideNumberWhereUserIsTagged: taggedVideo['slideNumber'],
                        postId: taggedVideo['overallPostId'],
                        dateTimeOfPost: taggedVideo['dateTimeOfPost'],
                        videoId: taggedVideo['videoId']
                    };
                }
            }
            else {
                postIdToFirstVideoSlideMapping[taggedVideo['overallPostId']] = {
                    smallestSlideNumberWhereUserIsTagged: taggedVideo['slideNumber'],
                    postId: taggedVideo['overallPostId'],
                    dateTimeOfPost: taggedVideo['dateTimeOfPost'],
                    videoId: taggedVideo['videoId']
                };
            }
        }

        for(let key of Object.keys(postIdToFirstVideoSlideMapping)) {
            output.push(postIdToFirstVideoSlideMapping[key]);
        }
        res.json(output);
    } catch (error) {
        console.error('Error querying MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/getVideosForMultiplePostIds', async (req, res) => {
    try {
        const postIds = req.body.postIds;
        const videos = await collection.find({ overallPostId: { $in: postIds } }).toArray();
        const output = {};
        for(let video of videos) {
            if(video['overallPostId'] in output) {
                if(video['slideNumber'] < output[video['overallPostId']]['smallestSlideNumber']) {
                    output[video['overallPostId']] = {
                        smallestSlideNumber: video['slideNumber'],
                        dateTimeOfPost: video['dateTimeOfPost'],
                        videoId: video['videoId'],
                        usernames: video['usernames']
                    }
                }
                output[video['overallPostId']]['hasMoreThanOneSlide'] = true;
            }
            else {
                output[video['overallPostId']] = {
                    smallestSlideNumber: video['slideNumber'],
                    dateTimeOfPost: video['dateTimeOfPost'],
                    videoId: video['videoId'],
                    hasMoreThanOneSlide: false,
                    usernames: video['usernames']
                }
            }
        }
        res.json(output);
    } catch (error) {
        console.error('Error querying MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/getVideosRelatedToTopic/:topic', async (req, res) => {
    try {
        const topic = req.params.topic;
        const postIds = req.body.postIds;
        const videos = await collection.find(
            {
                $or: [
                    { overallPostId: { $in: postIds } },
                    { category: topic }
                ],
                slideNumber: 0
            },
            { projection: { usernames: 1, overallPostId: 1, slideNumber: 1, dateTimeOfPost: 1, videoId: 1 } }
        ).toArray();
        const output = {};

        for(let video of videos) {
            if(video['overallPostId'] in output) {
                if(video['slideNumber'] < output[video['overallPostId']]['smallestSlideNumber']) {
                    output[video['overallPostId']] = {
                        smallestSlideNumber: video['slideNumber'],
                        dateTimeOfPost: video['dateTimeOfPost'],
                        videoId: video['videoId'],
                        usernames: video['usernames']
                    }
                }
                output[video['overallPostId']]['hasMoreThanOneSlide'] = true;
            }
            else {
                output[video['overallPostId']] = {
                    smallestSlideNumber: video['slideNumber'],
                    dateTimeOfPost: video['dateTimeOfPost'],
                    videoId: video['videoId'],
                    hasMoreThanOneSlide: false,
                    usernames: video['usernames']
                }
            }
        }
        
        res.json(output);
    }
    catch (error) {
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

app.get('/getLikedPostsOfUser/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const query = "SELECT PostId FROM likedPosts WHERE username = ?";
        connection.query(query, [username], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            const postIds = results.map(x=> {
                return x['PostId'];
            });
            res.json(postIds);
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

app.get('/getSavedPostsOfUser/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const query = "SELECT PostId FROM savedPosts WHERE username = ?";
        connection.query(query, [username], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            const postIds = results.map(x=> {
                return x['PostId'];
            });
            res.json(postIds);
        });
        
    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/isPostSavedByUser/:postId/:username', async (req, res) => {
    try {
        const postId = req.params.postId;
        const username = req.params.username;
        const query = "SELECT COUNT(*) AS count FROM savedPosts WHERE PostId = ? AND username = ?";
        connection.query(query, [postId, username], (error, results) => {
            if (error) {
                console.error('Error executing query:', error.stack);
                res.status(500).json({ error: 'Invalid Query' });
                return;
            }
            if(results[0]['count']==1) {
                return res.json({'isPostSavedByUser': true});
            }
            return res.json({'isPostSavedByUser': false});

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

app.get('/getPostNumLikesAndIsLikedByUser/:postId/:username', async (req, res) => {
    let connection;
    try {
        const postId = req.params.postId;
        const username = req.params.username;

        const mysqlQuery = "SELECT * FROM likedPosts WHERE PostId = ?";
        connection = await mysqlPool.getConnection(); // Get a connection from the pool

        const [mysqlResults] = await connection.query(mysqlQuery, [postId]);

        let isLikedByUser = mysqlResults.some(result => result['username'] === username);

        return res.json({ numLikes: mysqlResults.length, isLikedByUser });

    } catch (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });

    } finally {
        if (connection) connection.release();
    }
});



app.post('/getNumLikesAndCommentsOfMultiplePosts', async (req, res) => {
    let connection;
    const output = {};
    try {
        const listOfPostIds = req.body.listOfPostIds;

        if (!Array.isArray(listOfPostIds) || listOfPostIds.length === 0) {
            return res.status(400).json({ error: 'listOfPostIds must be a non-empty array' });
        }

        const placeholders = listOfPostIds.map(() => '?').join(',');
        
        const mysqlQuery = `SELECT PostId, COUNT(*) as count FROM likedPosts WHERE PostId IN (${placeholders}) GROUP BY PostId`;
        connection = await mysqlPool.getConnection();
        const [mysqlResults] = await connection.query(mysqlQuery, listOfPostIds);

        for (let result of mysqlResults) {
            output[result['PostId']] = [result['count']];
        }

        const pgsqlPlaceholders = listOfPostIds.map((_, index) => `$${index + 1}`).join(',');
        const pgsqlQuery1 = `
            SELECT postid, COUNT(*) AS count
            FROM usercomments
            WHERE postid IN (${pgsqlPlaceholders})
            GROUP BY postid
        `;
        
        const results1 = await pool.query(pgsqlQuery1, listOfPostIds);
        results1.rows.forEach(row => {
            if (row.postid in output) {
                output[row.postid].push(Number(row.count)-1); //-1 because 1 of the comments is caption and we don't count that
            } else {
                output[row.postid] = [0, Number(row.count)-1]; //-1 because 1 of the comments is caption and we don't count that
            }
        });

        const pgsqlQuery2 = `
            SELECT postid, COUNT(*) AS count
            FROM userreplies
            WHERE postid IN (${pgsqlPlaceholders})
            GROUP BY postid
        `;
        const results2 = await pool.query(pgsqlQuery2, listOfPostIds);
        results2.rows.forEach(row => {
            output[row.postid][1] = output[row.postid][1] + Number(row.count);
        });

        res.status(200).json(output);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
});



const port = 8004;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGINT', async () => {
    await client.close();
    connection.end();
    await pool.end();
    process.exit(0);
});
