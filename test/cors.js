const Koa = require("koa");
const { cors } = require("../packages/cors/index.js");

const app = new Koa();

app.use(cors({ allowedHeaders: ["Authorization", "abc"] }));

app.use(async function fn2(ctx, next) {
  ctx.response.body = "123";
});

app.listen(3000);
