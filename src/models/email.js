const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  subject: {
    type: String,
  },
  content: {
    type: String,
  },
});

const Email = mongoose.model('Email', EmailSchema);

module.exports = Email;
