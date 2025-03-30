const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Spanner } = require('@google-cloud/spanner');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { Readable } = require('stream');
const {
    KMSClient, DecryptCommand, CreateKeyCommand, CreateAliasCommand,
    GenerateDataKeyCommand, ScheduleKeyDeletionCommand
} = require("@aws-sdk/client-kms");
const rateLimit = require('express-rate-limit');
require('dotenv').config();


const mongodbClient = new MongoClient(process.env.LOCAL_MONGODB_URL_VIA_NGROK);
let imageAndVideoSlidesOfPostsBucket;
let imageAndVideoSlidesOfPostsDotFilesCollection;

async function initializeMongodbClient() {
    try {
        await mongodbClient.connect();
        const mongodbDatabase = mongodbClient.db("Megagram");

        imageAndVideoSlidesOfPostsBucket = new GridFSBucket(
            mongodbDatabase,
            {
                bucketName: 'imageAndVideoSlidesOfPosts'
            }
        );
        imageAndVideoSlidesOfPostsDotFilesCollection = mongodbDatabase.collection('imageAndVideoSlidesOfPosts.files');
    }
    catch (error) {
        console.error(error);
    }
}

initializeMongodbClient();

let gcMySQLSpannerClient;
let gcMySQLSpannerInstance;
let gcMySQLSpannerDatabase;

try {
    gcMySQLSpannerClient = new Spanner();
    gcMySQLSpannerInstance = gcMySQLSpannerClient.instance('mg-ms-sp');
    gcMySQLSpannerDatabase = gcMySQLSpannerInstance.database('Megagram');
}
catch (error) {
    console.error(error);
}

let awsKMSClient;
try {
    awsKMSClient = new KMSClient({ region: "us-east-1" });
}
catch (error) {
    console.error(error);
}


const listOfValidPostCategories = ['scenery', 'entertainment', 'random', 'comedy', 'thriller', 'drama',
'scary', 'prank', 'social-experiment', 'educational', 'food', 'music', 'beauty-and-fashion',
'sports', 'gaming', 'graphic', 'nature', 'cars', 'travel', 'meme', 'rant', 'challenge-or-trend',
'reaction-or-commentary', 'news'];
const languageCodeToLabelMappings = {
    "af": "Afrikaans",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bs": "Bosnian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "et": "Estonian",
    "fi": "Finnish",
    "fr": "French",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "ha": "Hausa",
    "he": "Hebrew",
    "hi": "Hindi",
    "hu": "Hungarian",
    "is": "Icelandic",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "km": "Khmer",
    "ko": "Korean",
    "ku": "Kurdish",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "mk": "Macedonian",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mn": "Mongolian",
    "ne": "Nepali",
    "no": "Norwegian",
    "fa": "Persian",
    "pl": "Polish",
    "pt-BR": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)",
    "pa": "Punjabi",
    "ro": "Romanian",
    "ru": "Russian",
    "sr": "Serbian",
    "si": "Sinhala",
    "sk": "Slovak",
    "sl": "Slovenian",
    "so": "Somali",
    "es": "Spanish",
    "sw": "Swahili",
    "sv": "Swedish",
    "tl": "Tagalog",
    "ta": "Tamil",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "zu": "Zulu"
};
const listOfValidLangCodes = Object.keys(languageCodeToLabelMappings);

const threePerMinuteRateLimiter = rateLimit({
    windowMs: 60_000,
    max: 3,
    message: `You've exceeded the rate-limit of this endpoint(3/min). Please try again later.`,
});
const fivePerMinuteRateLimiter = rateLimit({
    windowMs: 60_000,
    max: 5,
    message: `You've exceeded the rate-limit of this endpoint(5/min). Please try again later.`,
});
const userAuthenticationRateLimiter = rateLimit({
    windowMs: 60_000,
    max: 45,
    message: `You've exceeded the rate-limit of this endpoint(45/min). Please try again later.`,
});


const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

const upload = multer({ storage: multer.memoryStorage() });

const allowedOrigins = ['http://localhost:8004', 'http://34.111.89.101/'];
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


app.get('/getBatchOfPostsForUserFeed/:authUserId', fivePerMinuteRateLimiter, async (req, res) => {
    let { authUserId } = req.params;
    if (authUserId !== 'Anonymous Guest') {
        const userTokenValidationResult = validateUserAuthToken(authUserId, req.cookies);

        if (userTokenValidationResult instanceof Date) {
            const refreshedAuthToken = refreshUserAuthToken(authUserId);
            if (refreshedAuthToken!==null) {
                res.cookie(`authToken${authUserId}`, refreshedAuthToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict',
                    expires: userTokenValidationResult
                });
            }
        }
        else if (userTokenValidationResult === 'Forbidden') {
            return res.sendStatus(401);
        }
    }
    else
    {
        authUserId = -1;
    }

    let successMessage = '';
    let errorMessage = '';

    let top10UsersThatAuthUserFollowsAndEngagesWithTheMost = [];
    let top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost = [];
    let authUserFollowings = [];
    try {
        const response = await fetch(`http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/
        forHomePageFeedGetTheTopUsersBasedOnNumLikesNumCommentsNumPostViewsAndNumAdLinkClicks/${authUserId}`);
        if (!response.ok) {
            errorMessage += `• The server is supposed to provide the list of top 10 users you follow and whose posts you engage with
            the most(based on numLikes/numComments/numPostViews). Furthermore, it's supposed to provide the list of the top 10 users
            whose ad-posts you engage with the most(based on numLikes/numComments/numPostViews/numAdLinkClicks). However,
            the server had trouble doing that\n`; 
            return res.status(500).send(errorMessage);
        }

        successMessage += `• The server successfully provided the list of top 10 users you follow and whose posts you engage with
        the most(based on numLikes/numComments/numPostViews). Furthermore, it has also provided the list of the top 10 users
        whose ad-posts you engage with the most(based on numLikes/numComments/numPostViews/numAdLinkClicks).\n`;
        const responseData = await response.json();
        top10UsersThatAuthUserFollowsAndEngagesWithTheMost = responseData.top10UsersThatAuthUserFollowsAndEngagesWithTheMost;
        top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost = responseData.top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost;
        authUserFollowings = responseData.authUserFollowings;
        usersWithSponsoredPostsThatAuthUserCanView = responseData.usersWithSponsoredPostsThatAuthUserCanView;
    }
    catch (error) {
        errorMessage += `• The server is supposed to provide the list of top 10 users you follow and whose posts you engage with
        the most(based on numLikes/numComments/numPostViews). Furthermore, it's supposed to provide the list of the top 10 users
        whose ad-posts you engage with the most(based on numLikes/numComments/numPostViews/numAdLinkClicks). However,
        there was trouble connecting to the server that does this.\n`; 
        return res.status(500).send(errorMessage);
    }

    let orderedListOfOverallPostIdsForAuthUsersFeed = [];
    const overallPostIdToPostInfoMappings = {};
    try {
        const response1 = await fetch(`http:/34.111.89.101/api/Home-Page/springBootBackend2/
        getOrderedListOfOverallPostIdsOfBatchForHomePageFeed/${authUserId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                top10UsersThatAuthUserFollowsAndEngagesWithTheMost: top10UsersThatAuthUserFollowsAndEngagesWithTheMost,
                authUserFollowings: authUserFollowings,
                top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost: top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost,
                usersWithSponsoredPostsThatAuthUserCanView: usersWithSponsoredPostsThatAuthUserCanView,
            })
        });
        if (!response1.ok) {
            errorMessage += `• The server had trouble getting the ordered list of overallPostIds of the batch of posts for your
            home-page feed.\n`;
            return res.status(500).send(
                'There was a mix of success and Errors in this API-request...\n' + 
                'Here are the Successes:\n' + successMessage +
                '& Here are the Errors:\n' + errorMessage
            );
        }
        successMessage += `• The server successfully provided the ordered list of overallPostIds of the batch of posts for
        your home-page feed.\n`; 

        orderedListOfOverallPostIdsForAuthUsersFeed = await response1.json();
        orderedListOfOverallPostIdsForAuthUsersFeed = orderedListOfOverallPostIdsForAuthUsersFeed[
            'orderedListOfOverallPostIdsForBatchForHPFeed'
        ];
        for (let overallPostId of orderedListOfOverallPostIdsForAuthUsersFeed) {
            overallPostIdToPostInfoMappings[overallPostId] = {
                slides: {},
                plaintextDataEncryptionKey: null,
                isLiked: false,
                isSaved: false
            };
        }
    }
    catch (error) {
        errorMessage += `• There was trouble connecting to the server to get the ordered list of overallPostIds of the batch of posts for your
        home-page feed.\n`;
        return res.status(500).send(
            'There was a mix of success and Errors in this API-request...\n' + 
            'Here are the Successes:\n' + successMessage +
            '& Here are the Errors:\n' + errorMessage
        );
    }

    const setOfUserIdsToGetUsernamesOf = new Set();
    const overallPostIdsAndIfTheyAreEncrypted = {};
    try {
        const allPostSlides = await imageAndVideoSlidesOfPostsDotFilesCollection.find(
            { "metadata.overallPostId": { $in: orderedListOfOverallPostIdsForAuthUsersFeed } }
        ).sort({ "metadata.slideNumber": 1 }).toArray();
        
        for (let postSlide of allPostSlides) {
            const postSlideData = {...postSlide.metadata};
            const { overallPostId } = postSlideData;
            const { slideNumber } = postSlideData;
            const currSlideIsImage = postSlide.filename === 'img';
            let plaintextDataEncryptionKey = overallPostIdToPostInfoMappings[overallPostId].plaintextDataEncryptionKey;

            if (slideNumber == 0) {
                if ('authorsEncryptionInfo' in postSlideData) {
                    overallPostIdsAndIfTheyAreEncrypted[overallPostId] = true;
                    const encryptedDataEncryptionKey = postSlideData.authorsEncryptionInfo.encryptedDataEncryptionKey;
                    const decryptResponse = await awsKMSClient.send(new DecryptCommand({
                        CiphertextBlob: encryptedDataEncryptionKey,
                    }));
                    plaintextDataEncryptionKey = decryptResponse.Plaintext;
                    overallPostIdToPostInfoMappings[overallPostId].plaintextDataEncryptionKey = plaintextDataEncryptionKey;

                    const decryptedAuthors = decryptTextWithAWSDataEncryptionKey(
                        postSlideData.authors,
                        plaintextDataEncryptionKey,
                        postSlideData.authorsEncryptionInfo.iv,
                        postSlideData.authorsEncryptionInfo.authTag,
                    );
                    postSlideData.authors = JSON.parse(decryptedAuthors);
    
                    if ('locationOfPost' in postSlideData) {
                        postSlideData.locationOfPost = decryptTextWithAWSDataEncryptionKey(
                            postSlideData.locationOfPost,
                            plaintextDataEncryptionKey,
                            postSlideData.locationOfPostEncryptionInfo.iv,
                            postSlideData.locationOfPostEncryptionInfo.authTag,
                        );  
                    }
    
                    if ('adInfo' in postSlideData) {
                        const decryptedAdInfo = decryptTextWithAWSDataEncryptionKey(
                            postSlideData.adInfo,
                            plaintextDataEncryptionKey,
                            postSlideData.adInfoEncryptionInfo.iv,
                            postSlideData.adInfoEncryptionInfo.authTag,
                        );   
                        postSlideData.adInfo = JSON.parse(decryptedAdInfo);
                    }
                }
                else
                {
                    overallPostIdsAndIfTheyAreEncrypted[overallPostId] = false;
                }

                overallPostIdToPostInfoMappings[overallPostId].datetimeOfPost = postSlideData.datetimeOfPost;
                overallPostIdToPostInfoMappings[overallPostId].authors = postSlideData.authors;
                for(const authorId of postSlideData.authors) {
                    setOfUserIdsToGetUsernamesOf.add(authorId);
                }
                if ('locationOfPost' in postSlideData) {
                    overallPostIdToPostInfoMappings[overallPostId].locationOfPost = postSlideData.locationOfPost;
                }
                if ('adInfo' in postSlideData) {
                    overallPostIdToPostInfoMappings[overallPostId].adInfo = postSlideData.adInfo;
                }
            }

            if ('taggedAccountsEncryptionInfo' in postSlideData || 'sectionsEncryptionInfo' in postSlideData) { 
                if ('taggedAccounts' in postSlideData) {
                    const decryptedTaggedAccounts = decryptTextWithAWSDataEncryptionKey(
                        postSlideData.taggedAccounts,
                        plaintextDataEncryptionKey,
                        postSlideData.taggedAccountsEncryptionInfo.iv,
                        postSlideData.taggedAccountsEncryptionInfo.authTag,
                    );
                    postSlideData.taggedAccounts = JSON.parse(decryptedTaggedAccounts);
                }

                if ('sections' in postSlideData) {
                    const decryptedSections = decryptTextWithAWSDataEncryptionKey(
                        postSlideData.sections,
                        plaintextDataEncryptionKey,
                        postSlideData.sectionsEncryptionInfo.iv,
                        postSlideData.sectionsEncryptionInfo.authTag,
                    );
                    postSlideData.sections = JSON.parse(decryptedSections);
                }
            }
            
            const downloadStream = imageAndVideoSlidesOfPostsBucket.openDownloadStream(postSlide._id);
            let currSlideFileChunks = [];

            await new Promise((resolve, reject) => {
                downloadStream.on('data', (chunk) => currSlideFileChunks.push(chunk));
                downloadStream.on('end', () => {
                    const currSlideFileBuffer = Buffer.concat(currSlideFileChunks);
                    overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber] = {
                        type: currSlideIsImage ?  'image' : 'video',
                        src: currSlideFileBuffer
                    };

                    if ('taggedAccounts' in postSlideData) {
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts = postSlideData
                        .taggedAccounts;
                        for(const taggedAccountInfo of postSlideData.taggedAccounts) {
                            if (currSlideIsImage) {
                                setOfUserIdsToGetUsernamesOf.add(taggedAccountInfo[0]);
                            }
                            else {
                                setOfUserIdsToGetUsernamesOf.add(taggedAccountInfo);
                            }
                        }
                    }

                    if ('sections' in postSlideData) {
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].sections = 
                        postSlideData.sections;
                    }

                    if ('videoEncryptionInfo' in postSlideData) {
                        const decryptedVidFileBuffer = decryptFileBufferWithAWSDataEncryptionKey(
                            currSlideFileBuffer,
                            plaintextDataEncryptionKey,
                            postSlideData.videoEncryptionInfo.iv,
                            postSlideData.videoEncryptionInfo.authTag,
                        );
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].src = decryptedVidFileBuffer;
                    }
                    else if ('imageEncryptionInfo' in postSlideData) {
                        const decryptedImageFileBuffer = decryptFileBufferWithAWSDataEncryptionKey(
                            currSlideFileBuffer,
                            plaintextDataEncryptionKey,
                            postSlideData.imageEncryptionInfo.iv,
                            postSlideData.imageEncryptionInfo.authTag,
                        );
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].src = decryptedImageFileBuffer;
                    }
                    resolve();
                });
                downloadStream.on('error', reject);
            });
        }
        successMessage += `• The image-&-video slide data of the posts for your feed has been fetched successfully\n`;
    }
    catch (error) {
        errorMessage += `• There was trouble that took place during the fetching of the image-&-video-slide data of the posts for
        your feed.\n`;
        return res.status(500).send(
            'There was a mix of success and Errors in this API-request...\n' + 
            'Here are the Successes:\n' + successMessage +
            '& Here are the Errors:\n' + errorMessage
        );
    }

    try {
        const response2 = await fetch(`http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getCaptionsOfMultiplePosts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                overallPostIdsAndIfTheyAreEncrypted: overallPostIdsAndIfTheyAreEncrypted
            })
        });

        if (!response2.ok) {
            errorMessage += `• There was trouble fetching the captions of each of the posts of your feed\n`;
        }
        else {
            const response2Data = await response2.json();
            const overallPostIdsAndTheirCaptions = response2Data["overallPostIdsAndTheirCaptions"];
            for(const overallPostId of Object.keys(overallPostIdsAndTheirCaptions)) {
                if (overallPostIdsAndTheirCaptions[overallPostId] == null)
                {
                    continue;
                }
                
                const captionInfo = overallPostIdsAndTheirCaptions[overallPostId];
                overallPostIdToPostInfoMappings[overallPostId].caption =
                {
                    datetime: captionInfo['datetimeOfCaption'],
                    author: captionInfo['authorId'],
                    content: captionInfo['content']
                };

                if ('isEdited' in overallPostIdsAndTheirCaptions[overallPostId]) {
                    overallPostIdToPostInfoMappings[overallPostId].caption.isEdited = true;
                }
            }
            successMessage += `• The captions of each of the posts of your feed have been fetched successfully\n`;
        }
    }
    catch (error) {
        errorMessage += `• There was trouble connecting to the server to fetch the captions of each of the posts of your
        feed\n`;
    }

    try {
        const response3 = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/getBgMusicOfMultiplePosts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                overallPostIdsAndIfTheyAreEncrypted: overallPostIdsAndIfTheyAreEncrypted
            })
        });
        if (!response3.ok) {
            errorMessage += `• The server had trouble fetching the background-music of each of the posts for your feed\n`;
        }
        else {
            let overallPostIdsAndTheirBgMusic = await response3.json();
            overallPostIdsAndTheirBgMusic = overallPostIdsAndTheirBgMusic.overallPostIdsAndTheirBgMusic;
            
            for (let overallPostId of Object.keys(overallPostIdToBackgroundMusicMappings)) {
                overallPostIdToPostInfoMappings[overallPostId].backgroundMusic = overallPostIdToBackgroundMusicMappings[
                    overallPostId
                ];
            }
            successMessage += `• The background-music of each of the posts for your feed has been fetched successfully\n`;
        }
    }
    catch (error) {
        errorMessage += `• There was trouble connecting to the server to fetch the background-music of each of the posts for your
        feed\n`;
    }

    try {
        const response4 = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/getVidSubtitlesOfMultiplePosts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                overallPostIdsAndIfTheyAreEncrypted: overallPostIdsAndIfTheyAreEncrypted
            })
        });
        if (!response4.ok) {
            errorMessage += `• The server had trouble fetching the video-subtitle-files of each of the posts of your feed\n`;
        }
        else {
            let overallPostIdsAndTheirVidSubtitles = await response4.json();
            overallPostIdsAndTheirVidSubtitles = overallPostIdsAndTheirVidSubtitles.overallPostIdsAndTheirVidSubtitles;
            for (let overallPostId of Object.keys(overallPostIdsAndTheirVidSubtitles)) {
                const allVidSubtitlesOfPost = overallPostIdsAndTheirVidSubtitles[overallPostId];
                for(let vidSubtitlesInfo of allVidSubtitlesOfPost) {
                    const subtitlesSlideNumber = vidSubtitlesInfo['slideNumber'];
                    const subtitlesLangCode = vidSubtitlesInfo['langCode'];
                    const subtitlesFileBuffer = vidSubtitlesInfo['subtitles'];
                    let subtitlesFileIsDefault = 'isDefault' in vidSubtitlesInfo;

                    if (!('subtitles' in  overallPostIdToPostInfoMappings[overallPostId].slides[subtitlesSlideNumber])) {
                        overallPostIdToPostInfoMappings[overallPostId].slides[subtitlesSlideNumber].subtitles = [];
                    }

                    const newSubtitlesFileInfo = {
                        langCode: subtitlesLangCode,
                        src: subtitlesFileBuffer
                    };
                    if (subtitlesFileIsDefault) {
                        newSubtitlesFileInfo.default = true;
                        overallPostIdToPostInfoMappings[overallPostId].slides[subtitlesSlideNumber].subtitles = [
                            newSubtitlesFileInfo, ...overallPostIdToPostInfoMappings[overallPostId].slides[subtitlesSlideNumber]
                            .subtitles
                        ];
                    }
                    else {
                        overallPostIdToPostInfoMappings[overallPostId].slides[subtitlesSlideNumber].subtitles.push(
                            newSubtitlesFileInfo
                        );
                    }
                }
            }
            successMessage += `• The video-subtitle-files of each of the posts of your feed have been fetched successfully\n`;
        }
    }
    catch (error) {
        errorMessage += `• There was trouble connecting to the server to fetch the video-subtitle-files of each of the posts of your
        feed\n`;
    }

    let response5WasSuccessful = false;
    try {
        const response5 = await fetch (`http://34.111.89.101/api/Home-Page/aspNetCoreBackend1
        /getNumLikesNumCommentsAndAtMost3LikersFollowedByAuthUserForMultiplePosts/${authUserId}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(overallPostIdsAndIfTheyAreEncrypted)
        });
        if (!response5.ok) {
            errorMessage += `• There server had trouble fetching the numLikes/numComments/likersFollowedByAuthUser of each of
            the posts of your feed\n`;
        }
        else {
            let response5Data = await response5.json();
            response5Data = response5Data["postsAndTheirWantedInfo"];

            for (let overallPostId of Object.keys(response5Data)) {
                overallPostIdToPostInfoMappings[overallPostId].numLikes = response5Data[overallPostId].numLikes;
                overallPostIdToPostInfoMappings[overallPostId].numComments = response5Data[overallPostId].numComments;
                overallPostIdToPostInfoMappings[overallPostId].likersFollowedByAuthUser = response5Data[overallPostId
                ].likersFollowedByAuthUser;
                for (let likerId of response5Data[overallPostId].likersFollowedByAuthUser) {
                    setOfUserIdsToGetUsernamesOf.add(likerId);
                }
            }

            successMessage += `• The numLikes/numComments/likersFollowedByAuthUser of each of the posts of your feed have been
            fetched successfully\n`;
            response5WasSuccessful = true;
        }
    }
    catch (error) {
        errorMessage += `• There was trouble connecting to the server to fetch the numLikes/numComments/likersFollowedByAuthUser of
        each of the posts of your feed\n`;
    }

    if (!response5WasSuccessful) {
        for (let overallPostId of orderedListOfOverallPostIdsForAuthUsersFeed) {
            overallPostIdToPostInfoMappings[overallPostId].numLikes = 0;
            overallPostIdToPostInfoMappings[overallPostId].numComments = 0;
            overallPostIdToPostInfoMappings[overallPostId].likersFollowedByAuthUser = [];
        }
    }

    let userIdToUsernameMappings = null;
    try {
        const response6 = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/getUsernamesOfMultipleUserIds
        /${authUserId}`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userIds: [...setOfUserIdsToGetUsernamesOf]
            })
        });
        if (!response6.ok) {
            errorMessage += `• The server had trouble fetching the usernames associated with the
            authors/slideTaggedAccounts/likersFollowedByYou of each of the posts of your feed\n`
        }
        else {
            userIdToUsernameMappings = await response6.json();
            userIdToUsernameMappings = userIdToUsernameMappings['userIdsAndTheirUsernames'];
            successMessage += `• The usernames associated with the authors/slideTaggedAccounts/likersFollowedByYou of each of the posts
            for your feed have been fetched successfully\n`;
        }
    }
    catch (error) {
        errorMessage += `• There was trouble connecting to the server to fetch the usernames associated with the authors/slideTaggedAccounts/
        likersFollowedByYou of each of the posts of your feed\n`
    }

    for(const overallPostId of orderedListOfOverallPostIdsForAuthUsersFeed) {
        if (userIdToUsernameMappings!==null) {
            overallPostIdToPostInfoMappings[overallPostId].authors = overallPostIdToPostInfoMappings[overallPostId].authors.
            filter(authorId => authorId in userIdToUsernameMappings).map(
                authorId => userIdToUsernameMappings[authorId]
            );
            
            overallPostIdToPostInfoMappings[overallPostId].likersFollowedByAuthUser = overallPostIdToPostInfoMappings[overallPostId]
            .likersFollowedByAuthUser.map(
                likerId => userIdToUsernameMappings[likerId]);
            
            for(const slideNumber of Object.keys(overallPostIdToPostInfoMappings[overallPostId].slides)) {
                if ('taggedAccounts' in overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber]) {
                    if (overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].type === 'image') {
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts = 
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts.filter(
                            taggedAccountInfo => taggedAccountInfo[0] in userIdToUsernameMappings
                        ).map(
                            taggedAccountInfo => [userIdToUsernameMappings[taggedAccountInfo[0]], taggedAccountInfo[1],
                            taggedAccountInfo[2]]
                        );
                    }
                    else {
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts = 
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts.filter(
                            taggedAccount => taggedAccount in userIdToUsernameMappings
                        ).map(
                            taggedAccount => userIdToUsernameMappings[taggedAccount]
                        );
                    }
                }
            }

            if ('caption' in overallPostIdToPostInfoMappings[overallPostId]) {
                if (overallPostIdToPostInfoMappings[overallPostId].caption.author in userIdToUsernameMappings) {
                    overallPostIdToPostInfoMappings[overallPostId].caption.author = userIdToUsernameMappings[
                        overallPostIdToPostInfoMappings[overallPostId].caption.author
                    ];
                }
                else {
                    overallPostIdToPostInfoMappings[overallPostId].caption.author = "";
                }
            }
        }
        else {
            overallPostIdToPostInfoMappings[overallPostId].authors = overallPostIdToPostInfoMappings[overallPostId].authors.map(
                _ => 'unknown'
            );
            overallPostIdToPostInfoMappings[overallPostId].likersFollowedByAuthUser = overallPostIdToPostInfoMappings[overallPostId]
            .likersFollowedByAuthUser.map(
                _ => 'unknown'
            );

            for(const slideNumber of Object.keys(overallPostIdToPostInfoMappings[overallPostId].slides)) {
                if ('taggedAccounts' in overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber]) {
                    if (overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].type === 'image') {
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts = 
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts.map(
                            taggedAccountInfo => ['unknown', taggedAccountInfo[1], taggedAccountInfo[2]]
                        );
                    }
                    else {
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts =
                        overallPostIdToPostInfoMappings[overallPostId].slides[slideNumber].taggedAccounts.map(
                            _ => 'unknown'
                        );
                    }
                }
            }
        }

        if ('caption' in overallPostIdToPostInfoMappings[overallPostId]) {
            overallPostIdToPostInfoMappings[overallPostId].caption.author = 'unknown';
        }
        delete overallPostIdToPostInfoMappings[overallPostId].plaintextDataEncryptionKey;
    }

    const orderedListOfPostsForUserFeed = [];
    for(const overallPostId of orderedListOfOverallPostIdsForAuthUsersFeed) {
        overallPostIdToPostInfoMappings[overallPostId].slides = Object.values(overallPostIdToPostInfoMappings[overallPostId].slides)

        orderedListOfPostsForUserFeed.push({
            overallPostId: overallPostId,
            ...overallPostIdToPostInfoMappings[overallPostId],
        });
    }

    return res.send({
        successes: successMessage,
        Errors: errorMessage,
        output: orderedListOfPostsForUserFeed
    });
}); 


