using aspNetCoreBackend1.Contexts;
using aspNetCoreBackend1.Models.Postgres;
using aspNetCoreBackend1.Models.Postgres.PostOrCommentLike;
using aspNetCoreBackend1.Models.SqlServer.Caption;
using aspNetCoreBackend1.Models.SqlServer.Comment;
using aspNetCoreBackend1.Services;
using aspNetCoreBackend1.Attributes;

using System.Text.Json;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;

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
    private readonly HttpClient _httpClient;
    private readonly HttpClient _httpClientWithMutualTLS;
    private readonly Dictionary<string, int> _stringLabelToIntStatusCodeMappings;


    public Controller(
        PostgresContext postgresContext, SqlServerContext sqlServerContext,
        EncryptionAndDecryptionService encryptionAndDecryptionService, UserAuthService userAuthService,
        PostOrCommentLikingService postOrCommentLikingService, IHttpClientFactory httpClientFactory,
        PostInfoFetchingService postInfoFetchingService
    )
    {
        _postgresContext = postgresContext;
        _sqlServerContext = sqlServerContext;

        _encryptionAndDecryptionService = encryptionAndDecryptionService;
        _userAuthService = userAuthService;
        _postOrCommentLikingService = postOrCommentLikingService;
        _postInfoFetchingService = postInfoFetchingService;

        _httpClient = httpClientFactory.CreateClient();
        _httpClientWithMutualTLS = httpClientFactory.CreateClient("HttpClientWithMutualTLS");

        _stringLabelToIntStatusCodeMappings = new Dictionary<string, int>
        {
            {"UNAUTHORIZED", 403},
            {"BAD_GATEWAY", 502},
            {"NOT_FOUND", 404},
            {"INTERNAL_SERVER_ERROR", 500},
        };
    }

    
    [HttpPost("getBatchOfLikersOfPostOrComment/{authUserId}/{overallPostId?}/{commentId?}")]
    public async Task<IActionResult> GetBatchOfLikersOfPostOrComment(
        int authUserId, string? overallPostId, int? commentId, [FromBody] int[]? likersToExclude
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

        HashSet<int> setOfLikersToExclude = new HashSet<int>();
        if (likersToExclude != null)
        {
            likersToExclude = likersToExclude.Where(x => x > 0).ToArray();
            setOfLikersToExclude = new HashSet<int>(likersToExclude);
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
            setOfLikersToExclude.UnionWith(setOfAuthUserBlockings);
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
                byte[]? encryptedDataEncryptionKey = _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();

                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
            }
            catch
            {
                return StatusCode(
                    500,
                    @"There was trouble in the process of getting the encryptedDataEncryptionKey and then decrypting
                    that to get the plaintextDataEncryptionKey in order to decrypt each of the likers of this
                    private-post/private-post-comment."
                );
            }
            
            try
            {
                var infoOnEachEncryptedLikerOfPostOrComment = await _postgresContext
                    .encryptedPostOrCommentLikes
                    .Where(x => commentId == null ? x.overallPostId == overallPostId : x.commentId == commentId)
                    .OrderByDescending(x => x.datetimeOfLike)
                    .Select(x => new { x.encryptedLikerId, x.encryptionIv, x.encryptionAuthTag })
                    .ToListAsync();
                

                foreach (var encryptedLikerInfo in infoOnEachEncryptedLikerOfPostOrComment)
                {
                    string stringifiedLikerId = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                        encryptedLikerInfo.encryptedLikerId,
                        plaintextDataEncryptionKey,
                        encryptedLikerInfo.encryptionIv,
                        encryptedLikerInfo.encryptionAuthTag
                    );
                    int likerId = int.Parse(stringifiedLikerId);
                    if (setOfLikersToExclude.Contains(likerId))
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
                                    { "liker", likerId }
                                }
                        ); 
                        numLikersFound++;
                    }
                    else if (batchOfLikersNotFollowedByAuthUser.Count < 20)
                    {
                        batchOfLikersNotFollowedByAuthUser.Add(
                            new Dictionary<string, object>
                                {
                                    { "liker", likerId }
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
                    && !setOfLikersToExclude.Contains(x.likerId))
                    .OrderByDescending(x => x.datetimeOfLike)
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
                                    { "liker", likerId }
                                }
                        ); 
                        numLikersFound++;
                    }
                    else if (batchOfLikersNotFollowedByAuthUser.Count < 20)
                    {
                        batchOfLikersNotFollowedByAuthUser.Add(
                            new Dictionary<string, object>
                                {
                                    { "liker", likerId }
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
                    { "liker", authUserId}
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
                    .Select(x => new { x.encryptedLikerId, x.encryptionIv, x.encryptionAuthTag })
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
                    
                    byte[]? encryptedDataEncryptionKey = await _postgresContext
                        .captionsCommentsAndLikesEncryptionInfo
                        .Where(x => x.overallPostId == overallPostId)
                        .Select(x => x.encryptedDataEncryptionKey)
                        .FirstOrDefaultAsync();
                    
                    plaintextDataEncryptionKey = await _encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                        encryptedDataEncryptionKey!,
                        $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                    );

                    foreach (var encryptedLikerInfo in likersOfEncryptedPostOrComment)
                    {
                        string stringifiedLikerId = _encryptionAndDecryptionService.DecryptTextWithAzureDataEncryptionKey(
                            encryptedLikerInfo.encryptedLikerId,
                            plaintextDataEncryptionKey,
                            encryptedLikerInfo.encryptionIv,
                            encryptedLikerInfo.encryptionAuthTag
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
                byte[]? encryptedDataEncryptionKey = _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();

                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
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
    [HttpPost("addEncryptionInfoForCaptionCommentsAndLikesForNewlyUploadedEncryptedPost/{overallPostId}")]
    public async Task<IActionResult> AddEncryptionInfoForCaptionCommentsAndLikesForNewlyUploadedEncryptedPost(
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
                byte[]? encryptedDataEncryptionKey = _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();

                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
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
                byte[]? encryptedDataEncryptionKey = _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();
                
                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
                
                await _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .ExecuteDeleteAsync();
                
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
                    unencryptedCaptionToDelete.datetimeOfCaption,
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
                    encryptedCaptionToDelete.encryptionIv,
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
                    encryptedCaptionToDelete.datetimeOfCaption,
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
                    unencryptedComment.datetimeOfComment,
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
                    encryptedComment.encryptionIv,
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
                    encryptedComment.datetimeOfComment,
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
                        unencryptedLike.datetimeOfLike
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
                    encryptedLike.encryptionIv,
                    encryptedLike.encryptionAuthTag
                );

                unencryptedLikesToInsert.Add(
                    new UnencryptedPostOrCommentLike(
                        encryptedLike.overallPostId,
                        encryptedLike.commentId == null ? null :
                        oldCommentIdToNewCommentIdMappings[encryptedLike.commentId ?? -1],
                        int.Parse(likerIdAsString),
                        encryptedLike.datetimeOfLike
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
                byte[]? encryptedDataEncryptionKey = _postgresContext
                    .captionsCommentsAndLikesEncryptionInfo
                    .Where(x => x.overallPostId == overallPostId)
                    .Select(x => x.encryptedDataEncryptionKey)
                    .FirstOrDefault();

                plaintextDataEncryptionKey = await _encryptionAndDecryptionService.DecryptEncryptedDataEncryptionKey(
                    encryptedDataEncryptionKey!,
                    $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                );
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
    [HttpPost("getCaptionsOfMultiplePosts/{overallPostId}")]
    public async Task<IActionResult> GetCaptionsOfMultiplePosts(
        [FromBody] Dictionary<string, bool> overallPostIdsAndIfTheyAreEncrypted
    )
    {
        string[] overallPostIds = overallPostIdsAndIfTheyAreEncrypted.Keys.ToArray();

        HashSet<string> setOfOverallPostIdsOfEncryptedPosts = new HashSet<string>();
        HashSet<string> setOfOverallPostIdsOfUnencryptedPosts = new HashSet<string>();

        foreach(string overallPostId in overallPostIds)
        {
            if (overallPostIdsAndIfTheyAreEncrypted[overallPostId])
            {
                setOfOverallPostIdsOfEncryptedPosts.Add(overallPostId);
            }
            else
            {
                setOfOverallPostIdsOfUnencryptedPosts.Add(overallPostId);
            }
        }


        Dictionary<string, UnencryptedCaptionOfPost?> overallPostIdsAndTheirCaptions = new Dictionary<string,
        UnencryptedCaptionOfPost?>();
        foreach (string overallPostId in overallPostIds)
        {
            overallPostIdsAndTheirCaptions[overallPostId] = null;
        }

        string errorMessage = "";

        if (setOfOverallPostIdsOfEncryptedPosts.Count > 0)
        {
            Dictionary<string, byte[]> overallPostIdsAndTheirPlaintextDataEncryptionKeys = new Dictionary<string,
            byte[]>();

            try
            {
                List<EncryptedCaptionOfPost> encryptedCaptionsOfPosts = await _sqlServerContext
                    .encryptedCaptionsOfPosts
                    .Where(x => setOfOverallPostIdsOfUnencryptedPosts.Contains(x.overallPostId))
                    .ToListAsync();
                
                foreach (EncryptedCaptionOfPost encryptedCaptionOfPost in encryptedCaptionsOfPosts)
                {
                    string overallPostId = encryptedCaptionOfPost.overallPostId;
                    byte[] plaintextDataEncryptionKey = [];
                    byte[]? encryptedDataEncryptionKey = [];

                    bool plaintextDataEncryptionKeyWasFound = false;

                    if (overallPostIdsAndTheirPlaintextDataEncryptionKeys.ContainsKey(overallPostId))
                    {
                        plaintextDataEncryptionKey = overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId];
                        plaintextDataEncryptionKeyWasFound = true;
                    }
                    else
                    {
                        encryptedDataEncryptionKey = _postgresContext
                            .captionsCommentsAndLikesEncryptionInfo
                            .Where(x => x.overallPostId == overallPostId)
                            .Select(x => x.encryptedDataEncryptionKey)
                            .FirstOrDefault(); 
                        
                        plaintextDataEncryptionKey = await _encryptionAndDecryptionService
                        .DecryptEncryptedDataEncryptionKey(
                            encryptedDataEncryptionKey!,
                            $"captionCommentsAndLikesOfPostDEKCMK/{overallPostId}"
                        );

                        overallPostIdsAndTheirPlaintextDataEncryptionKeys[overallPostId] = plaintextDataEncryptionKey;
                        plaintextDataEncryptionKeyWasFound = true;
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
                                encryptedCaptionOfPost.datetimeOfCaption,
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
                foreach (string overallPostId in setOfOverallPostIdsOfEncryptedPosts)
                {
                    errorMessage += @$"• There was trouble retrieving the caption of the encrypted post with id
                    {overallPostId}\n";
                }
            }
        }

        if (setOfOverallPostIdsOfUnencryptedPosts.Count > 0)
        {
            try
            {
                List<UnencryptedCaptionOfPost> unencryptedCaptionsOfPosts = await _sqlServerContext
                    .unencryptedCaptionsOfPosts
                    .Where(x => setOfOverallPostIdsOfUnencryptedPosts.Contains(x.overallPostId))
                    .ToListAsync();
                
                foreach (UnencryptedCaptionOfPost unencryptedCaptionOfPost in unencryptedCaptionsOfPosts)
                {
                    overallPostIdsAndTheirCaptions[unencryptedCaptionOfPost.overallPostId] = unencryptedCaptionOfPost;
                }
            }
            catch
            {
                foreach (string overallPostId in setOfOverallPostIdsOfUnencryptedPosts)
                {
                    errorMessage += @$"• There was trouble retrieving the caption of the unencrypted post with id
                    {overallPostId}\n";
                }
            }
        }

        return Ok(new Dictionary<string, object> {
            { "overallPostIdsAndTheirCaptions", overallPostIdsAndTheirCaptions },
            { "errorMessage", errorMessage }
        });
    }
}
