import Migration from '../models/migration';

const run = () => Migration.sync();

export default run;