app.post('/uploadPost/:authUserId', threePerMinuteRateLimiter, upload.any(), async (req, res) => {
    let { authUserId } = req.params;
    const userTokenValidationResult = validateUserAuthToken(authUserId, req.cookies);
    
    if (userTokenValidationResult instanceof Date) {
        const refreshedAuthToken = refreshUserAuthToken(authUserId);
        if (refreshedAuthToken!==null) {
            res.cookie(`authToken${authUserId}`, refreshedAuthToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                expires: userTokenValidationResult
            });
        }
    }
    else if (userTokenValidationResult === 'Forbidden') {
        return res.sendStatus(401);
    }

    authUserId = Number(authUserId);
    let successMessage = "";
    let errorMessage = "";

    const validPostData = {
        authors: []
    };

    let isEncrypted = true;
    let authors = [];
    let isPrivateStatusesOfAuthors = [];

    if ('authors' in req.body) {
        let authorsIsValidlyStructured = true;
        try {
            authors = JSON.parse(req.body.authors);
            if (!Array.isArray(authors)) {
                authorsIsValidlyStructured = false;
            }
            else {
                authors = [authUserId, ...new Set(authors.filter(id => !isNaN(id) && id > 0 && id !== authUserId))];
                if (authors.length > 5) {
                    authors = authors.slice(0, 5);
                    errorMessage += `• The maximum number of post-authors is 5. Here is the
                    list of authors that have been randomly chosen as the 5 authors:
                    ${JSON.stringify(authors)}\n`; 
                }
            }
        }
        catch (error) {
            authorsIsValidlyStructured = false;
        }

        if (!authorsIsValidlyStructured) {
            authors = [authUserId];
            errorMessage += `• The authors list must be a list of user-ids of authors of this
            post\n`; 
        }
    }
    else {
        authors = [authUserId]
    }

    isPrivateStatusesOfAuthors = await getIsPrivateStatusesOfListOfUsers(authUserId, authors);
    if (typeof isPrivateStatusesOfAuthors === 'string') {
        errorMessage += `• ${isPrivateStatusesOfAuthors}. For context, that list was interpreted
        as the authors of the post.\n`; 
        return res.status(500).send(errorMessage);;
    }

    for (let i=0; i<authors.length; i++) {
        if (isPrivateStatusesOfAuthors[i] !== -1) {
            if(isPrivateStatusesOfAuthors[i] == 0) {
                isEncrypted = false;
            }
            validPostData.authors.push(authors[i]);
        }
        else {
            errorMessage += `• The author with the user-id ${authors[i]} does not exist\n`; 
        }
    }

    const newOverallPostId = new ObjectId();
    const newOverallPostIdAsString = newOverallPostId.toString();
    let plaintextDataEncryptionKey;
    let encryptedDataEncryptionKey;
    if (isEncrypted) {
        try {
            await createNewAWSCustomerMasterKey(
                `for encrypting/decrypting data-encryption-keys needed for safeguarding sensitive 
                private-post-data`,
                `post${newOverallPostIdAsString}`
            );

            const newAWSDataEncryptionKeyInfo = await createNewAWSDataEncryptionKey(
                `post${newOverallPostIdAsString}`
            );

            plaintextDataEncryptionKey = newAWSDataEncryptionKeyInfo[0];
            encryptedDataEncryptionKey = newAWSDataEncryptionKeyInfo[1];
        }
        catch (error) {
            errorMessage += `• There was trouble in the process of generating the data-encryption keys required for encrypting the
            sensitive private-post-data.\n`;
            return res.status(500).send(errorMessage);;
        }

        try {
            const encryptedAuthorsInfo = encryptTextWithAWSDataEncryptionKey(
                JSON.stringify(validPostData.authors),
                plaintextDataEncryptionKey
            );

            validPostData.authors = encryptedAuthorsInfo.encryptedTextBuffer;
            validPostData.authorsEncryptionInfo = {
                iv: encryptedAuthorsInfo.iv,
                authTag: encryptedAuthorsInfo.authTag,
                encryptedDataEncryptionKey: encryptedDataEncryptionKey
            }
        }
        catch (error) {
            errorMessage += `• There was trouble encrypting the authors of this intended-to-be-private post.\n`;
            return res.status(500).send(errorMessage);;
        }
    }

    if ('locationOfPost' in req.body && typeof req.body.locationOfPost === 'string') {
        if (req.body.locationOfPost.length > 40) {
            validPostData.locationOfPost = req.body.locationOfPost.substring(0, 37) + "...";
            errorMessage += `• The location of post has been trimmed to 37 characters followed by a
            '...'\n`;
        }
        else {
            validPostData.locationOfPost = req.body.locationOfPost;
        }

        if (isEncrypted) {
            try {
                const encryptedLocationOfPostInfo = encryptTextWithAWSDataEncryptionKey(
                    validPostData.locationOfPost,
                    plaintextDataEncryptionKey
                );
    
                validPostData.locationOfPost = encryptedLocationOfPostInfo.encryptedTextBuffer;
                validPostData.locationOfPostEncryptionInfo = {
                    iv: encryptedLocationOfPostInfo.iv,
                    authTag: encryptedLocationOfPostInfo.authTag
                }
            }
    
            catch (error) {
                errorMessage += `• There was trouble encrypting the location of this this intended-to-be-private
                post.\n`;
                delete validPostData.locationOfPost;
            }
        }
    }
    else if ('locationOfPost' in req.body) {
        errorMessage += `• The location of post, if you decide to set it, must be a string that doesn't exceed 40 characters
        in length. ${req.body.locationOfPost} is invalid\n`;
    }

    if ('category' in req.body) {
        if (listOfValidPostCategories.includes(req.body.category)) {
            validPostData.category = req.body.category
        }
        else {
            errorMessage += `• Your provided category (${req.body.category}) isn't in the list
            ${JSON.stringify(listOfValidPostCategories)}\n`;
        }
    }

    if ('adInfo' in req.body) {
        let adInfoIsValid = false;
        try {
            const adInfo = JSON.parse(req.body.adInfo);

            if (adInfo.constructor == Object) {
                if ('link' in adInfo && typeof adInfo.link === 'string') {
                    if (adInfo.link.length <= 90) {
                        validPostData.adInfo.callToAction = adInfo.callToAction;
                        validPostData.adInfo = {
                            link: adInfo.link
                        };
                        if ('callToAction' in adInfo && typeof adInfo.callToAction === 'string') {
                            if (adInfo.callToAction.length > 45) {
                                validPostData.adInfo.callToAction = adInfo.callToAction.substring(0,42) + '...';
                                errorMessage += `• The call to action of the adInfo object has been trimmed
                                to 42 characters followed by a '...'\n`;
                            }
                            else {
                                validPostData.adInfo.callToAction = adInfo.callToAction;
                            }
                            adInfoIsValid = true;
                        }
                        else {
                            delete validPostData.adInfo;
                        }
                    }
                }
            }

            if (adInfoIsValid && isEncrypted) {
                try {
                    const infoOnEncryptedAdInfo = encryptTextWithAWSDataEncryptionKey(
                        JSON.stringify(validPostData.adInfo),
                        plaintextDataEncryptionKey
                    );
        
                    validPostData.adInfo = infoOnEncryptedAdInfo.encryptedTextBuffer;
                    validPostData.adInfoEncryptionInfo = {
                        iv: infoOnEncryptedAdInfo.iv,
                        authTag: infoOnEncryptedAdInfo.authTag
                    }
                }
        
                catch (error) {
                    errorMessage += `• There was trouble encrypting the ad-info of this this
                    intended-to-be-private post.\n`;
                    delete validPostData.adInfo;
                }
            }
        }
        catch (error) {}

        if (!adInfoIsValid) {
            errorMessage += `• The adInfo, if provided, must be an object with two keys: 'link'(required) and
            'callToAction'(optional)\n`;
        }
    }

    let slidesInfo = {};
    
    if ('slidesInfo' in req.body) {
        let slidesInfoIsValid = false;
        try {
            slidesInfo = JSON.parse(req.body.slidesInfo);
            if (slidesInfo.constructor !== Object) {
                slidesInfo = {};
            }
            else {
                slidesInfoIsValid = true;
            }
        }
        catch (error) {}

        if (!slidesInfoIsValid) {
            errorMessage += `• slidesInfo, if you decide to submit it, is a stringified dict where 
            keys are the same string-keys used for the files that were sent here, and the values are info regarding
            them. You can also submit info about the audio-file you sent here, if you
            choose to upload your post with background-music. Furthermore, you can also
            submit info about the video-subtitle-files you sent here, if you choose to upload your post
            with video-slides that you would like to add subtitles for.\n`;
        }
    }

    const slideNumberToImageOrVideoFileMappings = {};
    const backgroundMusicInfo = null;
    const listOfSubtitleFiles = [];

    req.files.forEach((file) => {
        const intendedSlideNumber = Number(file.fieldname);
        if (isNaN(intendedSlideNumber)) {
            errorMessage += `• The key of each image/vid file should be your intended slide number 
            of the image/vid. I.e: the lowest number if you would like for it to be in the first slide,
            the second lowest number if you would like for it to be in the second slide, and so on.
            If the file is intended for background-music/subtitles of the post, you can set the key to any
            number. '${file.fieldname}' is an invalid key.\n`;
        }
        else if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            slideNumberToImageOrVideoFileMappings[intendedSlideNumber] = file;
        }
        else if (file.mimetype.startsWith('audio/')) {
            let providedBackgroundMusicInfo = {};
            if (intendedSlideNumber.toString() in slidesInfo) {
                providedBackgroundMusicInfo = slidesInfo[intendedSlideNumber.toString()];
            }
            backgroundMusicInfo = {};
            backgroundMusicInfo.audio = file.buffer;

            if ('startTime' in providedBackgroundMusicInfo &&
            !isNaN(providedBackgroundMusicInfo.startTime) &&
            'endTime' in providedBackgroundMusicInfo &&
            !isNaN(providedBackgroundMusicInfo.endTime) &&
            providedBackgroundMusicInfo.startTime >= 0 &&
            (providedBackgroundMusicInfo.endTime > providedBackgroundMusicInfo.startTime ||
            providedBackgroundMusicInfo.endTime == -1)) {
                backgroundMusicInfo.startTime = providedBackgroundMusicInfo.startTime;
                backgroundMusicInfo.endTime = providedBackgroundMusicInfo.endTime;
            }
            else {
                backgroundMusicInfo.startTime = 0; 
                backgroundMusicInfo.endTime = -1;
            }

            if ('title' in providedBackgroundMusicInfo &&
            typeof providedBackgroundMusicInfo.title === 'string') {
                backgroundMusicInfo.title = providedBackgroundMusicInfo.title;

                if (backgroundMusicInfo.title.length > 35) {
                    backgroundMusicInfo.title = backgroundMusicInfo.title.substring(0,32) + '...';
                    errorMessage += `• The title of the background-music has been shortened to 32
                    characters followed by an '...'\n`;
                }
            }
            else {
                backgroundMusicInfo.title = "Unknown Title"
            }

            if ('artist' in providedBackgroundMusicInfo &&
            typeof providedBackgroundMusicInfo.artist === 'string') {
                backgroundMusicInfo.artist = providedBackgroundMusicInfo.artist;

                if (backgroundMusicInfo.artist.length > 35) {
                    backgroundMusicInfo.artist = backgroundMusicInfo.artist.substring(0,32) + '...';
                    errorMessage += `• The artist of the background-music has been shortened to 32
                    characters followed by an '...'\n`;
                }
            }
            else {
                backgroundMusicInfo.artist = "Unknown Artist"
            }
        }
        else if (file.mimetype === 'text/vtt' && intendedSlideNumber.toString() in slidesInfo) {
            let providedSubtitlesFileInfo = {};
            if (intendedSlideNumber.toString() in slidesInfo) {
                providedSubtitlesFileInfo = slidesInfo[intendedSlideNumber.toString()];
            }

            let subtitlesFileIsValid = true;
            const subtitleFileDetails = {
                data: file.buffer
            };

            if('videoSlideNumberString' in providedSubtitlesFileInfo &&
            typeof providedSubtitlesFileInfo.videoSlideNumberString ===
            'string') {
                subtitleFileDetails.videoSlideNumberString = providedSubtitlesFileInfo.videoSlideNumberString;
            }
            else {
                subtitlesFileIsValid = false;
            }

            if (subtitlesFileIsValid && 'langCode' in providedSubtitlesFileInfo && 
            listOfValidLangCodes.includes(providedSubtitlesFileInfo.langCode)) {
                subtitleFileDetails.langCode = providedSubtitlesFileInfo.langCode;
            }
            else {
                subtitlesFileIsValid = false;
            }

            if (subtitlesFileIsValid && 'isDefault' in providedSubtitlesFileInfo) {
                subtitleFileDetails.isDefault = true;
            }

            if (subtitlesFileIsValid) {
                listOfSubtitleFiles.push(subtitleFileDetails);
            }
            else {
                errorMessage += `• The info for the subtitles file contains the following keys:
                'videoSlideNumberString'(required), 'langCode'(required; also, must be a valid langCode), & 'isDefault'(optional).
                The info provided for ${file.originalname} is invalid!\n`;
            }
        }
        else {
            errorMessage += `• You can only submit images, videos, background-music, and vid-subtitle-files of the post,
            not any other kinds of files, such as ${file.originalname}!\n`;
        }
    });

    let sortedSlideNumbers = [...Object.keys(slideNumberToImageOrVideoFileMappings)].sort((a, b) => a - b);
    if (sortedSlideNumbers.length==0) {
        errorMessage += `• You didn't submit any images/video slides for the post\n`;
        return res.status(400).send(errorMessage);
    }

    const vidSlideNumbersAndTheirSubtitleFiles = {};
    for(const subtitleFile of listOfSubtitleFiles) {
        const { videoSlideNumberString, langCode } = subtitleFile;
        const videoSlideNumber = Number(videoSlideNumberString);
        const vidFile = slideNumberToImageOrVideoFileMappings[videoSlideNumber];
        if (typeof vidFile !== 'undefined' && vidFile.mimetype.startsWith('video/')) { 
            if (videoSlideNumber in vidSlideNumbersAndTheirSubtitleFiles) {
                if (Object.keys(vidSlideNumbersAndTheirSubtitleFiles[videoSlideNumber])
                .length < 20) {
                    const newSubtitleFile = {...subtitleFile};
                    delete newSubtitleFile.videoSlideNumberString;

                    vidSlideNumbersAndTheirSubtitleFiles[videoSlideNumber][langCode] = newSubtitleFile;
                }
                else {
                    errorMessage += `• Videos can have subtitle-files associated with them for at-most 20
                    unique language codes. Hence, some of the subtitle-files for the video with the
                    slide-number ${videoSlideNumber} will be left out. In this case, the lang-code
                    of the subtitle-file that will be left out for slide-number ${videoSlideNumber} is
                    ${langCode}\n`;
                }
            }
            else {
                const newSubtitleFile = {...subtitleFile};
                delete newSubtitleFile.videoSlideNumberString;

                vidSlideNumbersAndTheirSubtitleFiles[videoSlideNumber] = {};
                vidSlideNumbersAndTheirSubtitleFiles[videoSlideNumber][langCode] = newSubtitleFile;
            }
        }
        else {
            errorMessage += `• One of the subtitle-files is incorrectly pointing to a file that isn't a video.
            Specifically, this subtitle-file has a videoSlideNumberString value of ${videoSlideNumberString}
            and a langCode of ${langCode}\n`;
        }
    }


    const postSlides = [];
    const newVidSlideNumbersAndTheirSubtitleFiles = {};
    for(let i=0; i<sortedSlideNumbers.length; i++) {
        if (imageSlides.length + videoSlides.length == 10) {
            errorMessage += `• There can be at-most 10 image and video slides per post`;
            break;
        }

        const currSlideNumber = sortedSlideNumbers[i];
        const stringifiedCurrSlideNumber = stringifiedCurrSlideNumber;
        const file = slideNumberToImageOrVideoFileMappings[currSlideNumber];
        
        const newSlideInfo = {
            data: file.buffer,
            slideNumber: i
        };

        if (isEncrypted) { 
            try {
                const encryptedSlideFileInfo = encryptFileBufferWithAWSDataEncryptionKey(
                    file.buffer,
                    plaintextDataEncryptionKey
                );
    
                newSlideInfo.data = encryptedSlideFileInfo.encryptedFileBuffer;
                newSlideInfo.dataEncryptionInfo = {
                    iv: encryptedSlideFileInfo.iv,
                    authTag: encryptedSlideFileInfo.authTag
                }
            }
    
            catch (error) {
                errorMessage += `• There was trouble encrypting the image/vid slide file-buffer associated
                with the slide-number ${currSlideNumber}, for this intended-to-be-private post.\n`;
                return res.status(500).send(errorMessage);;
            }
        }

        if (file.mimetype.startsWith('image/')) {
            if (stringifiedCurrSlideNumber in slidesInfo) {
                if ('taggedAccounts' in slidesInfo[stringifiedCurrSlideNumber]) {
                    const validatedTaggedAccounts = await getValidatedImageSlideTaggedAccounts(
                        authUserId,
                        slidesInfo[stringifiedCurrSlideNumber].taggedAccounts
                    );
                    if (typeof validatedTaggedAccounts === 'string') {
                        errorMessage += `• ${validatedTaggedAccounts}\n`
                    }
                    else if (validatedTaggedAccounts.length > 0) {
                        newSlideInfo.taggedAccounts = validatedTaggedAccounts;
                        if (isEncrypted) {
                            try {
                                const encryptedTaggedAccountsInfo = encryptTextWithAWSDataEncryptionKey(
                                    JSON.stringify(newSlideInfo.taggedAccounts),
                                    plaintextDataEncryptionKey
                                );
                    
                                newSlideInfo.taggedAccounts = encryptedTaggedAccountsInfo.encryptedTextBuffer;
                                newSlideInfo.taggedAccountsEncryptionInfo = {
                                    iv: encryptedTaggedAccountsInfo.iv,
                                    authTag: encryptedTaggedAccountsInfo.authTag
                                }
                            }
                    
                            catch (error) {
                                errorMessage += `• There was trouble encrypting the taggedAccounts
                                of the intended-to-be-private post for slide-number ${currSlideNumber}.\n`;
                                delete newSlideInfo.taggedAccounts;
                            }
                        }
                    }
                }
            }
            newSlideInfo.type = 'image';
            postSlides.push(newSlideInfo);
        }
        else {
            if (currSlideNumber in vidSlideNumbersAndTheirSubtitleFiles) {
                newVidSlideNumbersAndTheirSubtitleFiles[i] = vidSlideNumbersAndTheirSubtitleFiles[currSlideNumber];
            }

            if (stringifiedCurrSlideNumber in slidesInfo) {
                if ('taggedAccounts' in slidesInfo[stringifiedCurrSlideNumber]) {
                    const validatedTaggedAccounts = await getValidatedVideoSlideTaggedAccounts(
                        authUserId,
                        slidesInfo[stringifiedCurrSlideNumber].taggedAccounts
                    );
                    if (typeof validatedTaggedAccounts === 'string') {
                        errorMessage += `• ${validatedTaggedAccounts}\n`
                    }
                    else if (validatedTaggedAccounts.length > 0) {
                        newSlideInfo.taggedAccounts = validatedTaggedAccounts;
                        if (isEncrypted) {
                            try {
                                const encryptedTaggedAccountsInfo = encryptTextWithAWSDataEncryptionKey(
                                    JSON.stringify(newSlideInfo.taggedAccounts),
                                    plaintextDataEncryptionKey
                                );
                    
                                newSlideInfo.taggedAccounts = encryptedTaggedAccountsInfo.encryptedTextBuffer;
                                newSlideInfo.taggedAccountsEncryptionInfo = {
                                    iv: encryptedTaggedAccountsInfo.iv,
                                    authTag: encryptedTaggedAccountsInfo.authTag
                                }
                            }
                    
                            catch (error) {
                                errorMessage += `• There was trouble encrypting the the taggedAccounts
                                of the intended-to-be-private post for slide-number ${currSlideNumber}.\n`;
                                delete newSlideInfo.taggedAccounts;
                            }
                        }
                    }
                }

                if ('sections' in slidesInfo[stringifiedCurrSlideNumber]) {
                    const sectionsAreValid = validateSections(
                        slidesInfo[stringifiedCurrSlideNumber].sections
                    );
                    if (sectionsAreValid && slidesInfo[stringifiedCurrSlideNumber].sections.length > 0) {
                        newSlideInfo.sections = slidesInfo[stringifiedCurrSlideNumber].sections;
                        if (isEncrypted) {
                            try {
                                const encryptedSectionsInfo = encryptTextWithAWSDataEncryptionKey(
                                    JSON.stringify(newSlideInfo.sections),
                                    plaintextDataEncryptionKey
                                );
                    
                                newSlideInfo.sections = encryptedSectionsInfo.encryptedTextBuffer;
                                newSlideInfo.sectionsEncryptionInfo = {
                                    iv: encryptedSectionsInfo.iv,
                                    authTag: encryptedSectionsInfo.authTag
                                }
                            }
                    
                            catch (error) {
                                errorMessage += `• There was trouble encrypting the the sections
                                of the intended-to-be-private post for slide-number
                                ${currSlideNumber}.\n`;
                                delete newSlideInfo.sections;
                            }
                        }
                    }
                    else {
                        errorMessage += `• The sections provided for slide-number ${currSlideNumber}
                        is either invalidly structured or is simply an empty list.
                        Got: ${JSON.stringify(slidesInfo[stringifiedCurrSlideNumber].sections)}\n`
                    }
                }
            }
            newSlideInfo.type = 'video';
            postSlides.push(newSlideInfo);
        }
    }

    const firstSlideOfPostIsImage = postSlides[0].type === 'image';
    vidSlideNumbersAndTheirSubtitleFiles = {...newVidSlideNumbersAndTheirSubtitleFiles};
    
    validPostData.datetimeOfPost = new Date();
    validPostData.overallPostId = newOverallPostId;
    validPostData.slideNumber = postSlides[0].slideNumber;
    if ('taggedAccounts' in postSlides[0]) {
        validPostData.taggedAccounts = postSlides[0].taggedAccounts;
    }
    if ('sections' in postSlides[0]) {
        validPostData.sections = postSlides[0].sections;
    }
    if (isEncrypted) {
        if (firstSlideOfPostIsImage) {
            validPostData.imageEncryptionInfo = postSlides[0].dataEncryptionInfo;
        }
        else {
            validPostData.videoEncryptionInfo = postSlides[0].dataEncryptionInfo;
            if ('sections' in postSlides[0]) {
                validPostData.sectionsEncryptionInfo = postSlides[0].sectionsEncryptionInfo;
            }
        }

        if ('taggedAccounts' in postSlides[0]) {
            validPostData.taggedAccountsEncryptionInfo = postSlides[0].taggedAccountsEncryptionInfo;
        }
    }

    let uploadStream;
    try {
        uploadStream = imageAndVideoSlidesOfPostsBucket.openUploadStream(firstSlideOfPostIsImage ? 'img' : 'vid', {
            metadata: validPostData
        });
        await uploadImageOrVideoSlide(postSlides[0].data, uploadStream);
    }
    catch (error) {
        errorMessage += `• There was trouble uploading image/video slide number 0 of your post into the database\n`;
        return res.status(500).send(errorMessage);;
    }

    for(let i=1; i<postSlides.length; i++) {
        const postSlide = postSlides[i];
        const currSlideIsImage = postSlides[i].type === 'image';
        validPostData = {
            overallPostId: newOverallPostId,
            slideNumber: postSlide.slideNumber
        };
        if ('taggedAccounts' in postSlide) {
            validPostData.taggedAccounts = postSlide.taggedAccounts;
        }
        if ('sections' in postSlide) {
            validPostData.sections = postSlide.sections;
        }
        if (isEncrypted) {
            if (currSlideIsImage) {
                validPostData.imageEncryptionInfo = postSlide.dataEncryptionInfo;
            }
            else {
                validPostData.videoEncryptionInfo = postSlide.dataEncryptionInfo;
                if ('sections' in postSlide) {
                    validPostData.sectionsEncryptionInfo = postSlide.sectionsEncryptionInfo;
                }
            }

            if ('taggedAccounts' in postSlide) {
                validPostData.taggedAccountsEncryptionInfo = postSlide
                .taggedAccountsEncryptionInfo;
            }
        }

        try {
            uploadStream = imageAndVideoSlidesOfPostsBucket.openUploadStream(currSlideIsImage ? 'img' : 'vid', {
                metadata: validPostData
            });
            await uploadImageOrVideoSlide(postSlide.data, uploadStream);
            successMessage += `• Image/video slide number ${i} of your post has successfully been uploaded to the database.\n`;
        }
        catch (error) {
            errorMessage += `• There was trouble uploading postSlide ${i} into the database\n`;
            if (successMessage.length == 0) {
                return res.status(500).send(errorMessage);
            }
            return res.status(500).send(
                'There was a mix of success and Errors in this API-request...\n' + 
                newOverallPostIdAsString.length > 0 ? 
                `This is the overallPostId of your newly uploaded post: ${newOverallPostIdAsString}\n` : 
                '' +
                'Here are the Successes:\n' + successMessage +
                '& Here are the Errors:\n' + errorMessage
            );
        }
    }

    if (isEncrypted)
    {
        const encryptionInfoForCaptionCommentsAndLikesWasSuccessfullyAdded = await
        addEncryptionInfoForCaptionCommentsAndLikesOfNewlyUploadedEncryptedPost(
            newOverallPostIdAsString
        );

        if (!encryptionInfoForCaptionCommentsAndLikesWasSuccessfullyAdded)
        {
            errorMessage += `• There was trouble adding the encryption-info for the caption/comments/likes
            of your newly uploaded private-post.\n`;

            if (successMessage.length == 0) {
                return res.status(500).send(errorMessage);
            }
            return res.status(500).send(
                'There was a mix of success and Errors in this API-request...\n' + 
                newOverallPostIdAsString.length > 0 ? 
                `This is the overallPostId of your newly uploaded post: ${newOverallPostIdAsString}\n` : 
                '' +
                'Here are the Successes:\n' + successMessage +
                '& Here are the Errors:\n' + errorMessage
            );
        }


        const encryptionInfoForBgMusicAndVidSubsWasSuccessfullyAdded = await
        addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost(
            newOverallPostIdAsString
        );

        if (!encryptionInfoForBgMusicAndVidSubsWasSuccessfullyAdded)
        {
            errorMessage += `• There was trouble adding the encryption-info for the background-music and video-subtitles
            of this post.\n`;

            if (successMessage.length == 0) {
                return res.status(500).send(errorMessage);
            }
            return res.status(500).send(
                'There was a mix of success and Errors in this API-request...\n' + 
                newOverallPostIdAsString.length > 0 ? 
                `This is the overallPostId of your newly uploaded post: ${newOverallPostIdAsString}\n` : 
                '' +
                'Here are the Successes:\n' + successMessage +
                '& Here are the Errors:\n' + errorMessage
            );
        }
    }

    if ('caption' in req.body) {
        let { caption } = req.body;
        if (caption.length > 2200) {
            caption = caption.substring(0, 2197) + "...";
            errorMessage += `• The caption has been trimmed down to 2197 characters followed by a '...'\n`;
        }
        const captionWasSuccessfullyAdded = await addCaptionToPost(
            authUserId, caption, newOverallPostIdAsString, isEncrypted
        );
        if (captionWasSuccessfullyAdded) {
            successMessage += `• Your caption has been added successfully\n`;
        }
        else {
            errorMessage += `• There was trouble adding your caption\n`;
        }
    }

    if (Object.keys(vidSlideNumbersAndTheirSubtitleFiles).length > 0) {
        const vidSubtitleFilesWereSuccessfullyAdded = await addVidSubtitleFilesToPost(
            vidSlideNumbersAndTheirSubtitleFiles, newOverallPostIdAsString, isEncrypted
        );
        if (vidSubtitleFilesWereSuccessfullyAdded) {
            successMessage += `• Your vid-subtitle-files have been added to your post successfully\n`;
        }
        else {
            errorMessage += `• There was trouble adding your vid-subtitle-files to your post\n`;
        }
    }

    if (backgroundMusicInfo!==null) {
        const backgroundMusicWasSuccessfullyAdded = await addBackgroundMusicToPost(
            backgroundMusicInfo, newOverallPostIdAsString, isEncrypted
        );
        if (backgroundMusicWasSuccessfullyAdded) {
            successMessage += `• Your post-background-music has been added successfully\n`;
        }
        else {
            errorMessage += `• There was trouble adding your post-background-music\n`;
        }
    }
 
    if (errorMessage.length == 0) {
        return res.send(
        `This is the overallPostId of your newly uploaded post: ${newOverallPostIdAsString}\n` + 
        '& Here are the Successes:\n' + successMessage
        );
    }
    else if (successMessage.length == 0) {
        return res.status(500).send(errorMessage);
    }
    return res.status(500).send(
        'There was a mix of success and Errors in this API-request...\n' + 
        newOverallPostIdAsString.length > 0 ? 
        `This is the overallPostId of your newly uploaded post: ${newOverallPostIdAsString}\n` : 
        '' +
        'Here are the Successes:\n' + successMessage +
        '& Here are the Errors:\n' + errorMessage
    );
}); 


