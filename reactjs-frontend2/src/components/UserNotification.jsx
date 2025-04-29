import frisbeeXIcon from '../assets/images/frisbeeXIcon.png';

import { useEffect, useState } from 'react';


function UserNotification ({leftImage, rightImage, description, leftImageLink, entireNotificationLink, deleteThis}) {
  const [userIsHovering, setUserIsHovering] = useState(false);
  
  const [elementsForDescription, setElementsForDescription] = useState([]);

  const timeoutId = null;


  useEffect(() => {
    finishSettingElementsForDescription();

    timeoutId = setTimeout(() => {
      deleteThis(null);
    }, 4500);

    return () => {
      clearTimeout(timeoutId);
      timeoutId = null;
    };
  }, []);


  function finishSettingElementsForDescription() {
    const newElements = [];
    let descriptionValue = description || '';

    while (descriptionValue.length > 0) {
      const indexOfNextAt = descriptionValue.indexOf('@');
      const indexOfNextHash = descriptionValue.indexOf('#');

      if (indexOfNextAt === -1 && indexOfNextHash === -1) {
        newElements.push(<span key={newElements.length}>{descriptionValue}</span>);
        break;
      }
      else if (indexOfNextAt === -1 || (indexOfNextHash !== -1 && indexOfNextHash < indexOfNextAt)) {
        if (indexOfNextHash > 0) {
          newElements.push(<span key={newElements.length}>{descriptionValue.substring(0, indexOfNextHash)}</span>);
        }

        descriptionValue = descriptionValue.substring(indexOfNextHash);
        let indexOfSpace = descriptionValue.indexOf(' ');
        if (indexOfSpace === -1) indexOfSpace = descriptionValue.length;

        const hashtag = descriptionValue.substring(0, indexOfSpace);
        newElements.push(
          <a
            key={newElements.length}
            href={`http://34.111.89.101/search/tags/${hashtag.substring(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hashtagOrMention"
            style={{ color: '#71a3f5' }}
          >
            {hashtag}
          </a>
        );

        descriptionValue = descriptionValue.substring(indexOfSpace);
      }
      else {
        if (indexOfNextAt > 0) {
          newElements.push(<span key={newElements.length}>{descriptionValue.substring(0, indexOfNextAt)}</span>);
        }

        descriptionValue = descriptionValue.substring(indexOfNextAt);
        let indexOfSpace = descriptionValue.indexOf(' ');
        if (indexOfSpace === -1) indexOfSpace = descriptionValue.length;

        const mention = descriptionValue.substring(0, indexOfSpace);
        newElements.push(
          <a
            key={newElements.length}
            href={`http://34.111.89.101/profile/${mention.substring(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hashtagOrMention"
            style={{ color: '#71a3f5' }}
          >
            {mention}
          </a>
        );

        descriptionValue = descriptionValue.substring(indexOfSpace);
      }
    }

    setElementsForDescription(newElements);
  };


  function handleMouseLeave() {
    setTimeout(() => setUserIsHovering(false), 600);
  };


  return (
    <a href={entireNotificationLink} target="blank" rel="noopener noreferrer">
      <div className="popup" onMouseEnter={() => setUserIsHovering(true)} onMouseLeave={handleMouseLeave} style={{position:
      'fixed', top: '2%', left: '25%', width: '50%', height: '6em', borderRadius: '0.7em', zIndex: 2, paddingLeft: '3em',
      paddingTop: '1.5em',  paddingBottom: '1em',
      boxShadow: 'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px'}}>
        {userIsHovering &&
          (
            <img src={frisbeeXIcon} onClick={() => deleteThis(null)} style={{height: '2em', width: '2em', objectFit:
            'contain', cursor: 'pointer', position: 'absolute', top: '1%', right: '-3.5%', transform:
            'translate(-50%, -50%)',}}/>
          )
        }

        <div style={{ display: 'flex', gap: '3em', alignItems: 'start' }}>
          <a href={leftImageLink} target="blank" rel="noopener noreferrer">
            <img src={leftImage} style={{height: '4em', width: '4em', objectFit: 'contain'}}/>
          </a>

          <p style={{textAlign: 'start', width: '70%', maxHeight: '5em', overflowWrap: 'break-word', overflowY: 'scroll',
          marginTop: '0.5em'}}>
            { elementsForDescription }
          </p>

          {rightImage &&
            (
              <img src={rightImage} alt="right" style={{height: '5em', width: '4.8em'}}/>
            )
          }
        </div>
      </div>
    </a>
  );
};

export default UserNotification;
