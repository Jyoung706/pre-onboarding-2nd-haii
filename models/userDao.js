const { myDataSource } = require("./common");

const getUser = async (account, email, phoneNum) => {
  return await myDataSource.query(
    `SELECT id FROM users WHERE account = ? OR email = ? OR phone_number = ?;
    `,
    [account, email, phoneNum]
  );
};

const createUser = async (data) => {
  const name = data.name;
  const account = data.account;
  const email = data.email;
  const phoneNum = data.phone_number;
  const password = data.password;
  const admin = data.is_admin;
  const province = data.province_id;
  await myDataSource.transaction(async (manager) => {
    await manager.query(
      `INSERT INTO users (name,account,email,phone_number,password,is_admin,province_id) 
        VALUES (?,?,?,?,?,?,?)
      `,
      [name, account, email, phoneNum, password, admin, province]
    );
  });
};

const getUserByAccount = async (account) => {
  const [user] = await myDataSource.query(
    `
      SELECT
      * FROM users
      WHERE account = ?`,
    [account]
  );
  return user;
};

const isAdmin = async (admin_id) => {
  return await myDataSource.query(
    `SELECT *
          FROM users u 
          WHERE u.is_admin = 1
              AND ISNULL(u.province_id) 
              AND u.id = ?`,
    [admin_id]
  );
};

const userUpdate = async (user_id, name, phone_number, province_id) => {
  return await myDataSource.query(
    `UPDATE users
      SET name  = ?
          , phone_number = ?
          , province_id = ?
          WHERE id = ? `,
    [name, phone_number, province_id, user_id]
  );
};

const getUserByPhoneNumber = async (phone_number) => {
  return await myDataSource.query(
    `SELECT EXISTS 
          (SELECT *
          FROM users u 
          WHERE u.phone_number = ?
          ) AS result`,
    [phone_number]
  );
};

module.exports = {
  getUser,
  createUser,
  getUserByAccount,
  isAdmin,
  userUpdate,
  getUserByPhoneNumber,
};