app.patch('/updatePost/:authUserId/:overallPostId', threePerMinuteRateLimiter, upload.any(), async (req, res) => {
    const { authUserId, overallPostId } = req.params;
    const userTokenValidationResult = validateUserAuthToken(authUserId, req.cookies);
    
    if (userTokenValidationResult instanceof Date) {
        const refreshedAuthToken = refreshUserAuthToken(authUserId);
        if (refreshedAuthToken!==null) {
            res.cookie(`authToken${authUserId}`, refreshedAuthToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                expires: userTokenValidationResult
            });
        }
    }
    else if (userTokenValidationResult === 'Forbidden') {
        return res.sendStatus(401);
    }

    const overallPostIdObject = new ObjectId(overallPostId);
    let allSlidesOfPost = await imageAndVideoSlidesOfPostsDotFilesCollection.find(
        { "metadata.overallPostId": overallPostIdObject }
    ).sort(
        {"metadata.slideNumber": 1}
    ).toArray();
    
    const dataForEntirePost = {};
    const slideNumberToInfoMappings = {};
    const slideNumberToUpdatedInfoMappings = {};
    let slideNumbersOfPost = [];
    let plaintextDataEncryptionKey;
    let encryptedDataEncryptionKey;

    if (allSlidesOfPost.length > 0) {
        for (let postSlide of allSlidesOfPost) {
            const postSlideData = {...postSlide.metadata};
            const currSlideIsImage = postSlide.filename === 'img';
            if (postSlideData.slideNumber == 0) {   
                if ('authorsEncryptionInfo' in postSlideData) {
                    dataForEntirePost.isOriginallyEncrypted = true;

                    encryptedDataEncryptionKey = postSlideData.authorsEncryptionInfo.encryptedDataEncryptionKey;
                    const decryptResponse = await awsKMSClient.send(new DecryptCommand({
                        CiphertextBlob: encryptedDataEncryptionKey,
                    }));
                    plaintextDataEncryptionKey = decryptResponse.Plaintext;

                    const decryptedAuthors = decryptTextWithAWSDataEncryptionKey(
                        postSlideData.authors,
                        plaintextDataEncryptionKey,
                        postSlideData.authorsEncryptionInfo.iv,
                        postSlideData.authorsEncryptionInfo.authTag,
                    );
                    const authors = JSON.parse(decryptedAuthors);
                    if (!authors.includes(authUserId)) {
                        return res.status(401).send('You are not one of the authors of this post');
                    }
                    dataForEntirePost.authorsEncryptionInfo = postSlideData.authorsEncryptionInfo;
    
                    if ('locationOfPost' in postSlideData) {
                        dataForEntirePost.locationOfPostEncryptionInfo = postSlideData.locationOfPostEncryptionInfo;
                    }
    
                    if ('adInfo' in postSlideData) {
                        dataForEntirePost.adInfoEncryptionInfo = postSlideData.adInfoEncryptionInfo;
                    }
                }
                else {
                    dataForEntirePost.isOriginallyEncrypted = false;
                }
                dataForEntirePost.datetimeOfPost = postSlideData.datetimeOfPost;
                dataForEntirePost.authors = postSlideData.authors;
                if ('category' in postSlideData) {
                    dataForEntirePost.category = postSlideData.category;
                }
                if ('locationOfPost' in postSlideData) {
                    dataForEntirePost.locationOfPost = postSlideData.locationOfPost;
                }
                if ('adInfo' in postSlideData) {
                    dataForEntirePost.adInfo = postSlideData.adInfo;
                }
            }

            const { slideNumber } = postSlideData;
            slideNumbersOfPost.push(slideNumber);
            slideNumberToInfoMappings[slideNumber] = {
                _id : postSlide._id,
                type: currSlideIsImage ? 'image' : 'video'
            }
            if ('taggedAccounts' in postSlideData) {
                slideNumberToInfoMappings[slideNumber].taggedAccounts = postSlideData.taggedAccounts;
                if ('taggedAccountsEncryptionInfo' in postSlideData) {
                    slideNumberToInfoMappings[slideNumber].taggedAccountsEncryptionInfo = postSlideData.taggedAccountsEncryptionInfo;
                }
            }
            if ('sections' in postSlideData) {
                slideNumberToInfoMappings[slideNumber].sections = postSlideData.sections;
                if ('sectionsEncryptionInfo' in postSlideData) {
                    slideNumberToInfoMappings[slideNumber].sectionsEncryptionInfo = postSlideData.sectionsEncryptionInfo;
                }
            }
        }
    }
    else {
        return res.send({
            postWasFound: false
        });
    }

    let successMessage = '';
    let errorMessage = '';

    let isToBeEncrypted;
    if ('isToBeEncrypted' in req.body) {
        if (req.body.isToBeEncrypted === 'true') {
            isToBeEncrypted = true;
        }
        else {
            isToBeEncrypted = false;
        }
    }
    else {
        isToBeEncrypted = dataForEntirePost.isOriginallyEncrypted;
    }

    if (!dataForEntirePost.isOriginallyEncrypted && isToBeEncrypted) {
        try {
            await createNewAWSCustomerMasterKey(
                `for encrypting/decrypting data-encryption-keys needed for safeguarding sensitive 
                private-post-data`,
                `post${overallPostId}`
            );

            const newAWSDataEncryptionKeyInfo = await createNewAWSDataEncryptionKey(
                `post${overallPostId}`
            );

            plaintextDataEncryptionKey = newAWSDataEncryptionKeyInfo[0];
            encryptedDataEncryptionKey = newAWSDataEncryptionKeyInfo[1];
        }
        catch (error) {
            errorMessage += `• There was trouble in the process of generating the data-encryption
            keys required for encrypting the sensitive intended-to-be-private post-data.\n`;
            return res.status(500).send(errorMessage);;
        }
    }

    if (dataForEntirePost.isOriginallyEncrypted !== isToBeEncrypted) {
        try {
            for (let postSlide of allSlidesOfPost) {
                const currSlideIsImage = postSlide.filename === 'img';
                const downloadStream = imageAndVideoSlidesOfPostsBucket.openDownloadStream(postSlide._id);
                let imageOrVidSlideFileChunks = [];
                const postSlideData = {...postSlide.metadata};

                await new Promise((resolve, reject) => {
                    downloadStream.on('data', (chunk) => imageOrVidSlideFileChunks.push(chunk));
                    downloadStream.on('end', () => {
                        if (currSlideIsImage) {
                            let image = Buffer.concat(imageOrVidSlideFileChunks); 
                            if ('imageEncryptionInfo' in postSlideData) {
                                image = decryptFileBufferWithAWSDataEncryptionKey(
                                    Buffer.concat(imageOrVidSlideFileChunks),
                                    plaintextDataEncryptionKey,
                                    postSlideData.imageEncryptionInfo.iv,
                                    postSlideData.imageEncryptionInfo.authTag,
                                );   
                                
                            }
                            slideNumberToInfoMappings[slideNumber].image = image;
                        }
                        else {
                            let video = Buffer.concat(imageOrVidSlideFileChunks); 
                            if ('videoEncryptionInfo' in postSlideData) {
                                video = decryptFileBufferWithAWSDataEncryptionKey(
                                    Buffer.concat(imageOrVidSlideFileChunks),
                                    plaintextDataEncryptionKey,
                                    postSlideData.videoEncryptionInfo.iv,
                                    postSlideData.videoEncryptionInfo.authTag,
                                );   
                            }
                            slideNumberToInfoMappings[slideNumber].video = video;
                        }
                        resolve();
                    });
                    downloadStream.on('error', reject);
                });
            }
        }
        catch (error) {
            errorMessage += `• There was trouble fetching all the image and video files of the slides of this post, which
            is necessary for changing the encryption-status.\n`;
            return res.status(500).send(errorMessage);;
        }
    }

    const updatedDataForEntirePost = {
        $unset: {}
    };

    if ('locationOfPost' in req.body && typeof req.body.locationOfPost === 'string') {
        if (req.body.locationOfPost.length > 40) {
            updatedDataForEntirePost.locationOfPost = req.body.locationOfPost.substring(0, 37) + "...";
            errorMessage += `• The location of post has been trimmed to 37 characters followed by a
            '...'\n`;
        }
        else {
            if (req.body.locationOfPost.length == 0 && 'locationOfPost' in dataForEntirePost) {
                updatedDataForEntirePost.$unset.locationOfPost = "";
            }
            else if (req.body.locationOfPost.length > 0) {
                updatedDataForEntirePost.locationOfPost = req.body.locationOfPost;
            }
            else {
                errorMessage += `• The location of this post cannot be unset since it wasn't even set in the first place\n`;
            }
        }

        if ('locationOfPost' in updatedDataForEntirePost && isToBeEncrypted) {
            try {
                const encryptedLocationOfPostInfo = encryptTextWithAWSDataEncryptionKey(
                    updatedDataForEntirePost.locationOfPost,
                    plaintextDataEncryptionKey
                );
    
                updatedDataForEntirePost.locationOfPost = encryptedLocationOfPostInfo.encryptedTextBuffer;
                updatedDataForEntirePost.locationOfPostEncryptionInfo = {
                    iv: encryptedLocationOfPostInfo.iv,
                    authTag: encryptedLocationOfPostInfo.authTag
                }
            }
            catch (error) {
                errorMessage += `• There was trouble encrypting the updated location of this intended-to-be-private
                post.\n`;
                delete updatedDataForEntirePost.locationOfPost;
            }
        }
        else if (dataForEntirePost.isOriginallyEncrypted && !isToBeEncrypted && 'locationOfPost' in dataForEntirePost) {
            updatedDataForEntirePost.$unset.locationOfPostEncryptionInfo = "";
        }
    }
    else if ('locationOfPost' in req.body) {
        errorMessage += `• The location of post, if you decide to update it, must be a string that doesn't exceed 40 characters
        in length. If you would like to unset the location of post property, simply provide an empty string for it.
        ${req.body.locationOfPost} is invalid\n`;
    }

    if ('category' in req.body) {
        if (listOfValidPostCategories.includes(req.body.category)) {
            updatedDataForEntirePost.category = req.body.category
        }
        else if (typeof req.body.category === 'string' && req.body.category.length == 0 && 'category' in dataForEntirePost) {
            updatedDataForEntirePost.$unset.category = "";
        }
        else {
            errorMessage += `• Your provided category (${req.body.category}) isn't in the list ${JSON.stringify(
            listOfValidPostCategories)}. If you would like to unset the 'category' field instead, simply
            provide an empty string for it.\n`;
        }
    }

    if ('adInfo' in req.body) {
        let adInfoIsValid = false;
        try {
            const adInfo = JSON.parse(req.body.adInfo);

            if (adInfo.constructor == Object) {
                if ('link' in adInfo && typeof adInfo.link === 'string' && adInfo.link.length <= 90) {
                    updatedDataForEntirePost.adInfo = {
                        link: adInfo.link
                    };
                    if ('callToAction' in adInfo && typeof adInfo.callToAction === 'string') {
                        if (adInfo.callToAction.length > 45) {
                            updatedDataForEntirePost.adInfo.callToAction = adInfo.callToAction.substring(0,42) + '...';
                            errorMessage += `• The call to action of the adInfo object has been trimmed
                            to 42 characters followed by a '...'\n`;
                        }
                        else {
                            updatedDataForEntirePost.adInfo.callToAction = adInfo.callToAction;
                        }
                        adInfoIsValid = true;
                    }
                    else {
                        delete updatedDataForEntirePost.adInfo;
                    }
                }
                else {
                    if (Object.keys(adInfo).length == 0) {
                        updatedDataForEntirePost.$unset.adInfo = "";
                    }
                }
            }
            else if ('link' in adInfo && typeof adInfo.link === 'string') {
                errorMessage += `• The link of the adInfo object must not exceed 90 characters in length\n`;
            }

            if (adInfoIsValid && isToBeEncrypted) {
                try {
                    const infoOnEncryptedAdInfo = encryptTextWithAWSDataEncryptionKey(
                        JSON.stringify(updatedDataForEntirePost.adInfo),
                        plaintextDataEncryptionKey
                    );
        
                    updatedDataForEntirePost.adInfo = infoOnEncryptedAdInfo.encryptedTextBuffer;
                    updatedDataForEntirePost.adInfoEncryptionInfo = {
                        iv: infoOnEncryptedAdInfo.iv,
                        authTag: infoOnEncryptedAdInfo.authTag
                    }
                }
        
                catch (error) {
                    errorMessage += `• There was trouble encrypting the ad-info of this this
                    intended-to-be-private post.\n`;
                    delete updatedDataForEntirePost.adInfo;
                }
            }
            else if (dataForEntirePost.isOriginallyEncrypted && !isToBeEncrypted && 'adInfo' in dataForEntirePost) {
                updatedDataForEntirePost.$unset.adInfoEncryptionInfo = "";
            }
        }
        catch (error) {
            adInfoIsValid = false;
        }

        if (!adInfoIsValid) {
            errorMessage += `• The adInfo, if you decide to add it, must be a dictionary with two keys: 'link'(required) and
            'callToAction'(optional). If you would like to unset the adInfo field of the post,
            simply provide an empty dictionary.\n`;
        }
    }

    let slideNumberToUpdatedTaggedAccounts = {};
    if ('slideNumberToUpdatedTaggedAccounts' in req.body) {
        let slideNumberToUpdatedTaggedAccountsIsValid = true;
        try {
            slideNumberToUpdatedTaggedAccounts = JSON.parse(req.body.slideNumberToUpdatedTaggedAccounts);
            if (slideNumberToUpdatedTaggedAccounts.constructor == Object) {
                for(const slideNumber of Object.keys(slideNumberToUpdatedTaggedAccounts)) {
                    if (!isNaN(slideNumber) && slideNumber in slideNumberToInfoMappings) {
                        const slideType = slideNumberToInfoMappings[slideNumber].type;
                        let validatedTaggedAccounts = [];
                        if (slideType === 'image') {
                            validatedTaggedAccounts = getValidatedImageSlideTaggedAccounts(
                                authUserId,
                                slideNumberToUpdatedTaggedAccounts[slideNumber]
                            );
                        }
                        else {
                            validatedTaggedAccounts = getValidatedVideoSlideTaggedAccounts(
                                authUserId,
                                slideNumberToUpdatedTaggedAccounts[slideNumber]
                            );
                        }
                        if (typeof validatedTaggedAccounts === 'string') {
                            errorMessage += `• ${JSON.stringify(slideNumberToUpdatedTaggedAccounts[slideNumber])}
                            is in invalid value for the hashmap provided for the key ${slideNumber}
                            in the dict provided for 'slideNumberToUpdatedTaggedAccounts'\n`;
                        }
                        else {
                            if(isToBeEncrypted && validatedTaggedAccounts.length>0) {
                                const taggedAccountsEncryptionInfo = encryptTextWithAWSDataEncryptionKey(
                                    JSON.stringify(validatedTaggedAccounts),
                                    plaintextDataEncryptionKey
                                );
                
                                slideNumberToUpdatedInfoMappings[slideNumber].taggedAccounts =
                                taggedAccountsEncryptionInfo.encryptedTextBuffer;

                                slideNumberToUpdatedInfoMappings[slideNumber].taggedAccountsEncryptionInfo = {
                                    iv: taggedAccountsEncryptionInfo.iv,
                                    authTag: taggedAccountsEncryptionInfo.authTag
                                }
                            }
                            else {
                                if (validatedTaggedAccounts.length == 0) {
                                    slideNumberToUpdatedInfoMappings[slideNumber].$unset.taggedAccounts = "";
                                }
                                else {
                                    slideNumberToUpdatedInfoMappings[slideNumber].taggedAccounts = validatedTaggedAccounts;
                                }

                                if (dataForEntirePost.isOriginallyEncrypted && !isToBeEncrypted && 'taggedAccounts' in
                                slideNumberToInfoMappings[slideNumber]) {
                                    slideNumberToUpdatedInfoMappings[slideNumber].$unset.taggedAccountsEncryptionInfo = "";
                                }
                            }
                        }
                    }
                    else {
                        errorMessage += `• ${slideNumber} is an invalid key in the
                        dict provided for slideNumberToUpdatedTaggedAccounts. Only valid
                        slide numbers, in their numeric form(i.e no stringified numbers/etc), 
                        are acceptable\n`;
                    }
                }
            }
            else {
                slideNumberToUpdatedTaggedAccountsIsValid = false;
            }
        }
        catch (error) {
            slideNumberToUpdatedTaggedAccountsIsValid = false;
        }

        if (!slideNumberToUpdatedTaggedAccountsIsValid) {
            errorMessage += `• The slideNumberToUpdatedTaggedAccounts body parameter
            must have a value that is a stringified-hashmap. In this hashmap, each key must be
            an integer slideNumber and each value must be the updated taggedAccounts for that
            slideNumber.\n`;
        }
    }

    let slideNumberToUpdatedSections = {};
    if ('slideNumberToUpdatedSections' in req.body) {
        let slideNumberToUpdatedSectionsIsValid = true;
        try {
            slideNumberToUpdatedSections = JSON.parse(req.body.slideNumberToUpdatedSections);

            if (slideNumberToUpdatedSections.constructor == Object) {
                for(const slideNumber of Object.keys(slideNumberToUpdatedSections)) {
                    let slideNumberIsValid = false;
                    if (!isNaN(slideNumber) && slideNumber in slideNumberToInfoMappings) {
                        const slideType = slideNumberToInfoMappings[slideNumber].type;
                        if (slideType === 'video') {
                            slideNumberIsValid = true;
                            const sections =  slideNumberToUpdatedSections[slideNumber];
                            const sectionsAreValid = validateSections(
                                sections
                            );
                            if (!sectionsAreValid) {
                                errorMessage += `• ${JSON.stringify(sections)} is an invalid video-sections value for the key
                                ${slideNumber} in the dict provided for the 'slideNumberToUpdatedSections' parameter.\n`;  
                            }
                            else {
                                if(isToBeEncrypted && sections.length > 0) {
                                    const sectionsEncryptionInfo = encryptTextWithAWSDataEncryptionKey(
                                        JSON.stringify(sections),
                                        plaintextDataEncryptionKey
                                    );
                        
                                    slideNumberToUpdatedInfoMappings[slideNumber].sections =
                                    sectionsEncryptionInfo.encryptedTextBuffer;
    
                                    slideNumberToUpdatedInfoMappings[slideNumber].sectionsEncryptionInfo = {
                                        iv: sectionsEncryptionInfo.iv,
                                        authTag: sectionsEncryptionInfo.authTag
                                    };
                                }
                                else {
                                    if (sections.length==0) {
                                        slideNumberToUpdatedInfoMappings[slideNumber].$unset.sections = "";
                                    }
                                    else {
                                        slideNumberToUpdatedInfoMappings[slideNumber].sections = sections;
                                    }
    
                                    if (dataForEntirePost.isOriginallyEncrypted && !isToBeEncrypted && 'sections' in
                                    slideNumberToInfoMappings[slideNumber]) {
                                        slideNumberToUpdatedInfoMappings[slideNumber].$unset.sectionsEncryptionInfo = "";
                                    }
                                }
                            }
                        }
                    }
                    if (!slideNumberIsValid) {
                        errorMessage += `• ${slideNumber} is an invalid key in the
                        dict provided for slideNumberToUpdatedSections. Only valid
                        slide numbers, in their numeric form(i.e no stringified numbers/etc), 
                        are acceptable\n`;
                    }
                }
            }
            else {
                slideNumberToUpdatedSectionsIsValid = false;
            }
        }
        catch (error) {
            slideNumberToUpdatedSectionsIsValid = false;
        }

        if(!slideNumberToUpdatedSectionsIsValid) {
            errorMessage += `• The slideNumberToUpdatedSections body parameter
            must have a value that is a stringified-hashmap. In this hashmap, each key must be
            an integer slideNumber and each value must be the updated sections for that
            slideNumber, provided that the slide is of type 'video'. If you would like to unset the 
            sections of a specific vid-slide, simply pass in an empty list for that slideNumber-key.\n`;
        }
    }
    
    if (dataForEntirePost.isOriginallyEncrypted !== isToBeEncrypted) {
        if (isToBeEncrypted) {
            try {
                const encryptedAuthorsInfo = encryptTextWithAWSDataEncryptionKey(
                    JSON.stringify(dataForEntirePost.authors),
                    plaintextDataEncryptionKey
                );
    
                updatedDataForEntirePost.authors = encryptedAuthorsInfo.encryptedTextBuffer;
                updatedDataForEntirePost.authorsEncryptionInfo = {
                    iv: encryptedAuthorsInfo.iv,
                    authTag: encryptedAuthorsInfo.authTag,
                    encryptedDataEncryptionKey: encryptedDataEncryptionKey
                };

                if ('locationOfPost' in dataForEntirePost && !('locationOfPost' in updatedDataForEntirePost)
                && !('locationOfPost' in updatedDataForEntirePost.$unset)) {
                    const encryptedLocationOfPostInfo = encryptTextWithAWSDataEncryptionKey(
                        dataForEntirePost.locationOfPost,
                        plaintextDataEncryptionKey
                    );
        
                    updatedDataForEntirePost.locationOfPost = encryptedLocationOfPostInfo.encryptedTextBuffer;
                    updatedDataForEntirePost.locationOfPostEncryptionInfo = {
                        iv: encryptedLocationOfPostInfo.iv,
                        authTag: encryptedLocationOfPostInfo.authTag
                    };
                }

                if('adInfo' in dataForEntirePost && !('adInfo' in updatedDataForEntirePost) &&
                !('adInfo' in updatedDataForEntirePost.$unset)) {
                    const infoOnEncryptedAdInfo = encryptTextWithAWSDataEncryptionKey(
                       JSON.stringify(dataForEntirePost.adInfo),
                        plaintextDataEncryptionKey
                    );
        
                    updatedDataForEntirePost.adInfo = infoOnEncryptedAdInfo.encryptedTextBuffer;
                    updatedDataForEntirePost.adInfoEncryptionInfo = {
                        iv: infoOnEncryptedAdInfo.iv,
                        authTag: infoOnEncryptedAdInfo.authTag
                    };
                }

                for(let slideNumber of slideNumbersOfPost) {
                    const slideInfo = slideNumberToInfoMappings[slideNumber];
                    const updatedSlideInfo = slideNumberToUpdatedInfoMappings[slideNumber];

                    if ('taggedAccounts' in slideInfo && !('taggedAccounts' in updatedSlideInfo)
                    && !('taggedAccounts' in updatedSlideInfo.$unset)) {
                        const encryptedTaggedAccountsInfo = encryptTextWithAWSDataEncryptionKey(
                            JSON.stringify(slideInfo.taggedAccounts),
                            plaintextDataEncryptionKey
                        );

                        slideNumberToUpdatedInfoMappings[slideNumber].taggedAccounts = encryptedTaggedAccountsInfo
                        .encryptedTextBuffer;
                        slideNumberToUpdatedInfoMappings[slideNumber].taggedAccountsEncryptionInfo = {
                            iv: encryptedTaggedAccountsInfo.iv,
                            authTag: encryptedTaggedAccountsInfo.authTag
                        };
                    }

                    if ('sections' in slideInfo && !('sections' in updatedSlideInfo)
                    && !('sections' in updatedSlideInfo.$unset)) {
                        const encryptedSectionsInfo = encryptTextWithAWSDataEncryptionKey(
                            JSON.stringify(slideInfo.sections),
                            plaintextDataEncryptionKey
                        );

                        slideNumberToUpdatedInfoMappings[slideNumber].sections = encryptedSectionsInfo
                        .encryptedTextBuffer;
                        slideNumberToUpdatedInfoMappings[slideNumber].sectionsEncryptionInfo = {
                            iv: encryptedSectionsInfo.iv,
                            authTag: encryptedSectionsInfo.authTag
                        };
                    }

                    if ('image' in slideInfo) {
                        const encryptedImageInfo = encryptFileBufferWithAWSDataEncryptionKey(
                            slideInfo.image,
                            plaintextDataEncryptionKey
                        );
            
                        slideNumberToUpdatedInfoMappings[slideNumber].image = encryptedImageInfo.encryptedFileBuffer;
                        slideNumberToUpdatedInfoMappings[slideNumber].imageEncryptionInfo = {
                            iv: encryptedImageInfo.iv,
                            authTag: encryptedImageInfo.authTag
                        };
                    }
                    else {
                        const encryptedVideoInfo = encryptFileBufferWithAWSDataEncryptionKey(
                            slideInfo.video,
                            plaintextDataEncryptionKey
                        );
            
                        slideNumberToUpdatedInfoMappings[slideNumber].video = encryptedVideoInfo.encryptedFileBuffer;
                        slideNumberToUpdatedInfoMappings[slideNumber].videoEncryptionInfo = {
                            iv: encryptedVideoInfo.iv,
                            authTag: encryptedVideoInfo.authTag
                        };
                    }
                }
            }
            catch (error) {
                errorMessage += `• There was trouble encrypting the data of this intended-to-be-private
                post.\n`;
                return res.status(500).send(errorMessage);;
            }
        }
        else {
            try {
                const decryptedPostAuthors = decryptTextWithAWSDataEncryptionKey(
                    dataForEntirePost.authors,
                    plaintextDataEncryptionKey,
                    dataForEntirePost.authorsEncryptionInfo.iv,
                    dataForEntirePost.authorsEncryptionInfo.authTag,
                );
                updatedDataForEntirePost.authors = JSON.parse(decryptedPostAuthors);
                updatedDataForEntirePost.$unset.authorsEncryptionInfo = "";

                if ('locationOfPost' in dataForEntirePost && !('locationOfPost' in updatedDataForEntirePost)
                && !('locationOfPost' in updatedDataForEntirePost.$unset)) {
                    updatedDataForEntirePost.locationOfPost = decryptTextWithAWSDataEncryptionKey(
                        dataForEntirePost.locationOfPost,
                        plaintextDataEncryptionKey,
                        dataForEntirePost.locationOfPostEncryptionInfo.iv,
                        dataForEntirePost.locationOfPostEncryptionInfo.authTag,
                    );
                    updatedDataForEntirePost.$unset.locationOfPostEncryptionInfo = "";
                }

                if ('adInfo' in dataForEntirePost && !('adInfo' in updatedDataForEntirePost)
                && !('adInfo' in updatedDataForEntirePost.$unset)) {
                    const decryptedAdInfo = decryptTextWithAWSDataEncryptionKey(
                        dataForEntirePost.adInfo,
                        plaintextDataEncryptionKey,
                        dataForEntirePost.authorsEncryptionInfo.iv,
                        dataForEntirePost.authorsEncryptionInfo.authTag,
                    );
                    updatedDataForEntirePost.adInfo = JSON.parse(decryptedAdInfo);
                    updatedDataForEntirePost.$unset.adInfoEncryptionInfo = "";
                }

                for(let slideNumber of slideNumbersOfPost) {
                    const slideInfo = slideNumberToInfoMappings[slideNumber];
                    const updatedSlideInfo = slideNumberToUpdatedInfoMappings[slideNumber];

                    if ('taggedAccounts' in slideInfo && !('taggedAccounts' in updatedSlideInfo)
                    && !('taggedAccounts' in updatedSlideInfo.$unset)) {
                        const decryptedTaggedAccounts = decryptTextWithAWSDataEncryptionKey(
                            slideInfo.taggedAccounts,
                            plaintextDataEncryptionKey,
                            slideInfo.taggedAccountsEncryptionInfo.iv,
                            slideInfo.taggedAccountsEncryptionInfo.authTag
                        );

                        slideNumberToUpdatedInfoMappings[slideNumber].taggedAccounts = JSON.parse(decryptedTaggedAccounts);
                        slideNumberToUpdatedInfoMappings[slideNumber].$unset.taggedAccountsEncryptionInfo = "";
                    }

                    if ('sections' in slideInfo && !('sections' in updatedSlideInfo)
                    && !('sections' in updatedSlideInfo.$unset)) {
                        const decryptedSections = decryptTextWithAWSDataEncryptionKey(
                            slideInfo.sections,
                            plaintextDataEncryptionKey,
                            slideInfo.sectionsEncryptionInfo.iv,
                            slideInfo.sectionsEncryptionInfo.authTag
                        );

                        slideNumberToUpdatedInfoMappings[slideNumber].sections = JSON.parse(decryptedSections);
                        slideNumberToUpdatedInfoMappings[slideNumber].$unset.sectionsEncryptionInfo = "";
                    }

                    if ('image' in slideInfo) {
                        const decryptedImageFileBuffer = decryptFileBufferWithAWSDataEncryptionKey(
                            slideInfo.image,
                            plaintextDataEncryptionKey,
                            slideInfo.imageEncryptionInfo.iv,
                            slideInfo.imageEncryptionInfo.authTag
                        );
            
                        slideNumberToUpdatedInfoMappings[slideNumber].image = decryptedImageFileBuffer;
                        slideNumberToUpdatedInfoMappings[slideNumber].$unset.imageEncryptionInfo = "";
                    }
                    else {
                        const decryptedVideoFileBuffer = decryptFileBufferWithAWSDataEncryptionKey(
                            slideInfo.video,
                            plaintextDataEncryptionKey,
                            slideInfo.videoEncryptionInfo.iv,
                            slideInfo.videoEncryptionInfo.authTag
                        );
            
                        slideNumberToUpdatedInfoMappings[slideNumber].video = decryptedVideoFileBuffer;
                        slideNumberToUpdatedInfoMappings[slideNumber].$unset.videoEncryptionInfo = "";
                    }
                }
            }
            catch (error) {
                errorMessage += `• There was trouble decrypting the data of this intended-to-be-public post.\n`;
                return res.status(500).send(errorMessage);;
            }
        }
    }

    try {
        if (dataForEntirePost.isOriginallyEncrypted !== isToBeEncrypted) {
            for (let postSlide of allSlidesOfPost) {
                await imageAndVideoSlidesOfPostsBucket.delete(postSlide._id);
                successMessage += `• The data associated with the image/video slide numbered ${postSlide.metadata.slideNumber} has been
                deleted successfully, and will be replaced shortly with its ${isToBeEncrypted ? 'encrypted' : 'unencrypted'}
                counterpart.\n`;
            }

            for(const slideNumber of slideNumbersOfPost) {
                const currSlideIsImage = slideNumberToInfoMappings[slideNumber].type === 'image';
                const updatedPostSlideMetadata = {};
                if (slideNumber == 0) {
                    for (let key of dataForEntirePost) {
                        if (key !== 'isOriginallyEncrypted') {
                            updatedPostSlideMetadata[key] = dataForEntirePost[key];
                        }
                    }
                    for (let key of updatedDataForEntirePost.$unset) {
                        delete updatedPostSlideMetadata[key];
                    }
                    for (let key of updatedDataForEntirePost) {
                        if (key !== '$unset') {
                            updatedPostSlideMetadata[key] = updatedDataForEntirePost[key];
                        }
                    }
                }

                for (let key of slideNumberToInfoMappings[slideNumber]) {
                    if (key !== '_id' && key !== 'type' && key !== 'image' && key !== 'video') {
                        updatedPostSlideMetadata[key] = slideNumberToInfoMappings[slideNumber][key];
                    }
                }
                for (let key of slideNumberToUpdatedInfoMappings[slideNumber].$unset) {
                    delete updatedPostSlideMetadata[key];
                }
                for (let key of slideNumberToUpdatedInfoMappings[slideNumber]) {
                    if (key !== '$unset') {
                        updatedPostSlideMetadata[key] = slideNumberToUpdatedInfoMappings[slideNumber][key];
                    }
                }

                let uploadStream = imageAndVideoSlidesOfPostsBucket.openUploadStream(
                    currSlideIsImage ? 'img' : 'vid',
                    {
                        metadata: updatedPostSlideMetadata
                    }
                );
                await uploadImageOrVideoSlide(
                    currSlideIsImage ? slideNumberToUpdatedInfoMappings[slideNumber].image :
                    slideNumberToUpdatedInfoMappings[slideNumber].video,
                    uploadStream
                );
                successMessage += `• Your desired updates to the image/video slide-data of this post have been applied successfully
                for slide number ${slideNumber}.\n`;
            }
        }
        else {
            for(const slideNumber of slideNumbersOfPost) {
                const slideInfo = slideNumberToInfoMappings[slideNumber];
                const updatedSlideInfo = slideNumberToUpdatedInfoMappings[slideNumber];

                if (slideNumber == 0 && (Object.keys(updatedDataForEntirePost).length > 1 ||
                Object.keys(updatedDataForEntirePost.$unset).length > 0 || Object.keys(updatedSlideInfo).length > 1 ||
                Object.keys(updatedSlideInfo.$unset).length > 0)) {
                    await imageAndVideoSlidesOfPostsDotFilesCollection.updateOne(
                        { 
                            _id: slideInfo._id
                        },
                        {
                            $set: {
                                ...Object.entries(updatedDataForEntirePost).map(([key, value]) => [`metadata.${key}`, value])
                                    .filter(([key]) => key !== "$unset"),
                                ...Object.entries(updatedSlideInfo).map(([key, value]) => [`metadata.${key}`, value])
                                    .filter(([key]) => key !== "$unset")
                            },
                            $unset: {
                                ...Object.entries(updatedDataForEntirePost.$unset).map(([key, value]) => [`metadata.${key}`,
                                    value]),
                                ...Object.entries(updatedSlideInfo.$unset).map(([key, value]) => [`metadata.${key}`, value])
                            }
                        }
                    );

                    successMessage += `• Your desired updates to the image/video slide-data of this post have been applied
                    successfully for slide number 0.\n`;              
                }

                else if (slideNumber > 0 && (Object.keys(updatedSlideInfo).length > 1 || Object.keys(updatedSlideInfo.$unset).length
                > 0))
                {
                    await imageAndVideoSlidesOfPostsDotFilesCollection.updateOne(
                        { 
                            _id: slideInfo._id
                        },
                        {
                            $set: { 
                                ...Object.entries(updatedSlideInfo).map(([key, value]) => [`metadata.${key}`, value])
                                    .filter(([key]) => key !== "$unset")
                            },
                            $unset: {
                                ...Object.entries(updatedSlideInfo.$unset).map(([key, value]) => [`metadata.${key}`, value])
                            }
                        }
                    );
                    successMessage += `• Your desired updates to the image/video slide-data of this post have been applied
                    successfully for slide number ${slideNumber}.\n`;
                }
            }
        }
    }
    catch (error) {
        errorMessage += `• There was trouble applying your desired updates to all the image/video slide-data of this post.\n`;

        if (successMessage.length == 0 ) {
            return res.status(500).send(errorMessage);
        }
        else {
            return res.status(500).send(
                'There was a mix of success and Errors in this API-request...\n' + 
                'Here are the Successes:\n' + successMessage +
                '& Here are the Errors:\n' + errorMessage
            );
        }
    }

    if (dataForEntirePost.isOriginallyEncrypted !== isToBeEncrypted) {
        const encryptionStatusUpdatedSuccessfullyForCaptionCommentsAndLikesOfPost = await
        toggleEncryptionStatusOfCaptionCommentsAndLikesOfPost(overallPostId, dataForEntirePost.isOriginallyEncrypted);
        
        if (encryptionStatusUpdatedSuccessfullyForCaptionCommentsAndLikesOfPost) {
            successMessage += `• The encryption-status has successfully been updated for the caption, comments, and
            likes of the post.\n`;
        }
        else {
            errorMessage += `• There was trouble updating the encryption-status for the caption, comments, and
            likes of the post.\n`;
            if (successMessage.length == 0 ) {
                return res.status(500).send(errorMessage);
            }
            else {
                return res.status(500).send(
                    'There was a mix of success and Errors in this API-request...\n' + 
                    'Here are the Successes:\n' + successMessage +
                    '& Here are the Errors:\n' + errorMessage
                );
            }

        }

        const encryptionStatusUpdatedSuccessfullyForBgMusicAndVidSubtitlesOfPost = await
        toggleEncryptionStatusOfBgMusicAndVidSubtitlesOfPost(overallPostId, dataForEntirePost.isOriginallyEncrypted);
        
        if (encryptionStatusUpdatedSuccessfullyForBgMusicAndVidSubtitlesOfPost) {
            successMessage += `• The encryption-status has successfully been updated for the subtitles and background-music
            of this post.\n`;
        }
        else {
            errorMessage += `• There was trouble updating the encryption-status for the subtitles and background-music
            of this post..\n`;
            if (successMessage.length == 0 ) {
                return res.status(500).send(errorMessage);
            }
            else {
                return res.status(500).send(
                    'There was a mix of success and Errors in this API-request...\n' + 
                    'Here are the Successes:\n' + successMessage +
                    '& Here are the Errors:\n' + errorMessage
                );
            }

        }
    }

    if (dataForEntirePost.isOriginallyEncrypted && !isToBeEncrypted) {
        try {
            await deleteAWSCustomerMasterKey(`post${overallPostId}`);
        }
        catch (error) {
            errorMessage += `• There was trouble scheduling-for-deletion the AWS Customer-Master-Key(CMK) used for encrypting/
            decrypting the Data-Encryption-Keys for the data of this post.\n`; 
        }
    }

    if ('slideNumbersToDelete' in req.body) {
        let slideNumbersToDeleteIsValid = true;
        try {
            let slideNumbersToDelete = JSON.parse(req.body.slideNumbersToDelete);
            const allSlideNumbers = new Set(slideNumbersOfPost);
            if (Array.isArray(slideNumbersToDelete)) {
                slideNumbersToDelete = slideNumbersToDelete.filter(slideNumber => slideNumber in allSlideNumbers);
                const setOfSlideNumbersToDelete = new Set(slideNumbersToDelete)
                if (setOfSlideNumbersToDelete.size == allSlideNumbers.length) {
                    errorMessage = `• If you would like to delete all the slides of this post, you must
                    use the '/deletePost' endpoint of this backend-server, instead of this '/updatePost' endpoint\n`;
                }
                else {
                    const sortedRemainingSlideNumbers = allSlideNumbers.filter(
                        slideNumber => !setOfSlideNumbersToDelete.has(slideNumber)
                    ).sort((a,b) => a-b);
                    const originalSlideNumbersToNewSlideNumberMappings = {};
                    for(let i=0; i<sortedRemainingSlideNumbers.length; i++) {
                        originalSlideNumbersToNewSlideNumberMappings[sortedRemainingSlideNumbers[i]] = i;
                    }

                    for (let slideNumber of slideNumbersOfPost) {
                        if (setOfSlideNumbersToDelete.has(slideNumber)) {
                            try {
                                await imageAndVideoSlidesOfPostsBucket.delete(slideNumberToInfoMappings[slideNumber]._id);
                                successMessage += `• There was success deleting one of the image/video slides of this post, specifically of the
                                post's slide number ${slideNumber}\n`;
                            }
                            catch (error) {
                                errorMessage += `• There was trouble deleting one of the image/video slides of this post, specifically of the
                                post's slide number ${slideNumber}\n`;
                                if (successMessage.length == 0 ) {
                                    return res.status(500).send(errorMessage);
                                }
                                else {
                                    return res.status(500).send(
                                        'There was a mix of success and Errors in this API-request...\n' + 
                                        'Here are the Successes:\n' + successMessage +
                                        '& Here are the Errors:\n' + errorMessage
                                    );
                                }
                            }
                        }
                        else {
                            const newSlideNumber = originalSlideNumbersToNewSlideNumberMappings[slideNumber];
                            const $set = {
                                "metadata.slideNumber": newSlideNumber,
                            };
                            const $unset = {};

                            if (slideNumber !== 0 && newSlideNumber == 0) {
                                for(const key of dataForEntirePost) {
                                    if (key !== 'isOriginallyEncrypted') {
                                        $set[`metadata.${key}`] = dataForEntirePost[key];
                                    }
                                }
                                for (let key of updatedDataForEntirePost.$unset) {
                                    delete $set[`metadata.${key}`];
                                }
                                for (let key of updatedDataForEntirePost) {
                                    if (key !== '$unset') {
                                        $set[`metadata.${key}`] = updatedDataForEntirePost[key];
                                    }
                                }
                            }
                            else if (slideNumber = 0 && newSlideNumber !== 0) {
                                for(const key of dataForEntirePost) {
                                    if (key !== 'isOriginallyEncrypted') {
                                        $unset[`metadata.${key}`] = dataForEntirePost[key];
                                    }
                                }
                            }

                            await imageAndVideoSlidesOfPostsDotFilesCollection.updateOne(
                                {
                                    _id: slideNumberToInfoMappings[slideNumber]._id
                                },
                                {
                                    $set: $set,
                                    $unset: $unset
                                }
                            );
                            successMessage += `• There was success updating the slide-number one of the non-deleted image/video slides of
                            this post, specifically of the post's slide number ${slideNumber}\n`;
                        }
                    }
                }
            }
            else {
                slideNumbersToDeleteIsValid = false;
            }
        }
        catch (error) {
            slideNumbersToDeleteIsValid = false;
        }

        if (!slideNumbersToDeleteIsValid) {
            errorMessage += `• The 'slideNumbersToDelete' parameter is only valid if its value is a stringified-list
            of the numbers of the slides you intend to delete. We received this value instead, which is invalid:
            ${req.body.slideNumbersToDelete}\n`;
        }
    }

    let captionWasSuccessfullyEdited = false;
    if ('caption' in req.body && typeof req.body.caption === 'string') {
        let { caption } = req.body;
        if (caption.length > 2200) {
            caption = caption.substring(0, 2197) + "...";
            errorMessage += `• The caption has been trimmed to be 2197 characters in length,
            followed by a '...' in the end\n`;
        }
        
        if (caption.length > 0) {
            captionWasSuccessfullyEdited = await editCaptionOfPost(authUserId, caption, overallPostId,
            isToBeEncrypted);
        }
        else {
            captionWasSuccessfullyEdited = await deleteCaptionOfPost(overallPostId, isToBeEncrypted);
        }

        if (captionWasSuccessfullyEdited) {
            successMessage += `• Your caption has been edited successfully\n`;
        }
        else {
            errorMessage += `• There was trouble editing your caption\n`;
        }
    }
    else if('caption' in req.body) {
        errorMessage += `• The caption must be a string that doesn't exceed 2200 characters in
        length. If you would like to unset the caption of this post, provide an empty string as the caption.\n`; 
    }

    let postBackgroundMusicWasSuccessfullyRemoved = false
    if ('removePostBackgroundMusic' in req.body) {
        postBackgroundMusicWasSuccessfullyRemoved = await removeBackgroundMusicFromPost(overallPostId, isToBeEncrypted);
        if (postBackgroundMusicWasSuccessfullyRemoved) {
            successMessage += `• Your post's background-music has been removed successfully\n`;
        }
        else {
            errorMessage += `• There was trouble removing your post's background-music\n`;
        }
    }

    let subtitleFilesWereSuccessfullyRemoved = false;
    if ('subtitleFilesToRemove' in req.body) {
        try {
            let subtitleFilesToRemove = JSON.parse(req.body.subtitleFilesToRemove);
            subtitleFilesToRemove = subtitleFilesToRemove.filter(subtitleFile => {
                if (subtitleFile.constructor == Object && 'langCode' in subtitleFile && 'slideNumber'
                in subtitleFile && listOfValidLangCodes.includes(subtitleFile.langCode) &&
                slideNumberToInfoMappings[subtitleFile.slideNumber].type === 'video') {
                    return true;
                }
                errorMessage += `• This specific subtitleFile in the list of subtitlesFileToRemove
                is invalid: ${JSON.stringify(subtitleFile)}\n`;
                return false;
            });
            if (subtitleFilesToRemove.length > 0) {
                subtitleFilesWereSuccessfullyRemoved = await removeSpecifiedVidSubtitleFilesFromPost(overallPostId,
                subtitleFilesToRemove, isToBeEncrypted);
                if (subtitleFilesWereSuccessfullyRemoved) {
                    successMessage += `• Your post's specified subtitle-files has been removed successfully\n`;
                }
                else {
                    errorMessage += `• There was trouble removing your post's specified subtitle-files\n`;
                }
            }
        }
        catch (error) {
            errorMessage += `• The subtitleFilesToRemove parameter must include a list of dicts that contain info
            on the subtitleFiles you would like to remove. Each dict must have two keys: langCode and slideNumber\n`;
        }
    }

    let backgroundMusicInfo = {};
    if ('backgroundMusicInfo' in req.body) {
        let backgroundMusicInfoIsValid = true;
        try {
            const bgMusicInfo = JSON.parse(req.body.backgroundMusicInfo);

            if (bgMusicInfo.constructor === Object) {
                if ('startTime' in  bgMusicInfo && !isNaN(bgMusicInfo.startTime) &&
                'endTime' in bgMusicInfo && !isNaN(bgMusicInfo.endTime) &&
                bgMusicInfo.startTime >= 0 && bgMusicInfo.endTime > bgMusicInfo.startTime) {
                    backgroundMusicInfo.startTime = bgMusicInfo.startTime;
                    backgroundMusicInfo.endTime = bgMusicInfo.endTime;
                }
                else {
                    backgroundMusicInfo.startTime = 0;
                    backgroundMusicInfo.endTIme = -1;
                }
    
                if ('title' in bgMusicInfo && typeof bgMusicInfo.title === 'string') {
                    backgroundMusicInfo.title = bgMusicInfo.title;
                }
                else {
                    backgroundMusicInfo.title = "Unknown Title"
                }
    
                if ('artist' in bgMusicInfo && typeof bgMusicInfo.artist === 'string') {
                    backgroundMusicInfo.artist = bgMusicInfo.artist;
                }
                else {
                    backgroundMusicInfo.artist = "Unknown Artist"
                }
            }
            else {
                backgroundMusicInfoIsValid = false;
            }
        }
        catch (error) {
            backgroundMusicInfoIsValid = false;
        }

        if (!backgroundMusicInfoIsValid) {
            errorMessage += `• The backgroundMusicInfo value must be a stringified dict that contains
            the key-value-pairs on info regarding the updated backgroundMusic of the post, if you plan on updating
            the background-music in this endpoint.\n`;
        }
    }

    const slideNumbersAndTheirUpdatedSubtitleFiles = {};
    for(const file of req.files) {
        if (file.fieldname === 'backgroundMusic' && file.mimetype.startsWith('audio/')) {
            backgroundMusicInfo.audio = file.buffer;
            if (Object.keys(backgroundMusicInfo).length == 1) {
                backgroundMusicInfo.startTime = 0;
                backgroundMusicInfo.endTime = -1;
                backgroundMusicInfo.title = 'Unknown Title';
                backgroundMusicInfo.artist = 'Unknown Artist';
            }
        }
        else if (file.fieldname.startsWith('subtitleFileForVidAtSlideNumber=') && file.mimetype === 'text/vtt') {
            const indexOfAndLangCode = file.fieldname.indexOf('&langCode=');
            const slideNumber = Number(file.fieldname.substring(32, indexOfAndLangCode));

            let subtitlesFileIsDefault;
            let langCode;
            if (file.fieldname.endsWith('&isDefault')) {
                subtitlesFileIsDefault = true;
                langCode = file.fieldname.substring(indexOfAndLangCode+10, file.fieldname.indexOf('&isDefault'));
            }
            else {
                subtitlesFileIsDefault = false;
                langCode = file.fieldname.substring(indexOfAndLangCode+10);
            }

            if (!isNaN(slideNumber) && slideNumber in slideNumberToInfoMappings && slideNumberToInfoMappings[slideNumber].type ===
            'video' && listOfValidLangCodes.includes(langCode)) {
                if (!(slideNumber in slideNumbersAndTheirUpdatedSubtitleFiles)) {
                    slideNumbersAndTheirUpdatedSubtitleFiles[slideNumber] = {};
                }
            
                slideNumbersAndTheirUpdatedSubtitleFiles[slideNumber][langCode] = {
                    data: file.buffer
                };

                if (subtitlesFileIsDefault) {
                    slideNumbersAndTheirUpdatedSubtitleFiles[slideNumber][langCode].isDefault = true;
                }
            }
            else {
                errorMessage += `• Expected a file fieldname structured like the following, with a valid
                langCode and slideNumber of a video in the post: 'subtitleFileForVidAtSlideNumber=3&langCode=en&isDefault'
                (&isDefault is present in the end of the file fieldname is the subtitles-file is intended to be
                the default one for its video-slide). Instead, this is what was received: ${JSON.stringify(file.fieldname)}\n`;
            }
        }
        else {
            errorMessage += `• For this endpoint, any files you submit must meet the following requirements:
            is an audio file with the fieldname 'backgroundMusic'. OR it is a text/vtt subtitles-file with
            the fieldname structured as such- 'subtitleFileForVidAtSlideNumber=3&langCode=en&isDefault'. For
            clarification, if you do not want to set the subtitle-file as the default one of the vid-slide, simply omit the
            '&isDefault' part in the end of the fieldname\n`;
        }
    }

    let backgroundMusicWasSuccessfullyUpdated = false;
    if ('data' in backgroundMusicInfo) {
        backgroundMusicWasSuccessfullyUpdated = await updateBackgroundMusicOfPost(backgroundMusicInfo, overallPostId,
        isToBeEncrypted);

        if (backgroundMusicWasSuccessfullyUpdated) {
            successMessage += `• The background-music of this post has successfully been updated.\n`;
        }
        else {
            errorMessage += `• There was trouble updating the background-music of this post\n`;
        }
    }


    let vidSubtitleFilesWereSuccessfullyUpdated = false;
    if (Object.keys(slideNumbersAndTheirUpdatedSubtitleFiles).length > 0) {
        vidSubtitleFilesWereSuccessfullyUpdated = await addVidSubtitleFilesToPost(slideNumbersAndTheirUpdatedSubtitleFiles,
        overallPostId, isToBeEncrypted)

        if (vidSubtitleFilesWereSuccessfullyUpdated) {
            successMessage += `• The subtitle-files of this post has successfully been added. Keep in mind,,
            however, that each vid-slide can have a maximum of 20 subtitle-files. Therefore, depending on
            the number of subtitle-files you added for any given slide, some files may have not been added.\n`;
        }
        else {
            errorMessage += `• There was trouble updating the subtitle-files of this post.\n`;
        }
    }

    if (errorMessage.length == 0) {
        return res.send(successMessage);
    }
    return res.status(500).send(
        'There was a mix of success and Errors in this API-request...\n' + 
        'Here are the Successes:\n' + successMessage +
        '& Here are the Errors:\n' + errorMessage
    );
}); 


