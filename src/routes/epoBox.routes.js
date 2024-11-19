const express =require("express")
const epoBoxController=require("../controllers/epoBoxController.js");
const CheckAccountStatus = require("../middlewares/checkAccountStatus.js");


const router=express.Router();

router.get('/check-account/:mobileNumber',epoBoxController.checkEpoBoxAccount);

router.get('/postal-code',epoBoxController.getAllPostCode);

router.post('/virtual-address/register',CheckAccountStatus,epoBoxController.createEpoBoxAccount);


module.exports=router