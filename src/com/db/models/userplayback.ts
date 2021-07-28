import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';

interface UserPlaybackAttributes {
  id: number,
  UserId: number,
  libraryTitle: string,
  title: string,
  ratingKey: string,
  time: number,
}

interface UserPlaybackCreationAttributes extends Optional<UserPlaybackAttributes, 'id'> { }

export default class UserPlayback
  extends Model<UserPlaybackAttributes, UserPlaybackCreationAttributes>
  implements UserPlaybackAttributes {
  public id!: number;

  public UserId!: number;

  public libraryTitle!: string;

  public title!: string;

  public ratingKey!: string;

  public time!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

UserPlayback.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    UserId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    libraryTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ratingKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ['UserId', 'libraryTitle', 'ratingKey'],
      },
    ],
  },
);
