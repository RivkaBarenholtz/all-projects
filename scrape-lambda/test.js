const { handler } = require("./index");

(async () => {
  const result = await handler({});
  console.log(result);
})();