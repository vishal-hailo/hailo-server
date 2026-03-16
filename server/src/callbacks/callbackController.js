const ACK = {

  message: {

    ack: {

      status: "ACK"

    }

  }

}

const callbackController = {}

callbackController.onSearch = async (req,res)=>{

  console.log("on_search received")

  console.log(JSON.stringify(req.body,null,2))

  res.json(ACK)

}

callbackController.onSelect = async (req,res)=>{

  console.log("on_select received")

  res.json(ACK)

}

callbackController.onInit = async (req,res)=>{

  console.log("on_init received")

  res.json(ACK)

}

callbackController.onConfirm = async (req,res)=>{

  console.log("on_confirm received")

  res.json(ACK)

}

callbackController.onStatus = async (req,res)=>{

  console.log("on_status received")

  res.json(ACK)

}

export default callbackController