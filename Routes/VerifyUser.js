const express = require("express")
const nodemailer = require("nodemailer")
require("dotenv").config();

const bcrypt = require("bcryptjs")

const router = express.Router();



const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER,
        pass: process.env.USER_PASSWORD,
    },
});

const storedOtp  = new Map();
const expirationTime = 5 * 60 * 1000;

// console.log(storedOtp)

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post("/send-otp", async (req, res) => {
    const { email } = req.body;

   

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    const otp = generateOTP();
    
    const hashedOtp = await bcrypt.hash(otp ,10);
    const expiration  = Date.now() + expirationTime;



     storedOtp.set(email, {
            otp: hashedOtp,
            expiresAt: expiration,
            attempts: 0 // Track verification attempts
        });


    try {

        const info = await transporter.sendMail({
            from: '"Events website" <dpal991193@gmail.com>',
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is ${otp}`, // plain‑text body

        });

        console.log("Message sent:", info.messageId);

        

        res.status(200).json({ message: 'OTP sent successfully' })

       


    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to send OTP' });
    }

})

router.post("/verify-otp", async(req, res)=>{
    
    const { email ,  otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({error:"Email or otp is required"})
    }

    // 2. Check if OTP is a 6-digit number (you can adjust the length if needed)
    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({error:"OTP must be a 6-digit number!"});
    }

    const storedData = storedOtp.get(email);

    console.log(storedData)

    if(!storedData) return res.status(400).json({error:"OTP expired or not found"});


    if(storedData.attempts >= 3){
        storedOtp.delete(email);
        return res.status(429).json({error:"To many attempts"});
    }

    if(Date.now() > storedData.expiresAt){
         storedOtp.delete(email);
         return res.status(400).json({error:"OTP Expired"})
    }


    try {

        const isValid = await bcrypt.compare(otp, storedData.otp);

        if(!isValid){
            storedData.attempts++;
            storedOtp.set(email, storedData)
            return res.status(400).json({error:"Invalid Otp"})

        }

         storedOtp.delete(email); 
        return res.status(200).json({ message: 'OTP verified successfully' });
        
    } catch (error) {
        console.error(error.message);
        res.status(500).json({error:"error verifying  otp"})
    }


    
    
})


module.exports = router;
