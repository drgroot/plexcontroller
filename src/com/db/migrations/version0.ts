import User from '../models/user';
import UserPlayback from '../models/userplayback';

const run = () => Promise.all([
  User.sync({ force: true }),
  UserPlayback.sync({ force: true }),
]);

export default run;
