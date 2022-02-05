const mongoose = require("mongoose");

const EmailSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  assunto: {
    type: String,
  },
  conteudo: {
    type: String,
  },
});

const Email = mongoose.model("Email", EmailSchema);

module.exports = Email;
