require("dotenv").config();
const { notarize } = require("electron-notarize");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }
  return;

  const appName = context.packager.appInfo.productFilename;

  console.log(`${appOutDir}/${appName}.app`);

  return await notarize({
    appBundleId: "com.iniscreen.app",
    appPath: `${appOutDir}/${appName}.app`,
    appleId: "pszeman@netenglish.com",
    appleIdPassword: "jbuo-yrfh-nvng-lrji",
  });
};
