import UserPlayback from '../models/userplayback';

const run = () => UserPlayback.sync({ force: true });

export default run;
