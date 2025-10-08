// Add indexes for better query performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "premiumExpiryDate": 1 });
db.users.createIndex({ "createdAt": 1 });

// Add compound indexes for usage stats
db.usage.createIndex({ userId: 1, toolType: 1, createdAt: 1 });
db.usage.createIndex({ toolType: 1, createdAt: 1 });

// Add indexes for payments
db.payments.createIndex({ userId: 1, createdAt: -1 });
db.payments.createIndex({ status: 1 });

// Add text indexes for search
db.files.createIndex({ 
  fileName: "text", 
  description: "text" 
});
