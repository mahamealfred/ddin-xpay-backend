const dotenv =require("dotenv")
const axios =require("axios");
const accountID = require("../Utils/accountID");
dotenv.config();
class authController{
    static async signIn(req, res) {
        const authheader = req.headers.authorization;
        try {
     const response = await axios.get(process.env.CORE_URL+'/rest/members/me',{
        headers: {
            Authorization: authheader
          },
          withCredentials: true,
            });
            if(response.status===200){
                const data=await accountID(req,res,authheader)
                     let agentFloatAccountId=""
                    let  agentInstantCommissionAccountId=""
                    let   agentDelayedCommissionAccountId=""
                data.forEach(account => {
                    if(account.account.type.name ==="Agent Delayed Commission A/C"){
                        agentDelayedCommissionAccountId=(account.account.id).toString()
                    }
                    else if(account.account.type.name === "Agent Float A/C"){
                        agentFloatAccountId=(account.account.id).toString()
                    }else if(account.account.type.name === "Agent Instant Commission A/C"){
                        agentInstantCommissionAccountId=(account.account.id).toString()
                    }
                    else{
                        return;
                    }
                });
                let phone=""
                let country=""
                let nationalId=""
                let birthday=""
                let gender=""
                let province=""
                let  district=""
                let sector=""
                let agentCategory=""
                    //custome values
                    response.data.customValues.forEach(item=>{
                        if(item.internalName === "mobilePhone"){
                            phone=item.value
                        }
                        else if(item.internalName === "country"){
                            country=item.value
                        }
                        else if(item.internalName === "national_id"){
                            nationalId=item.value
                        }
                        else if(item.internalName === "gender"){
                            gender=item.value
                        }
                        else if(item.internalName === "area"){
                            province=item.value
                        }
                        else if(item.internalName === "district"){
                            district=item.value
                        }
                        else if(item.internalName==="sector"){
                            sector=item.value
                        }
                        else if(item.internalName==="agent_category"){
                           agentCategory=item.value
                        }
                    })
                    const currentDate = new Date();

                    const year = currentDate.getFullYear();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const day = String(currentDate.getDate()).padStart(2, '0');
                    const hours = String(currentDate.getHours()).padStart(2, '0');
                    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
                    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
                    
                    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            
                // console.log("true response:",data)
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus:"EXIST",
                    codeDescription: "SUCCESS",
                    responseDescription: "Successfully logged",
                    data:{
                        id:response.data.id.toString(),
                        name:response.data.name,
                        email:response.data.email,
                        phone,
                        username: response.data.username,
                        image: null,
                        country,
                        nationalId,
                        birthday: response.data.customValues[8].value,
                        gender,
                        city: null,
                        province,
                        district,
                        sector,
                        agentCategory,
                        agentFloatAccountId: agentFloatAccountId,
                        agentInstantCommissionAccountId: agentInstantCommissionAccountId,
                        agentDelayedCommissionAccountId: agentDelayedCommissionAccountId
                        
                    },
                    metadata:null,
                    responseDate:formattedDate
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
            return res.status(500).json({
                responseCode: 500,
                communicationStatus:"FAILED",
                error: "Dear client, we're unable to complete your resquest right now. Please try again later.",
              });  
        }
   
    }
   
}
module.exports=authController;