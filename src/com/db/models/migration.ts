import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';

interface MigrationAttributes {
  id: number,
  service: string,
  version: number,
}

interface MigrationCreationAttributes extends Optional<MigrationAttributes, 'id'> { }

export default class Migration extends Model<MigrationAttributes, MigrationCreationAttributes>
  implements MigrationAttributes {
  public id!: number;

  public service!: string;

  public version!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Migration.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'migrations',
    indexes: [
      {
        unique: true,
        fields: ['service', 'version'],
      },
    ],
  },
);
