import express from "express";

const router = express.Router();

router.post("/", (req, res) => {

  console.log("on_confirm received");

  console.log(JSON.stringify(req.body, null, 2));

  /*
  Flow 1a requirement:
  Driver must be assigned
  */

  res.json({
    message: "ACK"
  });
});

export default router;