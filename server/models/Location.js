const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    district: {
      type: String,
      default: 'Nashik',
    },
    state: {
      type: String,
      default: 'Maharashtra',
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ name: 'text' });

module.exports = mongoose.model('Location', locationSchema);
