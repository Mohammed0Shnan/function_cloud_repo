const functions = require("firebase-functions");
const stripe  = require('stripe')(functions.config().stripe.testkey)


const calculateOrderAmount = function (items){
    prices = [];
    console.log(items);
    items.forEach(item=>{
        quantity = item.quantity;
        price = item.price * quantity ;
        prices.push(price);
    });
    return parseFloat(prices.reduce((a,b) => a+b) * 100) ;
}

const generateResponse = function (intent){
    switch (intent.status){
        case 'requires_action':
            return {
                clientSecret: intent.client_secret,
                requestAction:true,
                status:intent.status,
            };
        case 'requires_payment_method':
            return {
                'error':'Your card was denied, please provide a new payment method'
            };
        case 'succeeded':
            console.log('Payment succeeded');
            return {clientSecret: intent.client_secret, status: intent.status};     
    }
    return {error: 'Failed'};
}



exports.StripePayEndpointMethodId =  functions.https.onRequest(async (req , res)=>{
    console.log(`start`);
   const { paymentMethodId,items, currency, useStripeSdk,customerId} = req.body;
   console.log(`${ req.body}`);
   const orderAmount = calculateOrderAmount(items);

   try{
    if(paymentMethodId){

        const params = {
            amount: orderAmount ,
            confirm:true,
            confirmation_method: 'manual',
            customer: customerId,
            //off_session: true,
            setup_future_usage:'off_session',
            currency: currency,
            payment_method: paymentMethodId,
            use_stripe_sdk: useStripeSdk,
        }
        const intent = await stripe.paymentIntents.create(params);
        console.log(`intent: ${intent}`);
        return res.send(generateResponse(intent));
    }
    return res.sendStatus(400);
   }catch (e) {
    return res.send({ error: e.message});
   }
});

exports.StripePayEndpointIntentId =  functions.https.onRequest(async (req , res)=>{
    const { paymentIntentId} = req.body; 
    try{
     if(paymentIntentId){
        const intent  = await stripe.paymentIntents.confirm(paymentIntentId);
        return res.send(generateResponse(intent));
     }
     return res.sendStatus(400);
    }catch (e) {
     return res.send({ error: e.message});
    }
});
 

exports.StripePayEndpointSetupIntent =  functions.https.onRequest(async (req , res)=>{

    const { paymentMethodId , customerId } = req.body;

    const ephemeralKey = await stripe.ephemeralKeys.create(
        {customer: customerId},
        {apiVersion: '2020-08-27'}
      );
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
      });
      const attachPaymentToCustomer = await stripe.paymentMethods.attach(
        paymentMethodId,{customer: customerId}
    );
      res.json({
        setupIntent: setupIntent.client_secret,
        attach:attachPaymentToCustomer,
        ephemeralKey: ephemeralKey.secret,
      })
});


exports.StripePayEndpointDetach =  functions.https.onRequest(async (req , res)=>{

    const { paymentMethodId } = req.body;

      const detachRes = await stripe.paymentMethods.detach(
        paymentMethodId
    );
      res.json(detachRes)
});

exports.StripePayEndpointGetPaymentMethods =  functions.https.onRequest(async (req , res)=>{
    const { customerId } = req.body;
    
const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });


  res.json({
    result:paymentMethods
  })
});



exports.StripePayEndpointCustomerId =  functions.https.onRequest(async (req , res)=>{
    const customer = await stripe.customers.create({
        
    });
//   const ephemeralKey = await stripe.ephemeralKeys.create(
//     {customer: customer.id},
//     {apiVersion: '2020-08-27'}
//   );
//   const setupIntent = await stripe.setupIntents.create({
//     customer: customer.id,
//   });
  res.json({
    // setupIntent: setupIntent.client_secret,
    // ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    // publishableKey 
    //publishableKey: 'pk_test_51LojVWB0KNCzD2CqpY4aXABmv6jQ7tDtU2agcaM5cbPsQm86mZ0wyrxHv6s0J1vCbwE5zc5NWEXfBAFXBjaUDxFV00HOAfHnL7'
  })
});


