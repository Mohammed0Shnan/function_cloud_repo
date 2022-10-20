import * as functions from "firebase-functions";

import * as admin from 'firebase-admin';
admin.initializeApp();

// const db = admin.firestore();
const fcm = admin.messaging();

export const sendMessageToTopic = functions.firestore
  .document('messages/{messagesId}')
  .onCreate(async snapshot => {
   const advertisement = snapshot.data();
    const topicName = 'advertisements';
    const message = {
      notification: {
        title:`${advertisement.title}`,
        body: `${advertisement.body}`,
      
 
          },
      android: {
        notification: {
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        }
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1
          }
        },
    
      },
  
      topic:topicName,
    };
    
    fcm.send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
      })
      .catch((error) => {
        console.log('Error sending message:', error);
      });
  
  });