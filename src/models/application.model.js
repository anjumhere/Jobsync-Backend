import mongoose, { Schema } from 'mongoose';

const applicationSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'accepted', 'rejected'],
      default: 'applied',
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    coverNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Application = mongoose.model('Application', applicationSchema);
