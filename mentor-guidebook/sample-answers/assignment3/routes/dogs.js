const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError, NotFoundError } = require("../errors");

router.get("/dogs", (req, res) => {
	res.json(dogs);
});

router.post("/adopt", (req, res, next) => {
    const { name, address, email, dogName } = req.body;
    
    // Use custom error classes
    if (!name || !email || !dogName) {
        const error = new ValidationError("Missing required fields: name, email, dogName");
        return next(error);
    }

    // Find the dog
    const dog = dogs.find(d => d.name === dogName && d.status === 'available');
    if (!dog) {
        const error = new NotFoundError(`Dog named ${dogName} not found or not available for adoption`);
        return next(error);
    }

    return res.status(201).json({
        message: `Adoption request received. We will contact you at ${email} for further details.`,
        application: {
            name,
            address,
            email,
            dogName,
            applicationId: Date.now()
        }
    });
});

router.get("/error", (req, res, next) => {
	const error = new Error("Test error");
	next(error);
});

// Add a slow route for testing performance monitoring
router.get("/slow", (req, res) => {
    // Simulate slow operation
    setTimeout(() => {
        res.json({ message: "This was a slow request" });
    }, 1200); // 1.2 seconds - should trigger warning
});

// Add a route to test validation errors
router.post("/test-validation", (req, res, next) => {
    const error = new ValidationError("This is a test validation error");
    next(error);
});

module.exports = router;

