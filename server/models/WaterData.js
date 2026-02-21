const mongoose = require('mongoose');

const waterDataSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100,
    },
    consumption: {
      type: Number,
      default: 0,
      min: 0,
    },
    perCapitaUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    agriculturalUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    industrialUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    householdUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    rainfall: {
      type: Number,
      default: 0,
      min: 0,
    },
    depletionRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    scarcityLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Severe', 'Extreme'],
      default: 'Moderate',
    },
    ph: {
      type: Number,
      default: 7.0,
      min: 0,
      max: 14,
    },
    groundwaterLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

waterDataSchema.index({ location: 1, year: 1 }, { unique: true });
waterDataSchema.index({ scarcityLevel: 1 });
waterDataSchema.index({ year: 1 });

module.exports = mongoose.model('WaterData', waterDataSchema);
