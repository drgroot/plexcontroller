import User from './models/user';
import UserPlayback from './models/userplayback';

const makeAssociations = () => User.hasMany(UserPlayback);

export default makeAssociations;
