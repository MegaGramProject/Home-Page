# Home-Page
  This GitHub repository contains code that powers both the <b>frontend & backend</b> of the <b>almighty home-page</b> of Megagram. This is the page that the user lands on <b>when they login</b>, and includes a feed of <b>stories, posts, and suggested-accounts</b>, as well as a bunch of <b>links to all that Megagram has to offer</b>. Megagram is a blend of some of the features of <b>Instagram and Amazon</b>, combined into a single website. It was created by me, <b>Rishav Ray</b>, as a personal project to <b>acquire and then showcase</b> my skills. To <b>allocate my time efficiently</b>, I focused on <b>three key repositories</b> of Megagram —<b>Login/Register, Reset Password, and Home Page</b>— which when combined effectively fulfills my purpose of this entire endeavor. I also focused on the <b>PortfolioPresentation</b> repo, a complex frontend that acts as a <b>website about me for job-recruiters and employers to view</b>.

  Because a major portion of the project depends on <b>the cloud</b>, in order to <b>save costs</b> on that, I <b>only activate</b> my frontend, backend and data/cloud-services for about 1-2 days max upon request, assuming that there aren't too many cloud-services also running at the time(<b>my contact-info is presented in the bottom-section</b>). <b>Once they're activated</b>, you should know that the frontend-urls either begin with https://megagram.com/, https://megagram.com/vuejs-frontend1/ or https://megagram.com/angularFrontend1/; the backend-urls all start with https://megagram.com/Home-Page/api/.

  If you so choose, you can use the <b>username 'testuser'</b> and the <b>password 'IamTESTINGMegagram1!!'</b> to login to Megagram as an actual user(although, unlike actual users, <b>you won't be able to edit the username or password</b> of this account).

  Welcome aboard!


## Table of Contents
  0. [Disclaimer](#disclaimer)
  1. [Key Points on Frontend](#key-points-on-frontend)
  2. [Key Points on Backend](#key-points-on-backend)
  3. [Key Points on WebSocket](#key-points-on-websocket)
  4. [Key Points on Data](#key-points-on-data)
  5. [Key Points on Cloud](#key-points-on-cloud)
  6. [Video of Frontend](#video-of-frontend)
  7. [Running the Frontend, Backend, & WebSocket](#running-the-frontend-backend-and-websocket)
  8. [Finale(My Contact Info is Here)](#finale)


## Disclaimer
  <b>Full-disclosure!</b> This entire undertaking is <b>solely a personal project</b> I used to learn the <b>necessary skills</b> for my desired career-path. I was not paid by a company, nor is this project a startup. Hence, for the sake of <b>doing more with less and not wasting time with needless repetition</b>, a few parts(like <b>less than 5%</b>) of the process have been omitted(i.e have been replaced by <b>placeholder logic/code or not even implemented at all</b>). 


## Key Points on Frontend
  * There are <b>three frontend directories</b> for the Home-Page, one powered by <b>ReactJS(reactjs-frontend2)</b>, one by <b>VueJS(vuejs-frontend1)</b>, and one by <b>Angular-TypeScript(angularFrontend1)</b>. Each of them essentially render the same website with the same logic and <b>only differ by their syntax</b>.

  * There are <b>2 endpoints</b>: / and /stories/{authorUsernameOrIdOfStory}. Both endpoints start with either https://megagram.com/, https://megagram.com/vuejs-frontend1/, or https://megagram.com/angularFrontend1/. 

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


## Key Points on Data
  * There is a <b>total of 22 diverse tables/collections/data-sources</b> used in the Home-Page.

  * Here are all the <b>MySQL tables from AWS Relational Database Service</b>:
    1. (Table-Name): int field1, string field2, ...

    And the info for the remaining data-souces will be added in the Iteration III as I work on them!

  * There was also <b>AWS-Redis-Cloud, which was used for caching the following pieces of data</b>:
    1. Example1
    2. Example2


## Key Points on Cloud
  * In this Home-Page, <b>the big-3 Cloud-services were used extensively</b> for a wide variety of purposes. In case you weren't aware, the big-3 cloud-services are <b>Amazon Web Services (AWS)</b>, <b>Microsoft Azure</b>, and <b>Google Cloud Platform (GCP)</b>. The purposes that they fulfilled include: providing scalable databases/caching/file-storage, encrypting data-encryption-keys, hosting the frontend servers and backend-servers with VMs and Kubernetes Clusters, Content-Delivery-Networks for caching and delivering files, etc.

  * <b>AWS was used for the following</b>:
    1. Example1
    2. Example2
  
  * <b>Azure was used for the following</b>:
    1. Example1
    2. Example2

  * <b>GCP was used for the following</b>:
    1. Example1
    2. Example2


## Video of Frontend
  <video src="./README_imgs_&_vids/videoOfFrontend.mp4" controls></video>


## Running the Frontend Backend and WebSocket
  <b>Because Code Reproducibility is Very Important!</b>

  If you would like to run a <b>development-server/production-server of the frontend</b> on your own computer/VM/container/etc, follow these steps:

  `0.` Run the following terminal-command:
  ```bash 
  git clone https://github.com/MegaGramProject/Home-Page.git
  ```

  `1.` Run the following terminal-command:
  ```bash 
  cd Home-Page/reactjs-frontend2
  ```

## Finale
  Thank you for sticking around till the end! Hope you found what you were looking for. Whether you did or not, feel free to reach out to me using any of the following methods:

  * Email: rishavray422@gmail.com

  * Number(texting only)-> <span style="color:#03b6fc">608-443-7805</span>

  * Linkedin: https://www.fakelink.com