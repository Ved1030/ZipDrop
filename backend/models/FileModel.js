const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({

  file_id: {
    type: String,
    required: true,
    unique: true
  },

  /* Multiple files stored in one code */

  files: [
    {
      file_name: {
        type: String,
        required: true
      },

      file_url: {
        type: String,
        required: true
      },

      file_size: {
        type: Number,
        required: true
      }
    }
  ],

  /* Used only when sharing text */

  file_name: {
    type: String
  },

  file_url: {
    type: String
  },

  file_size: {
    type: Number
  },

  download_count: {
    type: Number,
    default: 0
  },

  expiry_time: {
    type: Date,
    required: true
  },

  created_at: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("File", fileSchema);