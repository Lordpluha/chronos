import mongoose from 'mongoose'

export const locationSchema = new mongoose.Schema(
  {
    longitude: {
      type: Number,
      required: false,
      min: -180,
      max: 180,
    },
    latitude: {
      type: Number,
      required: false,
      min: -90,
      max: 90,
    },
  },
  { _id: false },
)
