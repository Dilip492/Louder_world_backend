const express = require("express")
const cors = require("cors")


const app = express();

const port = 5000 || process.env.port ;

app.use(express.json());

app.use(cors());

app.use("/server1" , require("./Routes/scrapRoute"))
app.use("/api" , require('./Routes/VerifyUser'))


app.get('/' , (req , res)=>{

    res.send("server is running");
})

app.listen(port , ()=>{
    console.log(`The Server is running on ${port}`);
})