app.delete('/deletePost/:authUserId/:overallPostId', threePerMinuteRateLimiter, async (req, res) => {
    const { authUserId, overallPostId } = req.params;
    const userTokenValidationResult = validateUserAuthToken(authUserId, req.cookies);
    
    if (userTokenValidationResult instanceof Date) {
        const refreshedAuthToken = refreshUserAuthToken(authUserId);
        if (refreshedAuthToken!==null) {
            res.cookie(`authToken${authUserId}`, refreshedAuthToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                expires: userTokenValidationResult
            });
        }
    }
    else if (userTokenValidationResult === 'Forbidden'){
        return res.sendStatus(401);
    }

    const overallPostIdObject = new ObjectId(overallPostId);
    let slidesToDelete = await imageAndVideoSlidesOfPostsDotFilesCollection.find(
        { "metadata.overallPostId": overallPostIdObject }
    ).toArray();

    let isEncrypted = false;

    if (slidesToDelete.length > 0) {
        for (let slideToDelete of slidesToDelete) {
            if ('authors' in slideToDelete.metadata) {
                let authors = slideToDelete.metadata.authors;
                if ('authorsEncryptionInfo' in slideToDelete.metadata) {
                    isEncrypted = true;
                    const { encryptedDataEncryptionKey } = slideToDelete.metadata.authorsEncryptionInfo;
                    const decryptResponse = await awsKMSClient.send(new DecryptCommand({
                        CiphertextBlob: encryptedDataEncryptionKey,
                    }));
                    const plaintextDataEncryptionKey = decryptResponse.Plaintext;

                    const decryptedAuthors = decryptTextWithAWSDataEncryptionKey(
                        authors,
                        plaintextDataEncryptionKey,
                        slideToDelete.metadata.authorsEncryptionInfo.iv,
                        slideToDelete.metadata.authorsEncryptionInfo.authTag,    
                    )
                    authors = JSON.parse(decryptedAuthors);
                }
                if (!authors.includes(authUserId)) {
                    return res.status(401).send('You are not one of the authors of this post');
                }
                break;
            }
        }
    }
    else {
        return res.send({
            postWasFound: false
        });
    }

    let successMessage = "• The post you are trying to delete has been found successfully.\n";
    let errorMessage = "";
    try {
        for (let slideToDelete of slidesToDelete) {
            await imageAndVideoSlidesOfPostsBucket.delete(slideToDelete._id);
        }
        successMessage += '• There was success deleting all the image and video slide-data of this post\n';
    }
    catch (error) {
        errorMessage += '• There was trouble deleting all the image and video slide-data of this post.\n'
        return res.status(500).send(errorMessage);;
    }

    const captionCommentsAndLikesWereSuccessfullyRemoved = await removeCaptionCommentsAndLikesOfPostAfterDeletingPost(
        overallPostId, isEncrypted
    );
    if (captionCommentsAndLikesWereSuccessfullyRemoved) {
        successMessage += `• The caption, comments and likes of your post has been removed successfully.\n`;
    }
    else {
        errorMessage = `• There was trouble remioving the caption, comments, and likes of your post.\n`;
        return res.status(500).send(
            'There was a mix of success and Errors in this API-request...\n' + 
            'Here are the Successes:\n' + successMessage +
            '& Here are the Errors:\n' + errorMessage
        );
    }

    const vidSubtitlesAndBgMusicWereSuccessfullyRemoved = await removeBgMusicAndVidSubtitlesFromPost(
        overallPostId, isEncrypted
    );
    if (vidSubtitlesAndBgMusicWereSuccessfullyRemoved) {
        successMessage += `• The vid-subtitles and background-music of your post has been removed successfully from the
        database.\n`;
    }
    else {
        errorMessage = `• There was trouble removing the vid-subtitles and background-music of your post from the
        database.\n`;
        return res.status(500).send(
            'There was a mix of success and Errors in this API-request...\n' + 
            'Here are the Successes:\n' + successMessage +
            '& Here are the Errors:\n' + errorMessage
        );
    }

    if (errorMessage.length == 0) {
        return res.send(successMessage);
    }
    else {
        return res.status(500).send(
            'There was a mix of success and Errors in this API-request...\n' + 
            'Here are the Successes:\n' + successMessage +
            '& Here are the Errors:\n' + errorMessage
        );
    }
});


