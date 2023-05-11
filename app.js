//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

mongoose.Promise = global.Promise;

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.URL);
}

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = new mongoose.Schema({
  item: String,
});

const Item = mongoose.model('Item', itemSchema);

const listSchema = new mongoose.Schema({
  name: String,
  list: [itemSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/', async function (req, res) {
  try {
    const items = await Item.find();
    res.render('list', { listTitle: 'List', newListItems: items });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

app.post('/', async function (req, res) {
  const itemName = req.body.newItem;
  const newItem = new Item({ item: itemName });

  try {
    const list = await List.findOne({ name: req.body.butt });
    if (list) {
        list.list.push(newItem);
        await list.save();
        res.redirect(`/${req.body.butt}`);
    } else {
      const title = req.body.butt;
      if (title === "List") {
        await newItem.save();
        res.redirect('/');
      } else {
        const newList = new List({ name: title, list: [] });
        newList.list.push(newItem);
        await newList.save();
        res.redirect(`/${req.body.butt}`);
      }
    }
  } catch (error) {
    console.log(error);
    res.redirect(`/${req.body.butt}`);
  }
});

app.post('/delete', async function (req, res) {
  const itemID = _.capitalize(req.body.checkbox);
  const title = req.body.hidden;

  if (title === "List") {
    await Item.deleteOne({ _id: itemID });
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({ name: title }, { $pull: { list: { _id: itemID } } });
    res.redirect(`/${title}`);
  }
});

app.get('/:param', async function (req, res) {
  const param = req.params.param;

  try {
    const list = await List.findOne({ name: param });
    if (list) {
      res.render('list', { listTitle: `${param}`, newListItems: list.list });
    } else {
      const newList = new List({ name: param, list: [] });
      await newList.save();
      res.render('list', { listTitle: `${param}`, newListItems: [] });
    }
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

app.listen(3000 || process.env.PORT, function() {
  console.log("Server started on port 3000");
});
