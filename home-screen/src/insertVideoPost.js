const { MongoClient, ObjectId } = require('mongodb');
const GridFSBucket = require('mongodb').GridFSBucket;
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

async function main() {
    const client = new MongoClient('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db('Megagram');


    const bucket = new GridFSBucket(db, { bucketName: 'videos' });

    const videoFilePath = '/Users/rishavr/Home-Screen/home-screen/src/images/videoPost.mp4';
    

    const uploadStream = bucket.openUploadStream('video');
    fs.createReadStream(videoFilePath).pipe(uploadStream)
        .on('error', (error) => {
            console.error('Error uploading file:', error);
        })
        .on('finish', async () => {
            console.log('File uploaded successfully with ID:', uploadStream.id);


            const metadataCollection = db.collection('videosMetadata');
            const randomId = uuidv4();
            await metadataCollection.insertOne({
                usernames: ['rishavry5'],
                locationOfPost: 'Dubai, UAE',
                dateTimeOfPost: new Date("2020-12-16T11:45:00Z"),
                taggedAccounts: [[[30, 60, 'bonjovi'], [20, 20, 'alanSchmidt'], [15, 78, 'charlieChelsea']]],
                videoId: uploadStream.id,
                overallPostId: randomId,
                slideNumber: 0,
            });

            console.log('Metadata stored successfully');
            client.close();
        });
}

main().catch(console.error);
