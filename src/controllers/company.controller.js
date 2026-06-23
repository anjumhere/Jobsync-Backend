import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { Company } from '../models/company.model.js';
import fs from 'fs';
import mongoose from 'mongoose';
const createCompany = asyncHandler(async (req, res) => {
  const { name, description, website, industry, location } = req.body;
  if (!name || name.trim() === '') {
    throw new ApiError(400, 'Company name is required.');
  }
  const logoLocalfilePath = req.file?.path;
  const logo = await uploadOnCloudinary(logoLocalfilePath);
  if (logo && !logo.url) {
    throw new ApiError(500, 'Logo Upload failed');
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
    .status(200)
    .json(new ApiResponse(200, company, 'Company Created Successfully'));
});
const getAllCompanies = asyncHandler(async (req, res) => {
  const { search, industry, location, page = 1, limit = 10 } = req.query;

  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }
  if (industry) {
    filter.industry = { $regex: industry, $options: 'i' };
  }
  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Company.countDocuments(filter),
  ]);

  if (!companies.length) {
    return res.status(200).json(new ApiResponse(200, [], 'No Companies Found'));
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        companies,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
      'Companies Fetched Successfully',
    ),
  );
});

const getCompanyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, 'Id is required');
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
    .json(new ApiResponse(200, company, 'Company Fetched Successfully'));
});
const getMyCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });

  if (!companies.length) {
    return res.status(200).json(new ApiResponse(200, [], 'No Companies found'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, companies, 'My companies fetched successfully'));
});
const updateMyCompany = asyncHandler(async (req, res) => {
  const { name, description, website, industry, location } = req.body;

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (description) updateFields.description = description.trim();
  if (website) updateFields.website = website.trim();
  if (industry) updateFields.industry = industry.trim();
  if (location) updateFields.location = location.trim();
  if (!Object.keys(updateFields).length) {
    throw new ApiError(400, 'At least one field is required to update ');
  }
  const company = await Company.findById(req.params.id);
  if (!company) {
    throw new ApiError(404, 'Company not found ');
  }

  if (company.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this company');
  }
  const updatedCompany = await Company.findByIdAndUpdate(
    req.params.id,
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
    .json(new ApiResponse(200, updatedCompany, 'Company updated Successfully'));
});
const updateCompanyLogo = asyncHandler(async (req, res) => {
  const logoLocalfilePath = req.file?.path;
  if (!logoLocalfilePath) {
    throw new ApiError(400, 'Logo required');
  }

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new ApiError(400, 'Invalid Company Id format');
    }
    const company = await Company.findById(req.params.id);
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    if (company.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not Authorized to perform this action');
    }

    const oldLogoUrl = company.logo;
    const logo = await uploadOnCloudinary(logoLocalfilePath);
    if (!logo || !logo.url) {
      throw new ApiError(500, 'Logo Upload failed');
    }
    if (oldLogoUrl) {
      await deleteFromCloudinary(oldLogoUrl);
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          logo: logo.url,
        },
      },
      { new: true },
    );

    if (fs.existsSync(logoLocalfilePath)) {
      fs.unlinkSync(logoLocalfilePath);
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedCompany, 'Logo Updated Successfully'));
  } catch (error) {
    if (fs.existsSync(logoLocalfilePath)) {
      fs.unlinkSync(logoLocalfilePath);
    }
    throw error;
  }
});

export {
  createCompany,
  getAllCompanies,
  getCompanyById,
  getMyCompanies,
  updateMyCompany,
  updateCompanyLogo,
};