app.get('/authenticateUser/:authUserId', userAuthenticationRateLimiter, async (req, res) => {
    const { authUserId } = req.params;
    const userTokenValidationResult = validateUserAuthToken(authUserId, req.cookies);

    if (userTokenValidationResult === 'Allowed') {
        return res.sendStatus(200);
    }
    
    if (userTokenValidationResult instanceof Date) {
        const refreshedAuthToken = refreshUserAuthToken(authUserId);

        if (refreshedAuthToken!==null) {
            res.cookie(`authToken${authUserId}`, refreshedAuthToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                expires: userTokenValidationResult
            });
           return res.send(
                'Your expired auth-token has been refreshed by your valid refresh-token'
            );
        }
        return res.send(
            `Your auth-token is expired and there was trouble refreshing it at the moment, but your
            refresh-token is valid`
        );
    }

    return res.sendStatus(401);
});


app.patch('/logout/:authUserId', threePerMinuteRateLimiter, async (req, res) => {
    const { authUserId } = req.params;

    res.cookie(`authToken${authUserId}`, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 0
    });
    res.cookie(`refreshToken${authUserId}`, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 0
    });

    res.sendStatus(200);
});


app.get('/getAuthorsAndEncryptionStatusOfPost/:overallPostId', async (req, res) => {
    const { overallPostId } = req.params;
    let authorsOfPost = [];
    let isEncrypted = false;

    try
    {
        const authorsAndIsEncryptedOfPost = await imageAndVideoSlidesOfPostsDotFilesCollection.findOne(
            {
                "metadata.overallPostId": overallPostId,
                "metadata.slideNumber": 0
            },
            {
                projection: {
                    "metadata.authors": 1,
                    "metadata.authorsEncryptionInfo": 1
                }
            }
        );

        if (authorsAndIsEncryptedOfPost == null)
        {
            return res.status(404).send(
                "You are trying to fetch the authors and encryption-status of a post that does not exist"
            );
        }
        authorsOfPost = authorsAndIsEncryptedOfPost.metadata.authors;
        if ('authorsEncryptionInfo' in authorsAndIsEncryptedOfPost.metadata)
        {
            isEncrypted = true;
            const { encryptedDataEncryptionKey, iv, authTag } = authorsAndIsEncryptedOfPost.metadata.authorsEncryptionInfo;
            let plaintextDataEncryptionKey;
            let plaintextDataEncryptionKeyWasFound = true;

            try
            {
                const decryptResponse = await awsKMSClient.send(new DecryptCommand({
                    CiphertextBlob: encryptedDataEncryptionKey,
                }));
                plaintextDataEncryptionKey = decryptResponse.Plaintext;
            }
            catch (error)
            {
                plaintextDataEncryptionKeyWasFound = false;
            }
            
            if (plaintextDataEncryptionKeyWasFound)
            {
                const authorsAsString = decryptTextWithAWSDataEncryptionKey(
                    authorsOfPost,
                    plaintextDataEncryptionKey,
                    iv,
                    authTag
                );
                authorsOfPost = JSON.parse(authorsAsString);
            }
            else
            {
                return res.status(500).send(
                    `There was trouble getting the plaintextDataEncryptionKey that is needed to get the authors of this
                    encrypted post`
                );
            }
        }

        return res.send({
            authorsOfPost,
            isEncrypted
        });
    }
    catch
    {
        return res.status(500).send(
            "There was trouble in the process of fetching the authors and encryptionStatus of the post"
        );
    }
});


