const fs = require('fs');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

async function run() {
    const uri = "mongodb://localhost:27017/";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('Megagram');
        const bucket = new GridFSBucket(database, { bucketName: 'videos' });

        // Replace with the actual ObjectId of the video you want to retrieve
        const videoId = new ObjectId('667ec25b11dfd49ab61fe796');
        
        // Create a writable stream to save the retrieved video
        const downloadStream = bucket.openDownloadStream(videoId);
        const outputFile = fs.createWriteStream('/users/rishavr/Downloads/retrievedPost.mp4');

        downloadStream.pipe(outputFile);

        downloadStream.on('finish', () => {
            console.log('Video retrieved and saved as retrievedPost.mp4');
            client.close();
        });

        downloadStream.on('error', (error) => {
            console.error("Error retrieving video:", error);
            client.close();
        });

    } catch (error) {
        console.error("Error retrieving document:", error);
    }
}

run().catch(console.dir);
