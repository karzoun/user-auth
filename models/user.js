const bcrypt = require("bcrypt");

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
        // Giving the User model a name of type STRING
        email: {
            type: DataTypes.STRING,
            // allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            // allowNull: false
        }
    });

    User.associate = function(models) {

        // User.hasMany(models.Review, {
        //         onDelete: 'cascade'
        //     })
        // Associating User with Posts
        // When an User is deleted, also delete any associated Posts
        // User.hasMany(models.Post, {
        //     onDelete: "cascade"
        // });
    };
    User.beforeCreate(function(user) {
        user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
    })

    return User;
};