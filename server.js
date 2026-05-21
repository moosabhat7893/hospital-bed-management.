const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));

mongoose.set("strictQuery", true);

/* =========================
   MONGODB CONNECTION
========================= */

mongoose.connect(process.env.MONGO_URI)

.then(() => {

    console.log("MongoDB Connected");
})

.catch((err) => {

    console.log(err);
});

/* =========================
   SCHEMAS
========================= */

const PatientSchema = new mongoose.Schema({

    pid: Number,

    name: String,

    age: Number,

    contact: String
});

const BedSchema = new mongoose.Schema({

    bid: Number,

    bedNumber: Number,

    bedType: String,

    pid: {
        type: Number,
        default: null
    },

    status: {
        type: String,
        default: "Available"
    }
});

const HistorySchema = new mongoose.Schema({

    hid: Number,

    pid: Number,

    bid: Number,

    diagnosis: String,

    treatment: String,

    fromDate: Date,

    toDate: Date
});

/* =========================
   MODELS
========================= */

const Patient = mongoose.model("Patient", PatientSchema);

const Bed = mongoose.model("Bed", BedSchema);

const History = mongoose.model("History", HistorySchema);

/* =========================
   PATIENT ROUTES
========================= */

/* ADD PATIENT */

app.post("/patients", async (req, res) => {

    try {

        const patient = new Patient(req.body);

        await patient.save();

        res.json({
            message: "Patient added successfully",
            patient
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* GET PATIENTS */

app.get("/patients", async (req, res) => {

    try {

        const patients = await Patient.find();

        res.json(patients);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* DELETE PATIENT */

app.delete("/patients/:pid", async (req, res) => {

    try {

        const pid = Number(req.params.pid);

        await Patient.deleteOne({ pid });

        await History.deleteMany({ pid });

        await Bed.updateMany(
            { pid },
            {
                $set: {
                    pid: null,
                    status: "Available"
                }
            }
        );

        res.json({
            message: "Patient deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   BED ROUTES
========================= */

/* ADD BED */

app.post("/beds", async (req, res) => {

    try {

        const existingBed = await Bed.findOne({

            bedNumber: req.body.bedNumber
        });

        if (existingBed) {

            return res.json({
                message: "Bed number already exists"
            });
        }

        const bed = new Bed(req.body);

        await bed.save();

        res.json({
            message: "Bed added successfully",
            bed
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* GET BEDS */

app.get("/beds", async (req, res) => {

    try {

        const beds = await Bed.find();

        res.json(beds);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* DELETE BED */

app.delete("/beds/:bid", async (req, res) => {

    try {

        const bid = Number(req.params.bid);

        await Bed.deleteOne({ bid });

        await History.deleteMany({ bid });

        res.json({
            message: "Bed deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* DISCHARGE BED */

app.put("/beds/discharge/:bid", async (req, res) => {

    try {

        const bid = Number(req.params.bid);

        await Bed.updateOne(
            { bid },
            {
                $set: {
                    pid: null,
                    status: "Available"
                }
            }
        );

        res.json({
            message: "Bed discharged successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   HISTORY ROUTES
========================= */

/* ASSIGN BED */

app.post("/history", async (req, res) => {

    try {

        const {
            hid,
            pid,
            bid,
            diagnosis,
            treatment,
            fromDate,
            toDate
        } = req.body;

        const startDate = new Date(fromDate);

        const endDate = new Date(toDate);

        /* =========================
           VALIDATE DATES
        ========================== */

        if (startDate > endDate) {

            return res.json({
                message: "Invalid date range"
            });
        }

        /* =========================
           CHECK BED AVAILABILITY
        ========================== */

        const existingBedBooking = await History.findOne({

            bid: bid,

            fromDate: {
                $lte: endDate
            },

            toDate: {
                $gte: startDate
            }
        });

        if (existingBedBooking) {

            return res.json({
                message: "Bed already occupied for selected dates"
            });
        }

        /* =========================
           CHECK PATIENT AVAILABILITY
        ========================== */

        const existingPatientBooking = await History.findOne({

            pid: pid,

            fromDate: {
                $lte: endDate
            },

            toDate: {
                $gte: startDate
            }
        });

        if (existingPatientBooking) {

            return res.json({
                message: "Patient already has a bed during selected dates"
            });
        }

        /* =========================
           SAVE HISTORY
        ========================== */

        const history = new History({

            hid,
            pid,
            bid,
            diagnosis,
            treatment,
            fromDate: startDate,
            toDate: endDate
        });

        await history.save();

        /* =========================
           UPDATE BED
        ========================== */

        await Bed.updateOne(
            { bid },
            {
                $set: {
                    pid: pid
                }
            }
        );

        res.json({
            message: "Bed assigned successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* GET HISTORY */

app.get("/history", async (req, res) => {

    try {

        const history = await History.find();

        res.json(history);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   CLEAR TEST DATA
========================= */

app.delete("/clearBeds", async (req, res) => {

    await Bed.deleteMany({});

    res.json({
        message: "Beds cleared"
    });
});

app.delete("/clearHistory", async (req, res) => {

    await History.deleteMany({});

    res.json({
        message: "History cleared"
    });
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});