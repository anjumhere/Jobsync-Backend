import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
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
    return { refreshToken, accessToken };
  } catch (error) {
    console.log('Token error', error);
    throw new ApiError(
      500,
      'Something went wrong while generating access and refreshToken',
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
    throw new ApiError(400, 'All fields are required');
  }

  // email validation
  //
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email');
  }

  // check if the user already exsists in the database
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, 'User already exists');
  }

  // get avatar and cover images localfilepaths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // send the avatar and coverImage locafilepaths to the cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // create an entry in the database
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
    throw new ApiError(500, 'Something went wrong while registering the User');
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User registered Successfully'));
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Password wrong');
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        'User loggedin Successfully',
      ),
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie('refreshToken', options)
    .clearCookie('accessToken', options)
    .json(new ApiResponse(200, {}, 'User loggedOut Successfully'));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, 'Unauthroized request');
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh Token expired or has been used');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie('refreshToken', newRefreshToken, options)
      .cookie('accessToken', accessToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          'AccessToken refreshed ',
        ),
      );
  } catch (error) {
    throw new ApiError(400, error?.message || 'Invalid refresh token');
  }
});
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'Both fields are requrired');
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found ');
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, 'Invalid old Password');
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changewd successfully'));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Current User Fetched Successfully'));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, bio, headline } = req.body;
  if (!fullName && headline === undefined && bio === undefined) {
    throw new ApiError(400, 'At least one field is required');
  }

  const updateFields = {};
  if (fullName) updateFields.fullName = fullName.trim();
  if (bio !== undefined) updateFields.bio = bio.trim();
  if (headline !== undefined) updateFields.headline = headline.trim();
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    },
  ).select('-password -refreshToken');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Accound Details Changed Successfully'));
});
const changeUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    console.log('no avatar');
    throw new ApiError(400, 'Avatar image is required');
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, 'Avatar Upload failed');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Avatar Change Successfully'));
});
const changeUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, 'coverImage image is required');
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, 'Cover Image Upload failed');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Cover Image Change Successfully'));
});

const updateResume = asyncHandler(async (req, res) => {
  const resumeLocalPath = req.file?.path;
  if (!resumeLocalPath) {
    throw new ApiError(400, 'Resume required');
  }

  if (req.file.mimetype !== 'application/pdf') {
    throw new ApiError(400, 'Only pdf files are allowed.');
  }
  const resume = await uploadOnCloudinary(resumeLocalPath);
  if (!resume.url) {
    throw new ApiError(500, 'Resume upload failed');
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        resume: resume.url,
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Resume Uploaded Successfully'));
});
const updateSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  if (!skill || skill.trim === '') {
    throw new ApiError(400, 'Skill is required');
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        skills: skill.trim(),
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Skill Added Successfully'));
});
const removeSkill = asyncHandler(async (req, res) => {
  const { skill } = req.params;
  if (!skill || skill.trim() === '') {
    throw new ApiError(400, 'Skill is required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        skills: skill.trim(),
      },
    },
    {
      new: true,
    },
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Skill Removed Successfully'));
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
};
