module.exports = function (sequelize, DataTypes) {
    return sequelize.define('user', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true
        },
        discordName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null
        },
        nickName: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null
        },
        deviceId: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        discordId: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        discordMember: {
            type: DataTypes.ENUM(['YES', 'NO']),
            allowNull: false,
            defaultValue: 'YES',
        },
        // signupTime:{
        //     type: DataTypes.STRING(100),
        //     allowNull: false,
        // },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        signupIpAddr: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        lastLoginIp: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        balance: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM(['ACTIVE', 'BLOCKED']),
            defaultValue: 'ACTIVE',
            allowNull: false,
        },
        lastStatusChangedDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        tableName: 'user',
        timestamps: true
    });
}