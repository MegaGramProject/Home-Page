const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const fs = require("fs");

async function retrieveFileFromGridFSBucket(_id, bucketName) {
    const client = await MongoClient.connect("mongodb://<user>:<password>@localhost:27017/Megagram?authSource=admin");
    const db = client.db("Megagram");
    const bucket = new GridFSBucket(db, { bucketName });

    const downloadStream = bucket.openDownloadStream(_id);

    const writeStream = fs.createWriteStream(`./downloads/${_id.toString()}.png`); //currently, it assumes file is png
    downloadStream.pipe(writeStream);

    writeStream.on("finish", () => {
        console.log(`File ${_id} downloaded successfully!`);
        client.close();
    });

    downloadStream.on("error", (err) => {
        console.error("Error downloading file:", err);
        client.close();
    });
}

retrieveFileFromGridFSBucket(new ObjectId('67bd143ba609a9a17c8118e6'), 'imageAndVideoSlidesOfPosts');
