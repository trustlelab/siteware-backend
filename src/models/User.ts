import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.ts'; // Import your Sequelize instance

// Define attributes for the User model
interface UserAttributes {
  id: number;
  email: string;
  password: string;
  resetPasswordOTP?: string | null;
  resetPasswordExpires?: Date | null;
}

// Define creation attributes (optional fields when creating a user)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'resetPasswordOTP' | 'resetPasswordExpires'> {}

// Create the User class that extends Sequelize Model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public resetPasswordOTP!: string | null;
  public resetPasswordExpires!: Date | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the User model
User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resetPasswordOTP: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize, // Sequelize instance
  modelName: 'User', // Model name
  timestamps: true, // Enable timestamps
});

export default User; // Export User as the default export
