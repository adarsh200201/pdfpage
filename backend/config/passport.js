const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/User");

// Google OAuth Strategy (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL ||
          "https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔵 [GOOGLE-OAUTH] Profile received:", {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            emailsArray: profile.emails,
          });

          // Validate profile data
          if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            console.error("🔴 [GOOGLE-OAUTH] No email in profile");
            return done(new Error("No email address provided by Google"), null);
          }

          const email = profile.emails[0].value;

          // Log the domain for debugging
          const domain = email.split('@')[1];
          console.log("🔵 [GOOGLE-OAUTH] User domain:", domain);

          // Check if this is an educational domain (.edu.in)
          if (domain && domain.endsWith('.edu.in')) {
            console.log("📚 [GOOGLE-OAUTH] Educational domain detected, proceeding...");
          }

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            console.log("✅ [GOOGLE-OAUTH] Existing user found with Google ID");
            return done(null, user);
          }

          // Check if user exists with same email
          const existingUser = await User.findOne({ email: email });

          if (existingUser) {
            // Link the Google account to existing user
            console.log("🔄 [GOOGLE-OAUTH] Linking Google account to existing user");
            existingUser.googleId = profile.id;
            existingUser.profilePicture = profile.photos?.[0]?.value;
            existingUser.authProvider = "google";
            existingUser.isEmailVerified = true;
            await existingUser.save();

            console.log("✅ [GOOGLE-OAUTH] Successfully linked Google account to existing user");
            return done(null, existingUser);
          }

          // Create new user
          console.log("🔄 [GOOGLE-OAUTH] Creating new user");
          const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(1000 + Math.random() * 9000);

          const newUser = new User({
            name: profile.displayName || 'Google User',
            email: email,
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
            authProvider: "google",
            isEmailVerified: true, // Google emails are verified
            username: username,
          });

          const savedUser = await newUser.save();
          console.log("✅ [GOOGLE-OAUTH] New user created successfully:", savedUser._id);

          done(null, savedUser);
        } catch (error) {
          console.error("🔴 [GOOGLE-OAUTH] Detailed error:", {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          done(error, null);
        }
      },
    ),
  );
} else {
  console.log(
    "⚠️  Google OAuth not configured - skipping Google strategy setup",
  );
}

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.userId);
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

module.exports = passport;
