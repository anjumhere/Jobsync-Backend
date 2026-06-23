import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.routes.js';
import companyRouter from './routes/company.routes.js';
import jobsRouter from './routes/jobs.routes.js';
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// user routes
app.use('/api/v1/users', userRouter);

//company routes
app.use('/api/v1/companies', companyRouter);

// jobs routes
app.use('/api/v1/jobs', jobsRouter);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});
export { app };
