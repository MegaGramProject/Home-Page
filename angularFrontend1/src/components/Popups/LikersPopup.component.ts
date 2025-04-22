import { FollowUser } from '../FollowUser.component';

import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';


@Component({
  selector: 'LikersPopup',
  templateUrl: '../../templates/Popups/LikersPopup.component.html',
  imports: [CommonModule, FollowUser],
  standalone: true
})
export class LikersPopup {
  @Input() idOfPostOrComment!:string|number;

  @Input() authUserId!:number;

  @Input() usersAndTheirRelevantInfo!:any;

  @Output() closePopup:EventEmitter<any> = new EventEmitter<any>();
  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() updateUsersAndTheirRelevantInfo:EventEmitter<object> = new EventEmitter<object>();

  likers:any[] = [];
  likerIdsToExclude:number[] = [];

  initialLikersFetchingErrorMessage:string = '';
  additionalLikersFetchingErrorMessage:string = '';

  fetchingInitialLikersIsComplete:boolean = false;
  isCurrentlyFetchingAdditionalLikers:boolean = false;

  @ViewChild('scrollableLikersDivRef') scrollableLikersDivRef!:ElementRef;


  ngOnInit() {
    this.fetchLikers('initial');
  }


  ngOnDestroy() {
    window.removeEventListener('scroll', () => this.fetchAdditionalLikersWhenUserScrollsToBottomOfPopup());
  }


