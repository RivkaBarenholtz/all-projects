const { handler } = require("./client");

async function runTest() {
  try {
    // You can pass a fake event if needed
    const event = { ByName : false ,
       accountInput: "ALLECUS-01", 
       enterpriseId:"SAPPH02"
    };
    const result = await handler(event);
    console.log("Lambda returned:", result);
  } catch (err) {
    console.error("Error running Lambda:", err);
  }
}

runTest();