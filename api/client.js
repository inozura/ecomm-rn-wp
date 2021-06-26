// external Libraries
import { create, CancelToken } from "apisauce";

//  Do not change anything above this line if you're not sure about what you're doing.

const domain = "https://next.yatou.mu";
const apiKey = "2dd07687-c6f2-466b-9d8a-d4ab653ab70c";
const apiRequestTimeOut = 30000; // 30 sec

//  Do not change anything below this line if you're not sure about what you're doing.

const cancelSource = CancelToken.source();
const api = create({
  baseURL: domain + "/wp-json/rtcl/v1/",
  headers: {
    Accept: "application/json",
    "X-API-KEY": apiKey,
  },
  timeout: apiRequestTimeOut,
  cancelToken: cancelSource.token,
});
const setAuthToken = (token) =>
  api.setHeader("Authorization", "Bearer " + token);
const removeAuthToken = () => api.deleteHeader("Authorization");
const setMultipartHeader = () =>
  api.setHeader("Content-Type", "multipart/form-data");
const removeMultipartHeader = () => api.deleteHeader("Content-Type");

export default api;
export {
  setAuthToken,
  removeAuthToken,
  setMultipartHeader,
  removeMultipartHeader,
  cancelSource,
};
