const dotenv = require("dotenv")
const axios = require("axios");
const dbConnect = require("../db/config");
const {  selectAllLogs } = require("../Utils/logsData");

dotenv.config();
class logsController {
    static async getLogs(req, res) {
        const authheader = req.headers.authorization;
        let transData = [];
    
        try {
            // Use async/await with MySQL query
            const [results] = await dbConnect.query('SELECT * FROM transactions_status');
    
            // Check if results is an array before processing
            if (Array.isArray(results)) {
                transData = results;
            } else {
                transData = []; // Set to an empty array if it's not an array
            }
    
            const response = await axios.get(process.env.CORE_URL + '/rest/accounts/default/history', {
                headers: {
                    Authorization: authheader,
                },
                withCredentials: true,
            });
    
            if (response.status === 200) {
                let transactions = [];
                response.data.elements.forEach(element => {
                    transactions.push({
                        id: element.id.toString(),
                        date: element.date,
                        formattedDate: element.formattedDate,
                        processDate: element.processDate,
                        formattedProcessDate: element.formattedProcessDate,
                        amount: element.amount.toString(),
                        formattedAmount: element.formattedAmount,
                        transactionType: element.transferType.name,
                        agentAccount: null,
                        description: element.description,
                        destinationAccountName: element.transferType.to.name,
                        destinationAccountHolderName: null
                    });
                });
    
                const filteredTransactions = [];
    
                // Iterate through each object in transData (ensure it's an array)
                transData.forEach(item => {
                    const transId = item.transactionId;
                    const stat = item.status;
    
                    const matchingTransaction = transactions.find(transaction => {
                        if (transaction.id === transId && stat === "Complete") {
                            filteredTransactions.push(transaction);
                        }
                    });
                });
    
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus: "SUCCESS",
                    responseDescription: "Account Transactions",
                    data: filteredTransactions
                });
            }
    
        } catch (error) {
            console.log("Error message", error);
    
            if (error.response && error.response.status) {
                const statusCode = error.response.status;
                if (statusCode === 401) {
                    return res.status(401).json({
                        responseCode: 401,
                        communicationStatus: "FAILED",
                        responseDescription: "Username and Password are required for authentication"
                    });
                }
                if (statusCode === 400) {
                    return res.status(400).json({
                        responseCode: 400,
                        communicationStatus: "FAILED",
                        responseDescription: "Invalid Username or Password"
                    });
                }
                if (statusCode === 404) {
                    return res.status(404).json({
                        responseCode: 404,
                        communicationStatus: "FAILED",
                        responseDescription: "Account Not Found"
                    });
                }
            }
    
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                error: error.message,
            });
        }
    }
    
    
    

    

    static async TransactionsByID(req, res) {
        const authheader = req.headers.authorization
        const id=req.params.id
        try {
            const response = await axios.get(process.env.CORE_URL+'/rest/accounts/default/history', {
                headers: {
                    Authorization: authheader,
                },
                withCredentials: true,
            });
            if (response.status === 200) {

                let transactions=[]
               response.data.elements.forEach(element => {
                if(element.id.toString()===id)
                transactions.push({
                    id: element.id.toString(),
                    date: element.date,
                    formattedDate: element.formattedDate,
                    processDate: element.processDate,
                    formattedProcessDate: element.formattedProcessDate,
                    amount: element.amount.toString(),
                    formattedAmount: element.formattedAmount,
                    transactionType: element.transferType.name,
                    agentAccount: null,
                    description: element.description,
                    destinationAccountName: element.transferType.to.name,
                    destinationAccountHolderName: null
                });
            
            })
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus: "SUCCESS",
                    responseDescription: "Account Transactions",
                    data:transactions
            })}
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                responseDescription: "Something went wrong, Please try again later.",
            });

        } catch (error) {
            if (error.response.status === 401) {
                return res.status(401).json({
                    responseCode: 401,
                    communicationStatus: "FAILED",
                    responseDescription: "Username and Password are required for authentication"
                });
            }
            if (error.response.status === 400) {
                return res.status(400).json({
                    responseCode: 400,
                    communicationStatus: "FAILED",
                    responseDescription: "Invalid Username or Password"
                });
            }
            if (error.response.status === 404) {
                return res.status(404).json({
                    responseCode: 404,
                    communicationStatus: "FAILED",
                    responseDescription: "Account Not Found"
                });
            }
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                error: error.message,
            });
        }

    }

    static async getLogsFromMysql(req, res) {
        //  const authheader = req.headers.authorization;
        try {
            // Use the promise-based query method
            const [results] = await dbConnect.query('SELECT * FROM transactions_status');
    
            return res.status(200).json({
                responseCode: 200,
                communicationStatus: "SUCCESS",
                responseDescription: "Transactions Logs",
                data: results
            });
        } catch (error) {
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                responseDescription: "Error while fetching data from Database.",
                error: error.message,
            });
        }
       

    }

    static async getBulkServicePaymentFromMysql(req, res) {
        try {
            // Use the promise-based query method
            const [results] = await dbConnect.query('SELECT * FROM bulkservicepaymentresults');
    
            return res.status(200).json({
                responseCode: 200,
                communicationStatus: "SUCCESS",
                responseDescription: "Transactions Logs",
                data: results
            });
        } catch (error) {
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                responseDescription: "Error while fetching data from Database.",
                error: error.message,
            });
        }
    }

    static async getBulkServicePaymentByAgentName(req, res) {
        try {
            // Extract the agent name from the request parameters or body
            const { agentName } = req.query; // Assuming agentName is passed as a query parameter
    
            // Check if agentName is provided
            if (!agentName) {
                return res.status(400).json({
                    responseCode: 400,
                    communicationStatus: "FAILED",
                    responseDescription: "Agent name is required."
                });
            }
            // Use a parameterized query to prevent SQL injection
            const [results] = await dbConnect.query('SELECT * FROM bulkservicepaymentresults WHERE agent_name = ?',
                [agentName]);
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus: "SUCCESS",
                    responseDescription: "Transactions Logs",
                    data: results
                });
            } catch (error) {
                return res.status(500).json({
                    responseCode: 500,
                    communicationStatus: "FAILED",
                    responseDescription: "Error while fetching data from Database.",
                    error: error.message,
                });
            }
    }


    static async getBulkServicePaymentByAgentNameAndId(req, res) {
        try {
            // Extract the agentName and id from the request query parameters
            const { agentName, transId } = req.query;
    
            // Check if either agentName or id is provided
            if (!agentName && !transId ) {
                return res.status(400).json({
                    responseCode: 400,
                    communicationStatus: "FAILED",
                    responseDescription: "Either agent name or id is required."
                });
            }
    
            // Initialize query and parameters
            let query = 'SELECT * FROM bulkservicepaymentresults WHERE';
            let params = [];
    
            // Add conditions based on the provided parameters
            if (agentName) {
                query += ' agent_name = ?';
                params.push(agentName);
            }
            if (transId) {
                if (params.length > 0) {
                    query += ' AND';
                }
                query += ' id = ?';
                params.push(transId);
            }
    
            // Use a parameterized query to prevent SQL injection
            const [results] = await dbConnect.query(query, params);
    
            return res.status(200).json({
                responseCode: 200,
                communicationStatus: "SUCCESS",
                responseDescription: "Transactions Logs",
                data: results
            });
        } catch (error) {
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                responseDescription: "Error while fetching data from Database.",
                error: error.message,
            });
        }
    }
    
    
