import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Job } from '../models/job.model.js';
import { Company } from '../models/company.model.js';
import mongoose from 'mongoose';
import { Application } from '../models/application.model.js';
import { User } from '../models/user.model.js';
const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { coverNote } = req.body;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job does not exists');
  }

  if (!job.isActive) {
    throw new ApiError(400, 'Job is not active  ');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found ');
  }

  if (!user.resume) {
    throw new ApiError(400, 'Please upload the resume');
  }

  const hasApplied = await Application.exists({
    job: jobId,
    applicant: req.user._id,
  });
  if (hasApplied) {
    throw new ApiError(400, 'You have already applied for this job');
  }

  const application = await Application.create({
    job: jobId,
    applicant: req.user._id,
    resume: user.resume,
    coverNote: coverNote || '',
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, application, 'Application created Successfully'),
    );
});

const viewApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const [application, total] = await Promise.all([
    Application.find({ applicant: req.user._id })
      .populate('job', 'title location jobType salaryMin salaryMax')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments({ applicant: req.user._id }),
  ]);

  if (!application.length) {
    throw new ApiError(404, 'Application not found');
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        applications: application,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
      'All active applications fetched successfully',
    ),
  );
});

export { applyToJob, viewApplications };
