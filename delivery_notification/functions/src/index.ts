import * as functions from "firebase-functions";

import * as admin from 'firebase-admin';
admin.initializeApp();

// const db = admin.firestore();
const fcm = admin.messaging();

export const sendMessageToDeliveryTopic = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async snapshot => {
   const order = snapshot.data();
    const topicName = 'delivery_topic';
    const message = {
      notification: {
        title:`New order `,
        body:`${order.order_source}`
 
          },
      android: {
        notification: {
          clickAction:`${snapshot.id}`,
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