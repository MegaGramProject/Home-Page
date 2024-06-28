const mongoose = require('mongoose');

const videosMetadataSchema = new mongoose.Schema({
    usernames: {
        type: [String],
        required: true
    },
    videoId: {
        type: String,
        unique: true,
        required: true
    },
    overallPostID: {
        type: String,
        required: true
    },
    locationOfPost: {
        type: String,
        required: true
    },
    dateTimeOfPost: {
        type: Date,
        required: true
    },
    slideNumber: {
        type: Number,
        required: true
    }
});


module.exports = mongoose.model('videosMetadata', videosMetadataSchema);
