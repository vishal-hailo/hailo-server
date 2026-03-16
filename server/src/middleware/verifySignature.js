export const verifySignature = (req,res,next)=>{

  const auth = req.headers.authorization

  if(!auth){

    return res.status(401).send("Missing signature")

  }

  next()

}