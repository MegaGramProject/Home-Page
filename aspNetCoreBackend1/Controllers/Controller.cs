using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.Postgres;
using aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;
using aspNetCoreBackend1.Models.SqlServer.Caption;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Attributes;

using System.Text.Json;
using System.Text;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using Microsoft.AspNetCore.RateLimiting;
using StackExchange.Redis;


namespace aspNetCoreBackend1.Controllers;


[ApiController]
[Route("/")]
public class Controller : ControllerBase
{
    private readonly PostgresContext _postgresContext;
    private readonly SqlServerContext _sqlServerContext;
    private readonly EncryptionAndDecryptionService _encryptionAndDecryptionService;
    private readonly UserAuthService _userAuthService;
    private readonly PostOrCommentLikingService _postOrCommentLikingService;
    private readonly PostInfoFetchingService _postInfoFetchingService;
    private readonly CaptionService _captionService;
    private readonly UserInfoFetchingService _userInfoFetchingService;
    private readonly HttpClient _httpClient;
    private readonly HttpClient _httpClientWithMutualTLS;
    private readonly Dictionary<string, int> _stringLabelToIntStatusCodeMappings;
    private readonly IDatabase _redisCachingDatabase;


    public Controller(
        PostgresContext postgresContext, SqlServerContext sqlServerContext,
        EncryptionAndDecryptionService encryptionAndDecryptionService, UserAuthService userAuthService,
        PostOrCommentLikingService postOrCommentLikingService, PostInfoFetchingService postInfoFetchingService,
        CaptionService captionService, UserInfoFetchingService UserInfoFetchingService,
        IHttpClientFactory httpClientFactory, IConnectionMultiplexer redisClient
    )
    {
        _postgresContext = postgresContext;
        _sqlServerContext = sqlServerContext;

        _encryptionAndDecryptionService = encryptionAndDecryptionService;
        _userAuthService = userAuthService;
        _postOrCommentLikingService = postOrCommentLikingService;
        _postInfoFetchingService = postInfoFetchingService;
        _captionService = captionService;
        _userInfoFetchingService = UserInfoFetchingService;

        _httpClient = httpClientFactory.CreateClient();
        _httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");

        _stringLabelToIntStatusCodeMappings = new Dictionary<string, int>
        {
            {"UNAUTHORIZED", 403},
            {"BAD_GATEWAY", 502},
            {"NOT_FOUND", 404},
            {"INTERNAL_SERVER_ERROR", 500},
        };
        
        _redisCachingDatabase = redisClient.GetDatabase(0);
    }


