import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { postsRouter } from './routes/posts';
import { usersRouter } from './routes/users';
import { feedRouter } from './routes/feed';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';
import { messagesRouter } from './routes/messages';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.path}`);
  next();
});

app.use('/auth', authRouter);
app.use('/posts', postsRouter);
app.use('/users', usersRouter);
app.use('/feed', feedRouter);
app.use('/notifications', notificationsRouter);
app.use('/admin', adminRouter);
app.use('/messages', messagesRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
