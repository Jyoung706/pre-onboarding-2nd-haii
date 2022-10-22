const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userDao = require("../models/userDao");
const secretKey = process.env.jwt_secret_key;
const ErrorCreator = require("../middlewares/errorCreator");

const userSignupService = async (userData) => {
  const name = userData.name;
  const account = userData.account;
  const email = userData.email;
  let phoneNum = userData.phone_number;
  let password = userData.password;

  const dashCheck = Object.values(phoneNum);

  if (dashCheck.find((e) => e === "-")) {
    throw new ErrorCreator("phone_number is only number", 400);
  }

  const newPhoneNum = phoneNum.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
  phoneNum = newPhoneNum;
  userData.phone_number = newPhoneNum;

  const [accountCheck] = await userDao.getUser(account, email, phoneNum);
  if (accountCheck) {
    throw new ErrorCreator("Already exist account or email or phone number", 400);
  }

  if (userData.province_id > 17) {
    throw new ErrorCreator("Not exist province_id", 400);
  }

  if (userData.is_admin > 1) {
    throw new ErrorCreator("is_admin value only has 0(false) or 1(true)", 400);
  }

  if (userData.is_admin === 0 && !userData.province_id) {
    throw new ErrorCreator("Please select province", 400);
  } else if (userData.is_admin === 1 && userData.province_id) {
    throw new ErrorCreator("admin can't has province id", 400);
  }

  if (userData.is_admin === 1) {
    userData.province_id = null;
  }

  if (!(name && account && email && phoneNum && password)) {
    throw new ErrorCreator("Please check input data", 400);
  }

  const validateName = /^[가-힣]{2,10}$/;
  const validateAccount = /^[0-9a-zA-Z_-]{3,30}$/;
  const validateEmail =
    /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
  const validatePhoneNum = /^01([0|1|6|7|8|9]?)-([0-9]{3,4})-([0-9]{4})$/;
  if (!validateName.test(name)) {
    throw new ErrorCreator("Please check name", 400);
  }
  if (!validateAccount.test(account)) {
    throw new ErrorCreator("Please match account format", 400);
  }
  if (!validateEmail.test(email)) {
    throw new ErrorCreator("Please match the e-mail format", 400);
  }
  if (!validatePhoneNum.test(phoneNum)) {
    throw new ErrorCreator("Please match phone_number format", 400);
  }

  const salt = bcrypt.genSaltSync(10);
  userData.password = bcrypt.hashSync(password, salt);

  await userDao.createUser(userData);
};

const signIn = async (account, password) => {
  const user = await userDao.getUserByAccount(account);
  if (!user) {
    const err = new Error("INVAILD_ACCOUNT OR INVALID_PASSWORD");
    err.statusCode = 400;
    throw err;
  }

  const passwordCheck = bcrypt.compareSync(password, user.password);

  if (!passwordCheck) {
    const err = new Error("INVAILD_ACCOUNT OR INVALID_PASSWORD");
    err.statusCode = 400;
    throw err;
  }

  const token = jwt.sign(
    {
      userId: user.id,
      isAdmin: user.is_admin,
      provinceId: user.province_id,
    },
    secretKey
  );

  return token;
};

const changeUserData = async (user_id, name, phone_number, province_id) => {
  const result = await isUnique(phone_number);
  if (result) {
    const error = new Error(result.message);
    error.statusCode = 404;
    throw error;
  }
  let updateResult = null;
  try {
    const updateUserIsAdmin = await userDao.isAdmin(user_id);

    if (updateUserIsAdmin.length == 0) {
      updateResult = await userDao.userUpdate(user_id, name, phone_number, province_id);
    } else {
      const province = null;
      updateResult = await userDao.userUpdate(user_id, name, phone_number, province);
    }
  } catch (err) {
    console.log(err);
  }
  if (updateResult.changedRows == 0) {
    const error = new Error("FAIL_USER_UPDATE");
    error.statusCode = 405;
    throw error;
  }
};

async function isUnique(phone_number) {
  const resultByPhoneNumber = await userDao.getUserByPhoneNumber(phone_number);
  if (resultByPhoneNumber[0].result == 1) {
    return { message: "USER_PHONE_NUMBER_DUPLICATE" };
  }
}

module.exports = {
  userSignupService,
  signIn,
  changeUserData,
};
