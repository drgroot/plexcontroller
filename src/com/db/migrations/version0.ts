import File from '../models/files';
import User from '../models/user';
import UserPlayback from '../models/userplayback';

const run = () => Promise.all([
  File.sync({ force: true }),
  User.sync({ force: true }),
  UserPlayback.sync({ force: true }),
]);

export default run;
