const { MongoClient } = require('mongodb');
const fs = require('fs').promises;

const uri = 'mongodb://localhost:27017';
const dbName = 'Megagram';

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectAndInsertDocument() {
try {
await client.connect();

const db = client.db(dbName);
const collection = db.collection('userPosts');


const imageFilePaths = [
    '/users/rishavr/base64image1.txt',
    '/users/rishavr/base64image2.txt',
    '/users/rishavr/base64image3.txt',
];


const imageBuffers = await Promise.all(imageFilePaths.map(readFileToBuffer));


const document = {
    usernames: ["rishavry7"],
    locationOfPost: "Bangalore Karnataka, India",
    dateTimeOfPost: new Date("2024-07-04T08:45:13Z"),
    taggedAccounts: [
    [[45, 45, 'Cassandra'], [70, 10, 'jordan']],
    [],
    [[10, 10, 'diljitD']]
    ],
    posts: imageBuffers,
    slides: [0, 2, 4]
};


const result = await collection.insertOne(document);
console.log(`Inserted document with _id: ${result.insertedId}`);

} catch (err) {
console.error('Error occurred:', err);
} finally {
await client.close();
}
}


async function readFileToBuffer(filePath) {
try {
const data = await fs.readFile(filePath, 'utf8');
return base64ToBuffer(data);
} catch (err) {
console.error(`Error reading file ${filePath}:`, err);
return null;
}
}


function base64ToBuffer(base64String) {

const base64Data = base64String.split(';base64,').pop();

return Buffer.from(base64Data, 'base64');
}


connectAndInsertDocument();
