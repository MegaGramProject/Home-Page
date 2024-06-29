const { MongoClient, ObjectId } = require('mongodb');
const GridFSBucket = require('mongodb').GridFSBucket;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function main() {
    const client = new MongoClient('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db('Megagram');


    const bucket = new GridFSBucket(db, { bucketName: 'videos' });

    const videoFilePath = '/Users/rishavr/Downloads/fakePilot.mp4';
    

    const uploadStream = bucket.openUploadStream('video');
    fs.createReadStream(videoFilePath).pipe(uploadStream)
        .on('error', (error) => {
            console.error('Error uploading file:', error);
        })
        .on('finish', async () => {
            console.log('File uploaded successfully with ID:', uploadStream.id);


            const metadataCollection = db.collection('videosMetadata');
            const randomId = '667f7011daf309f4dc197044';
            await metadataCollection.insertOne({
                usernames: ['rishavry7'],
                locationOfPost: 'Bangalore Karnataka, India',
                dateTimeOfPost: new Date("2024-07-04T08:45:13Z"),
                taggedAccounts: ['fakePilot'],
                videoId: uploadStream.id,
                overallPostId: randomId,
                slideNumber: 5,
            });

            console.log('Metadata stored successfully');
            client.close();
        });
}

main().catch(console.error);
