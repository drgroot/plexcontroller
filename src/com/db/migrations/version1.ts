import { QueryTypes } from 'sequelize';
import sequelize from '../../database';
import { setPlayback } from '../models/user';
import UserPlayback from '../models/userplayback';

const run = () => sequelize.query(
  'SELECT * FROM userplaybacks',
  { type: QueryTypes.SELECT },
)
  .then(
    // @ts-ignore
    (
      playbacks: { email: string, libraryTitle: string, title: string, time: number }[],
    ) => {
      const rawPlaybacks: {
        email: string, libraryTitle: string, title: string, time: number,
      }[] = playbacks.map(
        ({
          email, libraryTitle, title, time,
        }) => ({
          email, libraryTitle, title, time,
        }),
      );

      return UserPlayback.sync({ force: true })
        .then(
          () => Promise.all([
            rawPlaybacks
              .map(
                // @ts-ignore
                (p) => setPlayback(
                  p.email,
                  p.libraryTitle,
                  p.title,
                  p.time,
                ),
              ),
          ]),
        );
    },
  );

export default run;
