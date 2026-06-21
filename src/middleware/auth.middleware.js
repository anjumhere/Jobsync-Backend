import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new ApiError(
        401,
        'Unauthorized, accesstoken expired or has been used',
      );
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken) {
      throw new ApiError(401, 'Unauthorized request');
    }
    const user = await User.findById(decodedToken._id).select(
      '-password -refreshToken',
    );
    if (!user) {
      throw new ApiError(400, 'User not found');
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid accessToken');
  }
});

export { verifyJWT };
