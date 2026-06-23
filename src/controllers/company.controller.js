import mongoose from 'mongoose';
import fs from 'fs';
import { Company } from '../models/company.model.js';
import { Job } from '../models/job.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';

const createCompany = asyncHandler(async (req, res) => {
  const { name, description, website, industry, location } = req.body;

  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Company name is required.');
  }

  const logoLocalfilePath = req.file?.path;
  const logo = await uploadOnCloudinary(logoLocalfilePath);

  if (logoLocalfilePath && !logo?.url) {
    throw new ApiError(500, 'Logo upload failed');
  }

  const company = await Company.create({
    owner: req.user._id,
    name,
    description,
    website,
    industry,
    location,
    logo: logo?.url || '',
  });

  return res
    .status(201)
    .json(new ApiResponse(201, company, 'Company created successfully'));
});

const getAllCompanies = asyncHandler(async (req, res) => {
  const { search, industry, location, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (industry) filter.industry = { $regex: industry, $options: 'i' };
  if (location) filter.location = { $regex: location, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Company.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        companies,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
      'Companies fetched successfully',
    ),
  );
});

const getCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid company ID format');
  }

  const company = await Company.findById(id).populate(
    'owner',
    'fullName avatar headline',
  );

  if (!company) {
    throw new ApiError(404, 'Company not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, company, 'Company fetched successfully'));
});

const getMyCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, companies, 'My companies fetched successfully'));
});

const updateMyCompany = asyncHandler(async (req, res) => {
  const { name, description, website, industry, location } = req.body;
  const { id } = req.params;

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (description) updateFields.description = description.trim();
  if (website) updateFields.website = website.trim();
  if (industry) updateFields.industry = industry.trim();
  if (location) updateFields.location = location.trim();

  if (!Object.keys(updateFields).length) {
    throw new ApiError(400, 'At least one field is required to update');
  }

  const company = await Company.findById(id);
  if (!company) throw new ApiError(404, 'Company not found');

  if (company.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to update this company');
  }

  const updatedCompany = await Company.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true, runValidators: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCompany, 'Company updated successfully'));
});

const updateCompanyLogo = asyncHandler(async (req, res) => {
  const logoLocalfilePath = req.file?.path;
  const { id } = req.params;

  if (!logoLocalfilePath) throw new ApiError(400, 'Logo file is required');

  try {
    const company = await Company.findById(id);
    if (!company) throw new ApiError(404, 'Company not found');

    if (company.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Unauthorized');
    }

    const logo = await uploadOnCloudinary(logoLocalfilePath);
    if (!logo?.url) throw new ApiError(500, 'Logo upload failed');

    if (company.logo) await deleteFromCloudinary(company.logo);

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { $set: { logo: logo.url } },
      { new: true },
    );

    return res
      .status(200)
      .json(new ApiResponse(200, updatedCompany, 'Logo updated successfully'));
  } finally {
    if (fs.existsSync(logoLocalfilePath)) fs.unlinkSync(logoLocalfilePath);
  }
});

const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id))
    throw new ApiError(400, 'Invalid ID format');

  const company = await Company.findById(id);
  if (!company) throw new ApiError(404, 'Company not found');

  if (company.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized');
  }

  const activeJobs = await Job.countDocuments({ company: id });
  if (activeJobs > 0) {
    throw new ApiError(400, 'Cannot delete companies with active job postings');
  }

  if (company.logo) await deleteFromCloudinary(company.logo);
  await Company.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Company deleted successfully'));
});

export {
  createCompany,
  getAllCompanies,
  getCompanyById,
  getMyCompanies,
  updateMyCompany,
  updateCompanyLogo,
  deleteCompany,
};
