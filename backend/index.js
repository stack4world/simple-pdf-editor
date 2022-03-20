import express from "express";
import fs from "fs";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
app.use(cors());

mongoose.connect("mongodb+srv://tiger:tiger1@cluster0.5ti6r.mongodb.net/pdf?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("connected to DB")
}).catch((error) => {
    log.error("db error", error);
    process.exit(1);
});
// mongoose.connect("mongodb://localhost:27017/auth",{
//     useNewUrlParser:true,
//     useUnifiedTopology:true
// });()=>{
//     console.log("connected to DB")
// }

var Schema = mongoose.Schema;
//user schema 
const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    fileUrl: String
});

const dataSchema = new Schema({
    user_id: String,
    fileUrl: String
});

const User = mongoose.model("User", userSchema)
const UserData = mongoose.model("UserData", dataSchema)

//routes routes
app.post("/Login", (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    User.findOne({ email: email }, (err, user) => {
        if (user) {
            if (password === user.password) {
                res.send({ message: "login sucess", user: user })
            } else {
                res.send({ message: "wrong credentials" })
            }
        } else {
            res.send("not register")
        }
    })
});

app.post("/Register", (req, res) => {
    console.log(req.body)
    const { name, email, password } = req.body;
    User.findOne({ email: email }, (err, user) => {
        if (user) {
            res.send({ message: "user already exist" })
        } else {
            const user = new User({ name, email, password })
            user.save(err => {
                if (err) {
                    res.send(err)
                } else {
                    res.send({ message: "sucessfull" })
                }
            })
        }
    })
});

app.post('/upload', function (req, res) {
    const { user_id, json_data } = req.body;
    const filepath = './upload/' + 'json-' + Date.now() + '.json';
    fs.writeFile(filepath, json_data.toString(), function (err, data) {
        if (err) {
            res.status(500).json(err)
        }

        const userdata = new UserData({ user_id, fileUrl: filepath })
        userdata.save(err => {
            if (err) {
                res.send(err)
            } else {
                res.send({ message: "upload sucessfull" })
            }
        })
    });
});

app.post("/getdatalist", (req, res) => {
    const { user_id } = req.body;
    UserData.find({ user_id: user_id }, (err, userdata) => {
        if (userdata) {
            res.send(userdata)
        } else {
            res.send("no data")
        }
    })
});

app.post("/getdata", (req, res) => {
    const { _id } = req.body;
    UserData.findOne({ _id: _id }, (err, userdata) => {
        if (userdata.fileUrl) {
            fs.readFile(userdata.fileUrl, 'utf8', function (err, data) {
                // console.log(data)
                res.send(data)
            });
        } else {
            res.send("no data")
        }
    })
});

app.post("/delete", (req, res) => {
    const { _id } = req.body;
    UserData.deleteOne({ _id: _id }, (err, obj) => {
        if (err) throw err;
        res.send("delete")
    })
});


app.listen(6969, () => {
    console.log("started")
})