    [HttpPost("getBatchOfLikersOfPostOrComment/{authUserId}/{overallPostId?}/{commentId?}")]
    [EnableRateLimiting("6PerMinute")]
    public async Task<IActionResult> GetBatchOfLikersOfPostOrComment(
        int authUserId, string? overallPostId, int? commentId, [FromBody] int[]? likerIdsToExclude
    )
    {
        if ((overallPostId == null && commentId == null) || (overallPostId != null && commentId != null))
        {
            return BadRequest("Either the overallPostId or the commentId must be provided; it cannot be both.");
        }

        if (!ObjectId.TryParse(overallPostId, out _))
        {
            return BadRequest("The provided overallPostId is invalid.");
        }

        if (commentId < 1)
        {
            return BadRequest("The provided commentId is invalid.");
        }

        bool authUserIsAnonymousGuest = false;
        if (authUserId == -1)
        {
            authUserIsAnonymousGuest = true;
        }
        else if (authUserId < 1)
        {
            return BadRequest(@"The provided authUserId is not -1(which is reserved for anonymous guests) and is less
            than 0. There does not exist a user with that id.");
        }

        if (!authUserIsAnonymousGuest)
        {
            var userAuthenticationResult = await _userAuthService.AuthenticateUser(
                authUserId, Request.Cookies, _httpClient
            );

            if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
            {
                if (!userAuthenticationResultAsBoolean)
                {
                    return StatusCode(
                        403,
                        @$"The expressJSBackend1 server could not verify you as having the proper credentials
                        to be logged in as {authUserId}"
                    );
                }
            }
            else if (userAuthenticationResult is string userAuthenticationResultAsString)
            {
                if (string.Equals(userAuthenticationResultAsString, @"The provided authUser token, if any, in your
                cookies has an invalid structure."))
                {
                    return StatusCode(
                        403,
                        userAuthenticationResultAsString
                    );
                }
                return StatusCode(
                    502,
                    userAuthenticationResultAsString
                );
            }
            else if (userAuthenticationResult is List<object> userAuthenticationResultAsList)
            {
                Response.Cookies.Append(
                    $"authToken{authUserId}", 
                    (string) userAuthenticationResultAsList[0],
                    new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Expires = (DateTime) userAuthenticationResultAsList[1]
                        }
                );
            }
        }

        bool? isEncrypted = null;
        if (overallPostId == null)
        {
            try
            {
                overallPostId = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => x.overallPostId)
                    .FirstOrDefaultAsync();

                if (overallPostId == null)
                {
                    overallPostId = await _sqlServerContext
                        .encryptedCommentsOfPosts
                        .Where(x => x.id == commentId)
                        .Select(x => x.overallPostId)
                        .FirstOrDefaultAsync();

                    if (overallPostId == null)
                    {
                        return NotFound(
                            "You are trying to fetch the likes of a comment that does not exist."
                        );
                    }
                    else
                    {
                        isEncrypted = true;
                    }
                }
                else
                {
                    isEncrypted = false;
                }
            }
            catch 
            {
                return StatusCode(
                    500,
                    @"There was trouble getting the overallPostId of the comment whose likes you are
                    trying to fetch"
                );
            }
        }

        HashSet<int> setOfLikerIdsToExclude = new HashSet<int>();
        if (likerIdsToExclude != null)
        {
            likerIdsToExclude = likerIdsToExclude.Where(x => x > 0).ToArray();
            setOfLikerIdsToExclude = new HashSet<int>(likerIdsToExclude);
        }

        int[] authorsOfPost = [];
        HashSet<int> setOfAuthUserFollowings = new HashSet<int>();
        HashSet<int> setOfAuthUserBlockings = new HashSet<int>();

        var authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser =
        await _postInfoFetchingService.getAuthorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser(
            authUserId,
            overallPostId, 
            _httpClientWithMutualTLS
        );
        if (authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser is Tuple<string, string>
        authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[
                    authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput.Item2
                ],
                authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserErrorOutput.Item1
            );
        }
        else if (authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUser is Dictionary<string, object>
        authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput)
        {
            authorsOfPost = (int[]) authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "authorsOfPost"
            ];
            isEncrypted = (bool) authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "isEncrypted"
            ];
            setOfAuthUserFollowings = (HashSet<int>) 
            authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "setOfAuthUserFollowings"
            ];
            setOfAuthUserBlockings = (HashSet<int>)
            authorsAndEncryptionStatusOfPostAndFollowingsAndBlockingsOfUserSuccessOutput[
                "setOfAuthUserBlockings"
            ];
            setOfLikerIdsToExclude.UnionWith(setOfAuthUserBlockings);
        }

        List<Dictionary<string, object>> batchOfLikersFollowedByAuthUser = new List<Dictionary<string, object>>();
        List<Dictionary<string, object>> batchOfLikersNotFollowedByAuthUser = new List<Dictionary<string, object>>();
        List<Dictionary<string, object>> combinedBatchOfLikers = new List<Dictionary<string, object>>();
        bool isLikedByAuthUser = false;
        int numLikersFound = 0;
        byte[]? plaintextDataEncryptionKey = null;

        if (isEncrypted==true)
        {
            if (authUserIsAnonymousGuest)
            {
                return StatusCode(
                    403,
                    @"As an anonymous guest, you cannot access this private-post's likes/caption/comments/
                    comment-likes."
                );
            }

            bool authUserFollowsAtLeastOnePostAuthor = false;
            foreach (int authorId in authorsOfPost)
            {
                if (setOfAuthUserFollowings.Contains(authorId))
                {
                    authUserFollowsAtLeastOnePostAuthor = true;
                    break;
                }
            }

            if (!authUserFollowsAtLeastOnePostAuthor)
            {
                return StatusCode(
                    403,
                    @"As a user who does not follow any of the authors of this private-post, you cannot access its
                    likes/caption/comments/comment-likes."
                ); 
            }

            try
            {
                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                (
                    overallPostId,
                    _postgresContext,
                    _encryptionAndDecryptionService,
                    _redisCachingDatabase
                );
            }
            catch
            {
                return StatusCode(
                    500,
                    @"There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                    that in order to decrypt the data of this encrypted post."
                );
            }
            
            try
            {
                var infoOnEachEncryptedLikerOfPostOrComment = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                    .OrderByDescending(x => x.datetime)
                    .Select(x => new { x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag })
                    .ToListAsync();
                

                foreach (var encryptedLikerInfo in infoOnEachEncryptedLikerOfPostOrComment)
                {
                    string stringifiedLikerId = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                        encryptedLikerInfo.encryptedLikerId,
                        plaintextDataEncryptionKey,
                        encryptedLikerInfo.likerIdEncryptionIv,
                        encryptedLikerInfo.likerIdEncryptionAuthTag
                    );
                    int likerId = int.Parse(stringifiedLikerId);
                    if (setOfLikerIdsToExclude.Contains(likerId))
                    {
                        continue;
                    }
                    
                    if (likerId == authUserId)
                    {
                        isLikedByAuthUser = true;
                        numLikersFound++;
                    }
                    else if (setOfAuthUserFollowings.Contains(likerId))
                    {
                        batchOfLikersFollowedByAuthUser.Add(
                            new Dictionary<string, object>
                                {
                                    { "isFollowedByAuthUser", true },
                                    { "likerId", likerId }
                                }
                        ); 
                        numLikersFound++;
                    }
                    else if (batchOfLikersNotFollowedByAuthUser.Count < 20)
                    {
                        batchOfLikersNotFollowedByAuthUser.Add(
                            new Dictionary<string, object>
                                {
                                    { "likerId", likerId }
                                }
                        ); 
                    }

                    if (numLikersFound == 20)
                    {
                        break;
                    }
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    @"There was trouble getting each of the likers of this encrypted post/comment."
                );
            }
        }
        else
        {
            bool eachPostAuthorIsInAuthUserBlockings = true;
            foreach(int authorId in authorsOfPost)
            {
                if (!setOfAuthUserBlockings.Contains(authorId)) {
                    eachPostAuthorIsInAuthUserBlockings = false;
                    break;
                }
            }
            if (eachPostAuthorIsInAuthUserBlockings)
            {
                return StatusCode(
                    404,
                    "You are trying to fetch the likes of a post/comment that doesn't currently exist"
                );
            }
            
            try
            {
                var likersOfPostOrComment = await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId
                    && !setOfLikerIdsToExclude.Contains(x.likerId))
                    .OrderByDescending(x => x.datetime)
                    .Select(x => x.likerId)
                    .ToListAsync();
                
                foreach (int likerId in likersOfPostOrComment)
                {
                    if (likerId == authUserId)
                    {
                        isLikedByAuthUser = true;
                        numLikersFound++;
                    }
                    else if (setOfAuthUserFollowings.Contains(likerId))
                    {
                        batchOfLikersFollowedByAuthUser.Add(
                            new Dictionary<string, object>
                                {
                                    { "isFollowedByAuthUser", true },
                                    { "likerId", likerId }
                                }
                        ); 
                        numLikersFound++;
                    }
                    else if (batchOfLikersNotFollowedByAuthUser.Count < 20)
                    {
                        batchOfLikersNotFollowedByAuthUser.Add(
                            new Dictionary<string, object>
                                {
                                    { "likerId", likerId }
                                }
                        ); 
                    }

                    if (numLikersFound == 20)
                    {
                        break;
                    }
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    @"There was trouble getting each of the likers of this unencrypted post/comment."
                );
            }
        }

        if (isLikedByAuthUser)
        {
            combinedBatchOfLikers.Add(
            new Dictionary<string, object>
                {
                    { "isAuthUser", true },
                    { "likerId", authUserId}
                }
            ); 
        }

        combinedBatchOfLikers = combinedBatchOfLikers.Concat(batchOfLikersFollowedByAuthUser).ToList();

        if (numLikersFound < 20)
        {
            combinedBatchOfLikers = combinedBatchOfLikers.Concat(
                batchOfLikersNotFollowedByAuthUser.Slice(
                    0, 20-numLikersFound
                )
            ).ToList();
        }

        return Ok(combinedBatchOfLikers);
    }


    [EnableRateLimiting("12PerMinute")]
    [HttpPost("addLikeToPostOrComment/{authUserId}/{overallPostId?}/{commentId?}")]
    public async Task<IActionResult> AddLikeToPostOrComment(
        int authUserId, string? overallPostId, int? commentId
    )
    {
        if ((overallPostId == null && commentId == null) || (overallPostId != null && commentId != null))
        {
            return BadRequest("Either the overallPostId or the commentId must be provided; it cannot be both.");
        }

        if (!ObjectId.TryParse(overallPostId, out _)) {
            return BadRequest("The provided overallPostId is invalid.");
        }

        if (commentId < 1) {
            return BadRequest("The provided commentId is invalid.");
        }

        if (authUserId < 1)
        {
            return BadRequest("There does not exist a user with the provided authUserId.");
        }

        var userAuthenticationResult = await _userAuthService.AuthenticateUser(
            authUserId, Request.Cookies, _httpClient
        );

        if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
        {
            if (!userAuthenticationResultAsBoolean)
            {
                return StatusCode(
                    403,
                    @$"The expressJSBackend1 server could not verify you as having the proper credentials
                    to be logged in as {authUserId}"
                );
            }
        }
        else if (userAuthenticationResult is string userAuthenticationResultAsString)
        {
            if (string.Equals(userAuthenticationResultAsString, @"The provided authUser token, if any, in your
            cookies has an invalid structure."))
            {
                return BadRequest(userAuthenticationResultAsString);
            }
            return StatusCode(
                502,
                userAuthenticationResultAsString
            );
        }
        else if (userAuthenticationResult is List<object> userAuthenticationResultAsList)
        {
            Response.Cookies.Append(
                $"authToken{authUserId}", 
                (string) userAuthenticationResultAsList[0],
                new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = (DateTime) userAuthenticationResultAsList[1]
                    }
            );
        }

        bool isEncrypted = false;
        byte[]? plaintextDataEncryptionKey = null;
        try
        {
            List<int> likersOfUnencryptedPostOrComment = await _postgresContext
                .unencryptedPostOrCommentLikes
                .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                .Select(x => x.likerId)
                .ToListAsync();
            HashSet<int> setOfLikersOfUnencryptedPostOrComment = new HashSet<int>(likersOfUnencryptedPostOrComment);
            
            if (setOfLikersOfUnencryptedPostOrComment.Count > 0)
            {
                isEncrypted = false;
                if (setOfLikersOfUnencryptedPostOrComment.Contains(authUserId)) {
                    return BadRequest("You cannot like the same post twice.");
                }
                else if (commentId != null)
                {
                    overallPostId = _sqlServerContext
                        .unencryptedCommentsOfPosts
                        .Where(x => x.id == commentId)
                        .Select(x => x.overallPostId)
                        .FirstOrDefault();
                }
            }
            else
            {
                var likersOfEncryptedPostOrComment =  await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                    .Select(x => new { x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag })
                    .ToListAsync();

                if (likersOfEncryptedPostOrComment.Count > 0)
                {
                    isEncrypted = true;
                    if (commentId != null)
                    {
                        overallPostId = _sqlServerContext
                            .encryptedCommentsOfPosts
                            .Where(x => x.id == commentId)
                            .Select(x => x.overallPostId)
                            .FirstOrDefault();
                    }
                    
                    try
                    {
                        plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                        (
                            overallPostId!,
                            _postgresContext,
                            _encryptionAndDecryptionService,
                            _redisCachingDatabase
                        );
                    }
                    catch
                    {
                        return StatusCode(
                            500,
                            @"There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                            that in order to decrypt the data of this encrypted post."
                        );
                    }

                    foreach (var encryptedLikerInfo in likersOfEncryptedPostOrComment)
                    {
                        string stringifiedLikerId = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedLikerInfo.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedLikerInfo.likerIdEncryptionIv,
                            encryptedLikerInfo.likerIdEncryptionAuthTag
                        );
                        int likerId = int.Parse(stringifiedLikerId);
                        if (likerId == authUserId)
                        {
                            return BadRequest("You cannot like the same post twice.");
                        }
                    }
                }
            }
        }
        catch
        {
            return StatusCode(
                500,
                "There was trouble checking whether or not you already liked this post/comment"
            );
        }

        if (overallPostId == null)
        {
            try
            {
                overallPostId = _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => x.overallPostId)
                    .FirstOrDefault();
                
                if (overallPostId == null)
                {
                    overallPostId = _sqlServerContext
                        .encryptedCommentsOfPosts
                        .Where(x => x.id == commentId)
                        .Select(x => x.overallPostId)
                        .FirstOrDefault();
                    
                    if (overallPostId == null)
                    {
                        return NotFound(
                            "There does not exist a comment with the commentId you provided."
                        );
                    }
                    else
                    {
                        isEncrypted = true;
                    }
                }
                else
                {
                    isEncrypted = false;
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble getting the overallPostId of the comment with the commentId you provided."
                );
            }
        }

        var authorsAndPostEncryptionStatusIfUserHasAccessToPost = await _postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            _httpClientWithMutualTLS
        );
        if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is Tuple<string, string>
        authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[
                    authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item2
                ],
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item1
            );
        }
        else if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is bool
        authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput)
        {
            isEncrypted = authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput;
            if (isEncrypted && plaintextDataEncryptionKey==null)
            {
                try
                {
                    plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                    (
                        overallPostId,
                        _postgresContext,
                        _encryptionAndDecryptionService,
                        _redisCachingDatabase
                    );
                }
                catch
                {
                    return StatusCode(
                        500,
                        @"There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                        that in order to decrypt the data of this encrypted post."
                    );
                }
            }
        }
        
        object resultOfAddingLikeToPostOrComment = await _postOrCommentLikingService.AddLikeToPostOrComment(
            isEncrypted, authUserId, overallPostId,
            commentId, _postgresContext, _encryptionAndDecryptionService, plaintextDataEncryptionKey!
        );
        if (resultOfAddingLikeToPostOrComment is int idOfNewLike)
        {
            return Ok(idOfNewLike);
        }
        return StatusCode(
            ((Tuple <int, string>)resultOfAddingLikeToPostOrComment).Item1,
            ((Tuple <int, string>)resultOfAddingLikeToPostOrComment).Item2
        );
    
    }


    [RequireMutualTLS]
    [HttpPost("addEncryptionInfoForCaptionCommentsAndLikesOfNewlyUploadedEncryptedPost/{overallPostId}")]
    public async Task<IActionResult> AddEncryptionInfoForCaptionCommentsAndLikesOfNewlyUploadedEncryptedPost(
        string overallPostId
    )
    {
        try
        {
            await _encryptionAndDecryptionService.CreateNewAzureCustomerMasterKey(
                $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
            );

            var newDataEncryptionKeyInfo = await _encryptionAndDecryptionService.CreateNewDataEncryptionKey(
                $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
            );  

            byte[] plaintextDataEncryptionKey = newDataEncryptionKeyInfo.Item1;
            byte[] encryptedDataEncryptionKey = newDataEncryptionKeyInfo.Item2;

            CaptionCommentAndLikeEncryptionInfo newCaptionCommentAndLikeEncryptionInfo = new CaptionCommentAndLikeEncryptionInfo
            (
                overallPostId,
                encryptedDataEncryptionKey
            );

            await _postgresContext
                .captionsCommentsAndLikesEncryptionInfo
                .AddAsync(newCaptionCommentAndLikeEncryptionInfo);
            
            try
            {
                await _redisCachingDatabase.HashSetAsync(
                    "Posts and their Encrypted Data-Encryption-Keys",
                    overallPostId,
                    encryptedDataEncryptionKey
                );
            }
            catch
            {
                //pass
            }

            return Ok(true);
        }
        catch
        {
            return StatusCode(
                500,
                @"There was trouble in the process of creating a new Azure CMK, encrypting a new plaintext-data-encryption-key
                with that CMK, and then storing the encryptedDEK of the caption/comments/likes data of this newly uploaded
                encrypted post."
            );
        }
    }

    
    [EnableRateLimiting("12PerMinute")]
    [HttpPatch("toggleLikeToPostOrComment/{authUserId}/{overallPostId?}/{commentId?}")]
    public async Task<IActionResult> ToggleLikeToPostOrComment(
        int authUserId, string? overallPostId, int? commentId
    )
    {
        if ((overallPostId == null && commentId == null) || (overallPostId != null && commentId != null))
        {
            return BadRequest("Either the overallPostId or the commentId must be provided; it cannot be both.");
        }

        if (!ObjectId.TryParse(overallPostId, out _)) {
            return BadRequest("The provided overallPostId is invalid.");
        }

        if (commentId < 1) {
            return BadRequest("The provided commentId is invalid.");
        }

        if (authUserId < 1)
        {
            return BadRequest("There does not exist a user with the provided authUserId");
        }

        var userAuthenticationResult = await _userAuthService.AuthenticateUser(
            authUserId, Request.Cookies, _httpClient
        );

        if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
        {
            if (!userAuthenticationResultAsBoolean)
            {
                return StatusCode(
                    403,
                    @$"The expressJSBackend1 server could not verify you as having the proper credentials
                    to be logged in as {authUserId}"
                );
            }
        }
        else if (userAuthenticationResult is string userAuthenticationResultAsString)
        {
            if (string.Equals(userAuthenticationResultAsString, @"The provided authUser token, if any, in your
            cookies has an invalid structure."))
            {
                return BadRequest(userAuthenticationResultAsString);
            }
            return StatusCode(
                502,
                userAuthenticationResultAsString
            );
        }
        else if (userAuthenticationResult is List<object> userAuthenticationResultAsList)
        {
            Response.Cookies.Append(
                $"authToken{authUserId}", 
                (string) userAuthenticationResultAsList[0],
                new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = (DateTime) userAuthenticationResultAsList[1]
                    }
            );
        }

        bool isEncrypted = false;
        if (overallPostId == null)
        {
            try
            {
                overallPostId = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => x.overallPostId)
                    .FirstOrDefaultAsync();

                if (overallPostId == null)
                {
                    overallPostId = await _sqlServerContext
                        .encryptedCommentsOfPosts
                        .Where(x => x.id == commentId)
                        .Select(x => x.overallPostId)
                        .FirstOrDefaultAsync();

                    if (overallPostId == null)
                    {
                        return NotFound(
                            "You are trying to toggle your like to a comment that does not exist."
                        );
                    }
                    else
                    {
                        isEncrypted = true;
                    }
                }
                else
                {
                    isEncrypted = false;
                }
            }
            catch 
            {
                return StatusCode(
                    500,
                    @"There was trouble getting the overallPostId of the comment whose like you are trying to toggle."
                );
            }
        }

        byte[] plaintextDataEncryptionKey = [];

        var authorsAndPostEncryptionStatusIfUserHasAccessToPost = await _postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            _httpClientWithMutualTLS
        );
        if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is Tuple<string, string>
        authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[
                    authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item2
                ],
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item1
            );
        }
        else if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is bool
        authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput)
        {
            isEncrypted = authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput;
            if (isEncrypted)
            {
                try
                {
                    plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                    (
                        overallPostId,
                        _postgresContext,
                        _encryptionAndDecryptionService,
                        _redisCachingDatabase
                    );
                }
                catch
                {
                    return StatusCode(
                        500,
                        @"There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                        that in order to decrypt the data of this encrypted post."
                    );
                }
            }
        }

        bool likeWasRemoved = false;
        int? idOfAddedLike = null;

        var resultOfRemovingLikeFromPostOrComment = await _postOrCommentLikingService.RemoveLikeFromPostOrComment(
            _postgresContext, overallPostId, commentId, authUserId, _encryptionAndDecryptionService,
            isEncrypted, plaintextDataEncryptionKey
        );

        if (resultOfRemovingLikeFromPostOrComment is bool resultOfRemovingLikeFromPostOrCommentAsBool)
        {
            likeWasRemoved = resultOfRemovingLikeFromPostOrCommentAsBool;
        }
        else
        {
            return StatusCode(
                ((Tuple <int, string>)resultOfRemovingLikeFromPostOrComment).Item1,
                ((Tuple <int, string>)resultOfRemovingLikeFromPostOrComment).Item2
            ); 
        }

        if (!likeWasRemoved)
        {
            var resultOfAddingLikeToPostOrComment = await _postOrCommentLikingService.AddLikeToPostOrComment(
                isEncrypted, authUserId, overallPostId,
                commentId, _postgresContext, _encryptionAndDecryptionService, plaintextDataEncryptionKey!
            );
            if (resultOfAddingLikeToPostOrComment is int idOfNewLike)
            {
                idOfAddedLike = idOfNewLike;
            }
            return StatusCode(
                ((Tuple <int, string>)resultOfAddingLikeToPostOrComment).Item1,
                ((Tuple <int, string>)resultOfAddingLikeToPostOrComment).Item2
            );
        }

        return Ok(new {
            likeWasRemoved,
            idOfAddedLikeIfApplicable = idOfAddedLike
        });
    }


    [RequireMutualTLS]
    [HttpPatch("toggleEncryptionStatusOfCaptionCommentsAndLikesOfPost/{overallPostId}/{originallyIsEncrypted}")]
    public async Task<IActionResult> ToggleEncryptionStatusOfCaptionCommentsAndLikesOfPost(
        string overallPostId, bool originallyIsEncrypted
    )
    {
        byte[]? plaintextDataEncryptionKey = null;
        if (originallyIsEncrypted)
        {
            try
            {
               try
                {
                    plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                    (
                        overallPostId,
                        _postgresContext,
                        _encryptionAndDecryptionService,
                        _redisCachingDatabase
                    );
                }
                catch
                {
                    return StatusCode(
                        500,
                        @"There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                        that in order to decrypt the data of this encrypted post."
                    );
                }
                
                await _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
                
                await _redisCachingDatabase.HashDeleteAsync(
                    "Posts and their Encrypted Data-Encryption-Keys",
                    overallPostId
                );
                
                await _encryptionAndDecryptionService.DeleteCustomerMasterKey(
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
            }
            catch
            {
                return StatusCode(
                    500,
                    @"There was trouble in the process of fetching the encrypted data-encryption-key of the caption/
                    comments/likes of the post, decrypting that encrypted data-encryption-key, and removing
                    the data for the encryption-info of the now-to-be-unencrypted caption/comments/likes data."
                );
            }
        }
        else
        {
            try
            {
                await _encryptionAndDecryptionService.CreateNewAzureCustomerMasterKey(
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );

                var newDataEncryptionKeyInfo = await _encryptionAndDecryptionService.CreateNewDataEncryptionKey(
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );  

                plaintextDataEncryptionKey = newDataEncryptionKeyInfo.Item1;
                byte[] encryptedDataEncryptionKey = newDataEncryptionKeyInfo.Item2;

                CaptionCommentAndLikeEncryptionInfo newCaptionCommentAndLikeEncryptionInfo = new CaptionCommentAndLikeEncryptionInfo
                (
                    overallPostId,
                    encryptedDataEncryptionKey
                );

                await _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .AddAsync(newCaptionCommentAndLikeEncryptionInfo);

                try
                {
                    await _redisCachingDatabase.HashSetAsync(
                        "Posts and their Encrypted Data-Encryption-Keys",
                        overallPostId,
                        encryptedDataEncryptionKey
                    );
                }
                catch
                {
                    //pass
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    @"There was trouble in the process of creating a new Azure CMK, encrypting a new plaintext-data-encryption-key
                    with that CMK, and then saving the encryption-info of the now-to-be-encrypted caption/comments/likes data."
                );
            }
        }

        if (!originallyIsEncrypted)
        {
            UnencryptedCaptionOfPost? unencryptedCaptionToDelete = await _sqlServerContext
                .unencryptedCaptionsOfPosts
                .Where(x => x.overallPostId == overallPostId)
                .FirstOrDefaultAsync();

            if (unencryptedCaptionToDelete != null)
            {
                var encryptedCaptionAuthorInfo = _encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    unencryptedCaptionToDelete.authorId.ToString(),
                    plaintextDataEncryptionKey
                );

                byte[] encryptedCaptionContent = _encryptionAndDecryptionService
                .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                    unencryptedCaptionToDelete.content,
                    plaintextDataEncryptionKey,
                    encryptedCaptionAuthorInfo.iv,
                    encryptedCaptionAuthorInfo.authTag
                );

                EncryptedCaptionOfPost newEncryptedCaptionOfPost = new EncryptedCaptionOfPost(
                    overallPostId,
                    unencryptedCaptionToDelete.isEdited,
                    unencryptedCaptionToDelete.datetime,
                    encryptedCaptionAuthorInfo.encryptedTextBuffer,
                    encryptedCaptionContent,
                    encryptedCaptionAuthorInfo.iv,
                    encryptedCaptionAuthorInfo.authTag
                );

                try
                {
                    _sqlServerContext.unencryptedCaptionsOfPosts.Remove(unencryptedCaptionToDelete);
                    await _sqlServerContext.SaveChangesAsync();
                }
                catch
                {
                    return StatusCode(
                        500,
                        "There was trouble removing the unencrypted-caption of this now-to-be encrypted post"
                    );
                }
                
                try
                {
                    await _sqlServerContext
                        .encryptedCaptionsOfPosts
                        .AddAsync(newEncryptedCaptionOfPost);
                }
                catch
                {
                    return StatusCode(
                        500,
                        "There was trouble adding the encrypted-caption of this now-to-be encrypted post"
                    );
                }
            }
        }
        else
        {
            EncryptedCaptionOfPost? encryptedCaptionToDelete = await _sqlServerContext
                .encryptedCaptionsOfPosts
                .Where(x => x.overallPostId == overallPostId)
                .FirstOrDefaultAsync();
            
            if (encryptedCaptionToDelete != null)
            {
                string captionAuthorIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                    encryptedCaptionToDelete.encryptedAuthorId,
                    plaintextDataEncryptionKey,
                    encryptedCaptionToDelete.authorIdEncryptionIv,
                    encryptedCaptionToDelete.encryptionAuthTag
                );
                int captionAuthorId = int.Parse(captionAuthorIdAsString);

                string captionContent = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                    encryptedCaptionToDelete.encryptedContent,
                    plaintextDataEncryptionKey,
                    encryptedCaptionToDelete.encryptionIv,
                    encryptedCaptionToDelete.encryptionAuthTag
                );

                UnencryptedCaptionOfPost newUnencryptedCaptionOfPost = new UnencryptedCaptionOfPost(
                    overallPostId,
                    encryptedCaptionToDelete.isEdited,
                    encryptedCaptionToDelete.datetime,
                    captionAuthorId,
                    captionContent
                );

                try
                {
                    _sqlServerContext.encryptedCaptionsOfPosts.Remove(encryptedCaptionToDelete);
                    await _sqlServerContext.SaveChangesAsync();
                }
                catch
                {
                    return StatusCode(
                        500,
                        "There was trouble removing the encrypted caption of this now-to-be-unencrypted post"
                    );
                }

                try
                {
                    await _sqlServerContext
                        .unencryptedCaptionsOfPosts
                        .AddAsync(newUnencryptedCaptionOfPost);
                }
                catch
                {
                    return StatusCode(
                        500,
                        "There was trouble adding the unencrypted caption of this now-to-be-unencrypted post"
                    );
                }
            } 
        }

        Dictionary<int, int?> oldCommentIdToNewCommentIdMappings = new Dictionary<int, int?>();
        oldCommentIdToNewCommentIdMappings[-1] = null;
        List<int> oldCommentIds = new List<int>();
        List<int> oldIdsOfCommentsThatAreReplies = new List<int>();

        if (!originallyIsEncrypted)
        {
            List<UnencryptedCommentOfPost> unencryptedCommentsToDelete = await _sqlServerContext
                .unencryptedCommentsOfPosts
                .Where(x => x.overallPostId == overallPostId)
                .ToListAsync();
            
            List<EncryptedCommentOfPost> encryptedCommentsToInsert = new List<EncryptedCommentOfPost>();
            List<EncryptedCommentOfPost> encryptedCommentsToInsertThatAreReplies = new List<EncryptedCommentOfPost>();

            foreach (UnencryptedCommentOfPost unencryptedComment in unencryptedCommentsToDelete)
            {
                var encryptedCommentAuthorInfo = _encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    unencryptedComment.authorId.ToString(),
                    plaintextDataEncryptionKey
                );

                byte[] encryptedCommentContent = _encryptionAndDecryptionService
                .EncryptTextWithAzureDataEncryptionKeyGivenIvAndAuthTag(
                    unencryptedComment.content,
                    plaintextDataEncryptionKey,
                    encryptedCommentAuthorInfo.iv,
                    encryptedCommentAuthorInfo.authTag
                );
                
                EncryptedCommentOfPost newEncryptedCommentToInsert =  new EncryptedCommentOfPost(
                    overallPostId,
                    unencryptedComment.parentCommentId,
                    unencryptedComment.isEdited,
                    unencryptedComment.datetime,
                    encryptedCommentAuthorInfo.encryptedTextBuffer,
                    encryptedCommentContent,
                    encryptedCommentAuthorInfo.iv,
                    encryptedCommentAuthorInfo.authTag
                );

                if (unencryptedComment.parentCommentId == null)
                {
                    oldCommentIds.Add(unencryptedComment.id);
                    encryptedCommentsToInsert.Add(newEncryptedCommentToInsert);
                }
                else
                {
                    oldIdsOfCommentsThatAreReplies.Add(unencryptedComment.id);
                    encryptedCommentsToInsertThatAreReplies.Add(newEncryptedCommentToInsert);
                }
            }
            
            try
            {
                _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .RemoveRange(unencryptedCommentsToDelete);
                await _sqlServerContext.SaveChangesAsync();
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble removing all the unencrypted comments of this now-to-be-encrypted post."
                );
            }
            
            try
            {
                await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .AddRangeAsync(encryptedCommentsToInsert);
                
                for (int i = 0; i < encryptedCommentsToInsert.Count; i++)
                {
                    oldCommentIdToNewCommentIdMappings[oldCommentIds[i]] = encryptedCommentsToInsert[i].id;
                }

                for (int i = 0; i < encryptedCommentsToInsertThatAreReplies.Count; i++)
                {
                    encryptedCommentsToInsertThatAreReplies[i].parentCommentId = oldCommentIdToNewCommentIdMappings[
                        encryptedCommentsToInsertThatAreReplies[i].parentCommentId ?? -1
                    ];
                }

                await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .AddRangeAsync(encryptedCommentsToInsertThatAreReplies);
                
                for (int i = 0; i < encryptedCommentsToInsertThatAreReplies.Count; i++)
                {
                    oldCommentIdToNewCommentIdMappings[oldIdsOfCommentsThatAreReplies[i]] = encryptedCommentsToInsertThatAreReplies
                    [i].id;
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble adding all the encrypted comments of this now-to-be-encrypted post."
                );
            }
        }
        else
        {
            List<EncryptedCommentOfPost> encryptedCommentsToDelete = await _sqlServerContext
                .encryptedCommentsOfPosts
                .Where(x => x.overallPostId == overallPostId)
                .ToListAsync();
            
            List<UnencryptedCommentOfPost> unencryptedCommentsToInsert = new List<UnencryptedCommentOfPost>();
            List<UnencryptedCommentOfPost> unencryptedCommentsToInsertThatAreReplies = new List<UnencryptedCommentOfPost>();

            foreach (EncryptedCommentOfPost encryptedComment in encryptedCommentsToDelete)
            {
                string authorIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                    encryptedComment.encryptedAuthorId,
                    plaintextDataEncryptionKey,
                    encryptedComment.authorIdEncryptionIv,
                    encryptedComment.encryptionAuthTag
                );  
                string content = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                    encryptedComment.encryptedContent,
                    plaintextDataEncryptionKey,
                    encryptedComment.encryptionIv,
                    encryptedComment.encryptionAuthTag
                );

                UnencryptedCommentOfPost newUnencryptedCommentToInsert =  new UnencryptedCommentOfPost(
                    overallPostId,
                    encryptedComment.parentCommentId,
                    encryptedComment.isEdited,
                    encryptedComment.datetime,
                    int.Parse(authorIdAsString),
                    content
                );

                if (encryptedComment.parentCommentId == null)
                {
                    oldCommentIds.Add(encryptedComment.id);
                    unencryptedCommentsToInsert.Add(newUnencryptedCommentToInsert);
                }
                else
                {
                    oldIdsOfCommentsThatAreReplies.Add(encryptedComment.id);
                    unencryptedCommentsToInsertThatAreReplies.Add(newUnencryptedCommentToInsert);
                }
            }
            
            try
            {
                _sqlServerContext
                    .encryptedCommentsOfPosts
                    .RemoveRange(encryptedCommentsToDelete);
                await _sqlServerContext.SaveChangesAsync();
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble removing all the encrypted comments of this now-to-be-unencrypted post."
                );
            }

            try
            {
                await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .AddRangeAsync(unencryptedCommentsToInsert);
                
                for (int i = 0; i < unencryptedCommentsToInsert.Count; i++)
                {
                    oldCommentIdToNewCommentIdMappings[oldCommentIds[i]] = unencryptedCommentsToInsert[i].id;
                }

                for (int i = 0; i < unencryptedCommentsToInsertThatAreReplies.Count; i++)
                {
                    unencryptedCommentsToInsertThatAreReplies[i].parentCommentId = oldCommentIdToNewCommentIdMappings[
                        unencryptedCommentsToInsertThatAreReplies[i].parentCommentId ?? -1
                    ];
                }

                await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .AddRangeAsync(unencryptedCommentsToInsertThatAreReplies);
                
                for (int i = 0; i < unencryptedCommentsToInsertThatAreReplies.Count; i++)
                {
                    oldCommentIdToNewCommentIdMappings[oldIdsOfCommentsThatAreReplies[i]] =
                    unencryptedCommentsToInsertThatAreReplies[i].id;
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble adding all the unencrypted comments of this now-to-be-unencrypted post."
                );
            }
        }

        if (!originallyIsEncrypted)
        {
            List<UnencryptedPostOrCommentLike> unencryptedLikesToDelete = await _postgresContext
                .unencryptedPostOrCommentLikes
                .Where(x => x.overallPostId == overallPostId || oldCommentIdToNewCommentIdMappings.ContainsKey(
                    x.commentId ?? -2)
                )
                .ToListAsync();

            List<EncryptedPostOrCommentLike> encryptedLikesToInsert = new List<EncryptedPostOrCommentLike>();

            foreach (UnencryptedPostOrCommentLike unencryptedLike in unencryptedLikesToDelete)
            {
                var encryptedLikerIdInfo = _encryptionAndDecryptionService.EncryptTextWithAzureDataEncryptionKey(
                    unencryptedLike.likerId.ToString(),
                    plaintextDataEncryptionKey!
                );

                encryptedLikesToInsert.Add(
                    new EncryptedPostOrCommentLike(
                        unencryptedLike.overallPostId,
                        oldCommentIdToNewCommentIdMappings[unencryptedLike.commentId ?? -1],
                        encryptedLikerIdInfo.encryptedTextBuffer,
                        encryptedLikerIdInfo.iv,
                        encryptedLikerIdInfo.authTag,
                        unencryptedLike.datetime
                    )
                );
            }
            
            try
            {
                _postgresContext
                    .unencryptedPostOrCommentLikes
                    .RemoveRange(unencryptedLikesToDelete);
                await _postgresContext.SaveChangesAsync();
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble removing all the unencrypted likes of this now-to-be-encrypted post"
                );
            }

            try
            {
                await _postgresContext
                    .encryptedPostOrCommentLikes
                    .AddRangeAsync(encryptedLikesToInsert);
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble adding all the encrypted likes of this now-to-be-encrypted post"
                );
            }
        }
        else
        {
            List<EncryptedPostOrCommentLike> encryptedLikesToDelete = await _postgresContext
                .encryptedPostOrCommentLikes
                .Where(x => x.overallPostId == overallPostId || oldCommentIdToNewCommentIdMappings.ContainsKey(
                    x.commentId ?? -2)
                )
                .ToListAsync();

            List<UnencryptedPostOrCommentLike> unencryptedLikesToInsert = new List<UnencryptedPostOrCommentLike>();

            foreach (EncryptedPostOrCommentLike encryptedLike in encryptedLikesToDelete)
            {
                string likerIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                    encryptedLike.encryptedLikerId,
                    plaintextDataEncryptionKey!,
                    encryptedLike.likerIdEncryptionIv,
                    encryptedLike.likerIdEncryptionAuthTag
                );

                unencryptedLikesToInsert.Add(
                    new UnencryptedPostOrCommentLike(
                        encryptedLike.overallPostId,
                        encryptedLike.commentId == null ? null :
                        oldCommentIdToNewCommentIdMappings[encryptedLike.commentId ?? -1],
                        int.Parse(likerIdAsString),
                        encryptedLike.datetime
                    )
                );
            }

            try
            {
                _postgresContext
                    .encryptedPostOrCommentLikes
                    .RemoveRange(encryptedLikesToDelete);
                await _postgresContext.SaveChangesAsync();
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble removing the encrypted likes of this now-to-be-unencrypted post"
                );
            }

            try
            {
                await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .AddRangeAsync(unencryptedLikesToInsert);
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble adding the unencrypted likes of this now-to-be-unencrypted post"
                );
            }
        }

        return Ok("Success");
    }


    [EnableRateLimiting("12PerMinute")]
    [HttpDelete("removeLikeFromPostOrComment/{authUserId}/{overallPostId?}/{commentId?}")]
    public async Task<IActionResult> RemoveLikeFromPostOrComment(
         int authUserId, string? overallPostId, int? commentId
    )
    {
        if ((overallPostId == null && commentId == null) || (overallPostId != null && commentId != null))
        {
            return BadRequest("Either the overallPostId or the commentId must be provided; it cannot be both.");
        }

        if (!ObjectId.TryParse(overallPostId, out _)) {
            return BadRequest("The provided overallPostId is invalid.");
        }

        if (commentId < 1) {
            return BadRequest("The provided commentId is invalid");
        }

        if (authUserId < 1)
        {
            return BadRequest("There does not exist a user with your provided authUserId");
        }

        var userAuthenticationResult = await _userAuthService.AuthenticateUser(
            authUserId, Request.Cookies, _httpClient
        );

        if (userAuthenticationResult is bool userAuthenticationResultAsBoolean)
        {
            if (!userAuthenticationResultAsBoolean)
            {
                return StatusCode(
                    403,
                    @$"The expressJSBackend1 server could not verify you as having the proper credentials
                    to be logged in as {authUserId}"
                );
            }
        }
        else if (userAuthenticationResult is string userAuthenticationResultAsString)
        {
            if (string.Equals(userAuthenticationResultAsString, @"The provided authUser token, if any, in your
            cookies has an invalid structure."))
            {
                return BadRequest(userAuthenticationResultAsString);
            }
            return StatusCode(
                502,
                userAuthenticationResultAsString
            );
        }
        else if (userAuthenticationResult is List<object> userAuthenticationResultAsList)
        {
            Response.Cookies.Append(
                $"authToken{authUserId}", 
                (string) userAuthenticationResultAsList[0],
                new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = (DateTime) userAuthenticationResultAsList[1]
                    }
            );
        }

        bool isEncrypted = false;
        if (overallPostId == null)
        {
            try
            {
                overallPostId = _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.id == commentId)
                    .Select(x => x.overallPostId)
                    .FirstOrDefault();
                
                if (overallPostId == null)
                {
                    overallPostId = _sqlServerContext
                        .encryptedCommentsOfPosts
                        .Where(x => x.id == commentId)
                        .Select(x => x.overallPostId)
                        .FirstOrDefault();
                    
                    if (overallPostId == null)
                    {
                        return NotFound(
                            "There does not exist a comment with the commentId you provided."
                        );
                    }
                    else
                    {
                        isEncrypted = true;
                    }
                }
                else
                {
                    isEncrypted = false;
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble getting the overallPostId of the comment with the commentId you provided."
                );
            }
        }

        byte[] plaintextDataEncryptionKey = [];

        var authorsAndPostEncryptionStatusIfUserHasAccessToPost = await _postInfoFetchingService
        .getPostEncryptionStatusIfUserHasAccessToPost(
            authUserId,
            overallPostId,
            _httpClientWithMutualTLS
        );
        if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is Tuple<string, string>
        authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[
                    authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item2
                ],
                authorsAndPostEncryptionStatusIfUserHasAccessToPostErrorOutput.Item1
            );
        }
        else if (authorsAndPostEncryptionStatusIfUserHasAccessToPost is bool
        authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput)
        {
            isEncrypted = authorsAndPostEncryptionStatusIfUserHasAccessToPostSuccessOutput;

            if (isEncrypted)
            {
                try
                {
                    plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                    (
                        overallPostId,
                        _postgresContext,
                        _encryptionAndDecryptionService,
                        _redisCachingDatabase
                    );
                }
                catch
                {
                    return StatusCode(
                        500,
                        @"There was trouble in the process of obtaining the encryptedDataEncryptionKey and decrypting
                        that in order to decrypt the data of this encrypted post."
                    );
                }
            }
        }

        var resultOfRemovingLikeFromPostOrComment = await _postOrCommentLikingService.RemoveLikeFromPostOrComment(
            _postgresContext, overallPostId, commentId, authUserId, _encryptionAndDecryptionService,
            isEncrypted, plaintextDataEncryptionKey
        );

        if (resultOfRemovingLikeFromPostOrComment is bool resultOfRemovingLikeFromPostOrCommentAsBool)
        {
            return Ok(resultOfRemovingLikeFromPostOrCommentAsBool);
        }
        else
        {
            return StatusCode(
                ((Tuple <int, string>)resultOfRemovingLikeFromPostOrComment).Item1,
                ((Tuple <int, string>)resultOfRemovingLikeFromPostOrComment).Item2
            ); 
        }
    }


    [RequireMutualTLS]
    [HttpDelete("removeCaptionCommentsAndLikesOfPostAfterItsDeletion/{overallPostId}/{wasEncrypted}")]
    public async Task<IActionResult> RemoveCaptionCommentsAndLikesOfPostAfterItsDeletion(
        string overallPostId, bool wasEncrypted
    )
    {
        int numCaptionsDeleted = 0;

        try
        {
            if (!wasEncrypted)
            {
                numCaptionsDeleted = await _sqlServerContext
                    .unencryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
            }
            else
            {
                numCaptionsDeleted = await _sqlServerContext
                    .encryptedCaptionsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
            }
        }
        catch
        {
            return StatusCode(
                500,
                "There was trouble removing the caption, if any, of this post"
            );
        }


        int numPostLikesDeleted = 0;
        try
        {
            if (!wasEncrypted)
            {
                numPostLikesDeleted = await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
            }
            else
            {
                numPostLikesDeleted = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
            }
        }
        catch
        {
            return StatusCode(
                500,
                "There was trouble removing the likes(not of the comments), if any, of this post"
            );
        }
        
        List<int> idsOfCommentsToDelete = new List<int>();
        try
        {
            if (!wasEncrypted)
            {
                idsOfCommentsToDelete = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.id)
                    .ToListAsync();
            }
            else
            {
                idsOfCommentsToDelete = await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.id)
                    .ToListAsync();
            }
        }
        catch
        {
            return StatusCode(
                500,
                "There was trouble fetching the ids of the comments to delete, if any, of this post"
            );
        }

        HashSet<int> setOfIdsOfCommentsToDelete = new HashSet<int>(idsOfCommentsToDelete);
        int numCommentLikesDeleted = 0;
        if (setOfIdsOfCommentsToDelete.Count > 0)
        {
            try
            {
                if (!wasEncrypted)
                {
                    await _sqlServerContext
                        .unencryptedCommentsOfPosts
                        .Where(x => setOfIdsOfCommentsToDelete.Contains(x.id))
                        .ExecuteDeleteAsync();

                    numCommentLikesDeleted = await _postgresContext
                        .unencryptedPostOrCommentLikes
                        .Where(x => setOfIdsOfCommentsToDelete.Contains(x.commentId ?? -1))
                        .ExecuteDeleteAsync();
                }
                else
                {
                    await _sqlServerContext
                        .encryptedCommentsOfPosts
                        .Where(x => setOfIdsOfCommentsToDelete.Contains(x.id))
                        .ExecuteDeleteAsync();
                    
                    numCommentLikesDeleted = await _postgresContext
                        .encryptedPostOrCommentLikes
                        .Where(x => setOfIdsOfCommentsToDelete.Contains(x.commentId ?? -1))
                        .ExecuteDeleteAsync();
                }
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble removing the comments and likes of comments, if any, of this post"
                );
            }
        }

        if (wasEncrypted)
        {
            try
            {
                await _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
                
                await _redisCachingDatabase.HashDeleteAsync(
                    "Posts and their Encrypted Data-Encryption-Keys",
                    overallPostId
                );

                await _encryptionAndDecryptionService.DeleteCustomerMasterKey(
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
            }
            catch
            {
                return StatusCode(
                    500,
                    "There was trouble deleting the encryption-info of this now-to-be-deleted-encrypted-post"
                );
            }
        }

        return Ok(new {
            captionWasFoundAndDeleted = numCaptionsDeleted == 1,
            numPostLikesDeleted,
            numCommentsDeleted = setOfIdsOfCommentsToDelete.Count,
            numCommentLikesDeleted,
        });
    }

    [RequireMutualTLS]
    [HttpPost("getCaptionsOfMultiplePosts")]
    public async Task<IActionResult> GetCaptionsOfMultiplePosts(
        [FromBody] Dictionary<string, bool> overallPostIdsAndIfTheyAreEncrypted
    )
    {
        string[] overallPostIds = overallPostIdsAndIfTheyAreEncrypted.Keys.ToArray();


        Dictionary<string, UnencryptedCaptionOfPost?> overallPostIdsAndTheirCaptions =
        new Dictionary<string, UnencryptedCaptionOfPost?>();

        Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDataEncryptionKeys =
        new Dictionary<string, byte[]>();

        foreach (string overallPostId in overallPostIds)
        {
            overallPostIdsAndTheirCaptions[overallPostId] = null;
        }

        string errorMessage = "";
        HashSet<string> setOfOverallPostIdsOfUncachedUnencryptedCaptions = new HashSet<string>();
        HashSet<string> setOfOverallPostIdsOfUncachedEncryptedCaptions = new HashSet<string>();
        RedisValue[] redisOverallPostIdFields = Array.ConvertAll(overallPostIds, field => (RedisValue) field);
        RedisValue[] redisCaptionValues = [];
        bool redisCachedCaptionsHaveBeenFetchedSuccessfully = true;
        try
        {
            redisCaptionValues = await _redisCachingDatabase.HashGetAsync(
                "Posts and their Captions",
                redisOverallPostIdFields
            );
        }
        catch
        {
            errorMessage += "• There was trouble getting the Redis-cached captions of each of the posts.\n";  

            foreach(string overallPostId in overallPostIds)
            {
                if (overallPostIdsAndIfTheyAreEncrypted[overallPostId])
                {
                    setOfOverallPostIdsOfUncachedEncryptedCaptions.Add(overallPostId);
                }
                else
                {
                    setOfOverallPostIdsOfUncachedUnencryptedCaptions.Add(overallPostId);
                }
            }  
            redisCachedCaptionsHaveBeenFetchedSuccessfully = false; 
        }

        if (redisCachedCaptionsHaveBeenFetchedSuccessfully)
        {
            for (int i = 0; i < overallPostIds.Length; i++)
            {
                string overallPostId = overallPostIds[i];
                bool postIsEncrypted = overallPostIdsAndIfTheyAreEncrypted[overallPostId];
                string? stringifiedCaptionInfoOfPost = redisCaptionValues[i];
                
                if (stringifiedCaptionInfoOfPost == null)
                {
                    if (postIsEncrypted)
                    {
                        setOfOverallPostIdsOfUncachedEncryptedCaptions.Add(overallPostId);
                    }
                    else
                    {
                        setOfOverallPostIdsOfUncachedUnencryptedCaptions.Add(overallPostId);
                    }
                }
                else if (stringifiedCaptionInfoOfPost == "N/A")
                {
                    overallPostIdsAndTheirCaptions[overallPostId] = null;
                }
                else
                {
                    Dictionary<string, object>? captionInfoOfPost = JsonSerializer.Deserialize<Dictionary<string, object>>(
                        stringifiedCaptionInfoOfPost
                    );

                    bool captionHasBeenDecryptedSuccessfully = false;

                    if (postIsEncrypted)
                    {
                        byte[] plaintextDataEncryptionKey = [];

                        bool plaintextDataEncryptionKeyWasFound = true;

                        if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                        {
                            plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                        }
                        else
                        {
                            try
                            {
                                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                                (
                                    overallPostId,
                                    _postgresContext,
                                    _encryptionAndDecryptionService,
                                    _redisCachingDatabase
                                );

                                overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                            }
                            catch
                            {
                                plaintextDataEncryptionKeyWasFound = false;
                            }
                        }

                        if (!plaintextDataEncryptionKeyWasFound)
                        {
                            errorMessage += @$"• There was trouble decrypting the caption of the encrypted post with id
                            {overallPostId}\n";
                        }
                        else
                        {
                           string authorIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                                (byte[]) captionInfoOfPost!["encryptedAuthorId"],
                                plaintextDataEncryptionKey,
                                (byte[]) captionInfoOfPost!["authorIdEncryptionIv"],
                                (byte[]) captionInfoOfPost!["encryptionAuthTag"]
                            );
                            int authorId = int.Parse(authorIdAsString);

                            captionInfoOfPost!["authorId"] = authorId;
                            
                            string captionContent = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                                (byte[]) captionInfoOfPost!["encryptedContent"],
                                plaintextDataEncryptionKey,
                                (byte[]) captionInfoOfPost!["encryptionIv"],
                                (byte[]) captionInfoOfPost!["encryptionAuthTag"]
                            );

                            captionInfoOfPost!["authorId"] = authorId;
                            captionHasBeenDecryptedSuccessfully = true;
                        }
                    }

                    if (!postIsEncrypted || (postIsEncrypted && captionHasBeenDecryptedSuccessfully))
                    {
                        overallPostIdsAndTheirCaptions[overallPostId] = new UnencryptedCaptionOfPost(
                            overallPostId,
                            (bool) captionInfoOfPost!["isEdited"],
                            (DateTime) captionInfoOfPost!["datetime"],
                            (int) captionInfoOfPost!["authorId"],
                            (string) captionInfoOfPost!["content"]
                        );
                    }
                }
            }
        }
            
        List<HashEntry> newEntriesForRedisCaptionCaching = new List<HashEntry>();
        
        if (setOfOverallPostIdsOfUncachedEncryptedCaptions.Count > 0)
        {
            try
            {
                List<EncryptedCaptionOfPost> encryptedCaptionsOfPosts = await _sqlServerContext
                    .encryptedCaptionsOfPosts
                    .Where(x => setOfOverallPostIdsOfUncachedEncryptedCaptions.Contains(x.overallPostId))
                    .ToListAsync();
                
                foreach (EncryptedCaptionOfPost encryptedCaptionOfPost in encryptedCaptionsOfPosts)
                {
                    string overallPostId = encryptedCaptionOfPost.overallPostId;
                    newEntriesForRedisCaptionCaching.Add(
                        new HashEntry(overallPostId, JsonSerializer.Serialize(encryptedCaptionOfPost))
                    );
                    byte[] plaintextDataEncryptionKey = [];

                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );

                            overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (!plaintextDataEncryptionKeyWasFound)
                    {
                        errorMessage += @$"• There was trouble decrypting the caption of the encrypted post with id
                        {overallPostId}\n";
                    }
                    else
                    {
                        try
                        {
                            string authorIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                                encryptedCaptionOfPost.encryptedAuthorId,
                                plaintextDataEncryptionKey,
                                encryptedCaptionOfPost.encryptionIv,
                                encryptedCaptionOfPost.encryptionAuthTag
                            );
                            int authorId = int.Parse(authorIdAsString);
                            
                            string captionContent = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                                encryptedCaptionOfPost.encryptedContent,
                                plaintextDataEncryptionKey,
                                encryptedCaptionOfPost.encryptionIv,
                                encryptedCaptionOfPost.encryptionAuthTag
                            );

                            overallPostIdsAndTheirCaptions[overallPostId] = new UnencryptedCaptionOfPost(
                                overallPostId,
                                encryptedCaptionOfPost.isEdited,
                                encryptedCaptionOfPost.datetime,
                                authorId,
                                captionContent
                            );
                        }
                        catch
                        {
                            errorMessage += @$"• There was trouble decrypting the caption of the encrypted post with id
                            {overallPostId}\n";
                        }
                    }
                }
            }
            catch
            {
                foreach (string overallPostId in setOfOverallPostIdsOfUncachedEncryptedCaptions)
                {
                    errorMessage += @$"• There was trouble retrieving the caption of the encrypted post with id
                    {overallPostId}\n";
                }
            }
        }

        if (setOfOverallPostIdsOfUncachedUnencryptedCaptions.Count > 0)
        {
            try
            {
                List<UnencryptedCaptionOfPost> unencryptedCaptionsOfPosts = await _sqlServerContext
                    .unencryptedCaptionsOfPosts
                    .Where(x => setOfOverallPostIdsOfUncachedUnencryptedCaptions.Contains(x.overallPostId))
                    .ToListAsync();
                
                foreach (UnencryptedCaptionOfPost unencryptedCaptionOfPost in unencryptedCaptionsOfPosts)
                {
                    newEntriesForRedisCaptionCaching.Add(
                        new HashEntry(
                            unencryptedCaptionOfPost.overallPostId,
                            JsonSerializer.Serialize(unencryptedCaptionOfPost)
                        )
                    );
                    overallPostIdsAndTheirCaptions[unencryptedCaptionOfPost.overallPostId] = unencryptedCaptionOfPost;
                }
            }
            catch
            {
                foreach (string overallPostId in setOfOverallPostIdsOfUncachedUnencryptedCaptions)
                {
                    errorMessage += @$"• There was trouble retrieving the caption of the unencrypted post with id
                    {overallPostId}\n";
                }
            }
        }

        if (newEntriesForRedisCaptionCaching.Count > 0)
        {
            try
            {
                await _redisCachingDatabase.HashSetAsync(
                    "Posts and their Captions",
                    newEntriesForRedisCaptionCaching.ToArray()
                );
            }
            catch
            {
                //pass
            }
        }


        return Ok(new Dictionary<string, object> {
            { "overallPostIdsAndTheirCaptions", overallPostIdsAndTheirCaptions },
            { "errorMessage", errorMessage }
        });
    }


    [RequireMutualTLS]
    [HttpPost("addCaptionToPost/{authUserId}/{overallPostId}/{isEncrypted}")]
    public async Task<IActionResult> AddCaptionToPost(
        int authUserId, string overallPostId, bool isEncrypted, [FromBody] Dictionary<string, string> captionInfo
    )
    {
        string content = captionInfo["content"];

         var addCaptionToPostResult = await _captionService.AddCaptionToPost(
            authUserId, overallPostId, content, isEncrypted, _encryptionAndDecryptionService,
            _postgresContext, _redisCachingDatabase, _sqlServerContext
        );

        if (addCaptionToPostResult is Tuple<string, string> addCaptionToPostResultErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[addCaptionToPostResultErrorOutput.Item2],
                addCaptionToPostResultErrorOutput.Item1
            );
        }
        return Ok(true);
    }


    [RequireMutualTLS]
    [HttpPatch("editCaptionOfPost/{overallPostId}/{isEncrypted}")]
    public async Task<IActionResult> EditCaptionOfPost(
        string overallPostId, bool isEncrypted, [FromBody] Dictionary<string, string> captionInfo
    )
    {
        string newContent = captionInfo["newContent"];

        var editCaptionOfPostResult = await _captionService.EditCaptionOfPost(
            overallPostId, newContent, isEncrypted, _encryptionAndDecryptionService,
            _postgresContext, _redisCachingDatabase, _sqlServerContext
        );

        if (editCaptionOfPostResult is Tuple<string, string> editCaptionOfPostResultErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[editCaptionOfPostResultErrorOutput.Item2],
                editCaptionOfPostResultErrorOutput.Item1
            );
        }
        
        return Ok((bool) editCaptionOfPostResult);
    }


    [RequireMutualTLS]
    [HttpDelete("deleteCaptionOfPost/{overallPostId}/{isEncrypted}")]
    public async Task<IActionResult> DeleteCaptionOfPost(
        string overallPostId, bool isEncrypted
    )
    {
        var deleteCaptionOfPostResult = await _captionService.DeleteCaptionOfPost(
            overallPostId, isEncrypted, _redisCachingDatabase, _sqlServerContext
        );

        if (deleteCaptionOfPostResult is Tuple<string, string> deleteCaptionOfPostResultErrorOutput)
        {
            return StatusCode(
                _stringLabelToIntStatusCodeMappings[deleteCaptionOfPostResultErrorOutput.Item2],
                deleteCaptionOfPostResultErrorOutput.Item1
            );
        }
        
        return Ok((bool) deleteCaptionOfPostResult);
    }


    [RequireMutualTLS]
    [HttpPost("getNumLikesNumCommentsAndAtMost3LikersFollowedByAuthUserForMultiplePosts/{authUserId}")]
    public async Task<IActionResult> GetNumLikesNumCommentsAndAtMost3LikersFollowedByAuthUserForMultiplePosts(
        int authUserId, [FromBody] Dictionary<string, bool> overallPostIdsAndIfTheyAreEncrypted
    )
    {
        bool authUserIsAnonymousGuest = authUserId == -1;
        string[] overallPostIds = overallPostIdsAndIfTheyAreEncrypted.Keys.ToArray();
        HashSet<string> setOfOverallPostIdsOfEncryptedPosts = new HashSet<string>();
        HashSet<string> setOfOverallPostIdsOfUnencryptedPosts = new HashSet<string>();
        Dictionary<string, Dictionary<string, object>> postsAndTheirWantedInfo =
        new Dictionary<string, Dictionary<string, object>>();

        foreach(string overallPostId in overallPostIds)
        {
            postsAndTheirWantedInfo[overallPostId] = new Dictionary<string, object> {
                {"numLikes", 0},
                {"numComments", 0},
                {"likersFollowedByAuthUser", new List<int>()}
            };

            if (overallPostIdsAndIfTheyAreEncrypted[overallPostId])
            {
                setOfOverallPostIdsOfEncryptedPosts.Add(overallPostId);
            }
            else
            {
                setOfOverallPostIdsOfUnencryptedPosts.Add(overallPostId);
            }
        }

        string errorMessage = "";

        if (setOfOverallPostIdsOfEncryptedPosts.Count > 0)
        {
            try
            {
                Dictionary<string, int> overallPostIdsAndTheirNumLikes = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfEncryptedPosts.Contains(x.overallPostId ?? ""))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostId in overallPostIdsAndTheirNumLikes.Keys)
                {
                    postsAndTheirWantedInfo[overallPostId]["numLikes"] = overallPostIdsAndTheirNumLikes[overallPostId];
                }
            }
            catch
            {
                errorMessage += "• There was trouble getting the numLikes of each of the encrypted posts\n";
            }

            try
            {
                Dictionary<string, int> overallPostIdsAndTheirNumComments = await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfEncryptedPosts.Contains(x.overallPostId))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostId in overallPostIdsAndTheirNumComments.Keys)
                {
                    postsAndTheirWantedInfo[overallPostId]["numComments"] = overallPostIdsAndTheirNumComments[overallPostId];
                }
            }
            catch
            {
                errorMessage += "• There was trouble getting the numComments of each of the encrypted posts\n";
            }
        }


        if (setOfOverallPostIdsOfUnencryptedPosts.Count > 0)
        {
            try
            {
                Dictionary<string, int> overallPostIdsAndTheirNumLikes = await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfUnencryptedPosts.Contains(x.overallPostId ?? ""))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostId in overallPostIdsAndTheirNumLikes.Keys)
                {
                    postsAndTheirWantedInfo[overallPostId]["numLikes"] = overallPostIdsAndTheirNumLikes[overallPostId];
                }
            }
            catch
            {
                errorMessage += "• There was trouble getting the numLikes of each of the unencrypted posts\n";
            }

            try
            {
                Dictionary<string, int> overallPostIdsAndTheirNumComments = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfUnencryptedPosts.Contains(x.overallPostId ?? ""))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostId in overallPostIdsAndTheirNumComments.Keys)
                {
                    postsAndTheirWantedInfo[overallPostId]["numComments"] = overallPostIdsAndTheirNumComments[overallPostId];
                }
            }
            catch
            {
                errorMessage += "• There was trouble getting the numComments of each of the unencrypted posts\n";
            }
        }


        int[]? followingsOfAuthUser = null;
        if (!authUserIsAnonymousGuest)
        {
            try
            {
                HttpRequestMessage request = new HttpRequestMessage(
                    HttpMethod.Post,
                    $"http://34.111.89.101/api/Home-Page/djangoBackend2/graphql"
                );

                request.Content = new StringContent(
                    JsonSerializer.Serialize(new
                    {
                        query = @"query ($authUserId: Int!) {
                            getFollowingsOfUser(authUserId: $authUserId)
                        }",
                        variables = new
                        {
                            authUserId
                        }
                    }),
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage response = await _httpClientWithMutualTLS.SendAsync(request);            

                if (!response.IsSuccessStatusCode)
                {
                    errorMessage += "• The djangoBackend2 server had trouble retrieving the followings of the authUser.\n";
                }
                else
                {
                    string stringifiedResponseData = await response.Content.ReadAsStringAsync();
                    followingsOfAuthUser = JsonSerializer.Deserialize<int[]>(
                        stringifiedResponseData
                    );
                }
            }
            catch
            {
                errorMessage += @"• There was trouble connecting to the djangoBackend2 server to get the followings
                of the authUser.\n";
            }
        }

        if (!authUserIsAnonymousGuest && followingsOfAuthUser != null && followingsOfAuthUser.Length > 0)
        {
            HashSet<int> setOfFollowingsOfAuthUser = new HashSet<int>(followingsOfAuthUser);

            if (setOfOverallPostIdsOfEncryptedPosts.Count > 0)
            {

                Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDataEncryptionKeys =
                new Dictionary<string,byte[]>();
                HashSet<string> setOverallPostIdsThatAlreadyFound3LikersFollowedByAuthUser = new HashSet<string>();
                int numberOfOverallPostIdsInTotal = overallPostIds.Length;
                
                try
                {
                   var atMost3LikersFollowedByAuthUserOfEachPost = await _postgresContext
                        .encryptedPostOrCommentLikes
                        .Where(x => setOfOverallPostIdsOfUnencryptedPosts.Contains(x.overallPostId ?? ""))
                        .OrderByDescending(x => x.datetime)
                        .Select(x => new { x.overallPostId, x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag})
                        .ToListAsync();
                    
                    foreach(var authUserFollowedLikeOfPost in atMost3LikersFollowedByAuthUserOfEachPost)
                    {
                        string overallPostIdOfLikedPost = authUserFollowedLikeOfPost.overallPostId!;
                        if (
                            setOverallPostIdsThatAlreadyFound3LikersFollowedByAuthUser.Contains(overallPostIdOfLikedPost)
                        )
                        {
                            continue;
                        }

                        byte[] plaintextDataEncryptionKey = [];
                        bool plaintextDataEncryptionKeyWasFound = true;

                        if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostIdOfLikedPost))
                        {
                            plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[
                                overallPostIdOfLikedPost
                            ];
                        }
                        else
                        {
                            try
                            {
                                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                                (
                                    overallPostIdOfLikedPost,
                                    _postgresContext,
                                    _encryptionAndDecryptionService,
                                    _redisCachingDatabase
                                );
                                overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostIdOfLikedPost] =
                                plaintextDataEncryptionKey;
                            }
                            catch
                            {
                                errorMessage += @$"There was trouble getting the plaintextDataEncryptionKey for decrypting
                                one of the likers of the post with this overallPostId: {overallPostIdOfLikedPost}";
                                plaintextDataEncryptionKeyWasFound = false;
                            }
                        }

                        if (plaintextDataEncryptionKeyWasFound)
                        {
                            string likerIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                                authUserFollowedLikeOfPost.encryptedLikerId,
                                plaintextDataEncryptionKey,
                                authUserFollowedLikeOfPost.likerIdEncryptionIv,
                                authUserFollowedLikeOfPost.likerIdEncryptionAuthTag
                            );
                            int likerId = int.Parse(likerIdAsString);

                            if (setOfFollowingsOfAuthUser.Contains(likerId))
                            {
                                ((List<int>)postsAndTheirWantedInfo[overallPostIdOfLikedPost]["likersFollowedByAuthUser"])
                                .Add(likerId);

                                if (
                                    ((List<int>)postsAndTheirWantedInfo[overallPostIdOfLikedPost]["likersFollowedByAuthUser"])
                                    .Count ==3
                                )
                                {
                                    setOverallPostIdsThatAlreadyFound3LikersFollowedByAuthUser.Add(overallPostIdOfLikedPost);

                                    if (
                                        setOverallPostIdsThatAlreadyFound3LikersFollowedByAuthUser.Count ==
                                        numberOfOverallPostIdsInTotal
                                    )
                                    {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                catch
                {
                    errorMessage += @"• There was trouble getting the likersFollowedByAuthUser of each of the
                    encrypted posts.\n";
                }
            }

            if (setOfOverallPostIdsOfUnencryptedPosts.Count > 0)
            {
                try
                {
                    var atMost3LikersFollowedByAuthUserOfEachPost = await _postgresContext
                        .unencryptedPostOrCommentLikes
                        .Where(x => setOfOverallPostIdsOfUnencryptedPosts.Contains(x.overallPostId ?? "") &&
                            setOfFollowingsOfAuthUser.Contains(x.likerId)
                        )
                        .OrderByDescending(x => x.datetime)
                        .GroupBy(x => x.overallPostId)
                        .Select(g => g.Take(3))
                        .SelectMany(g => g)
                        .Select(x => new {x.overallPostId, x.likerId})
                        .ToListAsync();
                    
                    foreach(var authUserFollowedLikerOfPost in atMost3LikersFollowedByAuthUserOfEachPost)
                    {
                        string overallPostIdOfLikedPost = authUserFollowedLikerOfPost.overallPostId!;

                        ((List<int>)postsAndTheirWantedInfo[overallPostIdOfLikedPost]["likersFollowedByAuthUser"])
                        .Add(authUserFollowedLikerOfPost.likerId);
                    }
                }
                catch
                {
                    errorMessage += @"• There was trouble getting the likersFollowedByAuthUser of
                    each of the unencrypted posts.\n";
                }
            }
        }

        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage },
            { "postsAndTheirWantedInfo", postsAndTheirWantedInfo }
        });
    }


    [RequireMutualTLS]
    [HttpGet("forHomePageFeedGetTheTopUsersBasedOnNumLikesNumCommentsNumPostViewsAndNumAdLinkClicks/{authUserId}")]
    public async Task<IActionResult> ForHomePageFeedGetTheTopUsersBasedOnNumLikesNumCommentsNumPostViewsAndNumAdLinkClicks(
        int authUserId
    )
    {
        List<int> top10UsersThatAuthUserFollowsAndEngagesWithTheMost = new List<int>();
        List<int> top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost = new List<int>();

        string errorMessage = "";

        int[] userIdsOfAllPublicAccounts = [];
        int[] authUserFollowings = [];
        HashSet<int> setOfAuthUserFollowings = new HashSet<int>();
        int[] authUserBlockings = [];
        HashSet<int> setOfAuthUserBlockings = new HashSet<int>();
        Dictionary<int, Dictionary<string, int>> usersAndTheirStats = new Dictionary<int, Dictionary<string, int>>();
    
        int[] usersWithSponsoredPostsThatAuthUserCanView = [];
        HashSet<int> setOfUsersWithSponsoredPostsThatAuthUserCanView = new HashSet<int>();
        HashSet<string> setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView  = new HashSet<string>();

        Dictionary<string, int[]> overallPostIdsAndTheirAuthors = new Dictionary<string, int[]>();
        HashSet<string> setOfOverallPostIdsOfAuthUserFollowings = new HashSet<string>();

        bool authUserIsAnonymousGuest = authUserId == -1;

        if (authUserIsAnonymousGuest)
        {
            var resultOfGettingUserIdsOfAllPublicAccounts = await _userInfoFetchingService.GetTheUserIdsOfAllThePublicAccounts(
                _httpClientWithMutualTLS
            );
            if (resultOfGettingUserIdsOfAllPublicAccounts is Tuple<string, string>
            resultOfGettingUserIdsOfAllPublicAccountsErrorOutput)
            {
                return StatusCode(
                    _stringLabelToIntStatusCodeMappings[resultOfGettingUserIdsOfAllPublicAccountsErrorOutput.Item2],
                    resultOfGettingUserIdsOfAllPublicAccountsErrorOutput.Item1
                );
            }
            userIdsOfAllPublicAccounts = (int[]) resultOfGettingUserIdsOfAllPublicAccounts;
            

            var resultOfGettingTop500MostFollowedPublicUsers = await _userInfoFetchingService.GetTheMostFollowedUsersInList(
                _httpClientWithMutualTLS, userIdsOfAllPublicAccounts, 500
            );
            if (resultOfGettingTop500MostFollowedPublicUsers is Tuple<string, string>
            resultOfGettingTop500MostFollowedPublicUsersErrorOutput)
            {
                return StatusCode(
                    _stringLabelToIntStatusCodeMappings[resultOfGettingTop500MostFollowedPublicUsersErrorOutput.Item2],
                    resultOfGettingTop500MostFollowedPublicUsersErrorOutput.Item1 + @" of all the public accounts"
                );
            }
            authUserFollowings = (int[]) resultOfGettingTop500MostFollowedPublicUsers;
            setOfAuthUserFollowings = new HashSet<int>(authUserFollowings);
            foreach(int userFollowedByAuthUser in authUserFollowings)
            {
                usersAndTheirStats[userFollowedByAuthUser] = new Dictionary<string, int> {
                    {"numLikes", 0},
                    {"numComments", 0},
                    {"numPostViews", 0}
                };
            }

            var resultOfGettingOverallPostIdsOfEachUserInList = await _postInfoFetchingService
            .GetOverallPostIdsOfEachUserInList(
                _httpClientWithMutualTLS, authUserFollowings, 2, true
            );
            if (resultOfGettingOverallPostIdsOfEachUserInList is Tuple<string, string>
            resultOfGettingOverallPostIdsOfEachUserInListErrorOutput)
            {
                errorMessage += "• " + resultOfGettingOverallPostIdsOfEachUserInListErrorOutput.Item1 + @" of the top-500 most
                followed public accounts\n";

                return Ok(new Dictionary<string, object> {
                    { "errorMessage", errorMessage },
                    { "authUserFollowings", authUserFollowings },
                    { "usersWithSponsoredPostsThatAuthUserCanView", new List<int>()},
                    { "top10UsersThatAuthUserFollowsAndEngagesWithTheMost", authUserFollowings.ToList().Slice(0,10) },
                    { "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost", new List<int>() }
                });
            }
            overallPostIdsAndTheirAuthors = (Dictionary<string, int[]>) resultOfGettingOverallPostIdsOfEachUserInList;
            setOfOverallPostIdsOfAuthUserFollowings = new HashSet<string>(overallPostIdsAndTheirAuthors.Keys);

            try
            {
                Dictionary<string, int> numUnencryptedLikesReceivedByPostsMadeByUsersInAuthUserFollowings = await
                _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId!))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                foreach(string overallPostIdOfUnencryptedLikedPost in
                numUnencryptedLikesReceivedByPostsMadeByUsersInAuthUserFollowings.Keys)
                {
                    int[] authorsOfUnencryptedLikedPostThatAreFollowedByAuthUser = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedLikedPost
                    ];
                    int numLikesOfUnencryptedLikedPost = numUnencryptedLikesReceivedByPostsMadeByUsersInAuthUserFollowings[
                        overallPostIdOfUnencryptedLikedPost
                    ];

                    foreach(int author in authorsOfUnencryptedLikedPostThatAreFollowedByAuthUser)
                    {
                        usersAndTheirStats[author]["numLikes"] += numLikesOfUnencryptedLikedPost;
                    }
                }
                
                Dictionary<string, int> numEncryptedLikesReceivedByPostsMadeByUsersInAuthUserFollowings = await
                _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId!))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostIdOfEncryptedLikedPost in
                numEncryptedLikesReceivedByPostsMadeByUsersInAuthUserFollowings.Keys)
                {
                    int[] authorsOfEncryptedLikedPostThatAreFollowedByAuthUser = overallPostIdsAndTheirAuthors[
                        overallPostIdOfEncryptedLikedPost
                    ];
                    int numLikesOfEncryptedLikedPost = numEncryptedLikesReceivedByPostsMadeByUsersInAuthUserFollowings[
                        overallPostIdOfEncryptedLikedPost
                    ];
                    foreach(int author in authorsOfEncryptedLikedPostThatAreFollowedByAuthUser)
                    {
                        usersAndTheirStats[author]["numLikes"] += numLikesOfEncryptedLikedPost;
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the numLikes received by each of the top-500 most followed public
                accounts.\n";
            }

            try
            {
                Dictionary<string, int> numUnencryptedCommentsReceivedByPostsMadeByUsersInAuthUserFollowings = await
                _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId))
                    .GroupBy(x => x.overallPostId)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                foreach(string overallPostIdOfUnencryptedCommentedPost in
                numUnencryptedCommentsReceivedByPostsMadeByUsersInAuthUserFollowings.Keys)
                {
                    int[] authorsOfUnencryptedCommentedPostThatAreFollowedByAuthUser = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedCommentedPost
                    ];
                    int numCommentsOfUnencryptedCommentedPost = numUnencryptedCommentsReceivedByPostsMadeByUsersInAuthUserFollowings[
                        overallPostIdOfUnencryptedCommentedPost
                    ];
                    foreach(int author in authorsOfUnencryptedCommentedPostThatAreFollowedByAuthUser)
                    {
                        usersAndTheirStats[author]["numComments"] += numCommentsOfUnencryptedCommentedPost;
                    }
                }
                
                Dictionary<string, int> numEncryptedCommentsReceivedByPostsMadeByUsersInAuthUserFollowings = await
                _sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId))
                    .GroupBy(x => x.overallPostId)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostIdOfEncryptedCommentedPost in
                numEncryptedCommentsReceivedByPostsMadeByUsersInAuthUserFollowings.Keys)
                {
                    int[] authorsOfEncryptedCommentedPostThatAreFollowedByAuthUser = overallPostIdsAndTheirAuthors[
                        overallPostIdOfEncryptedCommentedPost
                    ];
                    int numCommentsOfEncryptedCommentedPost = numEncryptedCommentsReceivedByPostsMadeByUsersInAuthUserFollowings[
                        overallPostIdOfEncryptedCommentedPost
                    ];
                    foreach(int author in authorsOfEncryptedCommentedPostThatAreFollowedByAuthUser)
                    {
                        usersAndTheirStats[author]["numComments"] += numCommentsOfEncryptedCommentedPost;
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the numComments received by each of the top-500
                most followed public accounts.\n";
            }
            
            var resultOfGettingNumPostViewsOfEachOverallPostIdInList = await _postInfoFetchingService
            .GetNumPostViewsOfEachOverallPostIdInList(
                _httpClientWithMutualTLS, setOfOverallPostIdsOfAuthUserFollowings.ToList()
            );
            if (resultOfGettingNumPostViewsOfEachOverallPostIdInList is Tuple<string, string>
            resultOfGettingNumPostViewsOfEachOverallPostIdInListErrorOutput)
            {
                errorMessage += "• " + resultOfGettingNumPostViewsOfEachOverallPostIdInListErrorOutput.Item1 + @" of posts
                made by the top-500 most followed public accounts\n";
            }
            else
            {
                Dictionary<string, int> overallPostIdsAndTheirNumViews = (Dictionary<string, int>)
                resultOfGettingNumPostViewsOfEachOverallPostIdInList;

                foreach(string overallPostId in overallPostIdsAndTheirNumViews.Keys)
                {
                    int[] authorsOfPost = overallPostIdsAndTheirAuthors[overallPostId];
                    int numViewsOfPost = overallPostIdsAndTheirNumViews[overallPostId];
                    foreach(int author in authorsOfPost)
                    {
                        usersAndTheirStats[author]["numPostViews"] += numViewsOfPost;
                    }
                }
            }

            foreach(int userFollowedByAuthUser in usersAndTheirStats.Keys)
            {
                usersAndTheirStats[userFollowedByAuthUser]["sumOfNumLikesNumCommentsAndNumPostViews"] =
                usersAndTheirStats[userFollowedByAuthUser]["numLikes"] + 
                usersAndTheirStats[userFollowedByAuthUser]["numComments"] +
                usersAndTheirStats[userFollowedByAuthUser]["numPostsViews"];
            }

            top10UsersThatAuthUserFollowsAndEngagesWithTheMost = usersAndTheirStats
                .OrderByDescending(dict => dict.Value["sumOfNumLikesNumCommentsAndNumPostViews"])
                .Select(dict => dict.Key)
                .Take(10)
                .ToList();
    

            var resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPost = await _postInfoFetchingService.
            GetOverallPostIdsOfEachSponsoredPostThatAuthUserCanView(
                _httpClientWithMutualTLS, new List<int>(), new List<int>(), 2
            );
            if (resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPost is Tuple<string, string>
            resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPostErrorOutput)
            {
                errorMessage += "• " +  resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPostErrorOutput.Item1 + "\n";
                return Ok(new Dictionary<string, object> {
                    { "errorMessage", errorMessage },
                    { "authUserFollowings", authUserFollowings },
                    { "usersWithSponsoredPostsThatAuthUserCanView", new List<int>()},
                    { "top10UsersThatAuthUserFollowsAndEngagesWithTheMost", top10UsersThatAuthUserFollowsAndEngagesWithTheMost },
                    { "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost", new List<int>() }
                });
            }
            overallPostIdsAndTheirAuthors = (Dictionary<string, int[]>) resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPost;
            
            setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView = new HashSet<string>(
                overallPostIdsAndTheirAuthors.Keys
            );
            foreach(string overallPostId in setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView)
            {
                int[] authorsOfSponsoredPost = overallPostIdsAndTheirAuthors[overallPostId];
                setOfUsersWithSponsoredPostsThatAuthUserCanView.UnionWith(authorsOfSponsoredPost);
            }

            usersWithSponsoredPostsThatAuthUserCanView = setOfUsersWithSponsoredPostsThatAuthUserCanView.ToArray();
            usersAndTheirStats = new Dictionary<int, Dictionary<string, int>>();
            foreach(int userWithSponsoredPostThatAuthUserCanView in usersWithSponsoredPostsThatAuthUserCanView)
            {
                usersAndTheirStats[userWithSponsoredPostThatAuthUserCanView] = new Dictionary<string, int>
                {
                    {"numLikes", 0},
                    {"numComments", 0},
                    {"numAdLinkClicks", 0}
                };
            }

            try
            {
                var numUnencryptedLikesReceivedBySponsoredPostsThatAuthUserCanView = await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(x.overallPostId!))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                foreach(string overallPostIdOfUnencryptedLikedPost in
                numUnencryptedLikesReceivedBySponsoredPostsThatAuthUserCanView.Keys)
                {
                    int[] authorsOfUnencryptedLikedSponsoredPost = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedLikedPost
                    ];
                    int numLikesOfUnencryptedLikedPost = numUnencryptedLikesReceivedBySponsoredPostsThatAuthUserCanView[
                        overallPostIdOfUnencryptedLikedPost
                    ];
                    foreach(int author in authorsOfUnencryptedLikedSponsoredPost)
                    {
                        usersAndTheirStats[author]["numLikes"] += numLikesOfUnencryptedLikedPost;
                    }
                }
                
                var numEncryptedLikesReceivedBySponsoredPostsThatAuthUserCanView = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(x.overallPostId!))
                    .GroupBy(x => x.overallPostId!)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostIdOfEncryptedLikedPost in
                numEncryptedLikesReceivedBySponsoredPostsThatAuthUserCanView.Keys)
                {
                    int[] authorsOfEncryptedLikedSponsoredPost = overallPostIdsAndTheirAuthors[
                        overallPostIdOfEncryptedLikedPost
                    ];
                    int numLikesOfEncryptedLikedSponsoredPost = numEncryptedLikesReceivedBySponsoredPostsThatAuthUserCanView[
                        overallPostIdOfEncryptedLikedPost
                    ];
                    foreach(int author in authorsOfEncryptedLikedSponsoredPost)
                    {
                        usersAndTheirStats[author]["numLikes"] += numLikesOfEncryptedLikedSponsoredPost;
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the total numLikes of sponsored-posts for each of the users who
                have posted sponsored posts in the last two months that are visible to the authUser.\n";
            }

            try
            {
                var numUnencryptedCommentsReceivedBySponsoredPostsThatAuthUserCanView = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(x.overallPostId))
                    .GroupBy(x => x.overallPostId)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                foreach(string overallPostIdOfUnencryptedCommentedPost in
                numUnencryptedCommentsReceivedBySponsoredPostsThatAuthUserCanView.Keys)
                {
                    int[] authorsOfUnencryptedCommentedSponsoredPost = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedCommentedPost
                    ];
                    int numCommentsOfUnencryptedCommentedSponsoredPost = numUnencryptedCommentsReceivedBySponsoredPostsThatAuthUserCanView[
                        overallPostIdOfUnencryptedCommentedPost
                    ];
                    foreach(int author in authorsOfUnencryptedCommentedSponsoredPost)
                    {
                        usersAndTheirStats[author]["numComments"] += numCommentsOfUnencryptedCommentedSponsoredPost;
                    }
                }
                
                var numEncryptedCommentsReceivedBySponsoredPostsThatAuthUserCanView = await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(x.overallPostId))
                    .GroupBy(x => x.overallPostId)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());
                
                foreach(string overallPostIdOfEncryptedCommentedPost in
                numEncryptedCommentsReceivedBySponsoredPostsThatAuthUserCanView.Keys)
                {
                    int[] authorsOfEncryptedCommentedSponsoredPost = overallPostIdsAndTheirAuthors[
                        overallPostIdOfEncryptedCommentedPost
                    ];
                    int numCommentsOfEncryptedCommentedSponsoredPost = numEncryptedCommentsReceivedBySponsoredPostsThatAuthUserCanView[
                        overallPostIdOfEncryptedCommentedPost
                    ];
                    foreach(int author in authorsOfEncryptedCommentedSponsoredPost)
                    {
                        usersAndTheirStats[author]["numComments"] += numCommentsOfEncryptedCommentedSponsoredPost;
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the total numComments of sponsored-posts for each of the users who
                have posted sponsored posts in the last two months that are visible to the authUser.\n";
            }


            var resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostId = await _postInfoFetchingService
            .GetNumAdLinkClicksOfEachSponsoredOverallPostIdInList(
                _httpClientWithMutualTLS, setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.ToList()
            );
            if (resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostId is Tuple<string, string>
            resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostIdErrorOutput)
            {
                errorMessage += @"• " + resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostIdErrorOutput.Item1
                + " of sponsored posts that were made at-most 2 months ago and are visible to the authUser.\n";
            }
            else
            {
                Dictionary<string, int> overallPostIdsAndTheirAdLinkClicks = (Dictionary<string, int>)
                resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostId;

                foreach(string overallPostId in overallPostIdsAndTheirAdLinkClicks.Keys)
                {
                    int[] authorsOfPost = overallPostIdsAndTheirAuthors[overallPostId];
                    int numAdLinkClicksOfPost = overallPostIdsAndTheirAdLinkClicks[overallPostId];

                    foreach(int author in authorsOfPost)
                    {
                        usersAndTheirStats[author]["numAdLinkClicks"] += numAdLinkClicksOfPost;
                    }
                }
            }

            foreach(int user in usersAndTheirStats.Keys)
            {
                usersAndTheirStats[user]["sumOfNumLikesNumCommentsAndNumAdLinkClicks"] =
                usersAndTheirStats[user]["numLikes"] + 
                usersAndTheirStats[user]["numComments"] +
                usersAndTheirStats[user]["numAdLinkClicks"];
            }

            top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost = usersAndTheirStats
                .OrderByDescending(dict => dict.Value["sumOfNumLikesNumCommentsAndNumAdLinkClicks"])
                .Select(dict => dict.Key)
                .Take(10)
                .ToList();
        }
        else
        {
            var resultOfGettingFollowingsAndBlockingsOfAuthUser = await _userInfoFetchingService
            .GetTheFollowingsAndBlockingsOfUser(
                _httpClientWithMutualTLS, authUserId
            );
            if (resultOfGettingFollowingsAndBlockingsOfAuthUser is Tuple<string, string>
            resultOfGettingFollowingsAndBlockingsOfAuthUserErrorOutput)
            {
                return StatusCode(
                    _stringLabelToIntStatusCodeMappings[
                        resultOfGettingFollowingsAndBlockingsOfAuthUserErrorOutput.Item2
                    ],
                    resultOfGettingFollowingsAndBlockingsOfAuthUserErrorOutput.Item1
                );
            }
            Dictionary<string, int[]> followingsAndBlockingsInfo = (Dictionary<string, int[]>)
            resultOfGettingFollowingsAndBlockingsOfAuthUser;

            authUserFollowings = followingsAndBlockingsInfo["followings"];
            setOfAuthUserFollowings = new HashSet<int>(authUserFollowings);
            
            foreach(int userFollowedByAuthUser in authUserFollowings)
            {
                usersAndTheirStats[userFollowedByAuthUser] = new Dictionary<string, int> {
                    {"numLikes", 0},
                    {"numComments", 0},
                    {"numPostViews", 0}
                };
            }

            authUserBlockings = followingsAndBlockingsInfo["blockings"];
            setOfAuthUserBlockings = new HashSet<int>(authUserBlockings);

            var resultOfGettingOverallPostIdsOfEachUserInList = await _postInfoFetchingService
            .GetOverallPostIdsOfEachUserInList(
                _httpClientWithMutualTLS, authUserFollowings, 2, true
            );
            if (resultOfGettingOverallPostIdsOfEachUserInList is Tuple<string, string>
            resultOfGettingOverallPostIdsOfEachUserInListErrorOutput)
            {
                errorMessage += "• " + resultOfGettingOverallPostIdsOfEachUserInListErrorOutput.Item1 + @" of the accounts
                followed by the authUser\n";

                return Ok(new Dictionary<string, object> {
                    { "errorMessage", errorMessage },
                    { "authUserFollowings", authUserFollowings },
                    { "usersWithSponsoredPostsThatAuthUserCanView", new List<int>() },
                    { "top10UsersThatAuthUserFollowsAndEngagesWithTheMost", new List<int>() },
                    { "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost", new List<int>() }
                });
            }
            overallPostIdsAndTheirAuthors = (Dictionary<string, int[]>) resultOfGettingOverallPostIdsOfEachUserInList;
            setOfOverallPostIdsOfAuthUserFollowings = new HashSet<string>(overallPostIdsAndTheirAuthors.Keys);

            Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDataEncryptionKeys = new Dictionary<string, byte[]>();
            try
            {
                List<string> unencryptedLikesByAuthUserToByPostsMadeByUsersInAuthUserFollowings = await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => x.likerId == authUserId && setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId!))
                    .Select(x => x.overallPostId!)
                    .ToListAsync();

                foreach(string overallPostIdOfUnencryptedLikedPost in
                unencryptedLikesByAuthUserToByPostsMadeByUsersInAuthUserFollowings)
                {
                    int[] authorsOfUnencryptedPostThatIsLikedByAuthUser = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedLikedPost
                    ];
                    foreach(int author in authorsOfUnencryptedPostThatIsLikedByAuthUser)
                    {
                        usersAndTheirStats[author]["numLikes"]++;
                    }
                }

                var encryptedLikesOfPostsMadeByUsersInAuthUserFollowings = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId!))
                    .Select(x => new { x.overallPostId, x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag})
                    .ToListAsync();
                
                foreach(var encryptedPostLike in encryptedLikesOfPostsMadeByUsersInAuthUserFollowings)
                {
                    string overallPostId = encryptedPostLike.overallPostId!;
                    byte[] plaintextDataEncryptionKey = [];
                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                            .getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );
                            overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (plaintextDataEncryptionKeyWasFound)
                    {
                        string likerIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedPostLike.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedPostLike.likerIdEncryptionIv,
                            encryptedPostLike.likerIdEncryptionAuthTag
                        );
                        int likerId = int.Parse(likerIdAsString);
                        if (likerId == authUserId)
                        {
                            int[] authorsOfUnencryptedPostThatIsLikedByAuthUser = overallPostIdsAndTheirAuthors[
                                overallPostId
                            ];
                            foreach(int author in authorsOfUnencryptedPostThatIsLikedByAuthUser)
                            {
                                usersAndTheirStats[author]["numLikes"]++;
                            }
                        }
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the numLikes given by the authUser to each of those followed by
                the authUser.\n";
            }

            try
            {
                Dictionary<string, int> numUnencryptedCommentsByAuthUserToPostsMadeByUsersInAuthUserFollowings = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.authorId == authUserId && setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId))
                    .GroupBy(x => x.overallPostId)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                foreach(string overallPostIdOfUnencryptedCommentedPost in
                numUnencryptedCommentsByAuthUserToPostsMadeByUsersInAuthUserFollowings.Keys)
                {
                    int[] authorsOfUnencryptedCommentedPostThatAreFollowedByAuthUser = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedCommentedPost
                    ];

                    int numCommentsMadeByAuthUserInUnencryptedPost = numUnencryptedCommentsByAuthUserToPostsMadeByUsersInAuthUserFollowings[
                        overallPostIdOfUnencryptedCommentedPost
                    ];
                    
                    foreach(int author in authorsOfUnencryptedCommentedPostThatAreFollowedByAuthUser)
                    {
                        usersAndTheirStats[author]["numComments"] += numCommentsMadeByAuthUserInUnencryptedPost;
                    }
                }

                var encryptedCommentsOfPostsMadeByUsersInAuthUserFollowings = await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfAuthUserFollowings.Contains(x.overallPostId))
                    .Select(x => new { x.overallPostId, x.encryptedAuthorId, x.encryptionIv, x.encryptionAuthTag})
                    .ToListAsync();
                
                foreach(var encryptedComment in encryptedCommentsOfPostsMadeByUsersInAuthUserFollowings)
                {
                    string overallPostId = encryptedComment.overallPostId!;
                    byte[] plaintextDataEncryptionKey = [];
                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                            .getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );
                            overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (plaintextDataEncryptionKeyWasFound)
                    {
                        string authorIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedComment.encryptedAuthorId,
                            plaintextDataEncryptionKey,
                            encryptedComment.encryptionIv,
                            encryptedComment.encryptionAuthTag
                        );
                        int authorId = int.Parse(authorIdAsString);
                        
                        if (authorId == authUserId)
                        {
                            int[] authorsOfUnencryptedPostThatIsCommentedByAuthUser = overallPostIdsAndTheirAuthors[
                                overallPostId
                            ];
                            foreach(int author in authorsOfUnencryptedPostThatIsCommentedByAuthUser)
                            {
                                usersAndTheirStats[author]["numComments"]++;
                            }
                        }
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the numComments given by the authUser to each of those followed by
                the authUser.\n";
            }

            var resultOfGettingNumPostViewsOfEachOverallPostIdInList = await _postInfoFetchingService
            .GetNumPostViewsOfEachOverallPostIdInList(
                _httpClientWithMutualTLS, setOfOverallPostIdsOfAuthUserFollowings.ToList()
            );
            if (resultOfGettingNumPostViewsOfEachOverallPostIdInList is Tuple<string, string>
            resultOfGettingNumPostViewsOfEachOverallPostIdInListErrorOutput)
            {
                errorMessage += "• " + resultOfGettingNumPostViewsOfEachOverallPostIdInListErrorOutput.Item1 + @" of posts
                made by accounts that the authUser follows.\n";
            }
            else
            {
                Dictionary<string, int> overallPostIdsAndTheirNumViews = (Dictionary<string, int>)
                resultOfGettingNumPostViewsOfEachOverallPostIdInList;

                foreach(string overallPostId in overallPostIdsAndTheirNumViews.Keys)
                {
                    int[] authorsOfPost = overallPostIdsAndTheirAuthors[overallPostId];
                    int numViewsOfPost = overallPostIdsAndTheirNumViews[overallPostId];
                    foreach(int author in authorsOfPost)
                    {
                        usersAndTheirStats[author]["numPostViews"] += numViewsOfPost;
                    }
                }
            }

            foreach(int userFollowedByAuthUser in usersAndTheirStats.Keys)
            {
                usersAndTheirStats[userFollowedByAuthUser]["sumOfNumLikesNumCommentsAndNumPostViews"] =
                usersAndTheirStats[userFollowedByAuthUser]["numLikes"] + 
                usersAndTheirStats[userFollowedByAuthUser]["numComments"] +
                usersAndTheirStats[userFollowedByAuthUser]["numPostsViews"];
            }

            top10UsersThatAuthUserFollowsAndEngagesWithTheMost = usersAndTheirStats
                .OrderByDescending(dict => dict.Value["sumOfNumLikesNumCommentsAndNumPostViews"])
                .Select(dict => dict.Key)
                .Take(10)
                .ToList();
            
            
            var resultOfGettingUserIdsOfAllPublicAccounts = await _userInfoFetchingService.GetTheUserIdsOfAllThePublicAccounts(
                _httpClientWithMutualTLS
            );
            if (resultOfGettingUserIdsOfAllPublicAccounts is Tuple<string, string>
            resultOfGettingUserIdsOfAllPublicAccountsErrorOutput)
            {
                errorMessage += "• " + resultOfGettingUserIdsOfAllPublicAccountsErrorOutput.Item1 + "\n";
                return Ok(new Dictionary<string, object> {
                    { "errorMessage", errorMessage },
                    { "authUserFollowings", authUserFollowings },
                    { "usersWithSponsoredPostsThatAuthUserCanView", new List<int>() },
                    { "top10UsersThatAuthUserFollowsAndEngagesWithTheMost", top10UsersThatAuthUserFollowsAndEngagesWithTheMost },
                    { "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost", new List<int>() }
                });
                
            }
            userIdsOfAllPublicAccounts = (int[]) resultOfGettingUserIdsOfAllPublicAccounts;

            var resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPost = await _postInfoFetchingService.
            GetOverallPostIdsOfEachSponsoredPostThatAuthUserCanView(
                _httpClientWithMutualTLS, authUserFollowings.ToList(), authUserBlockings.ToList(), 2
            );
            if (resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPost is Tuple<string, string>
            resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPostErrorOutput)
            {
                errorMessage += "• " +  resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPostErrorOutput.Item1 + "\n";
                return Ok(new Dictionary<string, object> {
                    { "errorMessage", errorMessage },
                    { "authUserFollowings", authUserFollowings },
                    { "usersWithSponsoredPostsThatAuthUserCanView", new List<int>()},
                    { "top10UsersThatAuthUserFollowsAndEngagesWithTheMost", top10UsersThatAuthUserFollowsAndEngagesWithTheMost },
                    { "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost", new List<int>() }
                });
            }
            overallPostIdsAndTheirAuthors = (Dictionary<string, int[]>) resultOfGettingTheOverallPostIdsOfEachVisibleSponsoredPost;

            setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView = new HashSet<string>(
                overallPostIdsAndTheirAuthors.Keys
            );

            foreach(string overallPostId in overallPostIdsAndTheirAuthors.Keys)
            {
                int[] authorsOfSponsoredPost = overallPostIdsAndTheirAuthors[overallPostId];
                setOfUsersWithSponsoredPostsThatAuthUserCanView.UnionWith(authorsOfSponsoredPost);
            }

            usersWithSponsoredPostsThatAuthUserCanView = setOfUsersWithSponsoredPostsThatAuthUserCanView.ToArray();
            
            usersAndTheirStats = new Dictionary<int, Dictionary<string, int>>();
            foreach(int userWithSponsoredPostThatAuthUserCanView in usersWithSponsoredPostsThatAuthUserCanView)
            {
                usersAndTheirStats[userWithSponsoredPostThatAuthUserCanView] = new Dictionary<string, int>
                {
                    {"numLikes", 0},
                    {"numComments", 0},
                    {"numAdLinkClicks", 0}
                };
            }

            try
            {
                List<string> unencryptedLikesFromAuthUserToSponsoredPostsThatAuthUserCanView = await _postgresContext
                    .unencryptedPostOrCommentLikes
                    .Where(x => x.likerId == authUserId && setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(
                        x.overallPostId!
                    ))
                    .Select(x => x.overallPostId!)
                    .ToListAsync();

                foreach(string overallPostIdOfUnencryptedLikedPost in unencryptedLikesFromAuthUserToSponsoredPostsThatAuthUserCanView)
                {
                    int[] authorsOfUnencryptedLikedPost = overallPostIdsAndTheirAuthors[overallPostIdOfUnencryptedLikedPost];

                    foreach(int author in authorsOfUnencryptedLikedPost)
                    {
                        usersAndTheirStats[author]["numLikes"]++;
                    }
                }

                var encryptedLikesOfSponsoredPostsThatAuthUserCanView = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(x.overallPostId!))
                    .Select(x => new {x.overallPostId, x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag})
                    .ToListAsync();
                
                foreach(var encryptedPostLike in encryptedLikesOfSponsoredPostsThatAuthUserCanView)
                {
                    string overallPostId = encryptedPostLike.overallPostId!;
                    byte[] plaintextDataEncryptionKey = [];
                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                            .getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );
                            overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (plaintextDataEncryptionKeyWasFound)
                    {
                        string likerIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedPostLike.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedPostLike.likerIdEncryptionIv,
                            encryptedPostLike.likerIdEncryptionAuthTag
                        );
                        int likerId = int.Parse(likerIdAsString);
                        if (likerId == authUserId)
                        {
                            int[] authorsOfUnencryptedPostThatIsLikedByAuthUser = overallPostIdsAndTheirAuthors[
                                overallPostId
                            ];
                            foreach(int author in authorsOfUnencryptedPostThatIsLikedByAuthUser)
                            {
                                usersAndTheirStats[author]["numLikes"]++;
                            }
                        }
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the total numLikes from authUser to sponsored-posts for each of
                the users who have posted sponsored posts that are visible to the authUser.\n";
            }

            try
            {
                Dictionary<string, int> numUnencryptedCommentsByAuthUserToSponsoredPosts = await _sqlServerContext
                    .unencryptedCommentsOfPosts
                    .Where(x => x.authorId == authUserId &&setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(
                        x.overallPostId
                    ))
                    .GroupBy(x => x.overallPostId)
                    .ToDictionaryAsync(g => g.Key, g => g.Count());

                foreach(string overallPostIdOfUnencryptedCommentedPost in numUnencryptedCommentsByAuthUserToSponsoredPosts.Keys)
                {
                    int[] authorsOfUnencryptedCommentedSponsoredPost = overallPostIdsAndTheirAuthors[
                        overallPostIdOfUnencryptedCommentedPost
                    ];

                    int numCommentsMadeByAuthUserInUnencryptedSponsoredPost = numUnencryptedCommentsByAuthUserToSponsoredPosts[
                        overallPostIdOfUnencryptedCommentedPost
                    ];
                    
                    foreach(int author in authorsOfUnencryptedCommentedSponsoredPost)
                    {
                        usersAndTheirStats[author]["numComments"] += numCommentsMadeByAuthUserInUnencryptedSponsoredPost;
                    }
                }

                var encryptedCommentsOfPostsMadeInSponsoredPostsVisibleToAuthUser = await _sqlServerContext
                    .encryptedCommentsOfPosts
                    .Where(x => setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.Contains(x.overallPostId))
                    .Select(x => new { x.overallPostId, x.encryptedAuthorId, x.encryptionIv, x.encryptionAuthTag})
                    .ToListAsync();
                
                foreach(var encryptedComment in encryptedCommentsOfPostsMadeInSponsoredPostsVisibleToAuthUser)
                {
                    string overallPostId = encryptedComment.overallPostId!;
                    byte[] plaintextDataEncryptionKey = [];
                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                            .getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );
                            overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (plaintextDataEncryptionKeyWasFound)
                    {
                        string authorIdAsString = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedComment.encryptedAuthorId,
                            plaintextDataEncryptionKey,
                            encryptedComment.encryptionIv,
                            encryptedComment.encryptionAuthTag
                        );
                        int authorId = int.Parse(authorIdAsString);
                        
                        if (authorId == authUserId)
                        {
                            int[] authorsOfUnencryptedSponsoredPostThatIsCommentedByAuthUser = overallPostIdsAndTheirAuthors[
                                overallPostId
                            ];
                            foreach(int author in authorsOfUnencryptedSponsoredPostThatIsCommentedByAuthUser)
                            {
                                usersAndTheirStats[author]["numComments"]++;
                            }
                        }
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the numComments from authUser to sponsored-posts for
                each of the users who have posted sponsored posts that are visible to the authUser.\n";
            }


            var resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostId = await _postInfoFetchingService
            .GetNumAdLinkClicksByAuthUserForEachSponsoredOverallPostIdInList(
                _httpClientWithMutualTLS, setOfOverallPostIdsOfSponsoredPostsThatAuthUserCanView.ToList(),
                authUserId
            );
            if (resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostId is Tuple<string, string>
            resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostIdErrorOutput)
            {
                errorMessage += @"• " + resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostIdErrorOutput.Item1
                + " of sponsored posts that were made at-most 2 months ago and are visible to the authUser.\n";
            }
            else
            {
                Dictionary<string, int> overallPostIdsAndTheirAdLinkClicks = (Dictionary<string, int>)
                resultOfGettingNumAdLinkClicksOfEachVisibleSponsoredOverallPostId;

                foreach(string overallPostId in overallPostIdsAndTheirAdLinkClicks.Keys)
                {
                    int[] authorsOfPost = overallPostIdsAndTheirAuthors[overallPostId];
                    int numAdLinkClicksOfPost = overallPostIdsAndTheirAdLinkClicks[overallPostId];

                    foreach(int author in authorsOfPost)
                    {
                        usersAndTheirStats[author]["numAdLinkClicks"] += numAdLinkClicksOfPost;
                    }
                }
            }

            foreach(int user in usersAndTheirStats.Keys)
            {
                usersAndTheirStats[user]["sumOfNumLikesNumCommentsAndNumAdLinkClicks"] =
                usersAndTheirStats[user]["numLikes"] + 
                usersAndTheirStats[user]["numComments"] +
                usersAndTheirStats[user]["numAdLinkClicks"];
            }

            top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost = usersAndTheirStats
                .OrderByDescending(dict => dict.Value["sumOfNumLikesNumCommentsAndNumAdLinkClicks"])
                .Select(dict => dict.Key)
                .Take(10)
                .ToList();
        }

        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage },
            { "authUserFollowings", authUserFollowings },
            { "usersWithSponsoredPostsThatAuthUserCanView", usersWithSponsoredPostsThatAuthUserCanView },
            { "top10UsersThatAuthUserFollowsAndEngagesWithTheMost", top10UsersThatAuthUserFollowsAndEngagesWithTheMost },
            { "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost", top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost }
        });
    }


    [RequireMutualTLS]
    [HttpPost("fetchUpdatesToLikesOfMultiplePosts")]
    public async Task<IActionResult> FetchUpdatesToLikesOfMultiplePosts(
        [FromBody] Dictionary<string, object> infoForFetchingUpdates
    )
    {
        DateTime datetimeForCheckingUpdatesOfPostLikes = (DateTime) infoForFetchingUpdates[
            "datetimeForCheckingUpdatesOfPostLikes"
        ];
        List<string> overallPostIds = (List<string>) infoForFetchingUpdates["overallPostIds"];
        HashSet<string> setOfOverallPostIds = new HashSet<string>(overallPostIds);

        List<Dictionary<string, object>> postLikeUpdates = new List<Dictionary<string, object>>();
        string errorMessage = "";

        HashSet<string> setOfUnencryptedOverallPostIds = new HashSet<string>();

        try
        {
            postLikeUpdates = await _postgresContext
                .unencryptedPostOrCommentLikes
                .Where(x => setOfOverallPostIds.Contains(x.overallPostId) &&
                x.datetime >= datetimeForCheckingUpdatesOfPostLikes)
                .Select(x => new { x.overallPostId, x.likerId })
                .ToListAsync();
            
            foreach(var postLikeUpdate in postLikeUpdates)
            {
                setOfUnencryptedOverallPostIds.Add(postLikeUpdate.overallPostId);
            }
        }
        catch
        {
            errorMessage += @"• There was trouble getting the updated post-likes of the 
            unencrypted posts in the provided list, if any\n";
        }

        if (setOfOverallPostIds.Count > setOfUnencryptedOverallPostIds.Count)
        {
            Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDEKs =
            new Dictionary<string, byte[]>();

            try
            {
                var infoOnEachEncryptedLikerOfPostsInSet = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => setOfOverallPostIds.Contains(x.overallPostId) &&
                    x.datetime >= datetimeForCheckingUpdatesOfPostLikes)
                    .Select(x => new
                        {
                            x.overallPostId, x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag
                        }
                    )
                    .ToListAsync();

                
                foreach(var encryptedLikeInfo in infoOnEachUnencryptedLikerOfPostsInSet)
                {
                    string overallPostId = encryptedLikeInfo.overallPostId;
                    byte[] plaintextDataEncryptionKey = [];

                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDEKs.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDEKs[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                            .getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );

                            overallPostIdsAndTheirPlaintextDEKs[overallPostId] =
                            plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (plaintextDataEncryptionKeyWasFound)
                    {
                        string stringifiedLikerId = _encryptionAndDecryptionService
                        .DecryptTextWithAzureDataEncryptionKey(
                            encryptedLikeInfo.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedLikeInfo.likerIdEncryptionIv,
                            encryptedLikeInfo.likerIdEncryptionAuthTag
                        );

                        int likerId = int.Parse(stringifiedLikerId);

                        postLikeUpdates.Add(new Dictionary<string, object> {
                            { "overallPostId", overallPostId }
                            { "likerId", likerId }
                        });

                    }
                    else
                    {
                        errorMessage += @$"• There was trouble getting the plaintext-DEK
                        which is required for decrypting the liker of one of the likes of
                        encrypted post {overallPostId}\n";
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the updated post-likes of the 
                encrypted posts in the provided list, if any\n";
            }
        }


        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage }
            { "postLikeUpdates", postLikeUpdates }
        });
    }


    [RequireMutualTLS]
    [HttpPost("fetchUpdatesToCommentsOfMultiplePosts")]
    public async Task<IActionResult> FetchUpdatesToCommentsOfMultiplePosts(
        [FromBody] Dictionary<string, object> infoForFetchingUpdates
    )
    {
        DateTime datetimeForCheckingUpdatesOfPostComments = (DateTime) infoForFetchingUpdates[
            "datetimeForCheckingUpdatesOfPostComments"
        ];
        List<string> overallPostIds = (List<string>) infoForFetchingUpdates["overallPostIds"];
        HashSet<string> setOfOverallPostIds = new HashSet<string>(overallPostIds);

        List<Dictionary<string, object>> postCommentUpdates = new List<Dictionary<string, object>>();
        string errorMessage = "";

        HashSet<string> setOfUnencryptedOverallPostIds = new HashSet<string>();

        try
        {
            postCommentUpdates = await _postgresContext
                .unencryptedCommentsOfPosts
                .Where(x => x.parentCommentId == null &&
                setOfOverallPostIds.Contains(x.overallPostId) &&
                x.datetime >= datetimeForCheckingUpdatesOfPostComments)
                .Select(x => new { x.overallPostId, x.authorId, x.content })
                .ToListAsync();
            
            foreach(var postCommentUpdate in postCommentUpdates)
            {
                setOfUnencryptedOverallPostIds.Add(postCommentUpdate.overallPostId);
            }
        }
        catch
        {
            errorMessage += @"• There was trouble getting the updated post-comments of the 
            unencrypted posts in the provided list, if any\n";
        }

        if (setOfOverallPostIds.Count > setOfUnencryptedOverallPostIds.Count)
        {
            Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDEKs =
            new Dictionary<string, byte[]>();

            try
            {
                var infoOnEachEncryptedCommentOfPostsInSet = await _postgresContext
                    .encryptedCommentsOfPosts
                    .Where(x =>
                    x.parentCommentId == null &&
                    setOfOverallPostIds.Contains(x.overallPostId) &&
                    x.datetime >= datetimeForCheckingUpdatesOfPostComments)
                    .Select(x => new
                        {
                            x.overallPostId,
                            x.encryptedAuthorId,
                            x.encryptedContent,
                            x.encryptionIv,
                            x.encryptionAuthTag
                        }
                    )
                    .ToListAsync();

                
                foreach(var encryptedCommentInfo in infoOnEachEncryptedCommentOfPostsInSet)
                {
                    string overallPostId = encryptedCommentInfo.overallPostId;
                    byte[] plaintextDataEncryptionKey = [];

                    bool plaintextDataEncryptionKeyWasFound = true;

                    if (overallPostIdsAndTheirPlaintextDEKs.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDEKs[overallPostId];
                    }
                    else
                    {
                        try
                        {
                            plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                            .getPlaintextDataEncryptionKeyOfPost
                            (
                                overallPostId,
                                _postgresContext,
                                _encryptionAndDecryptionService,
                                _redisCachingDatabase
                            );

                            overallPostIdsAndTheirPlaintextDEKs[overallPostId] =
                            plaintextDataEncryptionKey;
                        }
                        catch
                        {
                            plaintextDataEncryptionKeyWasFound = false;
                        }
                    }

                    if (plaintextDataEncryptionKeyWasFound)
                    {
                        string stringifiedAuthorId = _encryptionAndDecryptionService
                        .DecryptTextWithAzureDataEncryptionKey(
                            encryptedCommentInfo.encryptedAuthorId,
                            plaintextDataEncryptionKey,
                            encryptedCommentInfo.encryptionIv,
                            encryptedCommentInfo.encryptionAuthTag
                        );

                        int authorId = int.Parse(stringifiedAuthorId);

                        string content = _encryptionAndDecryptionService
                        .DecryptTextWithAzureDataEncryptionKey(
                            encryptedCommentInfo.encryptedContent,
                            plaintextDataEncryptionKey,
                            encryptedCommentInfo.encryptionIv,
                            encryptedCommentInfo.encryptionAuthTag
                        );

                        postCommentUpdates.Add(new Dictionary<string, object> {
                            { "overallPostId", overallPostId }
                            { "authorId", authorId },
                            { "content", content }
                        });

                    }
                    else
                    {
                        errorMessage += @$"• There was trouble getting the plaintext-DEK
                        which is required for decrypting the commenterId and comment of one of the
                        comments of encrypted post {overallPostId}\n";
                    }
                }
            }
            catch
            {
                errorMessage += @"• There was trouble getting the updated post-comments of the 
                encrypted posts in the provided list, if any\n";
            }
        }


        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage }
            { "postCommentUpdates", postCommentUpdates }
        });
    }


    [RequireMutualTLS]
    [HttpPost("fetchUpdatesToLikesOfMultipleComments")]
    public async Task<IActionResult> FetchUpdatesToLikesOfMultipleComments(
        [FromBody] Dictionary<string, object> infoForFetchingUpdates
    )
    {
        DateTime datetimeForFetchingCommentLikeUpdates = (DateTime) infoForFetchingUpdates[
            "datetimeForFetchingCommentLikeUpdates"
        ];
        List<int> commentIds = (List<int>) infoForFetchingUpdates["commentIds"];
        HashSet<int> setOfCommentIds = new HashSet<int>(commentIds);

        List<Dictionary<string, object>> commentLikeUpdates = new List<Dictionary<string, object>>();
        string errorMessage = "";

        HashSet<int> setOfUnencryptedCommentIds = new HashSet<int>();

        try
        {
            commentLikeUpdates = await _postgresContext
                .unencryptedPostOrCommentLikes
                .Where(x => setOfCommentIds.Contains(x.commentId) &&
                x.datetime >= datetimeForFetchingCommentLikeUpdates)
                .Select(x => new { x.commentId, x.likerId })
                .ToListAsync();
            
            foreach(var commentLikeUpdate in commentLikeUpdates)
            {
                setOfUnencryptedCommentIds.Add(commentLikeUpdate.commentId);
            }
        }
        catch
        {
            errorMessage += @"• There was trouble getting the updated comment-likes of the unencrypted comments in the provided list,
            if any\n";
        }

        if (setOfCommentIds.Count > setOfUnencryptedCommentIds.Count)
        {
            HashSet<int> setOfPossiblyEncryptedCommentIds = new HashSet<int>(setOfCommentIds.Except(setOfUnencryptedCommentIds));

            Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDEKs =
            new Dictionary<string, byte[]>();
            Dictionary<int, string> encryptedCommentsAndTheirOverallPostIds = new Dictionary<int, string>();

            try
            {
                encryptedCommentsAndTheirOverallPostIds = await _sqlServerContext.encryptedComments
                    .Where(c => setOfPossiblyEncryptedCommentIds.Contains(c.id ?? -1))
                    .GroupBy(x => x.id)
                    .ToDictionaryAsync(c => c.id, c => c.overallPostId);
            }
            catch
            {
                errorMessage += @"• There was trouble getting the overallPostIds of each of the potentially encrypted comments, which is a
                required step for decrypting their encrypted liker info, if applicable.\n";
            }

            if (encryptedCommentsAndTheirOverallPostIds.Count > 0)
            {
                try
                {
                    var infoOnEachEncryptedLikerOfCommentsInSet = await _postgresContext
                        .encryptedPostOrCommentLikes
                        .Where(x => setOfCommentIds.Contains(x.commentId) &&
                        x.datetime >= datetimeForFetchingCommentLikeUpdates)
                        .Select(x => new
                            {
                                x.commentId, x.encryptedLikerId, x.likerIdEncryptionIv, x.likerIdEncryptionAuthTag
                            }
                        )
                        .ToListAsync();

                    
                    foreach(var encryptedLikeInfo in infoOnEachEncryptedLikerOfCommentsInSet)
                    {
                        int commentId = encryptedLikeInfo.commentId;

                        string overallPostId = encryptedCommentsAndTheirOverallPostIds[commentId];
                        byte[] plaintextDataEncryptionKey = [];

                        bool plaintextDataEncryptionKeyWasFound = true;

                        if (overallPostIdsAndTheirPlaintextDEKs.ContainsKey(overallPostId))
                        {
                            plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDEKs[overallPostId];
                        }
                        else
                        {
                            try
                            {
                                plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                                .getPlaintextDataEncryptionKeyOfPost
                                (
                                    overallPostId,
                                    _postgresContext,
                                    _encryptionAndDecryptionService,
                                    _redisCachingDatabase
                                );

                                overallPostIdsAndTheirPlaintextDEKs[overallPostId] =
                                plaintextDataEncryptionKey;
                            }
                            catch
                            {
                                plaintextDataEncryptionKeyWasFound = false;
                            }
                        }

                        if (plaintextDataEncryptionKeyWasFound)
                        {
                            string stringifiedLikerId = _encryptionAndDecryptionService
                            .DecryptTextWithAzureDataEncryptionKey(
                                encryptedLikeInfo.encryptedLikerId,
                                plaintextDataEncryptionKey,
                                encryptedLikeInfo.likerIdEncryptionIv,
                                encryptedLikeInfo.likerIdEncryptionAuthTag
                            );

                            int likerId = int.Parse(stringifiedLikerId);

                            postLikeUpdates.Add(new Dictionary<string, object> {
                                { "commentId", commentId }
                                { "likerId", likerId }
                            });

                        }
                        else
                        {
                            errorMessage += @$"• There was trouble getting the plaintext-DEK which is required for decrypting the liker
                            of one of the likes of encrypted comment {commentId}\n";
                        }
                    }
                }
                catch
                {
                    errorMessage += @"• There was trouble getting the updated likes of the encrypted comments in the provided list,
                    if any\n";
                }
            }
        }


        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage }
            { "commentLikeUpdates", commentLikeUpdates }
        });
    }


    [RequireMutualTLS]
    [HttpPost("fetchUpdatesToRepliesOfMultipleComments")]
    public async Task<IActionResult> FetchUpdatesToRepliesOfMultipleComments(
        [FromBody] Dictionary<string, object> infoForFetchingUpdates
    )
    {
        DateTime datetimeForFetchingCommentReplyUpdates = (DateTime) infoForFetchingUpdates[
            "datetimeForFetchingCommentReplyUpdates"
        ];
        List<int> commentIds = (List<int>) infoForFetchingUpdates["commentIds"];
        HashSet<int> setOfCommentIds = new HashSet<int>(commentIds);

        List<Dictionary<string, object>> commentReplyUpdates = new List<Dictionary<string, object>>();
        string errorMessage = "";

        HashSet<int> setOfUnencryptedCommentIds = new HashSet<int>();

        try
        {
            commentReplyUpdates = await _postgresContext
                .unencryptedCommentsOfPosts
                .Where(x => setOfCommentIds.Contains(x.parentCommentId) &&
                x.datetime >= datetimeForFetchingCommentReplyUpdates)
                .Select(x => new { x.parentCommentId, x.authorId, x.content })
                .ToListAsync();
            
            foreach(var commentReplyUpdate in commentReplyUpdates)
            {
                setOfUnencryptedCommentIds.Add(commentReplyUpdate.parentCommentId);
            }
        }
        catch
        {
            errorMessage += @"• There was trouble getting the updated comment-replies of the unencrypted comments in the provided list,
            if any\n";
        }

        if (setOfCommentIds.Count > setOfUnencryptedCommentIds.Count)
        {
            HashSet<int> setOfPossiblyEncryptedCommentIds = new HashSet<int>(setOfCommentIds.Except(setOfUnencryptedCommentIds));

            Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDEKs =
            new Dictionary<string, byte[]>();

            if (encryptedCommentsAndTheirOverallPostIds.Count > 0)
            {
                try
                {
                    var infoOnEachEncryptedCommentOfPostsInSet = await _postgresContext
                        .encryptedCommentsOfPosts
                        .Where(x => setOfUnencryptedCommentIds.Contains(x.parentCommentId) &&
                        x.datetime >= datetimeForFetchingCommentReplyUpdates)
                        .Select(x => new
                            {
                                x.overallPostId,
                                x.parentCommentId,
                                x.encryptedAuthorId,
                                x.encryptedContent,
                                x.encryptionIv,
                                x.encryptionAuthTag
                            }
                        )
                        .ToListAsync();

                    
                    foreach(var encryptedCommentInfo in infoOnEachEncryptedCommentOfPostsInSet)
                    {
                        int parentCommentId = encryptedCommentInfo.parentCommentId;
                        string overallPostId = encryptedCommentInfo.overallPostId;
                        byte[] plaintextDataEncryptionKey = [];

                        bool plaintextDataEncryptionKeyWasFound = true;

                        if (overallPostIdsAndTheirPlaintextDEKs.ContainsKey(overallPostId))
                        {
                            plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDEKs[overallPostId];
                        }
                        else
                        {
                            try
                            {
                                plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                                .getPlaintextDataEncryptionKeyOfPost
                                (
                                    overallPostId,
                                    _postgresContext,
                                    _encryptionAndDecryptionService,
                                    _redisCachingDatabase
                                );

                                overallPostIdsAndTheirPlaintextDEKs[overallPostId] =
                                plaintextDataEncryptionKey;
                            }
                            catch
                            {
                                plaintextDataEncryptionKeyWasFound = false;
                            }
                        }

                        if (plaintextDataEncryptionKeyWasFound)
                        {
                            string stringifiedAuthorId = _encryptionAndDecryptionService
                            .DecryptTextWithAzureDataEncryptionKey(
                                encryptedCommentInfo.encryptedAuthorId,
                                plaintextDataEncryptionKey,
                                encryptedCommentInfo.encryptionIv,
                                encryptedCommentInfo.encryptionAuthTag
                            );

                            int authorId = int.Parse(stringifiedAuthorId);

                            string content = _encryptionAndDecryptionService
                            .DecryptTextWithAzureDataEncryptionKey(
                                encryptedCommentInfo.encryptedContent,
                                plaintextDataEncryptionKey,
                                encryptedCommentInfo.encryptionIv,
                                encryptedCommentInfo.encryptionAuthTag
                            );

                            postCommentUpdates.Add(new Dictionary<string, object> {
                                { "parentCommentId", parentCommentId }
                                { "authorId", authorId },
                                { "content", content }
                            });

                        }
                        else
                        {
                            errorMessage += @$"• There was trouble getting the plaintext-DEK which is required for decrypting the commenterId
                            and comment of one of the replies of encrypted comment {parentCommentId}\n";
                        }
                    }
                }
                catch
                {
                    errorMessage += @"• There was trouble getting the updated comment-replies of the encrypted comments in the provided
                    list, if any\n";
                }
            }
        }


        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage }
            { "commentReplyUpdates", commentReplyUpdates }
        });
    }


    [RequireMutualTLS]
    [HttpGet("getCommentIdsOfUser/{userId}")]
    public async Task<IActionResult> GetCommentIdsOfUser(
        int userId
    )
    {
        string errorMessage = "";
        List<int> commentIdsOfUser = new List<int>();

        try
        {
            commentIdsOfUser = await _sqlServerContext
                .unencryptedCommentsOfPosts
                .Where(x => x.authorId == userId)
                .Select(x => x.id)
                .ToListAsync();

        }
        catch
        {
            errorMessage += "• There was trouble fetching the asked-for data from the database of all the public-comments\n";
        }

        var allPrivateComments;

        try
        {
            allPrivateComments = await _sqlServerContext
                .encryptedCommentsOfPosts
                .Select(x => new {x.id, x.overallPostId, x.encryptedAuthorId, x.encryptionIv, x.encryptionAuthTag})
                .ToListAsync();
        }
        catch
        {
            errorMessage += "• There was trouble fetching the asked-for data from the database of all the private-comments\n";
        }

        Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDEKs = new Dictionary<string, byte[]>();
        foreach(var privateComment in allPrivateComments)
        {
            int commentId = privateComment.id;
            string overallPostId = privateComment.overallPostId;
            byte[] plaintextDataEncryptionKey = [];

            if (overallPostIdsAndTheirPlaintextDEKs.ContainsKey(overallPostId))
            {
                plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDEKs[overallPostId];
            }
            else
            {
                try
                {
                    plaintextDataEncryptionKey = await _encryptionAndDecryptionService.getPlaintextDataEncryptionKeyOfPost
                    (
                        overallPostId,
                        _postgresContext,
                        _encryptionAndDecryptionService,
                        _redisCachingDatabase
                    );

                    overallPostIdsAndTheirPlaintextDEKs[overallPostId] = plaintextDataEncryptionKey;
                }
                catch {}
            }

            if (plaintextDataEncryptionKey == null)
            {
                errorMessage += @$"• There was trouble getting the plaintext-DEK needed to decrypt the info on comment {commentId},
                and determine whether or not user {userId} is its author\n";
            }
            else
            {
                string stringifiedAuthorId = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                    privateComment.encryptedAuthorId,
                    plaintextDataEncryptionKey,
                    privateComment.encryptionIv,
                    privateComment.encryptionAuthTag
                );

                int authorId = int.Parse(stringifiedAuthorId);

                if (authorId == authUserId)
                {
                    commentIdsOfUser.Add(commentId);
                }
            }

        }

        return Ok(new Dictionary<string, object> {
            { "errorMessage", errorMessage }
            { "commentIdsOfUser", commentIdsOfUser }
        });
    }
}