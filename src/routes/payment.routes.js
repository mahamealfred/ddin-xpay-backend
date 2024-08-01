const express =require("express")
const rraController =require("../controllers/rraController.js");
const electricityController =require("../controllers/electricityController.js");

const bulkSmsController=require("../controllers/bulkSmsController.js");
const CheckAccountStatus = require("../middlewares/checkAccountStatus.js");
const airtimeController =require("../controllers/airtimeController.js");
const checkEfashePayment = require("../services/checkEfashePayment.js");
const Startimeontroller = require("../controllers/startimeController.js");

const router=express.Router();
//RRA Payament
router.post('/rra/validate-vend',
rraController.ValidateRRAId
// (req,res)=>{
//     return res.status(400).json({
//         responseCode: 400,
//         communicationStatus: "FAILED",
//         responseDescription: "Dear client, the service is currently undergoing maintenance to serve you better. We appreciate your patience and apologize for any inconvenience."
//       });
// }
);
router.post('/rra/payment',CheckAccountStatus,rraController.rraPayment);

//ELECTRICITY Payament
router.post('/electricity/validate-vend',electricityController.ValidateCustomerMeterNumber);
router.post('/electricity/payment',CheckAccountStatus,electricityController.ddinElectricityPaymentNewMethode);

//AIRTIME PAYMENT
router.post('/airtime/validate-vend',airtimeController.ValidatePhoneNumber);
router.post('/airtime/payment',CheckAccountStatus,airtimeController.ddinAirtimePayment);
router.post('/bulk-airtime/payment',CheckAccountStatus,airtimeController.ddinBulkAirtimePayment);

//BULK SMS 
router.post('/pindo-bulksms/payment',CheckAccountStatus,bulkSmsController.ddinPindoBulkSmsPayment);

//STARTIME 
router.post('/startime/validate-vend',
Startimeontroller.ValidateStartimeNumber
// (req,res)=>{
//     return res.status(400).json({
//         responseCode: 400,
//         communicationStatus: "FAILED",
//         responseDescription: "Dear client, the service is currently undergoing maintenance to serve you better. We appreciate your patience and apologize for any inconvenience."
//       });
// }
);
router.post('/startime/payment',CheckAccountStatus,Startimeontroller.ddinStartimePayment);

//payament status
router.get("/check-efashe-transaction/status",checkEfashePayment)

module.exports= router