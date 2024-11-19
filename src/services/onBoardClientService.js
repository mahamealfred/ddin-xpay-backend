const dotenv = require("dotenv")
const axios = require("axios");



dotenv.config();
//new methode



function generateUsername(firstName) {
    // Limit the first name to ensure the username length is under 11
    let namePart = firstName.slice(0, 8); // Adjust based on the desired length
    const randomChars = Math.random().toString(36).substring(2, 5); // Generate 3 random characters
    const username = `${namePart}${randomChars}`;

    // Ensure total length is less than 11
    return username.slice(0, 10);
}


function generateStrongPassword(length = 12) {
    // Define the characters to include in the password
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialCharacters = '!@#$%^&*()_+[]{}|;:,.<>?';

    // Combine all characters
    const allCharacters = upperCase + lowerCase + numbers + specialCharacters;

    // Ensure the password contains at least one character from each category
    const passwordArray = [
        upperCase[Math.floor(Math.random() * upperCase.length)],
        lowerCase[Math.floor(Math.random() * lowerCase.length)],
        numbers[Math.floor(Math.random() * numbers.length)],
        specialCharacters[Math.floor(Math.random() * specialCharacters.length)]
    ];

    // Generate the remaining characters randomly
    for (let i = passwordArray.length; i < length; i++) {
        passwordArray.push(allCharacters[Math.floor(Math.random() * allCharacters.length)]);
    }

    // Shuffle the password array to ensure randomness
    const password = passwordArray.sort(() => Math.random() - 0.5).join('');
    return password;
}

const onBoardClient = async (firstName,lastName,email,addressType,address,nationalId) => {

    const username = generateUsername(firstName);
    const password = generateStrongPassword(12);

    // const axios = require('axios');
    let data = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mem="http://members.webservices.cyclos.strohalm.nl/">\r\n   <soapenv:Header/>\r\n   <soapenv:Body>\r\n      <mem:registerMember>\r\n         <!--Optional:-->\r\n         <params>\r\n            <!--Optional:-->\r\n            <groupId>26</groupId>\r\n            <!--Optional:-->\r\n            <username>${username}</username>\r\n            <!--Optional:-->\r\n            <name>${firstName+" "+lastName}</name>\r\n            <!--Optional:-->\r\n            <email>${email}</email>\r\n            <!--Optional:-->\r\n            <loginPassword>${password}</loginPassword>\r\n            <fields>\r\n               <!--Optional:-->\r\n               <internalName>addressType</internalName>\r\n               <!--Optional:-->\r\n               <fieldId>91</fieldId>\r\n               <!--Optional:-->\r\n               <value>${addressType}</value>\r\n               <!--Optional:-->\r\n               <internalName>address</internalName>\r\n               <!--Optional:-->\r\n               <fieldId>92</fieldId>\r\n               <!--Optional:-->\r\n               <value>${address}</value>\r\n               <!--Optional:-->\r\n               <internalName>nationalId</internalName>\r\n               <!--Optional:-->\r\n               <fieldId>93</fieldId>\r\n               <!--Optional:-->\r\n               <value>${nationalId}</value>\r\n            </fields>\r\n         </params>\r\n      </mem:registerMember>\r\n   </soapenv:Body>\r\n</soapenv:Envelope>`;

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://core.ddin.rw/core/services/members',
        headers: {
            'Content-Type': 'application/xml'
        },
        data: data
    };

    await axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data))
            //   console.log(JSON.stringify(response.data));
            //   return res.status(200).json({
            //     responseCode: 200,
            //     communicationStatus: "SUCCESS",
            //     responseDescription: "Account Created Successfully",
            //     data:JSON.stringify(response.data)
            // });
    
          
        })
        .catch((error) => {
            // Extract relevant information from the error
            const errorResponse = error.response || {};
            const errorMessage = errorResponse.data || error.message || "An error occurred";
            const errorStatus = errorResponse.status || 500;
            console.log("error:",errorMessage)
            // return res.status(errorStatus).json({
            //     responseCode: errorStatus,
            //     communicationStatus: "FAILED",
            //     error: {
            //         message: errorMessage,
            //         details: errorResponse.data || null // Provide additional error details if available
            //     }
            // });
        });


    } 
  
module.exports = onBoardClient