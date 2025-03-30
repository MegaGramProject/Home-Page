package com.megagram.springBootBackend2.Controllers.RestAPI;

import java.util.ArrayList;
import java.util.HashMap;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


@SuppressWarnings("unchecked")
@RestController
public class MiscController {
    

    public MiscController() {}


    /*
        Disclaimer: for the sake of simplicity and efficiency, the following method uses commented logic instead of actually
        implemented coded logic
    */
    @PostMapping("/getOrderedListOfOverallPostIdsOfBatchForHomePageFeed/{authUserId}")
    @CrossOrigin({"http://34.111.89.101", "http://localhost:8004"})
    public HashMap<String, Object> getOrderedListOfOverallPostIdsOfBatchForHomePageFeed(HttpServletRequest request,
    HttpServletResponse response, @RequestParam int authUserId, @RequestBody HashMap<String, Object>
    infoOnPotentialAuthorsOfPostsForFeed) throws Exception {
        ArrayList<Integer> top10UsersThatAuthUserFollowsAndEngagesWithTheMost = (ArrayList<Integer>)
        infoOnPotentialAuthorsOfPostsForFeed.get(
            "top10UsersThatAuthUserFollowsAndEngagesWithTheMost"
        );
        ArrayList<Integer> authUserFollowings = (ArrayList<Integer>) infoOnPotentialAuthorsOfPostsForFeed.get(
            "authUserFollowings"
        );

        ArrayList<Integer> top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost = (ArrayList<Integer>)
        infoOnPotentialAuthorsOfPostsForFeed.get(
            "top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost"
        );
        ArrayList<Integer> usersWithSponsoredPostsThatAuthUserCanView = (ArrayList<Integer>)
        infoOnPotentialAuthorsOfPostsForFeed.get(
            "usersWithSponsoredPostsThatAuthUserCanView"
        );

        String errorMessage = "";

        ArrayList<String> orderedListOfOverallPostIdsForBatchForHPFeed = new ArrayList<String>();

        /*
            First get the 6 non-sponsored posts. For this, get the 10 most recent posts of each user in the top 10 that the authUser
            follows and engages with. Then, the first post in the ordered-list will be the an unseen post from the #1 user.
            The next post will be from the #2 user and so on and so forth. If the 2nd user has no unseen posts for the authUser,
            you can use another post of the #1 if there is one, or just go down to the 3rd user. There will be no more than
            3 posts in a batch by the same author. If after all this, say you lack 2 more posts(i.e there must be a total
            of 6 non-sponsored posts). If this is the case, repeat the process(i.e find another unviewed post made by the #1 user,
            then #2 user, and so on, so long as there is not already 3 posts in the batch that are already by the #1 user, etc).
            Keep repeating this process until you have 0 more unviewed posts left to add to the list. If you still haven't
            met the 6 non-sponsored posts requirement, choose random users from the authUserFollowings to make up for that deficit.
            These users must not be present in top10UsersThatAuthUserEngagesWithTheSponsoredPostsOfTheMost. The number of random 
            users you pick is dependent on the number of posts you lack. I.e if you lack 4 non-sponsored posts, seek 4 random 
            users. If just 1, seek 1 random user.

            Follow the process above but for 2 sponsored posts instead. You get the gist.

            Now that you have the 6 non-sponsored overallPostIds and the 2 sponsored overallPostIds, arrange
            orderedListOfOverallPostIdsForBatchForHPFeed such that the first 3 are the top 3 non-sponsored posts, then the top
            sponsored post, then the next top 3 non-sponsored posts, followed by the next top sponsored post.
        */



        HashMap<String, Object> output = new HashMap<String, Object>();
        output.put("orderedListOfOverallPostIdsForBatchForHPFeed", orderedListOfOverallPostIdsForBatchForHPFeed);
        output.put("ErrorMessage", errorMessage);

        return output;
    }
}