//previous methode
    static async getTransactionsLogs(req, res) {
        const authheader = req.headers.authorization
        try {
            const response = await axios.get(process.env.CORE_URL+'/rest/accounts/default/history', {
                headers: {
                    Authorization: authheader,
                },
                withCredentials: true,
            });
            if (response.status === 200) {
               
                let transactions=[]
               response.data.elements.forEach(element => {
                transactions.push({
                    id: element.id.toString(),
                    date: element.date,
                    formattedDate: element.formattedDate,
                    processDate: element.processDate,
                    formattedProcessDate: element.formattedProcessDate,
                    amount: element.amount.toString(),
                    formattedAmount: element.formattedAmount,
                    transactionType: element.transferType.name,
                    agentAccount: null,
                    description: element.description,
                    destinationAccountName: element.transferType.to.name,
                    destinationAccountHolderName: null
                });
            })
                return res.status(200).json({
                    responseCode: 200,
                    communicationStatus: "SUCCESS",
                    responseDescription: "Account Transactions",
                    data:transactions
                    
            })}
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                responseDescription: "Something went wrong, Please try again later.",
            });

        } catch (error) {
            if (error.response.status === 401) {
                return res.status(401).json({
                    responseCode: 401,
                    communicationStatus: "FAILED",
                    responseDescription: "Username and Password are required for authentication"
                });
            }
            if (error.response.status === 400) {
                return res.status(400).json({
                    responseCode: 400,
                    communicationStatus: "FAILED",
                    responseDescription: "Invalid Username or Password"
                });
            }
            if (error.response.status === 404) {
                return res.status(404).json({
                    responseCode: 404,
                    communicationStatus: "FAILED",
                    responseDescription: "Account Not Found"
                });
            }
            return res.status(500).json({
                responseCode: 500,
                communicationStatus: "FAILED",
                error: error.message,
            });
        }

    }

}
module.exports = logsController;