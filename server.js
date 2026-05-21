const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/public"));

/* =========================
   MONGODB CONNECTION
========================= */

mongoose.connect(process.env.MONGO_URI)

.then(() => {

    console.log("MongoDB Connected");
})

.catch(err => {

    console.log("MongoDB Error:", err);
});

/* =========================
   SCHEMAS
========================= */

const PatientSchema = new mongoose.Schema({

    pid: Number,
    name: String,
    age: String,
    contact: String

}, { strict: false });

const BedSchema = new mongoose.Schema({

    bid: Number,
    bedNumber: String,
    bedType: String,
    pid: Number,
    status: String

}, { strict: false });

const HistorySchema = new mongoose.Schema({

    hid: Number,
    bid: Number,
    pid: Number,
    diagnosis: String,
    treatment: String,
    fromDate: String,
    toDate: String

}, { strict: false });

/* =========================
   MODELS
========================= */

const Patient = mongoose.model("Patient", PatientSchema);

const Bed = mongoose.model("Bed", BedSchema);

const History = mongoose.model("History", HistorySchema);

/* =========================
   PATIENT ROUTES
========================= */

app.post("/patients", async (req, res) => {

    try {

        const patient = new Patient(req.body);

        await patient.save();

        res.json(patient);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/patients", async (req, res) => {

    try {

        const patients = await Patient.find();

        res.json(patients);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.delete("/patients/:pid", async (req, res) => {

    try {

        const patientId = Number(req.params.pid);

        await Patient.deleteOne({
            pid: patientId
        });

        await History.deleteMany({
            pid: patientId
        });

        await Bed.updateMany(
            { pid: patientId },
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

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   BED ROUTES
========================= */

app.post("/beds", async (req, res) => {

    try {

        const bed = new Bed(req.body);

        await bed.save();

        res.json(bed);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/beds", async (req, res) => {

    try {

        const beds = await Bed.find();

        res.json(beds);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.delete("/beds/:bid", async (req, res) => {

    try {

        const bedId = Number(req.params.bid);

        await Bed.deleteOne({
            bid: bedId
        });

        await History.deleteMany({
            bid: bedId
        });

        res.json({
            message: "Bed deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.put("/beds/discharge/:bid", async (req, res) => {

    try {

        const bedId = Number(req.params.bid);

        await Bed.updateOne(
            { bid: bedId },
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

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   HISTORY ROUTES
========================= */

app.post("/history", async (req, res) => {

    try {

        const {

            hid,
            bid,
            pid,
            diagnosis,
            treatment,
            fromDate,
            toDate

        } = req.body;

        const existingAssignment = await History.findOne({

            bid: bid,

            fromDate: { $lte: toDate },

            toDate: { $gte: fromDate }
        });

        if (existingAssignment) {

            return res.json({
                message: "Bed already assigned during selected dates"
            });
        }

        const history = new History({

            hid,
            bid,
            pid,
            diagnosis,
            treatment,
            fromDate,
            toDate
        });

        await history.save();

        await Bed.updateOne(

            { bid: bid },

            {
                $set: {
                    pid: pid,
                    status: "Occupied"
                }
            }
        );

        res.json({
            message: "Bed assigned successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

app.get("/history", async (req, res) => {

    try {

        const history = await History.find();

        res.json(history);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            error: error.message
        });
    }
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});