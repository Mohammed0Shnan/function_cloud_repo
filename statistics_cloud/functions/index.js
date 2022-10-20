const functions = require("firebase-functions");
const moment = require("moment-timezone");
const admin = require('firebase-admin');
admin.initializeApp()

const database = admin.firestore();

const getOrdersAndSumOrderValueInDayForStore = async (store_id, day) => {
    const orders = [];
    let orders_value = 0;
  
    const orders_snapshot = await database
      .collection("orders")
      .where("store_Id", "==", store_id)
      .get();
    const orders_docs = await orders_snapshot._docs();
  
    for (let i = 0; i < orders_snapshot._size; i++) {
      const order = await orders_docs[i].data();
      if (order["start_date"].toString().startsWith(day)) {
        orders.push(order);
        orders_value += order.order_value;
      }
    }
  
    return { orders, orders_value };
  };

exports.scheduledStatisticsFunction = functions.pubsub.schedule('55 23 * * *').timeZone("Asia/Dubai").onRun(  async (context) => {
    const now_time = moment.tz("Asia/Dubai").toDate();
    const day = moment.tz("Asia/Dubai").format("YYYY-MM-DD").toString();
  
    const stores_snapshot = await database.collection("stores").get();
    const stores_docs = await stores_snapshot._docs();
  
    const result = [];
  
    for (let i = 0; i < stores_snapshot._size; i++) {
      const store_id = stores_docs[i].id;
      const { orders, orders_value } =
        await getOrdersAndSumOrderValueInDayForStore(store_id, day);
      const store_result = {
        store_id,
        orders: orders.length,
        revenue: orders_value,
        dateTime: now_time,
      };
  
      result.push(store_result);
    }
  
  
    let allStoresOrders = 0;
    let allStoresRevenue = 0.0;

    for (let i = 0; i < result.length; i++) {

      const res = await database.collection("statistics").add(result[i]);
      allStoresOrders += result[i].orders;
      allStoresRevenue += result[i].revenue;
    }

    /// Statistics For All Stores

    const all_statistics_result = {
      store_id:'all',
      orders: allStoresOrders,
      revenue: allStoresRevenue,
      dateTime: now_time,
    };
    const all_res = await database.collection("statistics").add(all_statistics_result);
 
    return true;
  });