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
        callbackURL:
          process.env.NODE_ENV === "production"
            ? "https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback"
            : "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("🔵 [GOOGLE-OAUTH] Profile received:", {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
          });

          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            console.log("✅ [GOOGLE-OAUTH] Existing user found");
            return done(null, user);
          }

          // Check if user exists with same email
          const existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingUser) {
            // Link the Google account to existing user
            existingUser.googleId = profile.id;
            existingUser.profilePicture = profile.photos?.[0]?.value;
            await existingUser.save();

            console.log(
              "✅ [GOOGLE-OAUTH] Linked Google account to existing user",
            );
            return done(null, existingUser);
          }

          // Create new user
          const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
            authProvider: "google",
            isEmailVerified: true, // Google emails are verified
            username:
              profile.emails[0].value
                .split("@")[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "") +
              Math.floor(1000 + Math.random() * 9000),
          });

          await newUser.save();
          console.log("✅ [GOOGLE-OAUTH] New user created");

          done(null, newUser);
        } catch (error) {
          console.error("🔴 [GOOGLE-OAUTH] Error:", error);
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