app.post('/getTheOverallPostIdsOfEachUserInList/:postsFromAtMostThisManyMonthsAgo/:allUsersArePublic', async (req, res) => {
    const { postsFromAtMostThisManyMonthsAgo, allUsersArePublic } = req.params;
    const { listOfUserIds } = req.body;
    const setOfUsersInList = new Set(listOfUserIds);

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - postsFromAtMostThisManyMonthsAgo);

    const relevantInfoOfEachPost = await imageAndVideoSlidesOfPostsDotFilesCollection.find(
        {
            "metadata.slideNumber": 0,
            "metadata.datetimeOfPost": { $gte: cutoffDate }
        },
        {
            projection: {
                "metadata.overallPostId": 1,
                "metadata.authors": 1,
                "metadata.authorsEncryptionInfo": 1
            }
        }
    ).toArray();
    
    const overallPostIdsAndTheirAuthors = {};
    let errorMessage = "";

    for(let relevantPostInfo of relevantInfoOfEachPost)
    {
        let postIsEncrypted = 'authorsEncryptionInfo' in relevantPostInfo.metadata;

        if (postIsEncrypted && allUsersArePublic)
        {
            continue;
        }

        const { overallPostId, authorsEncryptionInfo } = relevantPostInfo.metadata;
        let { authors } = relevantPostInfo.metadata;
        let plaintextDataEncryptionKeyWasFound = true;
        
        if (postIsEncrypted)
        {
            const { encryptedDataEncryptionKey, iv, authTag } = authorsEncryptionInfo;
            let plaintextDataEncryptionKey;
            try
            {
                const decryptResponse = await awsKMSClient.send(new DecryptCommand({
                    CiphertextBlob: encryptedDataEncryptionKey,
                }));
                plaintextDataEncryptionKey = decryptResponse.Plaintext;
            }
            catch (error)
            {
                plaintextDataEncryptionKeyWasFound = false;
            }
            
            if (plaintextDataEncryptionKeyWasFound)
            {
                const decryptedAuthors = decryptTextWithAWSDataEncryptionKey(
                    authors,
                    plaintextDataEncryptionKey,
                    iv,
                    authTag
                );
                authors = JSON.parse(decryptedAuthors);
            }
            else
            {
                errorMessage += `• There was trouble getting the plaintextDataEncryptionKey that is needed
                to get the authors of the post ${overallPostId}, which may or may not have authors
                that are in the list.\n`;
            }
        }
        
        if (!postIsEncrypted || (postIsEncrypted && plaintextDataEncryptionKeyWasFound))
        {
            authors = authors.filter(
                author => setOfUsersInList.has(author)
            );
            if (authors.length > 0)
            {
                overallPostIdsAndTheirAuthors[overallPostId] = authors;
            }
        }
    }

    res.send({
        errorMessage: errorMessage,
        overallPostIdsAndTheirAuthors: overallPostIdsAndTheirAuthors
    });
});


