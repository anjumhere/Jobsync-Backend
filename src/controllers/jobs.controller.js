import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';
import { Job } from '../models/job.model.js';
import { Company } from '../models/company.model.js';
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

  if (company.owner.toString() !== req.user?.id.toString()) {
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

export { postJob };
