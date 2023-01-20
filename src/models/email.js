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
  formattedContent: {
    type: String,
  },
  description: {
    type: String,
  },
  tags: {
    type: Array,
  },
});

const Email = mongoose.model('Email', EmailSchema);

module.exports = Email;