app.post('/getTheOverallPostIdsOfEverySponsoredPostThatAuthUserCanView/:postsFromAtMostThisManyMonthsAgo',
async (req, res) => {
    const { postsFromAtMostThisManyMonthsAgo } = req.params;
    const { authUserFollowings, authUserBlockings } = req.body;
    const setOfAuthUserFollowings = new Set(authUserFollowings);
    const setOfAuthUserBlockings = new Set(authUserBlockings);

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - postsFromAtMostThisManyMonthsAgo);

    const relevantInfoOfEachPost = await imageAndVideoSlidesOfPostsDotFilesCollection.find(
        {
            "metadata.slideNumber": 0,
            "metadata.datetimeOfPost": { $gte: cutoffDate }
        },
        {
            projection: {
                "metadata.overallPostId": 1,
                "metadata.authors": 1,
                "metadata.authorsEncryptionInfo": 1,
                "metadata.adInfo": 1
            }
        }
    ).toArray();
    
    const overallPostIdsAndTheirAuthors = {};
    let errorMessage = "";

    for(let relevantPostInfo of relevantInfoOfEachPost)
    {
        let postIsSponsored = 'adInfo' in relevantInfoOfEachPost.metadata;
        if (!postIsSponsored)
        {
            continue;
        }

        let postIsEncrypted = 'authorsEncryptionInfo' in relevantPostInfo.metadata;

        const { overallPostId, authorsEncryptionInfo } = relevantPostInfo.metadata;
        let { authors } = relevantPostInfo.metadata;
        let plaintextDataEncryptionKeyWasFound = true;
        
        if (postIsEncrypted)
        {
            const { encryptedDataEncryptionKey, iv, authTag } = authorsEncryptionInfo;
            let plaintextDataEncryptionKey;
            try
            {
                const decryptResponse = await awsKMSClient.send(new DecryptCommand({
                    CiphertextBlob: encryptedDataEncryptionKey,
                }));
                plaintextDataEncryptionKey = decryptResponse.Plaintext;
            }
            catch (error)
            {
                plaintextDataEncryptionKeyWasFound = false;
            }
            
            if (plaintextDataEncryptionKeyWasFound)
            {
                const authorsAsString = decryptTextWithAWSDataEncryptionKey(
                    authors,
                    plaintextDataEncryptionKey,
                    iv,
                    authTag
                );
                authors = JSON.parse(authorsAsString);
            }
            else
            {
                errorMessage += `• There was trouble getting the plaintextDataEncryptionKey that is needed
                to get the authors of the post ${overallPostId}. The authors of the post is required
                to see if the user has access to this sponsored post.\n`;
            }
        }
        
        if (!postIsEncrypted || (postIsEncrypted && plaintextDataEncryptionKeyWasFound))
        {
            if (postIsEncrypted)
            {
                let authorFollowsAtLeastOneAuthorOfPost = false;
                for(let author of authors) {
                    if (setOfAuthUserFollowings.has(author)) {
                        authorFollowsAtLeastOneAuthorOfPost = true;
                        break;
                    }
                }

                if (!authorFollowsAtLeastOneAuthorOfPost) {
                    continue;
                }
            }
            else
            {
                let authorIsBlockedByEachAuthorOfPost = true;
                for(let author of authors) {
                    if (!setOfAuthUserBlockings.has(author)) {
                        authorIsBlockedByEachAuthorOfPost = false;
                        break;
                    }
                }

                if (authorIsBlockedByEachAuthorOfPost) {
                    continue;
                }
            }

            authors = authors.filter(
                author => !setOfAuthUserBlockings.has(author)
            );

            if (authors.length > 0)
            {
                overallPostIdsAndTheirAuthors[overallPostId] = authors;
            }
        }
    }

    res.send({
        errorMessage: errorMessage,
        overallPostIdsAndTheirAuthors: overallPostIdsAndTheirAuthors
    });
});


