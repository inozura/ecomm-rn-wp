import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import { AppName } from "../app/services/appName";
import settingsStorage from "../app/settings/settingsStorage";
import { __ } from "../language/stringPicker";
import authStorage from "../app/auth/authStorage";
import api, { removeAuthToken, setAuthToken } from "../api/client";

import ListingDetailScreen from "../screens/ListingDetailScreen";
import ChatScreen from "../screens/ChatScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SettingsScreen from "../screens/SettingsScreen";
import TabNavigator from "./TabNavigator";
import MyListingsScreen from "../screens/MyListingsScreen";
import FavouriteScreen from "../screens/FavoritesScreen";
import ReportScreen from "../screens/ReportScreen";
import MyMembershipScreen from "../screens/MyMembershipScreen";
import ContactUsScreen from "../screens/ContactUsScreen";
import FAQScreen from "../screens/FAQScreen";
import HowToSellFastScreen from "../screens/HowToSellFastScreen";
import MoreScreen from "../screens/MoreScreen";
import MyProfileScreen from "../screens/MyProfileScreen";
import EditPersonalDetailScreen from "../screens/EditPersonalDetailScreen";
import AboutAppScreen from "../screens/AboutAppScreen";
import TnCScreen from "../screens/TnCScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import ThirdPartyLicensesScreen from "../screens/ThirdPartyLicensesScreen";

import EditListingScreen from "../screens/EditListingScreen";
import SelectLocationScreen from "../screens/SelectLocationScreen";
import SendEmailScreen from "../screens/SendEmailScreen";
import SelectCategoryScreen from "../screens/SelectCategoryScreen";
import StoreDetailsScreen from "../screens/StoreDetailsScreen";
import StoreMoreDetailsScreen from "../screens/StoreMoreDetailsScreen";
import AllStores from "../screens/AllStores";
import MyStoreScreen from "../screens/MyStoreScreen";

const Stack = createStackNavigator();

const HomeNavigator = () => {
  const [{ user, auth_token, appSettings }, dispatch] = useStateValue();
  const [userSet, setUserSet] = useState(false);
  const restoreUser = async () => {
    const storedUser = await authStorage.getUser();
    if (!storedUser) return;
    dispatch({
      type: "SET_AUTH_DATA",
      data: {
        user: JSON.parse(storedUser).user,
        auth_token: JSON.parse(storedUser).jwt_token,
      },
    });
    setUserSet(true);
  };
  const updateChatBadge = () => {
    setAuthToken(auth_token);
    api.get("my/chat").then((res) => {
      if (res.ok) {
        removeAuthToken();
        const badgeNumber = res.data.filter(
          (_chat) => _chat.is_read == 0 && user.id != _chat.source_id
        ).length;

        if (badgeNumber) {
          dispatch({
            type: "SET_CHAT_BADGE",
            chat_badge: badgeNumber,
          });
        }
      } else {
        removeAuthToken();
        // Error updating chat info
      }
    });
  };
  const restoreSettings = async () => {
    const storedSettings = await settingsStorage.getAppSettings();
    if (!storedSettings) return;
    const parsedSettings = JSON.parse(storedSettings);
    if (Object.keys(parsedSettings).length) {
      dispatch({
        type: "SET_SETTINGS",
        appSettings: parsedSettings,
      });
    }
  };
  // chat badge update call
  useEffect(() => {
    if (!userSet) return;
    updateChatBadge();
    return () => console.log("badge");
  }, [userSet]);
  // restore secure data
  useEffect(() => {
    restoreUser();
    restoreSettings();
    updateConfigData();
    return () => console.log("storage");
  }, []);

  const updateConfigData = () => {
    api.get("config").then((res) => {
      console.log(res.data);
      if (res.ok) {
        dispatch({
          type: "SET_CONFIG",
          config: res.data,
        });
      } else {
        // TODO add error storing
      }
    });
  };
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle: "Back",
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: COLORS.primary,
          height: 50,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen
        name="Listing"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Listing Detail"
        component={ListingDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Send Email"
        component={SendEmailScreen}
        options={{ title: __("screenTitles.sendEmailScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Contact us"
        component={ContactUsScreen}
        options={{ title: __("screenTitles.contactUsScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: __("screenTitles.reportScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: __("screenTitles.chatScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Location"
        component={SelectLocationScreen}
        options={{
          title: __("screenTitles.selectLocationScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: __("screenTitles.settingsScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Log In"
        component={LoginScreen}
        options={{ title: __("screenTitles.loginScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Sign Up"
        component={SignUpScreen}
        options={{ title: __("screenTitles.signUpScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="My Listings"
        component={MyListingsScreen}
        options={{
          title: __("screenTitles.myListingsScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="My Membership"
        component={MyMembershipScreen}
        options={{
          title: __("screenTitles.myMembershipScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="Favourite"
        component={FavouriteScreen}
        options={{ title: __("screenTitles.favoritesScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="My Profile"
        component={MyProfileScreen}
        options={{ title: __("screenTitles.myProfileScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{ title: __("screenTitles.fAQScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="How To Sell Fast"
        component={HowToSellFastScreen}
        options={{
          title: __("screenTitles.howtoSellFastScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="More"
        component={MoreScreen}
        options={{ title: __("screenTitles.moreScreen", appSettings.lng) }}
      />

      <Stack.Screen
        name={AppName}
        component={AboutAppScreen}
        options={{ title: __("screenTitles.aboutAppScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name={"Select category"}
        component={SelectCategoryScreen}
        options={{
          title: __("screenTitles.selectCategoryScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="Privacy Policy"
        component={PrivacyPolicyScreen}
        options={{
          title: __("screenTitles.privacyPolicyScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="Licenses"
        component={ThirdPartyLicensesScreen}
        options={{
          title: __("screenTitles.thirdPartyLicensesScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="TnC"
        component={TnCScreen}
        options={{ title: __("screenTitles.tNCScreen", appSettings.lng) }}
      />
      <Stack.Screen
        name="Edit Personal Detail"
        component={EditPersonalDetailScreen}
        options={{
          title: __("screenTitles.editPersonalDetailScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="Edit Listing"
        component={EditListingScreen}
        options={{
          title: __("screenTitles.editListingScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        options={{
          headerShown: false,
          title: __("screenTitles.storeDetailsScreen", appSettings.lng),
        }}
        name="Store Details"
        component={StoreDetailsScreen}
      />
      <Stack.Screen
        name="More Details Store"
        component={StoreMoreDetailsScreen}
        options={{
          title: __("screenTitles.storeMoreDetailsScreen", appSettings.lng),
        }}
      />
      <Stack.Screen
        name="Stores"
        component={AllStores}
        options={{ title: __("screenTitles.allStores", appSettings.lng) }}
      />
      <Stack.Screen
        name="My Store Settings"
        component={MyStoreScreen}
        options={{ title: __("screenTitles.myStoreScreen", appSettings.lng) }}
      />
    </Stack.Navigator>
  );
};

export default HomeNavigator;
