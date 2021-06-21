import {
  DataTypes, Model, Optional, Op,
} from 'sequelize';
import sequelize from '../../database';

interface FileAttribtues {
  id: number,
  onlineId: string,
  path: String,
  sizeMB: number
  resolution: number
  encode: string
  videoCodec: string
  videoBitrate: number
}

interface FileCreationAttributes extends Optional<FileAttribtues, 'id'> { }

export default class File extends Model<FileAttribtues, FileCreationAttributes>
  implements FileAttribtues {
  public id!: number;

  public onlineId!: string;

  public path!: string;

  public sizeMB!: number;

  public resolution!: number;

  public encode!: string;

  public videoCodec!: string;

  public videoBitrate!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

File.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    onlineId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sizeMB: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    resolution: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    encode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoCodec: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoBitrate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'files',
    indexes: [
      {
        unique: true,
        fields: ['path'],
      },
      {
        name: 'file_onlineId',
        fields: ['onlineId'],
      },
      {
        name: 'file_bitrate',
        fields: ['videoBitrate'],
      },
      {
        name: 'file_codec',
        fields: ['videoCodec'],
      },
    ],
  },
);

export const getRecentFiles = (now = new Date()) => {
  let referenceDays = 1;

  // if we are the beginning of the week, examine the full week of data
  if (now.getUTCDay() === 1) {
    referenceDays = 7;
  }

  const where = (now.getUTCDate() === 1) ? {} : {
    updatedAt: {
      [Op.between]: [
        new Date(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - referenceDays,
          0,
          0,
          0,
          0,
        ),
        now,
      ],
    },
  };

  return File.findAll({
    attributes: ['path'],
    // @ts-ignore
    where,
  });
};
