import { Job } from '../models/job.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log('Token generation error:', error);
    throw new ApiError(
      500,
      'Failed to generate authentication tokens. Please try again.',
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (
    [fullName, email, password].some(
      (field) => !field || field.toString().trim() === '',
    )
  ) {
    throw new ApiError(400, 'Full name, email, and password are all required.');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address.');
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatar?.url || '',
    coverImage: coverImage?.url || '',
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );
  if (!createdUser) {
    throw new ApiError(
      500,
      'Something went wrong while creating your account. Please try again.',
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'Account created successfully.'));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No account found with this email.');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Incorrect password. Please try again.');
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );
  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'Logged in successfully.',
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie('refreshToken', options)
    .clearCookie('accessToken', options)
    .json(new ApiResponse(200, {}, 'Logged out successfully.'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(
        401,
        'Unauthorized request. No refresh token provided.',
      );
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(
        401,
        'Refresh token is expired or has already been used.',
      );
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessRefreshToken(user._id);
    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie('refreshToken', newRefreshToken, options)
      .cookie('accessToken', accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed successfully.',
        ),
      );
  } catch (error) {
    throw new ApiError(
      400,
      error?.message || 'Invalid or expired refresh token.',
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'Both old and new passwords are required.');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, 'Your current password is incorrect.');
  }

  if (oldPassword === newPassword) {
    throw new ApiError(
      400,
      'New password must be different from the old password.',
    );
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new ApiError(
      400,
      'New password must be at least 8 characters long and include one uppercase letter and one number.',
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully.'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Current user fetched successfully.'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, bio, headline } = req.body;

  const updateFields = {};
  if (fullName?.trim()) updateFields.fullName = fullName.trim();
  if (bio?.trim()) updateFields.bio = bio.trim();
  if (headline?.trim()) updateFields.headline = headline.trim();

  if (!Object.keys(updateFields).length) {
    throw new ApiError(400, 'Provide at least one field to update.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true },
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Account details updated successfully.'));
});

const changeUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Please provide an avatar image.');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, 'Failed to upload avatar. Please try again.');
  }

  if (req.user.avatar) {
    await deleteFromCloudinary(req.user.avatar);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Avatar updated successfully.'));
});

const changeUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, 'Please provide a cover image.');
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(500, 'Failed to upload cover image. Please try again.');
  }

  if (req.user.coverImage) {
    await deleteFromCloudinary(req.user.coverImage);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Cover image updated successfully.'));
});

const updateResume = asyncHandler(async (req, res) => {
  const resumeLocalPath = req.file?.path;
  if (!resumeLocalPath) {
    throw new ApiError(400, 'Please provide a resume file.');
  }

  if (req.file.mimetype !== 'application/pdf') {
    throw new ApiError(400, 'Resume must be a PDF file.');
  }

  const resume = await uploadOnCloudinary(resumeLocalPath);
  if (!resume.url) {
    throw new ApiError(500, 'Failed to upload resume. Please try again.');
  }

  if (req.user.resume) {
    await deleteFromCloudinary(req.user.resume);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { resume: resume.url } },
    { new: true },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Resume uploaded successfully.'));
});

const updateSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  if (!skill || skill.trim() === '') {
    throw new ApiError(400, 'Please provide a skill to add.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { skills: skill.trim() } },
    { new: true },
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Skill added successfully.'));
});

const removeSkill = asyncHandler(async (req, res) => {
  const { skill } = req.params;
  if (!skill || skill.trim() === '') {
    throw new ApiError(400, 'Please specify a skill to remove.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { skills: skill.trim() } },
    { new: true },
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Skill removed successfully.'));
});

const bookMarkJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId || jobId.trim() === '') {
    throw new ApiError(400, 'Job ID is required.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { savedJobs: jobId } },
    { new: true },
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Job bookmarked successfully.'));
});

const removeBookmarkedJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId || jobId.trim() === '') {
    throw new ApiError(400, 'Job ID is required.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedJobs: jobId } },
    { new: true },
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, 'Job removed from bookmarks successfully.'),
    );
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('savedJobs')
    .select('-password -refreshToken');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user.savedJobs, 'Saved jobs fetched successfully.'),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  changeUserAvatar,
  changeUserCoverImage,
  updateResume,
  updateSkill,
  removeSkill,
  bookMarkJob,
  removeBookmarkedJob,
  getSavedJobs,
};
