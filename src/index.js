import express from "express";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";

import { rechargeQueue } from "./queue.js";

const port = process.env.NODE_PORT || 3000;

/* Bullboard */
const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
  queues: [
    new BullMQAdapter(rechargeQueue),
  ],
  serverAdapter: serverAdapter,
});
serverAdapter.setBasePath("/admin");
/* End Bullboard */

/* Express */
const app = express();

/* Routes */

app.use("/admin", serverAdapter.getRouter());

app.get("/", async function (req, res) {
  res.render("index", { port });
});

/* End Routes */

app.listen(port, function () {
  console.log(`Server running on port ${port}`);
});