async function validateUserAuthToken(userId, requestCookies) {
    const userAuthTokenCookie = `authToken${userId}`;
    const userRefreshTokenCookie = `refreshToken${userId}`;

    if (!(userAuthTokenCookie in requestCookies)) {
        return 'Forbidden';
    }

    let correctUserToken = null;
    try {
        const [results] = await gcMySQLSpannerDatabase.run({
            sql: "SELECT * FROM userAuthTokens WHERE userId = @userId",
            params: {
                userId: userId
            },
            types: {
                userId: 'int64'
            }
        });

        if (results.length === 0) {
            return 'Forbidden';
        }

        const columnNamesInCorrectOrder = [
            "userId", "hashedAuthToken", "authTokenSalt", "hashedRefreshToken",
            "refreshTokenSalt", "authTokenExpiry", "refreshTokenExpiry"
        ];

        correctUserToken = Object.fromEntries(columnNamesInCorrectOrder.map((key, index) =>
        [key, results[0][index]]));

        correctUserToken["authTokenExpiry"] = new Date(correctUserToken["authTokenExpiry"]);
    }
    catch (error) {
        return 'Forbidden';
    }

    const userAuthTokenCookieVal = requestCookies[userAuthTokenCookie];

    const providedHashedSaltedToken = hashSaltedToken(
        userAuthTokenCookieVal, correctUserToken['authTokenSalt']
    );

    if (correctUserToken['hashedAuthToken'] === providedHashedSaltedToken &&
    correctUserToken['authTokenExpiry'] > new Date()) {
        return 'Allowed';
    }

    if (correctUserToken['hashedAuthToken'] === providedHashedSaltedToken) {
        if (userRefreshTokenCookie in requestCookies) {
            const userRefreshTokenCookieVal = requestCookies[userRefreshTokenCookie];

            correctUserToken["refreshTokenExpiry"] = new Date(correctUserToken["refreshTokenExpiry"]);

            if (correctUserToken['hashedRefreshToken'] === hashSaltedToken(userRefreshTokenCookieVal,
            correctUserToken['refreshTokenSalt']) && correctUserToken['refreshTokenExpiry'] > new Date()) {
                return correctUserToken['refreshTokenExpiry'];
            }
        }
    }

    return 'Forbidden';
}


async function refreshUserAuthToken(userId) {
    const newAuthToken = generateToken(100);
    const newAuthTokenSalt = generateToken(32);
    const newAuthTokenExpiry = new Date(Date.now() + 45 * 60 * 1000);

    const query = {
        sql: `
            UPDATE userAuthTokens
            SET authTokenSalt = @newAuthTokenSalt,
                hashedAuthToken = @newHashedAuthToken,
                authTokenExpiry = @newAuthTokenExpiry
            WHERE userId = @userId
        `,
        params: {
            newAuthTokenSalt: newAuthTokenSalt,
            newHashedAuthToken: hashSaltedToken(newAuthToken, newAuthTokenSalt),
            newAuthTokenExpiry: newAuthTokenExpiry,
            userId: userId
        }
    };

    try {
        const refreshWasSuccessful = await gcMySQLSpannerDatabase.runTransaction(
            async (err, transaction) => {
                if (err) {
                    return false;
                }
                await transaction.runUpdate(query);
                await transaction.commit();
                return true;
            }
        );

        if (refreshWasSuccessful) {
            return newAuthToken;
        }
        return null;
    }
    catch (error) {
        return null;
    }
}


function hashSaltedToken(token, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(token + salt, 'utf-8');
    const hashedBytes = hash.digest();
    return Buffer.from(hashedBytes).toString('base64');
}


function generateToken(byteLength) {
    return crypto.randomBytes(byteLength).toString('base64');
}


async function getIsPrivateStatusesOfListOfUsers(authUserId, userIds) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                query:  `query getIsPrivateStatuses($authUserId: Int!, $userIds: [Int!]!) {
                    getIsPrivateStatusesOfList(authUserId: $authUserId, userIds: $userIds)
                }`,
                variables: {
                    authUserId: authUserId,  
                    userIds: userIds  
                }
            })
        });
        if (!response.ok) {
            return `The server had trouble getting the isPrivate and existence statuses of the users in
            the list ${JSON.stringify(userIds)}.`
        }
        else {
            let isPrivateStatusesOfList = await response.json();
            return isPrivateStatusesOfList = isPrivateStatusesOfList.data.getIsPrivateStatusesOfList;
        }
    }
    catch (error) {
        return `There was trouble connecting to the server to get the isPrivate and existence statuses of
        the users in the list ${JSON.stringify(userIds)}.`
    }
}


async function uploadImageOrVideoSlide(vidFileBuffer, uploadStream) {
    return new Promise((resolve, reject) => {
        const fileStream = Readable.from(vidFileBuffer);

        fileStream.pipe(uploadStream)
            .on("error", reject)
            .on("finish", () => {
                resolve(uploadStream.id);
            });
    });
}


async function getValidatedImageSlideTaggedAccounts(authUserId, taggedAccounts) {
    if (Array.isArray(taggedAccounts)) {
        const userIdToTaggedAccountPositionMappings = {};
        for(const taggedAccount of taggedAccounts) {
            if (Array.isArray(taggedAccount) && taggedAccount.length==3 && !isNaN(taggedAccount[0]) &&
            !isNaN(taggedAccount[1]) && !isNaN(taggedAccount[2]) && taggedAccount[0] > 0 &&
            taggedAccount[1] >= 0 && taggedAccount[2] >= 0 && taggedAccount[1] <= 100 &&
            taggedAccount[2] <= 100 && taggedAccount[0] % 1 == 0) {
                userIdToTaggedAccountPositionMappings[taggedAccount[0]] = [taggedAccount[1], taggedAccount[2]];
            }
        }

        if (Object.keys(userIdToTaggedAccountPositionMappings).length > 0) {
            try {
                const response = await fetch(
                `http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        query:  `query getValidUserIds($authUserId: Int!, $userIds: [Int!]!) {
                            getTheUserIdsThatExistInList(authUserId: $authUserId, userIds: $userIds)
                        }`,
                        variables: {
                            authUserId: authUserId,  
                            userIds: userIdToTaggedAccountPositionMappings  
                        }
                    })
                });
                if (!response.ok) {
                    return `The server had trouble validating the existence of the userIds in this list:
                    ${JSON.stringify(taggedAccounts)}. For context, this list was provided as the taggedAccounts
                    for one of the image-slides.`;
                }

                let validUsers = await response.json();
                validUsers = validUsers.data.getTheUserIdsThatExistInList;
                const validatedTaggedAccounts = [];

                for (let validUser of validUsers) {
                    const validUsersTaggedAccountPosition = userIdToTaggedAccountPositionMappings[validUser];
                    validatedTaggedAccounts.push(
                        [validUser, validUsersTaggedAccountPosition[0], validUsersTaggedAccountPosition[1]]
                    );
                    if (validatedTaggedAccounts.length == 20) {
                        break;
                    }
                }
                return validatedTaggedAccounts;
            }
            catch (error) {
                return `There was trouble connecting to the server to validate the existence
                of the userIds in this list: ${JSON.stringify(taggedAccounts)}. For context, this list was
                provided as the taggedAccounts for one of the image-slides.`;
            }
        }
        return [];
    }

    return `The provided tagged-accounts for one of the image-slides is in the wrong format. Expected
    a list of lists of lists, with each innermost list containing three elements in this order: 
    a userId, the x-coordinate of the tag, the y-coordinate of the tag.
    Got: ${JSON.stringify(taggedAccounts)}`;
}


async function getValidatedVideoSlideTaggedAccounts(authUserId, taggedAccounts) {
    if (Array.isArray(taggedAccounts)) {
        const potentiallyValidTaggedAccounts = taggedAccounts.filter(x => !isNaN(x) && x>0 && x%1==0);
        if (potentiallyValidTaggedAccounts.length==0) {
            return [];
        }

        try {
            const response = await fetch(
            `http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    query:  `query getValidUserIds($authUserId: Int!, $userIds: [Int!]!) {
                        getTheUserIdsThatExistInList(authUserId: $authUserId, userIds: $userIds)
                    }`,
                    variables: {
                        authUserId: authUserId,  
                        userIds: potentiallyValidTaggedAccounts  
                    }
                })
            });
            if (!response.ok) {
                return `The server had trouble validating the existence of the userIds in this list:
                ${JSON.stringify(taggedAccounts)}. For context, this list was provided as the taggedAccounts
                for one of the video-slides.`;
            }
            let validatedTaggedAccounts = await response.json();

            validatedTaggedAccounts = validatedTaggedAccounts.data.getTheUserIdsThatExistInList;
            return validatedTaggedAccounts.slice(0,20);
        }
        catch (error) {
            return `There was trouble connecting to the server to validate the existence
            of the userIds in this list: ${JSON.stringify(taggedAccounts)}. For context, this list was
            provided as the taggedAccounts for one of the video-slides.`;
        }
    }

    return `The provided tagged-accounts for one of the video-slides is in the wrong format. Expected
    a list of user-ids. Got: ${JSON.stringify(taggedAccounts)}`;
}


function validateSections(sections) {
    if (!Array.isArray(sections)) return false;

    let prevEnd = -1;

    for (const section of sections) {
        if (!Array.isArray(section) || section.length !== 3) return false;

        const [start, end, label] = section;

        if (typeof start !== 'number' || typeof end !== 'number' || typeof label !== 'string') {
            return false;
        }

        if (start < 0 || end < 0 || start >= end) return false;

        if (start <= prevEnd) return false;

        prevEnd = end;
    }

    return true;
}


async function addCaptionToPost(authUserId, captionContent, overallPostId, isEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/addCaptionToPost
        /${authUserId}/${overallPostId}/${isEncrypted}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: captionContent,
            })
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function editCaptionOfPost(authUserId, newCaptionContent, overallPostId, isEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/editCaptionOfPost
        /${authUserId}/${overallPostId}/${isEncrypted}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                newContent: newCaptionContent
            })
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function toggleEncryptionStatusOfCaptionCommentsAndLikesOfPost(overallPostId, originallyIsEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/toggleEncryptionStatusOfCaptionCommentsAndLikesOfPost
        /${overallPostId}/${originallyIsEncrypted}`, {
            method: 'PATCH'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function deleteCaptionOfPost(overallPostId, isEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/deleteCaptionOfPost/${overallPostId}/${isEncrypted}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function removeCaptionCommentsAndLikesOfPostAfterDeletingPost(overallPostId, wasEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1
        /removeCaptionCommentsAndLikesOfPostAfterItsDeletion/${overallPostId}/${wasEncrypted}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function addBackgroundMusicToPost(backgroundMusicInfo, overallPostId, isEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/addBgMusicToPost/${overallPostId}/${isEncrypted}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                bgMusicAudioFileBuffer: backgroundMusicInfo.audio,
                startTime: backgroundMusicInfo.startTime,
                endTime: backgroundMusicInfo.endTime,
                title: backgroundMusicInfo.title,
                artist: backgroundMusicInfo.artist,
            })
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function updateBackgroundMusicOfPost(backgroundMusicInfo, overallPostId, isEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/updateBgMusicOfPost/${overallPostId}/${isEncrypted}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                bgMusicAudioFileBuffer: backgroundMusicInfo.audio,
                startTime: backgroundMusicInfo.startTime,
                endTime: backgroundMusicInfo.endTime,
                title: backgroundMusicInfo.title,
                artist: backgroundMusicInfo.artist,
            })
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function removeBgMusicAndVidSubtitlesFromPost(overallPostId, isEncrypted) {
    try {
        const response = await fetch(`
        http://34.111.89.101/api/Home-Page/laravelBackend1/removeBgMusicAndVidSubtitlesFromPostAfterItsDeletion
        /${overallPostId}/${isEncrypted}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function addVidSubtitleFilesToPost(vidSlideNumbersAndTheirSubtitleFiles, overallPostId, isToBeEncrypted) {
    try {
        const vidSubtitleFilesToAdd = [];
        for(let slideNumber of Object.keys(vidSlideNumbersAndTheirSubtitleFiles)) {
            for(let langCode of Object.keys(vidSlideNumbersAndTheirSubtitleFiles[slideNumber])) {
                const vidSubtitlesInfo = vidSlideNumbersAndTheirSubtitleFiles[slideNumber][langCode];
                
                const newVidSubtitlesElement = {
                    slideNumber: slideNumber,
                    langCode: langCode,
                    subtitles: vidSubtitlesInfo.data
                };

                if ('isDefault' in vidSubtitlesInfo) {
                    newVidSubtitlesElement.default = true;
                }
                vidSubtitleFilesToAdd.push(newVidSubtitlesElement);
            }
        }

        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/addVidSubtitleFilesToPost/${overallPostId}/${isToBeEncrypted}`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                vidSubtitleFilesToAdd: vidSubtitleFilesToAdd
            })
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function toggleEncryptionStatusOfBgMusicAndVidSubtitlesOfPost(overallPostId, originallyIsEncrypted) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/toggleEncryptionStatusOfBgMusicAndVidSubtitlesOfPost
        /${overallPostId}/${originallyIsEncrypted}`, {
            method: 'PATCH'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function removeSpecifiedVidSubtitleFilesFromPost(overallPostId, subtitleFilesToRemove, isEncrypted) {
    const slideNumberToListOfLangCodesToRemoveMappings = {};

    for(let subtitleFile of subtitleFilesToRemove) {
        const subtitleSlideNumber = subtitleFile['slideNumber'];
        const subtitleLangCode = subtitleFile['langCode'];

        if (!(subtitleSlideNumber in slideNumberToListOfLangCodesToRemoveMappings)) {
            slideNumberToListOfLangCodesToRemoveMappings[subtitleSlideNumber] = [];
        }

        slideNumberToListOfLangCodesToRemoveMappings[subtitleSlideNumber].push(subtitleLangCode);
    }

    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/removeSpecifiedVidSubtitleFilesFromPost/
        ${overallPostId}/${isEncrypted}`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                slideNumberToListOfLangCodesToRemoveMappings: slideNumberToListOfLangCodesToRemoveMappings
            })
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function addEncryptionInfoForCaptionCommentsAndLikesOfNewlyUploadedEncryptedPost(overallPostId) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1
        /addEncryptionInfoForCaptionCommentsAndLikesOfNewlyUploadedEncryptedPost/${overallPostId}`, {
            method: 'POST'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost(overallPostId) {
    try {
        const response = await fetch(
        `http://34.111.89.101/api/Home-Page/laravelBackend1/addEncryptionInfoForBgMusicAndVidSubsOfNewlyUploadedEncryptedPost
        /${overallPostId}`, {
            method: 'POST'
        });
        if (!response.ok) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}


async function createNewAWSCustomerMasterKey(description, keyAlias) {
    const createKeyCommand = new CreateKeyCommand({
        Description: description,
        KeyUsage: "ENCRYPT_DECRYPT",
        CustomerMasterKeySpec: "SYMMETRIC_DEFAULT",
    });

    const keyResponse = await awsKMSClient.send(createKeyCommand);
    const keyId = keyResponse.KeyMetadata.KeyId;

    const aliasCommand = new CreateAliasCommand({
        AliasName: `alias/${keyAlias}`,
        TargetKeyId: keyId
    });

    await awsKMSClient.send(aliasCommand);
}

async function deleteAWSCustomerMasterKey(awsCustomerMasterKeyAlias) {
    const params = {
        KeyId: `alias/${awsCustomerMasterKeyAlias}`,
        PendingWindowInDays: 7
    };

    const command = new ScheduleKeyDeletionCommand(params);
    await awsKMSClient.send(command);
}

async function createNewAWSDataEncryptionKey(awsCustomerMasterKeyAlias) {
    const dataKeyParams = {
        KeyId: `alias/${awsCustomerMasterKeyAlias}`,
        KeySpec: "AES_256"
    };

    const generateDataKeyCommand = new GenerateDataKeyCommand(dataKeyParams);
    const dataKeyResponse = await awsKMSClient.send(generateDataKeyCommand);
    
    const plaintextDataEncryptionKey = dataKeyResponse.Plaintext;
    const encryptedDataEncryptionKey = dataKeyResponse.CiphertextBlob;
    
    return [plaintextDataEncryptionKey, encryptedDataEncryptionKey];
}


function encryptTextWithAWSDataEncryptionKey(plaintext, plaintextDataEncryptionKey) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", plaintextDataEncryptionKey, iv);
    const encryptedTextBuffer = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
        encryptedTextBuffer: encryptedTextBuffer,
        iv: iv,
        authTag: authTag,
    };
}


function decryptTextWithAWSDataEncryptionKey(encryptedTextBuffer, plaintextDataEncryptionKey, iv, authTag) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", plaintextDataEncryptionKey, iv);
    decipher.setAuthTag(authTag);

    const decryptedText = Buffer.concat([
        decipher.update(encryptedTextBuffer),
        decipher.final(),
    ]).toString("utf-8");

    return decryptedText;
}


function encryptFileBufferWithAWSDataEncryptionKey(plainfileBuffer, plaintextDataEncryptionKey) {
    const iv = crypto.randomBytes(12); 
    const cipher = crypto.createCipheriv("aes-256-gcm", plaintextDataEncryptionKey, iv);

    const encryptedFileBuffer = Buffer.concat([cipher.update(plainfileBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        encryptedFileBuffer: encryptedFileBuffer,
        iv: iv,
        authTag: authTag,
    };
}


function decryptFileBufferWithAWSDataEncryptionKey(encryptedFileBuffer, plaintextDataEncryptionKey, iv, authTag) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", plaintextDataEncryptionKey, iv);
    decipher.setAuthTag(authTag);

    const decryptedFileBuffer = Buffer.concat([decipher.update(encryptedFileBuffer), decipher.final()]);

    return decryptedFileBuffer;
}


app.listen(8005, () => {
    console.log('Server is running on https://localhost:8005');
});


process.on('SIGINT', async () => { // Handles Ctrl+C (graceful shutdown)
    await gcMySQLSpannerDatabase.close();
    await mongodbClient.close();
    await awsKMSClient.destroy();
    process.exit(0);
});


process.on('SIGTERM', async () => { // Handles termination signals (i.e non-graceful shutdowns)
    await gcMySQLSpannerDatabase.close();
    await mongodbClient.close();
    await awsKMSClient.destroy();
    process.exit(0);
});