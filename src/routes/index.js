const express =require("express")
const  authRoute =require("./auth.routes.js");
const  accountsRoute =require("./accounts.routes.js");
const  logsRoute =require( "./logs.routes.js");
const paymentRoute =require("./payment.routes.js");
const epoBoxRoute=require("./epoBox.routes.js");
const router=express.Router();

//authentication
 router.use('/api/v1/authentication',authRoute);
 //agent accounts
 router.use('/api/v1/accounts',accountsRoute);
//goverment services
router.use('/api/v1/payment-service',paymentRoute);

//logs
router.use('/api/v1/transactions',logsRoute);

//epoBox
router.use('/api/v1/epobox-service',epoBoxRoute);

module.exports= router