import mongoose, { Schema } from 'mongoose';

const jobSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      required: true,
    },
    jobType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'interrnship', 'remote'],
      required: true,
    },
    salaryMin: {
      type: Number,
    },
    salaryMax: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const Job = mongoose.model('Job', jobSchema);