  async fetchLikers(initialOrAdditionalText:string) {
    const isInitialFetch = initialOrAdditionalText === 'initial';
    const postOrCommentText = typeof this.idOfPostOrComment === 'string' ? 'post' : 'comment';

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/aspNetCoreBackend1/getBatchOfLikersOfPostOrComment/${this.authUserId}
      /${this.idOfPostOrComment}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(this.likerIdsToExclude),
        credentials: 'include'
      });

      if(!response.ok) {
        if(isInitialFetch) {
          this.initialLikersFetchingErrorMessage = 
          `The server had trouble getting the initial likers of this ${postOrCommentText}.`;
          this.fetchingInitialLikersIsComplete = true;
        }
        else {
          this.additionalLikersFetchingErrorMessage = 
          `The server had trouble getting the additional likers of this ${postOrCommentText}.`;
          this.isCurrentlyFetchingAdditionalLikers = false;
        }

        return;
      }

      const fetchedLikers:any[] = await response.json();
      if (fetchedLikers.length == 0) {
        if(isInitialFetch) {
          this.initialLikersFetchingErrorMessage =  'No one has liked this yet';
          this.fetchingInitialLikersIsComplete = true;
        }
        else {
          this.additionalLikersFetchingErrorMessage = 'No additional likers have been found yet';
          this.isCurrentlyFetchingAdditionalLikers = false;
        }

        return;
      }

      const newLikerIds = fetchedLikers.map(fetchedLiker => fetchedLiker.likerId);
      this.likerIdsToExclude = [...this.likerIdsToExclude, ...newLikerIds];

      const newUsersAndTheirRelevantInfo:any = await this.fetchAllTheNecessaryLikerInfo(newLikerIds);
      this.updateUsersAndTheirRelevantInfo.emit(newUsersAndTheirRelevantInfo);

      const newLikers = [...this.likers];
      for(let fetchedLiker of fetchedLikers) {
        const likerId = fetchedLiker.likerId;

        let likerUsername = null;
        if (likerId in newUsersAndTheirRelevantInfo && 'username' in newUsersAndTheirRelevantInfo[likerId]) {
          likerUsername = newUsersAndTheirRelevantInfo[likerId].username;
        }
        else {
          continue;
        }

        let likerFullName = null;
        if (likerId in newUsersAndTheirRelevantInfo && 'fullName' in newUsersAndTheirRelevantInfo[likerId]) {
          likerFullName = newUsersAndTheirRelevantInfo[likerId].fullName;
        }
        else {
          likerFullName = 'Could not fetch full-name of this user';
        }

        let likerPfp = null;
        if (likerId in newUsersAndTheirRelevantInfo && 'profilePhoto' in newUsersAndTheirRelevantInfo[likerId]) {
          likerPfp = newUsersAndTheirRelevantInfo[likerId].profilePhoto;
        }
        else {
          likerPfp = 'images/defaultPfp.png';
        }

        let likerIsVerified = null;
        if (likerId in newUsersAndTheirRelevantInfo && 'isVerified' in newUsersAndTheirRelevantInfo[likerId]) {
          likerIsVerified = newUsersAndTheirRelevantInfo[likerId].isVerified;
        }
        else {
          likerIsVerified = false;
        }

        const newLikerInfo:any = {
          likerId: likerId,
          likerUsername: likerUsername,
          likerFullName: likerFullName,
          likerPfp: likerPfp,
          likerIsVerified: likerIsVerified
        };

        if (likerId === this.authUserId) {
          newLikerInfo.originalFollowText = '';
        }
        else if (fetchedLiker.isFollowedByAuthUser) {
          newLikerInfo.originalFollowText = 'Following';
        }
        else {
          newLikerInfo.originalFollowText = 'Follow';
        }

        newLikers.push(newLikerInfo);
      }

      this.likers = newLikers;

      if(isInitialFetch) {
        this.fetchingInitialLikersIsComplete = true;
        setTimeout(() => {
          window.addEventListener("scroll", () => this.fetchAdditionalLikersWhenUserScrollsToBottomOfPopup());
        }, 1500);
      }
      else {
          this.isCurrentlyFetchingAdditionalLikers = false;
      }
    }
    catch {
      if(isInitialFetch) {
        this.initialLikersFetchingErrorMessage = 
          `There was trouble connecting to the server to get the initial likers of this ${postOrCommentText}.`
        ;
        this.fetchingInitialLikersIsComplete = true;
      }
      else {
        this.additionalLikersFetchingErrorMessage = 
          `There was trouble connecting to the server to get the additional likers of this ${postOrCommentText}.`
        ;
        this.isCurrentlyFetchingAdditionalLikers = false;
      }
    }
  }


  async fetchAllTheNecessaryLikerInfo(newLikerIds:any[]): Promise<any> {
    let graphqlUserQueryStringHeaderInfo:any = {};
    let graphqlUserQueryString = '';
    let graphqlUserVariables:any = {};

    let usersAndTheirUsernames:any = {};
    const newLikerIdsNeededForUsernames = newLikerIds.filter(newLikerId => {
      if (!(newLikerId in this.usersAndTheirRelevantInfo) || !('username' in
      this.usersAndTheirRelevantInfo[newLikerId])) {
        return newLikerId;
      }
    });

    if (newLikerIdsNeededForUsernames.length > 0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newLikerIdsNeededForUsernames'] = '[Int!]!';

      graphqlUserQueryString +=
      `getUsernamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newLikerIdsNeededForUsernames) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newLikerIdsNeededForUsernames = newLikerIdsNeededForUsernames;
    }

    let usersAndTheirFullNames:any = {};
    const newLikerIdsNeededForFullNames = newLikerIds.filter(newLikerId => {
      if (!(newLikerId in this.usersAndTheirRelevantInfo) || !('fullName' in this.usersAndTheirRelevantInfo[newLikerId])) {
        return newLikerId;
      }
    });

    if (newLikerIdsNeededForFullNames.length > 0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newLikerIdsNeededForFullNames'] = '[Int!]!';

      graphqlUserQueryString +=
      `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newLikerIdsNeededForFullNames) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newLikerIdsNeededForFullNames = newLikerIdsNeededForFullNames;
    }

    let usersAndTheirVerificationStatuses:any = {};
    const newLikerIdsNeededForVerificationStatuses = newLikerIds.filter(newLikerId => {
      if (!(newLikerId in this.usersAndTheirRelevantInfo) || !('isVerified' in
      this.usersAndTheirRelevantInfo[newLikerId])) {
        return newLikerId;
      }
    });

    if (newLikerIdsNeededForVerificationStatuses.length>0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newLikerIdsNeededForVerificationStatuses'] = '[Int!]!';

      graphqlUserQueryString +=
      `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
      $newLikerIdsNeededForVerificationStatuses) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newLikerIdsNeededForVerificationStatuses = newLikerIdsNeededForVerificationStatuses;
    }

    if (graphqlUserQueryString.length > 0) {
      let graphqlUserQueryStringHeader = 'query (';
      let graphqlUserQueryStringHeaderKeys = Object.keys(graphqlUserQueryStringHeaderInfo);

      for(let i=0; i<graphqlUserQueryStringHeaderKeys.length; i++) {
        const key = graphqlUserQueryStringHeaderKeys[i];
        const value = graphqlUserQueryStringHeaderInfo[key];

        if (i < graphqlUserQueryStringHeaderKeys.length-1) {
          graphqlUserQueryStringHeader+= `${key}: ${value}, `;
        }
        else {
          graphqlUserQueryStringHeader+= `${key}: ${value}`;
        }
      }

      graphqlUserQueryStringHeader+= '){ ';
      graphqlUserQueryString = graphqlUserQueryStringHeader + graphqlUserQueryString + '}';

      try {
          const response = await fetch(`http://34.111.89.101/api/Home-Page/laravelBackend1/graphql`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                query: graphqlUserQueryString,
                variables: graphqlUserVariables
            }),
            credentials: 'include'
          });
          if (!response.ok) {
              if (newLikerIdsNeededForUsernames.length > 0) {
                console.error(
                  'The server had trouble fetching the usernames of all the newly fetched likers'
                );
              }

              if (newLikerIdsNeededForFullNames.length > 0) {
                console.error(
                  'The server had trouble fetching the full-names of all the newly fetched likers'
                );
              }

              if (newLikerIdsNeededForVerificationStatuses.length > 0) {
                console.error(
                  `The server had trouble fetching the verification-statuses of all the new fetched
                  likers`
                );
              }
          }
          else {
              const responseData = await response.json();

              if (newLikerIdsNeededForUsernames.length > 0) {
                const listOfUsernamesForNewLikerIds = responseData.data.getListOfUsernamesForUserIds;

                for(let i=0; i<newLikerIdsNeededForUsernames.length; i++) {
                  const newLikerId = newLikerIdsNeededForUsernames[i];
                  const newLikerUsername = listOfUsernamesForNewLikerIds[i];

                  if (newLikerUsername !== null) {
                    usersAndTheirUsernames[newLikerId] = newLikerUsername;
                  }
                }
              }
              
              if (newLikerIdsNeededForFullNames.length > 0) {
                const listOfFullNamesForNewLikerIds = responseData.data.getListOfFullNamesForUserIds;

                for(let i=0; i<newLikerIdsNeededForFullNames.length; i++) {
                  const newLikerId = newLikerIdsNeededForFullNames[i];
                  const newLikerFullName = listOfFullNamesForNewLikerIds[i];

                  if (newLikerFullName !== null) {
                    usersAndTheirFullNames[newLikerId] = newLikerFullName;
                  }
                }
              }

              if (newLikerIdsNeededForVerificationStatuses.length > 0) {
                const listOfVerificationStatusesForNewLikerIds = responseData.data
                .getListOfUserVerificationStatusesForUserIds;

                for(let i=0; i<newLikerIdsNeededForVerificationStatuses.length; i++) {
                  const newLikerId = newLikerIdsNeededForVerificationStatuses[i];
                  const newLikerVerificationStatus = listOfVerificationStatusesForNewLikerIds[i];

                  if (newLikerVerificationStatus !== null) {
                    usersAndTheirVerificationStatuses[newLikerId] = newLikerVerificationStatus;
                  }
                }
              }
          }
      }
      catch {
          if (newLikerIdsNeededForUsernames.length > 0) {
            console.error(
              `There was trouble connecting to the server to fetch the usernames of all the newly fetched
              likers`
            );
          }

          if (newLikerIdsNeededForFullNames.length > 0) {
            console.error(
              `There was trouble connecting to the server to fetch the full-names of all the newly fetched
              likers`
            ); 
          }

          if (newLikerIdsNeededForVerificationStatuses.length > 0) {
            console.error(
              `There was trouble connecting to the server to fetch the verification-statuses of all the newly
              fetched likers`
            );
          }
      }
    }

    let usersAndTheirPfps:any = {};
    const newLikerIdsNeededForPfps = newLikerIds.filter(newLikerId => {
      if (!(newLikerId in this.usersAndTheirRelevantInfo) || !('profilePhoto' in
      this.usersAndTheirRelevantInfo[newLikerId])) {
        return newLikerId;
      }
    });
    if (newLikerIdsNeededForPfps.length>0) {
      try {
        const response2 = await fetch(
          'http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                userIds: newLikerIdsNeededForPfps
              })
          });
        if(!response2.ok) {
          console.error(
            'The server had trouble fetching the profile-photos of all the newly fetched likers'
          );
        }
        else {
          usersAndTheirPfps = await response2.json();
        }
      }
      catch {
        console.error(
          'There was trouble connecting to the server to fetch the profile-photos of all the newly fetched likers'
        );
      }
    }

    const newUsersAndTheirRelevantInfo = {...this.usersAndTheirRelevantInfo};

    for(let newLikerId of newLikerIds) {
      if (!(newLikerId in usersAndTheirFullNames) && !(newLikerId in usersAndTheirVerificationStatuses) &&
      !(newLikerId in usersAndTheirPfps)) {
        continue;
      }

      if(!(newLikerId in newUsersAndTheirRelevantInfo)) {
        newUsersAndTheirRelevantInfo[newLikerId] = {};
      }
      
      if (newLikerId in usersAndTheirUsernames) {
        newUsersAndTheirRelevantInfo[newLikerId].username = usersAndTheirUsernames[newLikerId];
      }
      if (newLikerId in usersAndTheirFullNames) {
        newUsersAndTheirRelevantInfo[newLikerId].fullName = usersAndTheirFullNames[newLikerId];
      }
      if (newLikerId in usersAndTheirVerificationStatuses) {
        newUsersAndTheirRelevantInfo[newLikerId].isVerified = usersAndTheirVerificationStatuses[newLikerId];
      }
      if (newLikerId in usersAndTheirPfps) {
        newUsersAndTheirRelevantInfo[newLikerId].profilePhoto = usersAndTheirPfps[newLikerId];
      }
    }

    return newUsersAndTheirRelevantInfo;
  }


  fetchAdditionalLikersWhenUserScrollsToBottomOfPopup() {
    const el = this.scrollableLikersDivRef?.nativeElement;

    if (el && this.additionalLikersFetchingErrorMessage.length === 0 && !this.isCurrentlyFetchingAdditionalLikers &&
    el.scrollTop + el.clientHeight >= el.scrollHeight) {
      this.isCurrentlyFetchingAdditionalLikers = true;
      this.fetchLikers('additional');
    }
  }
}
