require('dotenv').config();
const express = require("express");
const fs = require("fs");
const { body, validationResult } = require('express-validator');
const mongoose = require("mongoose");
const swaggerJSdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 8000;

// Swagger setup
const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'FS Booking Api Project',
            version: '1.0.0'
        },
        servers: [
            {
                url: 'http://localhost:8000/'
            }
        ]
    },
    apis: ['./index.js']
};

const swaggerSpec = swaggerJSdoc(options);
app.use('/api/bookings', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(express.json());

// Connection
mongoose.connect("mongodb://127.0.0.1:27017/FASBookings")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Schema
const bookingsSchema = new mongoose.Schema({
    pickuplocation: { type: String, required: true },
    dropofflocation: { type: String, required: true },
    vantype: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                return ["Medium", "Large", "Small"].includes(value);
            },
            message: "VanType should be Medium, Large, or Small"
        }
    },
    deliverytime: { type: Date, required: true }
});

const Bookings = mongoose.model("Bookings", bookingsSchema);

// Routes
/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Add a new booking
 *     description: This endpoint adds a new booking to the MongoDB database.
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickuplocation:
 *                 type: string
 *               dropofflocation:
 *                 type: string
 *               vantype:
 *                 type: string
 *               deliverytime:
 *                 type: string
 *                 format: date-time
 *             required:
 *               - pickuplocation
 *               - dropofflocation
 *               - vantype
 *               - deliverytime
 *     responses:
 *       200:
 *         description: Booking added successfully
 *       400:
 *         description: Invalid input
 */
app.post('/api/bookings', [
    body('pickuplocation').notEmpty().withMessage('Pickup location is required'),
    body('dropofflocation').notEmpty().withMessage('Drop-off location is required'),
    body('vantype').isIn(['Medium', 'Large', 'Small']).withMessage('Van type must be Medium, Large, or Small'),
    body('deliverytime').isISO8601().toDate().withMessage('Delivery time must be a valid date')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const booking = await Bookings.create(req.body);
        console.log("Booking added:", booking);
        return res.status(200).json({ msg: "Success", booking });
    } catch (error) {
        console.error("Error adding booking:", error);
        return res.status(500).json({ msg: "Internal server error", error });
    }
});

// Port Connection
app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`));
