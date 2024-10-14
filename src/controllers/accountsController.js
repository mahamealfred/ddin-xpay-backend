const dotenv =require("dotenv")
const axios =require("axios");
const xml2js = require('xml2js');
const trustAccountToAgentFloat = require("../Utils/trustAccountToAgentFloat");
dotenv.config();
class accountsController{
    static async getAccountsBalance(req, res) {
        const authheader = req.headers.authorization;
        try {
     const response = await axios.get(process.env.CORE_URL+'/rest/accounts/default/status',{
        headers: {
            Authorization: authheader,
          },
          withCredentials: true,
            });
            if(response.status===200){
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus:"SUCCESS",
                    responseDescription: "Agent Accounts",
                    data:{
                        balance:response.data.balance,
                        formattedBalance:response.data.formattedBalance,
                        availableBalance:response.data.availableBalance,
                        formattedAvailableBalance:response.data.formattedAvailableBalance,
                        reservedAmount:response.data.reservedAmount,
                        formattedReservedAmount:response.data.formattedReservedAmount,
                        creditLimit:response.data.creditLimit,
                        formattedCreditLimit:response.data.formattedCreditLimit
                    }
                  });  
            }
              
            
        } catch (error) {
            if(error.response.status===401){
                return res.status(401).json({
                    responseCode: 401,
                    communicationStatus:"FAILED",
                    responseDescription: "Username and Password are required for authentication"
                  }); 
            }
            if(error.response.status===400){
                return res.status(400).json({
                    responseCode: 400,
                    communicationStatus:"FAILED",
                    responseDescription: "Invalid Username or Password"
                  }); 
            }
            if(error.response.status===404){
                return res.status(404).json({
                    responseCode: 404,
                    communicationStatus:"FAILED",
                    responseDescription: "Account Not Found"
                  }); 
            }
            return res.status(500).json({
                responseCode: 500,
                communicationStatus:"FAILED",
                error: error.message,
              });  
        }
   
    }
//    get account by ID
static async getAccountsBalanceByID(req, res) {
    const authheader = req.headers.authorization;
    const id=req.query.accountId
    try {
 const response = await axios.get(process.env.CORE_URL+`/rest/accounts/${id}/status`,{
    headers: {
        Authorization: authheader,
      },
      withCredentials: true,
        });
        if(response.status===200){
            const currentDate = new Date();

            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const hours = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const seconds = String(currentDate.getSeconds()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            return res.status(200).json({
                responseCode: 200,
                communicationStatus:"SUCCESS",
                responseDescription: "Agent Accounts by ID",
                data:{
                    balance:response.data.balance.toString(),
                    formattedBalance:response.data.formattedBalance,
                    availableBalance:response.data.availableBalance.toString(),
                    formattedAvailableBalance:response.data.formattedAvailableBalance,
                    reservedAmount:response.data.reservedAmount.toString(),
                    formattedReservedAmount:response.data.formattedReservedAmount,
                    creditLimit:response.data.creditLimit.toString(),
                    formattedCreditLimit:response.data.formattedCreditLimit
                },
                metadata:null,
                responseDate:formattedDate
              });  
        }
          
        
    } catch (error) {
      console.log("e:",error)
        if(error.response.status===401){
        
            return res.status(401).json({
                responseCode: 401,
                communicationStatus:"FAILED",
                responseDescription: "Username and Password are required for authentication"
              }); 
        }
        if(error.response.status===400){
            return res.status(400).json({
                responseCode: 400,
                communicationStatus:"FAILED",
                responseDescription: "Invalid Username or Password"
              }); 
        }
        if(error.response.status===404){
            return res.status(404).json({
                responseCode: 404,
                communicationStatus:"FAILED",
                responseDescription: "Account Not Found"
              }); 
        }
        return res.status(500).json({
            responseCode: 500,
            communicationStatus:"FAILED",
            error: error.message,
          });  
    }

}
//self serve commission
static async selfServeCommisiion(req, res) {
    const {amount}=req.body
    const authheader = req.headers.authorization;
      //agent name
      const authHeaderValue = authheader.split(' ')[1];
      const decodedValue = Buffer.from(authHeaderValue, 'base64').toString('ascii');
      const agent_name = decodedValue.split(':')[0]
    const url = process.env.CORE_URL+'/services/payment';
    const soapRequest =`
   <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:pay="http://payments.webservices.cyclos.strohalm.nl/">
   <soapenv:Header/>
   <soapenv:Body>
      <pay:doPayment>
         <!--Optional:-->
         <params>
            <toSystem>true</toSystem>  
            <fromMemberPrincipalType>USER</fromMemberPrincipalType>
            <fromMember>${agent_name}</fromMember>
            <amount>${amount}</amount>
            <description>Agent Commission Withdrawal</description>
            <transferTypeId>100</transferTypeId>        
         </params>
      </pay:doPayment>
   </soapenv:Body>
</soapenv:Envelope>
    `;
    
    const headers = {
      'Content-Type': 'text/xml',
      'SOAPAction': ''
    };
    try {
        const response = await axios.post(url, soapRequest, { headers });
        try {
          const result = await xml2js.parseStringPromise(response.data, { explicitArray: false });
          //console.log('JSON response:', JSON.stringify(result, null, 2));
         // console.log("result:",result["soap:Envelope"]["soap:Body"][ 'ns2:doPaymentResponse'].return.status)
         if(result &&  result["soap:Envelope"]["soap:Body"][ 'ns2:doPaymentResponse'].return.status==="PROCESSED"){
trustAccountToAgentFloat(req,res,agent_name,amount)
         }
         if(result &&  result["soap:Envelope"]["soap:Body"][ 'ns2:doPaymentResponse'].return.status==="INVALID_PARAMETERS"){
          return res.status(400).json({
            responseCode: 400,
            communicationStatus:"FAILED",
            responseDescription: "Something went wrong. Please get in touch with DDIN support!"
          }); 
                   }
        } catch (parseError) {
          
            return res.status(500).json({
                responseCode: 500,
                communicationStatus:"FAILED",
                error: parseError,
              });  
        }
      } catch (error) {
        console.error('Error making request:', error);
        return res.status(500).json({
            responseCode: 500,
            communicationStatus:"FAILED",
            error: "Dear client, we're unable to complete your transaction right now. Please try again later.",
          });  
      }

}
}
module.exports= accountsController;