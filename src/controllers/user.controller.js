import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

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
  if (!email && !password) {
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
      200,
      {
        user: loggedInUser,
        refreshToken,
        accessToken,
      },
      'User loggedIn successfully',
    );
});

export { registerUser, loginUser };
