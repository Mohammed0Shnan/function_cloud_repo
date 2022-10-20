import * as functions from "firebase-functions";

import * as admin from 'firebase-admin';
admin.initializeApp();

// const db = admin.firestore();
const fcm = admin.messaging();

export const sendAdvertisementToTopic = functions.firestore
  .document('advertisements/{advertisementsId}')
  .onCreate(async snapshot => {
   const advertisement = snapshot.data();
    const topicName = 'advertisements';
    const message = {
      notification: {
        title:`${advertisement.title}`,
        body: `${advertisement.body}`,
        image : `${advertisement.image_url}`,
 
          },
      android: {
        notification: {
          imageUrl: `${advertisement.image_url}`,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        }
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1
          }
        },
        fcm_options: {
          image: `${advertisement.image_url}`,
        
        }
      },
      webpush: {
        headers: {
          image:`${advertisement.image_url}`
        }
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
    // const payload: admin.messaging.MessagingPayload = {
    //   notification: {
    //     title:  `${advertisement.title}`,
    //     body: `${advertisement.body}`,
      
    //     icon:'functions\\icon\\noti_icon.png',
    //     imageUrl:`${advertisement.image_url}`,
    //     clickAction:"FLUTTER_NOTIFICATION_CLICK",// required only for onResume or onLaunch callbacks
        
    //   },
    
    // };

    // return fcm.sendToTopic('advertisements', payload);
  });