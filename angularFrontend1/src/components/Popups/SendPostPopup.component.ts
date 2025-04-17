import { SelectUserOrGroupChat } from '../SelectUserOrGroupChat.component';

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'SendPostPopup',
  templateUrl: '../../templates/Popups/SendPostPopup.component.html',
  imports: [CommonModule, SelectUserOrGroupChat],
  standalone: true
})
export class SendPostPopup {
  @Input() authUserId!:number;

  @Input() overallPostId!:string;

  @Input() usersAndTheirRelevantInfo!:any;
  @Input() cachedMessageSendingSuggestions!:any;

  @Output() closePopup:EventEmitter<any> = new EventEmitter<any>();
  @Output() showErrorPopup:EventEmitter<string> = new EventEmitter<string>();
  @Output() updateUsersAndTheirRelevantInfo:EventEmitter<any> = new EventEmitter<any>();
  @Output() updateCachedMessageSendingSuggestions:EventEmitter<any> = new EventEmitter<any>();

  inputText:string = '';
  errorMessage:string = '';
  statusOfFetchingResults:string = '';
  statusOfSendingPost:string = '';

  currentSuggestions:any[] = [];

  selectedUsersAndGroupChats:Set<string> = new Set<string>();

  
  ngOnInit() {
    this.fetchUsersToSendPostToGivenTextInput(null);
  }

