# Home-Page
  This GitHub repository contains code that powers both the <b>frontend & backend</b> of the <b>almighty home-page</b> of Megagram. This is the page that the user lands on <b>when they login</b>, and includes a feed of <b>stories, posts, and suggested-accounts</b> for users to <b>view and interact with</b>, as well as a bunch of <b>links to all that Megagram has to offer</b>. Megagram is a blend of some of the features of <b>Instagram and Amazon</b>, combined into a single website. It was created by me, <b>Rishav Ray</b>, as a personal project to <b>acquire and then showcase</b> my skills. To <b>allocate my time efficiently</b>, I focused on <b>three of the nine key repositories</b> of Megagram —<b>Login/Register, Reset Password, and Home Page</b>— which when combined <b>fulfills</b> my <b>purpose</b> of the <b>entire endeavor</b>. I also focused on the <a href="https://github.com/rishavry/WorksPresentation" style="font-weight: bold;" target="_blank" rel="noopener noreferrer">WorksPresentation Github repository</a> of mine(which has a <b>wiki with important info</b>), containing a complex frontend that acts as a <b>website about me for job-recruiters and employers to view</b>!

  <b>Welcome</b> aboard!

## Table of Contents
  0. [Important Disclaimer](#important-disclaimer-because-honesty-is-the-best-policy)
  1. [Key Points on Frontend](#key-points-on-frontend)
  2. [Key Points on Backend](#key-points-on-backend)
  3. [Key Points on WebSocket](#key-points-on-websocket)
  4. [Finale(My Contact Info is Here)](#finale)

## Important Disclaimer because Honesty is the Best Policy

During the first iteration of Project Megagram, I worked on all nine repositories. In the second iteration, I narrowed my focus to three of them, including this Home-Page repository. In the third and final iteration, I continued concentrating on these three repositories. However, I chose not to fully revise and polish all the frontend and backend files across them, as the work(which I was not paid at all for) felt repetitive and offered limited new learning and 'showing-skills-to-future-employer' opportunities. Furthermore, all the cloud-services that my project so heavily relies on were out of my budget.

To combat the issues above, I used the final iteration to create detailed wiki pages in my <a href="https://github.com/rishavry/WorksPresentation" style="font-weight: bold;" target="_blank" rel="noopener noreferrer">WorksPresentation Github repository</a>. These documents outline how I would approach various aspects of frontend, backend, cloud architecture, and more, if I were tasked with building them under real-world conditions.

As a result, the current state of the content in this repository(including the rest of the README below) may not fully reflect industry-grade optimization or deployment readiness. Rather, it represents earlier work, with my more refined thought process and technical strategies documented in the associated wiki pages.

## Key Points on Frontend
  * There are <b>three frontend directories</b> for the Home-Page, one powered by <b>ReactJS(reactjs-frontend2)</b>, one by <b>VueJS(vuejs-frontend1)</b>, and one by <b>Angular-TypeScript(angularFrontend1)</b>. Each of them essentially render the same website with the same logic and <b>only differ by their syntax</b>.

  * There are <b>2 endpoints</b>: / and /stories/{authorUsernameOrIdOfStory}. Both endpoints start with either https://project-megagram.com/, https://project-megagram.com/vuejs-frontend1/, or https://project-megagram.com/angularFrontend1/. 

  * When the user visits the <b>/ page</b>, they get access to a <b>Left-Sidebar</b> with links to all the links of Megagram,
  as well as the <b>feed of stories, suggested-accounts, and posts</b> for the user. The <b>feeds are based on a variety of factors</b>, including number of followers followers, amount-of-engagement from the user, the accounts the user follows, etc. The user can even be logged out and <b>browse the feed as an Anonymous guest</b>.

  * When the user visits the <b>/stories/ page</b>, they are taken to a page that <b>shows them the stories(vids/images that cannot be viewed after 2 weeks) of a user</b>, as well as <b>story-previews of other users</b> in their home-page feed if applicable. In this page, users can reply to story-authors, and click through each of the chronologically-ordered stories of people they follow, as well as stories that were <b>sponsored</b> and recommended to them via the backend. Each author can post a <b>maximum of 11 unexpired stories</b> at a time, and each story <b>expires after 2 weeks</b>.

  * Each frontend <b>fetches, creates and modifies data</b> for its users with the help of requests made to the <b>4 backends of this repository</b>. Additionally, each frontend <b>renders notifications of various update</b>s(i.e likes/comments to one's own posts/comments, new replies to one's own comments, new followings/follow-requests, and new messages) with the help of connections to the <b>4 WebSockets of this repository</b>.

  * Each frontend has the <b>following components</b>:
      1. AboutAccountPopup
      2. CommentsPopup
      3. ErrorPopup
      4. LeftSidebarPopup
      5. LikersPopup
      6. SendPostPopup
      7. ThreeDotsPopup
      8. AccountPreview
      9. CommentOfPost
      10. FollowUser
      11. LeftSidebar
      12. MediaPost
      13. PostDots
      14. SelectUserOrGroupChat
      15. StoryViewer
      16. UserBar
      17. UserIcon
      18. UserNotification

    And the <b>following views</b>:
      1. HomePage
      2. NotFoundPage
      3. StoryViewerPage

  * Each of the frontend pages work for both <b>dark-mode and light-mode of the system</b>, and have been <b>successfully tested</b> across the <b>top 5 most popular browsers</b> and across the <b>numerous different screen-sizes</b> provided by Google-Chrome Dev-Tools.

  * Whenever the user tries to access an endpoint in the frontend that <b>does not exist</b>, they will come across a <b>'Page-Not-Found'</b> page that is very well styled. It was created by an <b>experienced Graphics designer</b> and the styling is <b>very exquisite and complex</b>, but I was able to <b>alter</b> the HTML/JS/CSS just a bit so that it <b>fits the 'Megagram-brand'</b>.

## Key Points on Backend
  * There are <b>five backend directories</b> for the Home-Page, one powered by <b>C# Asp NET Core(aspNetCoreBackend1)</b>, one by <b>Python Django(djangoBackend2)</b>, one by <b>NodeJS Express (expressJSBackend1)</b>, one by <b>PHP Laravel (laravelBackend1)</b>, and one by <b>Java Spring-Boot(springBootBackend2)</b>. Each of them <b>serve different purposes</b> and work with data of different kinds. They all connect with <b>databases/cloud in one way or another</b>, and some of them connect to WebSockets for the sake of <b>quick and seamless data-update tracking</b>.

  * The <b>C# Asp NET Core Backend</b> has the following <b>Postgres-SQL (via AWS Aurora)</b> models:
      1. EncryptedPostOrCommentLike
      2. UnencryptedPostOrCommentLike
      3. CaptionCommentAndLikeEncryptionInfo (captions, comments, and likes are all encrypted/decrypted with data-encryption-keys, which themselves are encrypted with <b>Microsoft Azure Cloud Key-Management-Service</b>)

    The following <b>Microsoft Azure Cloud SQL Server</b> models:
      1. EncryptedCaptionOfPost
      2. UnencryptedCaptionOfPost
      3. EncryptedCommentOfPost
      4. UnencryptedCommentOfPost

    The following <b>Rest-API endpoints</b>:
      1. getBatchOfLikersOfPostOrComment/{authUserId}/{overallPostId?}/{commentId?}
      2. addLikeToPostOrComment/{authUserId}/{overallPostId?}/{commentId?}
      3. addEncryptionInfoForCaptionCommentsAndLikesOfNewlyUploadedEncryptedPost/{overallPostId}
      4. toggleLikeToPostOrComment/{authUserId}/{overallPostId?}/{commentId?}
      5. toggleEncryptionStatusOfCaptionCommentsAndLikesOfPost/{overallPostId}/{originallyIsEncrypted}
      6. removeLikeFromPostOrComment/{authUserId}/{overallPostId?}/{commentId?}
      7. removeCaptionCommentsAndLikesOfPostAfterItsDeletion/{overallPostId}/{wasEncrypted}
      8. getCaptionsOfMultiplePosts
      9. getNumLikesNumCommentsAndAtMost3LikersFollowedByAuthUserForMultiplePosts/{authUserId}
      10. forHomePageFeedGetTheTopUsersBasedOnNumLikesNumCommentsNumPostViewsAndNumAdLinkClicks/{authUserId}
  
    And the following <b>GraphQL mutations and queries</b>.
      1. AddCaptionToPost(int authUserId, string overallPostId, string captionContent)
      2. EditCaptionOfPost(int authUserId, string overallPostId, string newCaptionContent)
      3. DeleteCaptionOfPost(int authUserId, string overallPostId)
      4. AddCommentToPost(int authUserId, string overallPostId, string commentContent)
      5. AddReplyToComment(int authUserId, int commentId, string replyContent)
      6. EditComment(int authUserId, int commentId, string newCommentContent)
      7. DeleteComment(int authUserId, int commentId)
      8. GetCaptionOfPost(int? authUserId, string overallPostId)
      9. GetBatchOfCommentsOfPost(int authUserId, string overallPostId, int?[] commentIdsToExclude, int? maxBatchSize)
      10. GetBatchOfRepliesOfComment(int authUserId, int commentId, int?[] replyIdsToExclude, int? maxBatchSize)

    Last but not least, this backend <b>utilizes Redis for caching</b> info on the <b>captions of posts</b>, as well as the <b>encrypted data-encryption-keys used for encrypting captions/comments/likes</b> of private posts(posts whose authors are account-visibility-statuses are all <b>set to 'private'</b>).
  
  * The <b>Python Django Backend</b> has the following <b>My-SQL (via AWS Relational Database Service)</b> models:
    1. FollowRequest
    2. PostSave

    The following <b>Postgres-SQL (via Microsoft Azure Cloud Flexible-Server)</b> models:
      1. UserBlocking
      2. UserFollowing

    The following <b>Rest-API endpoints</b>:
      1. getBatchOfSaversOfOwnPost/{auth_user_id}/{overall_post_id}
      2. savePost/{auth_user_id}/{overall_post_id}
      3. toggleSavePost/{auth_user_id}/{overall_post_id}
      4. unsavePost/{auth_user_id}/{overall_post_id}
      5. getBatchOfThoseBlockedByMe/{auth_user_id}
      6. blockUser/{auth_user_id}/{id_of_user_to_block}
      7. toggleBlockUser/{auth_user_id}/{id_of_user_to_block}
      8. unblockUser/{auth_user_id}/{id_of_user_to_block}
      9. getBlockingsOfUser/{user_id}
      10. isEachUserInListInTheBlockingsOfAuthUser/{auth_user_id}
      11. getFollowingsAndBlockingsOfUser/{auth_user_id}
      12. checkIfUserIsInBlockingsOfAuthUser/{auth_user_id}/{user_id}
      13. checkIfUsersInListAreInBlockingsOfAuthUser/{auth_user_id}
      14. getOrderedListOfUserSuggestionsBasedOnNumFollowersAndOtherMetrics/{auth_user_id}/{username_starts_with_this}/{limit}
      15. getNumFollowersFollowingsAndPostsOfMyTop5UserSuggestions/{auth_user_id}

    And the Following <b>GraphQL mutations and queries</b>:
      1. FollowUser(int authUserId, int idOfUserToFollow)
      2. ToggleFollowUser(int authUserId, int idOfUserToToggleFollow)
      3. UnfollowUser(int authUserId, int idOfUserToUnfollow)
      4. RequestToFollowUser(int authUserId, int idOfUserToRequestToFollow)
      5. CancelFollowRequestToOrFromUser(int authUserId, int idOfUserToCancelRequest, boolean authUserIsRecipientOfRequest)
      6. ToggleFollowRequestToUser(int authUserId, int idOfUserToToggleRequest)
      7. AcceptFollowRequestFromUser(int authUserId, int idOfUserToAccept)
      8. AcceptAllFollowRequestsAfterGoingPublic(int authUserId) 
      9. GetBatchOfFollowersOfUser(int authUserId, int userId, int[]? followerIdsToExclude)
      10. GetBatchOfFollowersOfUser(int authUserId, int userId, int[]? followerIdsToExclude)
      
      And the remaining UserFollowingQuery resolvers and FollowRequestQuery resolvers (fill them out in iteration III as you work on them)

  And the info for the remaining backends will be added in the Iteration III as I work on them!

## Key Points on WebSocket
  * There are <b>four WebSocket directories</b> in this repository: <b>cSharpSignalRWebSocket(C# SignalR)</b>, <b>nodeJSWebSocketDotIO(NodeJS Socket.IO)</b>, <b>phpRatchetWebSocket(PHP Ratchet)</b>, & <b>pythonWebSocket(Python WebSocket)</b>.

  * The <b>cSharpSignalRWebSocket</b> WebSocket is responsible for providing <b>updates on comment-likes and comment-replies</b> to comments of connected clients who have <b>authenticated themselves</b>. The updates are given to the WebSocket by the <b>aspNetCoreBackend1 backend-server</b>.

  * The <b>nodeJSWebSocketDotIO</b> WebSocket is responsible for providing <b>updates on comments and likes</b> to posts of connected clients who have <b>authenticated themselves</b>. The updates are given to the WebSocket by the <b>aspNetCoreBackend1 backend-server</b>.

  * The <b>phpRatchetWebSocket</b> WebSocket is responsible for providing <b>updates on follow-requests or followings</b> received by connected clients who have <b>authenticated themselves</b>. The updates are given to the WebSocket by the <b>djangoBackend2 backend-server</b>.

  * The <b>pythonWebSocket</b> WebSocket is responsible for providing <b>updates on messages</b> in conversations of connected clients who have <b>authenticated themselves</b>. The updates are given to the WebSocket by the <b>springBootBackend2 backend-server</b>.

## Finale
  Thank you for sticking around till the end! Hope you found what you were looking for. Whether you did or not, feel free to reach out to me using any of the following methods:

  * Email: rishavray422@gmail.com

  * Number(texting only)-> <span style="color:#03b6fc">608-443-7805</span>

  * Linkedin: https://www.fakelink.com