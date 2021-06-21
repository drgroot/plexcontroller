import {
  Association,
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  Model,
  Optional,
  Op,
} from 'sequelize';
import sequelize from '../../database';
import UserPlayback from './userplayback';

interface UserAttributes {
  id: number,
  name: string,
  email: string,
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

export default class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;

  public name!: string;

  public email!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public getUserPlaybacks!: HasManyGetAssociationsMixin<UserPlayback>;

  public addUserPlayback!: HasManyAddAssociationMixin<UserPlayback, number>;

  public hasUserPlayback!: HasManyHasAssociationMixin<UserPlayback, number>;

  public createUserPlayback!: HasManyCreateAssociationMixin<UserPlayback>;

  public readonly UserPlaybacks?: UserPlayback[];

  public static associations: {
    UserPlaybacks: Association<User, UserPlayback>;
  };
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  },
);

export const getUserByEmail = (email: string): Promise<User | null> => User
  .findOne({ where: { email } });

export const getUser = (name: string): Promise<User | null> => User.findOne({ where: { name } });

export const newUser = (name: string, email: string): Promise<User | null> => getUserByEmail(email)
  .then(
    async (user: User | null) => {
      if (user) {
        // update username
        if (user.name !== name) {
          // eslint-disable-next-line no-param-reassign
          user.name = name;
          await user.save({ fields: ['name'] });
        }

        return user;
      }

      await User.create({ name, email });
      return getUserByEmail(email);
    },
  );

export const setPlayback = async (
  email: string, libraryTitle: string, title: string, time: number,
): Promise<boolean> => {
  const user = await getUserByEmail(email);
  if (!user) return false;

  const allPlaybacks = await user.getUserPlaybacks();
  const playback = allPlaybacks.find((f) => f.libraryTitle === libraryTitle && f.title === title);

  if (!playback) {
    await user.createUserPlayback({ libraryTitle, title, time });
    return true;
  }

  if (playback.time !== time) {
    playback.time = time;
    await playback.save({ fields: ['time'] });
    return true;
  }

  return false;
};

export const getPlaybacks = (now = new Date()) => User.findAll({
  include: {
    model: UserPlayback,
    required: true,
    where: {
      updatedAt: {
        [Op.between]: [
          new Date(now.getFullYear(), now.getMonth() - 1, now.getDate() - 2, 0, 0, 0, 0),
          now,
        ],
      },
    },
  },
});
