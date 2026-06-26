import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Job } from '../models/job.model.js';
import { Company } from '../models/company.model.js';
import mongoose from 'mongoose';
const postJob = asyncHandler(async (req, res) => {
  const {
    companyId,
    title,
    description,
    requirements,
    location,
    jobType,
    salaryMin,
    salaryMax,
    isActive,
  } = req.body;
  if (
    [companyId, title, description, location, jobType].some(
      (field) => field?.trim() === '' || field === undefined,
    )
  ) {
    throw new ApiError(400, 'Please fill all required fields');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  if (company.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      'You are only authorized to post jobs for the company you own',
    );
  }

  let reqArray = [];
  if (requirements) {
    reqArray = Array.isArray(requirements)
      ? requirements
      : requirements.split(',').map((item) => item.trim());
  }
  const createdJob = await Job.create({
    company: companyId,
    title,
    description,
    requirements: reqArray,
    location,
    jobType,
    salaryMin: salaryMin || 0,
    salaryMax: salaryMax || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, createdJob, 'Job created successfully'));
});

const getAllJobs = asyncHandler(async (req, res) => {
  // get search location jobType , salaryMin, salaryMax, page, limit
  const {
    search,
    location,
    jobType,
    salaryMin,
    salaryMax,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};
  filter.isActive = true;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (salaryMin) {
    filter.salaryMin = { $gte: Number(salaryMin) };
  }
  if (salaryMax) {
    filter.salaryMax = { $lte: Number(salaryMax) };
  }
  const skip = (page - 1) * limit;
  const [job, total] = await Promise.all([
    Job.find(filter)
      .populate('company', 'name logo location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(filter),
  ]);
  if (!job.length) {
    return res.status(200).json(new ApiResponse(200, [], 'No jobs found'));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        job,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
      'Jobs fetched Successfully',
    ),
  );
});

const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid job id Format');
  }

  const job = await Job.findById(id).populate(
    'company',
    'name, logo, location, website, industry',
  );
  if (!job) {
    throw new ApiError(404, 'No jobs found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, job, 'Job fetched successfully'));
});

const getJobsByCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!mongoose.isValidObjectId(req.params.companyId)) {
    throw new ApiError(400, 'Invalid company id format');
  }
  const company = await Company.findById(companyId);
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }
  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    Job.find({ company: companyId })
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments({ company: companyId }),
  ]);

  if (!jobs.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No jobs found under this company'));
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        jobs,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
      'All jobs fetched successfully',
    ),
  );
});

const updateJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    requirements,
    location,
    jobType,
    salaryMin,
    salaryMax,
  } = req.body;

  const { id } = req.params;

  const updateFields = {};

  if (title) updateFields.title = title.trim();
  if (description) updateFields.description = description.trim();
  if (requirements)
    updateFields.requirements = Array.isArray(requirements)
      ? requirements
      : requirements.split(',').map((item) => item.trim());
  if (location) updateFields.location = location.trim();

  if (jobType) updateFields.jobType = jobType;
  if (salaryMin) updateFields.salaryMin = salaryMin;
  if (salaryMax) updateFields.salaryMax = salaryMax;

  if (!Object.keys(updateFields).length) {
    throw new ApiError(400, 'At least one field is required to update');
  }
  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }
  const company = await Company.findById(job.company);
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  if (company.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this job');
  }
  const updatedJob = await Job.findByIdAndUpdate(
    id,
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedJob, 'Job updated Successfully'));
});

const toggleActiveJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const company = await Company.findById(job.company);
  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  if (company.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to perform this action');
  }

  const updatedJob = await Job.findByIdAndUpdate(
    id,
    {
      $set: { isActive: !job.isActive },
    },
    { new: true, runValidators: true },
  );

  return res.status(200).json(new ApiResponse(200, updatedJob, 'Toggle done'));
});

export {
  postJob,
  getAllJobs,
  getJobById,
  getJobsByCompany,
  updateJob,
  toggleActiveJob,
};