  async fetchUsersToSendPostToGivenTextInput(event:any) {
    this.errorMessage = '';
    let newInputText = '';

    if(event!==null) {
      newInputText = event.target.value;
      this.inputText = newInputText;
    }

    if(newInputText in this.cachedMessageSendingSuggestions) {
      this.currentSuggestions = this.cachedMessageSendingSuggestions[newInputText];
      return;
    }

    this.statusOfFetchingResults = 'Loading...';

    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/springBootBackend2/getMessageSendingSuggestions/${this.authUserId}
      /${newInputText}`, {
        credentials: 'include'
      });
      if(!response.ok) {
          this.errorMessage = `The server had trouble getting the suggested accounts/group-chats for you to send
          this post to.`
      }
      else {
        const postSendingSuggestions:any[] = await response.json();
        this.currentSuggestions = postSendingSuggestions;

        const newCachedMessageSendingSuggestions = {...this.cachedMessageSendingSuggestions};
        newCachedMessageSendingSuggestions[newInputText] = postSendingSuggestions;
        this.updateCachedMessageSendingSuggestions.emit(newCachedMessageSendingSuggestions);

        const idsOfSuggestedUsers = postSendingSuggestions
        .filter(
          x => x.userId !== null
        )
        .map(
          x => x.userId
        );

        const newUsersAndTheirRelevantInfo = await this.fetchAllTheRelevantUserInfo(idsOfSuggestedUsers);
        for(let suggestion of postSendingSuggestions) {
          const userId = suggestion.userId;
          if (userId !== null) {
              const username = suggestion.userOrGroupChatName;

              if (!(userId in newUsersAndTheirRelevantInfo)) {
                  newUsersAndTheirRelevantInfo[userId] = {};
              }

              newUsersAndTheirRelevantInfo[userId].username = username;
          }
      }
        this.updateUsersAndTheirRelevantInfo.emit(newUsersAndTheirRelevantInfo);
      }
    }
    catch (error) {
      this.errorMessage = `There was trouble connecting to the server to get the suggested accounts/group-chats for
      you to send this post to.`;
    }
    finally {
      this.statusOfFetchingResults = '';
    }
  }


  async fetchAllTheRelevantUserInfo(newSuggestedUserIds:any[]) {
    let graphqlUserQueryStringHeaderInfo:any = {};
    let graphqlUserQueryString = '';
    let graphqlUserVariables:any = {};

    let usersAndTheirFullNames:any = {};
    const newSuggestedUserIdsNeededForFullNames = newSuggestedUserIds.filter(newSuggestedUserId => {
      if (!(newSuggestedUserId in this.usersAndTheirRelevantInfo) || !('fullName' in
      this.usersAndTheirRelevantInfo[newSuggestedUserId])) {
        return newSuggestedUserId;
      }
    });

    if (newSuggestedUserIdsNeededForFullNames.length > 0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newSuggestedUserIdsNeededForFullNames'] = '[Int!]!';

      graphqlUserQueryString +=
      `getFullNamesForListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds: $newSuggestedUserIdsNeededForFullNames) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newSuggestedUserIdsNeededForFullNames = newSuggestedUserIdsNeededForFullNames;
    }

    let usersAndTheirVerificationStatuses:any = {};
    const newSuggestedUserIdsNeededForVerificationStatuses = newSuggestedUserIds.filter(newSuggestedUserId => {
      if (!(newSuggestedUserId in this.usersAndTheirRelevantInfo) || !('isVerified' in
      this.usersAndTheirRelevantInfo[newSuggestedUserId])) {
        return newSuggestedUserId;
      }
    });
    if (newSuggestedUserIdsNeededForVerificationStatuses.length>0) {
      graphqlUserQueryStringHeaderInfo['$authUserId'] = 'Int!';
      graphqlUserQueryStringHeaderInfo['$newSuggestedUserIdsNeededForVerificationStatuses'] = '[Int!]!';

      graphqlUserQueryString +=
      `getVerificationStatusesOfListOfUserIdsAsAuthUser(authUserId: $authUserId, userIds:
      $newSuggestedUserIdsNeededForVerificationStatuses) `;
      graphqlUserVariables.authUserId = this.authUserId;
      graphqlUserVariables.newSuggestedUserIdsNeededForVerificationStatuses =
      newSuggestedUserIdsNeededForVerificationStatuses;
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
          if (newSuggestedUserIdsNeededForFullNames.length > 0) {
            console.error(
              'The server had trouble fetching the full-names of all the newly fetched post-sending suggestions'
            );
          }

          if (newSuggestedUserIdsNeededForVerificationStatuses.length > 0) {
            console.error(
              'The server had trouble fetching the verification-statuses of all the new post-sending suggestions'
            );
          }
        }
        else {
          const responseData = await response.json();
          
          if (newSuggestedUserIdsNeededForFullNames.length > 0) {
            const listOfFullNamesFornewSuggestedUserIds = responseData.data.getListOfFullNamesForUserIds;

            for(let i=0; i<newSuggestedUserIdsNeededForFullNames.length; i++) {
              const newSuggestedUserId = newSuggestedUserIdsNeededForFullNames[i];
              const newLikerFullName = listOfFullNamesFornewSuggestedUserIds[i];

              if (newLikerFullName !== null) {
                usersAndTheirFullNames[newSuggestedUserId] = newLikerFullName;
              }
            }
          }

          if (newSuggestedUserIdsNeededForVerificationStatuses.length > 0) {
            const listOfVerificationStatusesFornewSuggestedUserIds = responseData.data
            .getListOfUserVerificationStatusesForUserIds;

            for(let i=0; i<newSuggestedUserIdsNeededForVerificationStatuses.length; i++) {
              const newSuggestedUserId = newSuggestedUserIdsNeededForVerificationStatuses[i];
              const newLikerVerificationStatus = listOfVerificationStatusesFornewSuggestedUserIds[i];

              if (newLikerVerificationStatus !== null) {
                usersAndTheirVerificationStatuses[newSuggestedUserId] = newLikerVerificationStatus;
              }
            }
          }
        }
      }
      catch {
        if (newSuggestedUserIdsNeededForFullNames.length > 0) {
          console.error(
            `There was trouble connecting to the server to fetch the full-names of all the newly fetched
            post-sending suggestions`
          ); 
        }

        if (newSuggestedUserIdsNeededForVerificationStatuses.length > 0) {
          console.error(
            `There was trouble connecting to the server to fetch the verification-statuses of all the newly
            fetched post-sending suggestions`
          );
        }
      }
    }

    let usersAndTheirPfps:any = {};
    const newSuggestedUserIdsNeededForPfps = newSuggestedUserIds.filter(newSuggestedUserId => {
      if (!(newSuggestedUserId in this.usersAndTheirRelevantInfo) || !('profilePhoto' in
      this.usersAndTheirRelevantInfo[newSuggestedUserId])) {
        return newSuggestedUserId;
      }
    });
    if (newSuggestedUserIdsNeededForPfps.length>0) {
      try {
        const response2 = await fetch(
          'http://34.111.89.101/api/Home-Page/laravelBackend1/getProfilePhotosOfMultipleUsers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              userIds: newSuggestedUserIdsNeededForPfps
            })
          });
        if(!response2.ok) {
          console.error(
            'The server had trouble fetching the profile-photos of all the newly fetched post-sending suggestions'
          );
        }
        else {
          usersAndTheirPfps = await response2.json();
        }
      }
      catch {
        console.error(
          `There was trouble connecting to the server to fetch the profile-photos of all the newly fetched post-
          sending suggestions`
        );
      }
    }

    const newUsersAndTheirRelevantInfo = {...this.usersAndTheirRelevantInfo};

    for(let newSuggestedUserId of newSuggestedUserIds) {
      if (!(newSuggestedUserId in usersAndTheirFullNames) && !(newSuggestedUserId in usersAndTheirVerificationStatuses)
      && !(newSuggestedUserId in usersAndTheirPfps)) {
        continue;
      }

      if(!(newSuggestedUserId in newUsersAndTheirRelevantInfo)) {
        newUsersAndTheirRelevantInfo[newSuggestedUserId] = {};
      }
      
      if (newSuggestedUserId in usersAndTheirFullNames) {
        newUsersAndTheirRelevantInfo[newSuggestedUserId].fullName = usersAndTheirFullNames[newSuggestedUserId];
      }
      if (newSuggestedUserId in usersAndTheirVerificationStatuses) {
        newUsersAndTheirRelevantInfo[newSuggestedUserId].isVerified = usersAndTheirVerificationStatuses[newSuggestedUserId];
      }
      if (newSuggestedUserId in usersAndTheirPfps) {
        newUsersAndTheirRelevantInfo[newSuggestedUserId].profilePhoto = usersAndTheirPfps[newSuggestedUserId];
      }
    }
    return newUsersAndTheirRelevantInfo;
  }


  selectUserOrGroupChat(userOrGroupChatToBeSelected:string) {
    this.selectedUsersAndGroupChats.add(userOrGroupChatToBeSelected);
  }


  unselectUserOrGroupChat(userOrGroupChatToBeUnselected:string) {
    this.selectedUsersAndGroupChats.delete(userOrGroupChatToBeUnselected);
  }


  async sendPost(method:string) {
    if (this.authUserId === -1) {
      this.showErrorPopup.emit('Dear Anonymous Guest, you must be logged in to an account to do that');
      return;
    }
    
    this.statusOfSendingPost = 'Loading...';
    try {
      const response = await fetch(
      `http://34.111.89.101/api/Home-Page/springBootBackend2/sendMessageToOneOrMoreUsersAndGroups/${this.authUserId}/${method}`,
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          messageToSend: `http://34.111.89.101/posts/${this.overallPostId}`,
          usersAndGroupsToSendTo: [...this.selectedUsersAndGroupChats]
        }),
        credentials: 'include'
      });

      if(!response.ok) {
        this.showErrorPopup.emit('The server had trouble sending this post to the selected member(s).');
        this.statusOfSendingPost = '';
      }
      else {
        this.selectedUsersAndGroupChats = new Set();
        this.statusOfSendingPost = 'Sent';
        setTimeout(() => {
          this.statusOfSendingPost = '';
        }, 1600);
      }
    }
    catch (error) {
      this.showErrorPopup.emit('There was trouble connecting to the server to send this post to the selected member(s).');
      this.statusOfSendingPost = '';
    }
  }


  getSpecificInfoOnSelectedUserOrGroupChat(labelOfSpecificInfo:string, selectedUserOrGroupChat:string) {
    const partsOfSelectedUserOrGroupChatString = selectedUserOrGroupChat.split('/');

    switch (labelOfSpecificInfo) {
      case 'key': {
        if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
          const groupChatId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
          return `group-chat ${groupChatId}`;
        }
        else {
          const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
          return `user ${userId}`;
        }
      }

      case 'groupChatId': {
        if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
          const groupChatId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
          return groupChatId;
        }
        return null;
      }

      case 'userId': {
        if (partsOfSelectedUserOrGroupChatString[0] === 'user') {
          const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
          return userId;
        }
        return null;
      }

      case 'userOrGroupChatName': {
        return partsOfSelectedUserOrGroupChatString[2];
      }
      
      case 'fullName': {
        if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
          return 'One of your group-chats';
        }

        const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
        if (userId in this.usersAndTheirRelevantInfo && 'fullName' in this.usersAndTheirRelevantInfo[userId]) {
          return this.usersAndTheirRelevantInfo[userId].fullName;
        }
        return 'Could not get full-name';
      }

      case 'profilePhoto': {
        if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
          return 'images/defaultGroupChatPfp.png';
        }

        const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
        if (userId in this.usersAndTheirRelevantInfo && 'profilePhoto' in this.usersAndTheirRelevantInfo[userId]) {
          return this.usersAndTheirRelevantInfo[userId].profilePhoto;
        }
        return 'images/defaultPfp.png';
      }
      
      case 'isVerified': {
        if (partsOfSelectedUserOrGroupChatString[0] === 'group-chat') {
          return false;
        }

        const userId = parseInt(partsOfSelectedUserOrGroupChatString[1]);
        if (userId in this.usersAndTheirRelevantInfo && 'isVerified' in this.usersAndTheirRelevantInfo[userId]) {
          return this.usersAndTheirRelevantInfo[userId].isVerified;
        }
        return false;
      }
    }
  }


  getSpecificInfoOnPostSendingSuggestion(labelOfSpecificInfo:string, postSendingSuggestion:any) {
    switch (labelOfSpecificInfo) {
      case 'key':
      if (postSendingSuggestion.groupChatId !== null) {
        return `group-chat ${postSendingSuggestion.groupChatId}`;
      }
      return `user ${postSendingSuggestion.userId}`;

      case 'groupChatId': 
        return postSendingSuggestion.groupChatId;

      case 'userId':
        return postSendingSuggestion.userId;

      case 'userOrGroupChatName':
        return postSendingSuggestion.userOrGroupChatName;
      
      case 'fullName':
        if (postSendingSuggestion.groupChatId !== null) {
          return 'One of your group-chats;'
        }

        if (postSendingSuggestion.userId in this.usersAndTheirRelevantInfo && 'fullName' in
        this.usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
          return this.usersAndTheirRelevantInfo[postSendingSuggestion.userId].fullName;
        }
        return 'Could not get full-name';

      case 'profilePhoto':
        if (postSendingSuggestion.groupChatId !== null) {
          return 'images/defaultGroupChatPfp.png';
        }

        if (postSendingSuggestion.userId in this.usersAndTheirRelevantInfo && 'profilePhoto' in
        this.usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
          return this.usersAndTheirRelevantInfo[postSendingSuggestion.userId].profilePhoto;
        }
        return 'images/defaultPfp.png';
      
      case 'isVerified':
        if (postSendingSuggestion.groupChatId !== null) {
          return false;
        }

        if (postSendingSuggestion.userId in this.usersAndTheirRelevantInfo && 'isVerified' in
        this.usersAndTheirRelevantInfo[postSendingSuggestion.userId]) {
          return this.usersAndTheirRelevantInfo[postSendingSuggestion.userId].isVerified;
        }
        return false;
    }
  }


  getFilteredCurrentSuggestionsThatAreNamedAndThatAreNotAlreadySelected() {
    return this.currentSuggestions.filter(suggestion => {
      const isGroupChatSelected = this.selectedUsersAndGroupChats.has(
        `group-chat/${suggestion.groupChatId}/${suggestion.userOrGroupChatName}`
      );
      const isUserSelected = this.selectedUsersAndGroupChats.has(
        `user/${suggestion.userId}/${suggestion.userOrGroupChatName}`
      );

      if (isGroupChatSelected || isUserSelected) return false;

      return true;
    });
  }


  trackByFunctionForSelectedUsersAndGroupChats = (_:number, selectedUserOrGroupChat:string) => {
    return this.getSpecificInfoOnSelectedUserOrGroupChat('key', selectedUserOrGroupChat);
  }


  trackByFunctionForPostSendingSuggestions = (_:number, postSendingSuggestion:any) => {
    return this.getSpecificInfoOnPostSendingSuggestion('key', postSendingSuggestion);
  }
}
