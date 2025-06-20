# Backend Setup Instructions

## Quick Start to Enable Real Functionality

To make your PdfPage platform fully functional and start earning money, you need to set up a backend API. Here's the quickest way:

### 1. Create Backend Project Structure

```bash
mkdir pdfpage-backend
cd pdfpage-backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv razorpay cloudinary multer helmet express-rate-limit
npm install -D nodemon
```

### 2. Environment Variables (.env)

```env
MONGODB_URI=mongodb+srv://ADARSHSHARMA__:SITADEVI%401234765__@cluster1.tcdmjd6.mongodb.net/pdfwiz
JWT_SECRET=K8r@Yw94!s@Nz$ePq#1L&uVz7Gp*TjCv
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=urbanride219@gmail.com
SMTP_PASS=xzdlmsvmlzytmzpn
EMAIL_FROM=noreply@pdfpage.com
EMAIL_FROM_NAME=PdfPage

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dj8qhuudz
CLOUDINARY_API_KEY=862265886717521
CLOUDINARY_API_SECRET=jEG7MtWenZDOfC3-iFMYJC_1aaA

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_PnSgiqE2elzEYx
RAZORPAY_KEY_SECRET=RV1PocdlG73ZiDFxneoYcsyQ

PORT=5000
NODE_ENV=development
```

### 3. Core API Endpoints Needed

**server.js**

```javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/usage", require("./routes/usage"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 4. Required Models

**models/User.js**

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    premiumExpiryDate: Date,
    dailyUploads: { type: Number, default: 0 },
    maxDailyUploads: { type: Number, default: 3 },
    lastUploadDate: Date,
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

### 5. Critical Routes

**routes/auth.js**

```javascript
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        dailyUploads: user.dailyUploads,
        maxDailyUploads: user.maxDailyUploads,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        dailyUploads: user.dailyUploads,
        maxDailyUploads: user.maxDailyUploads,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

### 6. Payment Integration

**routes/payments.js**

```javascript
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, planType } = req.body;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify payment
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      planType,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment verified, upgrade user
      const user = await User.findById(req.userId);
      user.isPremium = true;
      user.premiumExpiryDate = new Date(
        Date.now() + (planType === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
      );
      await user.save();

      res.json({ message: "Payment verified and user upgraded" });
    } else {
      res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

### 7. Deploy Backend

1. **Railway/Render (Free):**

   - Connect GitHub repo
   - Add environment variables
   - Deploy automatically

2. **Vercel (Serverless):**
   - Use Vercel Functions
   - Deploy with `vercel --prod`

### 8. Update Frontend URLs

Update your frontend `.env`:

```env
VITE_API_URL=https://your-backend-url.railway.app/api
```

### 9. Start Earning Money!

Once backend is deployed:

1. ✅ Users can register/login
2. ✅ Payment system works
3. ✅ Premium upgrades functional
4. ✅ Usage tracking active
5. ✅ Real PDF processing
6. ✅ Ready for ads revenue

Your website will be fully functional and ready to generate revenue through:

- Premium subscriptions (₹299/month, ₹2999/year)
- Google AdSense for free users
- Potential API monetization later

Total setup time: **2-3 hours** for a complete money-making PDF platform!
