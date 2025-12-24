const { handler } = require("./index");

(async () => {
  const event = {
    enterpriseid : "GNPIN01", 
    username : "BARRI1", 
    password: "Rivka@instech360", 
    amount: ".25", 
    paymentMethod: "Check", 
    bankAccountNumber : 1010, 
    description : "test description", 
    detailDescription : "test detail description", 
    accountInput : "TEST", 
    isDebit: true, 
    isLocalTest: true
  }
  const result = await handler(event);
  console.log(result);
})();