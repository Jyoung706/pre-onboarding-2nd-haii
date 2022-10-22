const res = require("express/lib/response");
const ErrorCreator = require("../middlewares/errorCreator");
const hospitalDao = require("../models/hospitalDao");
const { centerType, provinceNum } = require("../typemapper");

const hospitalDataService = async (recordData) => {
  const checkHospitalData = recordData.map((val) => {
    const arr = [];
    arr.push(val.치매센터명);
    return arr;
  });
  for (let i in checkHospitalData) {
    const [hospital] = await hospitalDao.getHospitalData(checkHospitalData[i][0]);
    if (hospital) {
      throw new ErrorCreator("Already exist hospital name", 400);
    }
  }

  recordData.map((val) => {
    val.치매센터유형 = centerType[val.치매센터유형];
  });
  const data = (recordData) => {
    const parsedData = recordData.map((val) => {
      if (!val.건축물면적) {
        val.건축물면적 = null;
      } else if (!val.치매센터명) {
        throw new ErrorCreator("not exist name", 400);
      } else if (!val.위도 || !val.경도) {
        throw new ErrorCreator("not exist latitude or longitude", 400);
      } else if (!val.설립연월) {
        throw new ErrorCreator("not exist establishment", 400);
      }
      let arr = Object.entries(val);
      let [province] = arr[22][1].split(" ");
      let num = arr[22][1];
      num = provinceNum[province];
      arr[22][1] = num;
      const obj = Object.fromEntries(arr);
      return obj;
    });
    return parsedData;
  };
  console.log(data(recordData));
  for (let i = 0; i < data(recordData).length; i++) {
    await hospitalDao.createHospital(data(recordData)[i]);
  }
};

const getHospitalDataService = async (isAdmin, provinceId, reqQuery) => {
  if (isAdmin && provinceId) {
    throw new ErrorCreator("admin cannot have province_id", 400);
  }
  if (!isAdmin && !provinceId) {
    throw new ErrorCreator("province_id not provided", 400);
  }
  const hospitalData = await hospitalDao.getHospitalList(provinceId, reqQuery);

  return hospitalData;
};

module.exports = {
  hospitalDataService,
  getHospitalDataService,
};
