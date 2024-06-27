import React, { Component } from 'react';
import aiIcon from './images/aiIcon.png';
import createIcon from './images/createIcon.png';
import exploreIcon from './images/exploreIcon.png';
import gamesIcon from './images/gamesIcon.jpg';
import homeIcon from './images/homeIcon.png';
import listenIcon from './images/listenIcon.png';
import messagesIcon from './images/messagesIcon.png';
import moreIcon from './images/moreIcon.png';
import newsIcon from './images/newsIcon.jpg';
import notifsIcon from './images/notificationsIcon.png';
import predictIcon from './images/predictIcon.png';
import reelsIcon from './images/reelsIcon.png';
import searchIcon from './images/searchIcon.png';
import shopIcon from './images/shopIcon.jpg';
import timeCapsuleIcon from './images/timeCapsuleIcon.jpg';
import LeftSidebarPopup from './leftSidebarPopup';
import './styles.css';

class LeftSidebar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            homeText: 'Home',
            searchText: 'Search',
            exploreText: 'Explore',
            reelsText: 'Reels',
            messagesText: 'Messages',
            notificationsText: 'Notifications',
            createText: 'Create',
            profileText: 'Profile',
            shopText: 'Shop',
            weatherNewsText: 'Weather/News',
            gamesText: 'Games',
            aiChatText: 'AI',
            timeCapsuleText: 'Time Capsule',
            predictText: 'Predict',
            listenText: 'Listen',
            moreText: 'More',
            profilePhotoLoading: true,
            profilePhoto: null,
            error: null,
        };
    };



    translateTextPromise = async function(text, language1, language2){
        let language1Code;
        let language2Code;
        if(language1===language2) {
            return text;
        }
        if (language1==="English"){
            language1Code = "en";
        }
        else if(language1==="Español") {
            language1Code = "es";
        }
        else if(language1==="Français") {
            language1Code = "fr";
        }
        else if(language1==="हिंदी") {
            language1Code = "hi";
        }
        else if(language1==="中国人") {
            language1Code = "zh-CN";
        }
        else if(language1==="বাংলা"){
            language1Code = "bn";
        }
        else if(language1==="العربية") {
            language1Code = "ar";
        }
        else if(language1==="Deutsch") {
            language1Code = "de";
        }
        else if(language1==="Bahasa Indonesia") {
            language1Code = "id";
        }
        else if(language1==="Italiano"){
            language1Code = "it";
        }
        else if(language1==="日本語") {
            language1Code = "ja";
        }
        else if(language1==="Русский") {
            language1Code = "ru";
        }
        if (language2==="English"){
            language2Code = "en";
        }
        else if(language2==="Español") {
            language2Code = "es";
        }
        else if(language2==="Français") {
            language2Code = "fr";
        }
        else if(language2==="हिंदी") {
            language2Code = "hi";
        }
        else if(language2==="中国人") {
            language2Code = "zh-CN";
        }
        else if(language2==="বাংলা"){
            language2Code = "bn";
        }
        else if(language2==="العربية") {
            language2Code = "ar";
        }
        else if(language2==="Deutsch") {
            language2Code = "de";
        }
        else if(language2==="Bahasa Indonesia") {
            language2Code = "id";
        }
        else if(language2==="Italiano"){
            language2Code = "it";
        }
        else if(language2==="日本語") {
            language2Code = "ja";
        }
        else if(language2==="Русский") {
            language2Code = "ru";
        }
        const apiUrl = "https://deep-translate1.p.rapidapi.com/language/translate/v2";
        const data = {"q":text,"source":language1Code,"target":language2Code};
        const options = {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'deep-translate1.p.rapidapi.com',
            'x-rapidapi-key': '14da2e3b7emsh5cd3496c28a4400p16208cjsn947339fe37a4'
            },
            body: JSON.stringify(data)
        };
        try {
            const response = await fetch(apiUrl, options);
            if (!response.ok) {
                throw new Error("Network response not ok");
            }
            return response.json()['data']['translations']['translatedText'];
        }

        catch (error) {
            console.error('Error:', error);
            return "T";
        }
    }

    async updateHomeText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.homeText,
                currLang,
                this.props.language
            );
            this.setState({homeText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateSearchText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.searchText,
                currLang,
                this.props.language
            );
            this.setState({ searchText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateExploreText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.exploreText,
                currLang,
                this.props.language
            );
            this.setState({ exploreText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateReelsText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.reelsText,
                currLang,
                this.props.language
            );
            this.setState({reelsText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateMessagesText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.messagesText,
                currLang,
                this.props.language
            );
            this.setState({ messagesText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateNotificationsText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.notificationsText,
                currLang,
                this.props.language
            );
            this.setState({ notificationsText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateCreateText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.createText,
                currLang,
                this.props.language
            );
            this.setState({createText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateProfileText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.profileText,
                currLang,
                this.props.language
            );
            this.setState({ profileText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateShopText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.shopText,
                currLang,
                this.props.language
            );
            this.setState({ shopText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateWeatherNewsText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.weatherNewsText,
                currLang,
                this.props.language
            );
            this.setState({weatherNewsText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateGamesText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.gamesText,
                currLang,
                this.props.language
            );
            this.setState({ gamesText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateAIChatText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.aiChatText,
                currLang,
                this.props.language
            );
            this.setState({ aiChatText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateTimeCapsuleText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.timeCapsuleText,
                currLang,
                this.props.language
            );
            this.setState({ timeCapsuleText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updatePredictText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.predictText,
                currLang,
                this.props.language
            );
            this.setState({ predictText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateListenText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.listenText,
                currLang,
                this.props.language
            );
            this.setState({ listenText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    async updateMoreText(currLang) {
        try {
            const translatedText = await this.translateTextPromise(
                this.state.moreText,
                currLang,
                this.props.language
            );
            this.setState({ moreText: translatedText });
        } catch (error) {
            console.error("Translation failed", error);
        }
    }

    fetchProfilePhoto(username) {
        fetch(`http://localhost:8003/getProfilePhoto/${username}`)
            .then(response => {
                if (!response.ok) {
                    this.setState({
                        error: true,
                        profilePhotoLoading: false
                    });
                    throw new Error('Network response was not ok');
                }
                return response.arrayBuffer();
            })
            .then(buffer => {
                const base64Flag = 'data:image/jpeg;base64,';
                const imageStr = this.arrayBufferToBase64(buffer);
                this.setState({
                    profilePhoto: base64Flag + imageStr,
                    profilePhotoLoading: false
                });
            })
            .catch(error => {
                this.setState({
                    error: true,
                    profilePhotoLoading: false
                });
            });
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    async componentDidMount() {
        this.fetchProfilePhoto(this.props.username);
        await this.updateHomeText("English");
        await this.updateSearchText("English");
        await this.updateExploreText("English");
        await this.updateReelsText("English");
        await this.updateMessagesText("English");
        await this.updateNotificationsText("English");
        await this.updateCreateText("English");
        await this.updateProfileText("English");
        await this.updateShopText("English");
        await this.updateWeatherNewsText("English");
        await this.updateGamesText("English");
        await this.updateAIChatText("English");
        await this.updateTimeCapsuleText("English");
        await this.updatePredictText("English");
        await this.updateListenText("English");
        await this.updateMoreText("English");
    }

    
    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.language !== this.props.language) {
            await this.updateHomeText(prevProps.language);
            await this.updateSearchText(prevProps.language);
            await this.updateExploreText(prevProps.language);
            await this.updateReelsText(prevProps.language);
            await this.updateMessagesText(prevProps.language);
            await this.updateNotificationsText(prevProps.language);
            await this.updateCreateText(prevProps.language);
            await this.updateProfileText(prevProps.language);
            await this.updateShopText(prevProps.language);
            await this.updateWeatherNewsText(prevProps.language);
            await this.updateGamesText(prevProps.language);
            await this.updateAIChatText(prevProps.language);
            await this.updateTimeCapsuleText(prevProps.language);
            await this.updatePredictText(prevProps.language);
            await this.updateListenText(prevProps.language);
            await this.updateMoreText(prevProps.language);
        }
    }


    



    render() {
        return (
        <React.Fragment>
        <div style={{position: 'fixed'}}>
        <div style={{width:'14.5em', height:'54em', borderStyle:'solid', borderColor:'lightgray',  borderWidth: '0px 0.01em 0px 0em', position: 'relative', overflow:'scroll'}}>
            <h1 className="headerMegagram" style={{fontFamily:'Billabong', fontSize:'1.9em', marginLeft:'-3em', marginTop:'1em', fontWeight: '100'}}><span style={{cursor:"pointer"}}>Megagram</span></h1>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={homeIcon} style={{height:'2.3em', width:'2.3em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontWeight:'bold', fontSize:'1em', marginLeft:'0.4em'}}>{this.state.homeText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={searchIcon} style={{height:'1.8em', width:'2.3em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.searchText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={exploreIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.exploreText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={reelsIcon} style={{height:'2.4em', width:'2.4em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.reelsText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={messagesIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.messagesText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={notifsIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.notificationsText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={createIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.createText}</p>
            </div>
            <div className="sidebarElement"  style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            {!(this.state.profilePhotoLoading || this.state.error) &&
            (<img src={this.state.profilePhoto} style={{height:'2.2em', width:'2.2em', pointerEvents:'none', objectFit:'contain'}}/>)}
            {(this.state.profilePhotoLoading || this.state.error) &&
            (<img src={moreIcon} style={{height:'2.2em', width:'2.2em', pointerEvents:'none', objectFit:'contain'}}/>)}
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.profileText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={shopIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.shopText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={newsIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.weatherNewsText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={gamesIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.gamesText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={aiIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.aiChatText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={timeCapsuleIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.timeCapsuleText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={predictIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/> 
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.predictText}</p>
            </div>
            <div className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em'}}>
            <img src={listenIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em'}}>{this.state.listenText}</p>
            </div>
            <div onClick={this.props.changePopup} className="sidebarElement" style={{display:'flex', justifyContent:'start', alignItems:'center', marginLeft:'0.9em', marginTop:'7em'}}>
            <img src={moreIcon} style={{height:'2.5em', width:'2.5em', pointerEvents:'none', objectFit:'contain'}}/>
            <p style={{fontSize:'1em', marginLeft:'0.4em', fontWeight: this.props.showPopup ? 'bold' : 'normal'}}>{this.state.moreText}</p>
        </div>
        {this.props.showPopup && (
        <div style={{position: 'absolute', top: '37em'}}>
            <LeftSidebarPopup language={this.props.language}/>
        </div>
        )}
        </div>
        </div>
        </React.Fragment>);
    };
}

export default LeftSidebar;