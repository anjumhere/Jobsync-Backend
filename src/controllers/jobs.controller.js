import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';
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
    throw new ApiError(400, 'Invalid job id format');
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
export { postJob, getAllJobs, getJobById };
