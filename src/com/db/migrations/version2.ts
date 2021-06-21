import User from '../models/user';
import UserPlayback from '../models/userplayback';

const run = async () => {
  await User.sync({ force: true });
  await UserPlayback.sync({ force: true });
};

export default run;
